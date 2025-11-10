from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
import joblib
import re
from datetime import datetime
from bs4 import BeautifulSoup

app = FastAPI(title="VitaCava API")

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # in prod, set to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Load Artifacts (defensive) --------


def safe_load(path, required=True):
    try:
        return joblib.load(path)
    except Exception as e:
        if required:
            raise RuntimeError(f"Failed to load {path}: {e}")
        return None


health_model = safe_load("models/health_model_joblib.pkl", required=False)

ent = safe_load("models/tmdb_soup_artifact.pkl")
tmdb_df = ent['df_small']
tmdb_tfidf = ent['tfidf']
tmdb_vec = ent['vectorizer']
tmdb_title_to_idx = ent['title_to_idx']

food_art = safe_load("models/food_pref_artifact.pkl")
food_table = pd.read_csv("data/food_table.csv")
recipes = food_art['recipes']       # must include 'name' and 'soup'
food_vec = food_art['vec']
food_X = food_vec.fit_transform(recipes['soup'])
food_name_to_idx = {n.lower(): i for i, n in enumerate(recipes['name'])}

social_art = safe_load("models/social_sentiment_tfidf_lr.pkl")
sent_pipe = social_art['pipeline']

# -------- Schemas --------


class HealthInput(BaseModel):
    steps: float
    calories: float
    distance: float
    active_minutes: float


class MovieReq(BaseModel):
    title: str
    k: int = 8


class FoodPlanReq(BaseModel):
    sex: str
    age: int
    height_cm: float
    weight_kg: float
    activity: str           # sedentary|light|moderate|active|very_active
    goal: str               # loss|maintain|gain
    diet_type: str = "veg"  # veg|vegegg|nonveg|vegan


class FoodLikesReq(BaseModel):
    likes: List[str]
    k: int = 8


class ProjectReq(BaseModel):
    plan_kcal: float
    tdee: float


class SentimentReq(BaseModel):
    text: str

# -------- Helpers --------


def tdee_calc(sex, age, h, w, activity):
    bmr = 10*w + 6.25*h - 5*age + (5 if sex.lower() == "male" else -161)
    act = {"sedentary": 1.2, "light": 1.375,
           "moderate": 1.55, "active": 1.725, "very_active": 1.9}
    return bmr * act.get(activity, 1.55)


def macro_split(goal):
    if goal == "loss":
        return dict(protein=0.30, carbs=0.40, fat=0.30)
    if goal == "gain":
        return dict(protein=0.25, carbs=0.50, fat=0.25)
    return dict(protein=0.30, carbs=0.45, fat=0.25)


def diet_filter(df, dtype="veg"):
    name = df['food_name'].str.lower()
    nonveg = ['chicken', 'fish', 'meat', 'egg', 'beef',
              'pork', 'mutton', 'tuna', 'salmon', 'shrimp']
    dairy = ['milk', 'paneer', 'curd', 'yogurt', 'cheese', 'ghee', 'butter']
    if dtype == "veg":
        return df[~name.str.contains('|'.join(nonveg), na=False)].copy()
    if dtype == "vegegg":
        meat_block = name.str.contains(
            '|'.join([k for k in nonveg if k != 'egg']), na=False)
        egg_ok = name.str.contains('egg', na=False)
        return df[(~meat_block) | egg_ok].copy()
    if dtype == "vegan":
        return df[~name.str.contains('|'.join(nonveg+dairy), na=False)].copy()
    return df.copy()


def grams_needed(row, t_kcal=None, t_p=None, t_c=None, t_f=None):
    eps = 1e-9
    gk = (t_kcal*100)/max(row['kcal_per_100g'], eps) if t_kcal else 0
    gp = (t_p*100)/max(row['protein_per_100g'], eps) if t_p else 0
    gc = (t_c*100)/max(row['carbs_per_100g'], eps) if t_c else 0
    gf = (t_f*100)/max(row['fat_per_100g'], eps) if t_f else 0
    cand = [g for g in [gp, gc, gf, gk] if g > 0]
    return float(np.median(cand)) if cand else 0.0


def build_day_plan(food_df, target_kcal, tp, tc, tf):
    f = food_df.copy()
    eps = 1e-9
    f['pp100kcal'] = f['protein_per_100g']/(f['kcal_per_100g']/100+eps)
    f['cp100kcal'] = f['carbs_per_100g'] / (f['kcal_per_100g']/100+eps)
    f['fp100kcal'] = f['fat_per_100g'] / (f['kcal_per_100g']/100+eps)
    hp = f.sort_values('pp100kcal', ascending=False).head(50)
    hc = f.sort_values('cp100kcal', ascending=False).head(50)
    hf = f.sort_values('fp100kcal', ascending=False).head(50)

    rem = dict(kcal=target_kcal, p=tp, c=tc, f=tf)
    picks = []

    # protein anchors
    for _, row in hp.head(3).iterrows():
        need = grams_needed(row, t_p=rem['p']*0.5)
        if need <= 0:
            continue
        g = float(np.clip(need, 30, 250))
        kcal = row['kcal_per_100g']*g/100
        p = row['protein_per_100g']*g/100
        c = row['carbs_per_100g']*g/100
        f = row['fat_per_100g']*g/100
        picks.append(dict(food=row['food_name'], grams=round(g, 0), kcal=round(
            kcal, 1), protein=round(p, 1), carbs=round(c, 1), fat=round(f, 1)))
        rem['kcal'] -= kcal
        rem['p'] -= p
        rem['c'] -= c
        rem['f'] -= f

    # carbs
    for _, row in hc.head(2).iterrows():
        if rem['c'] <= 0:
            break
        g = float(np.clip(grams_needed(row, t_c=rem['c']*0.7), 40, 250))
        kcal = row['kcal_per_100g']*g/100
        p = row['protein_per_100g']*g/100
        c = row['carbs_per_100g']*g/100
        f = row['fat_per_100g']*g/100
        picks.append(dict(food=row['food_name'], grams=round(g, 0), kcal=round(
            kcal, 1), protein=round(p, 1), carbs=round(c, 1), fat=round(f, 1)))
        rem['kcal'] -= kcal
        rem['p'] -= p
        rem['c'] -= c
        rem['f'] -= f

    # fat top-up
    row = hf.iloc[0]
    g = float(np.clip(grams_needed(row, t_f=rem['f']), 10, 60))
    kcal = row['kcal_per_100g']*g/100
    p = row['protein_per_100g']*g/100
    c = row['carbs_per_100g']*g/100
    f = row['fat_per_100g']*g/100
    picks.append(dict(food=row['food_name'], grams=round(g, 0), kcal=round(
        kcal, 1), protein=round(p, 1), carbs=round(c, 1), fat=round(f, 1)))

    totals = pd.DataFrame(
        picks)[['kcal', 'protein', 'carbs', 'fat']].sum().to_dict()
    gaps = {
        'kcal_gap': round(target_kcal - totals.get('kcal', 0), 1),
        'protein_gap': round(tp - totals.get('protein', 0), 1),
        'carbs_gap': round(tc - totals.get('carbs', 0), 1),
        'fat_gap': round(tf - totals.get('fat', 0), 1),
    }
    return picks, totals, gaps


def parse_whatsapp_bytes(name: str, content: bytes):
    def parse_lines(text):
        rows = []
        lines = text.splitlines()
        p1 = re.compile(
            r'^(\d{1,2}/\d{1,2}/\d{2,4}),\s+(\d{1,2}:\d{2})\s+-\s+(.*?):\s+(.*)$')
        p2 = re.compile(
            r'^\[(\d{1,2}/\d{1,2}/\d{2,4}),\s+(\d{1,2}:\d{2})\]\s+(.*?):\s+(.*)$')

        def to_dt(d, t):
            for fmt in ["%d/%m/%Y %H:%M", "%d/%m/%y %H:%M", "%m/%d/%Y %H:%M", "%m/%d/%y %H:%M"]:
                try:
                    return datetime.strptime(f"{d} {t}", fmt)
                except:
                    pass
            return None
        cur_dt, cur_sender, cur_msg = None, None, []

        def flush():
            nonlocal cur_dt, cur_sender, cur_msg
            if cur_dt and cur_sender:
                rows.append((cur_dt, cur_sender, ' '.join(cur_msg).strip()))
            cur_dt, cur_sender, cur_msg = None, None, []
        for line in lines:
            m = p1.match(line) or p2.match(line)
            if m:
                flush()
                d, t, s, msg = m.group(1), m.group(2), m.group(3), m.group(4)
                cur_dt, cur_sender, cur_msg = to_dt(d, t), s, [msg]
            else:
                if cur_dt is not None:
                    cur_msg.append(line)
        flush()
        return rows

    if name.endswith((".html", ".htm")):
        soup = BeautifulSoup(content, "html.parser")
        txt = soup.get_text("\n")
        return parse_lines(txt)
    else:
        return parse_lines(content.decode(errors='ignore'))

# -------- Endpoints --------


@app.get("/")
def root(): return {"ok": True, "service": "VitaCava API"}

@app.post("/health/predict")
def health_predict(x: HealthInput):
    if health_model is None:
        raise HTTPException(503, "Health model not loaded.")
    df = pd.DataFrame([x.dict()])
    model = health_model.get("model", health_model)
    y = model.predict(df)
    label = "Active" if int(y[0]) == 1 else "Lazy"
    proba = (
        health_model.predict_proba(df)[0].tolist()
        if hasattr(health_model, "predict_proba")
        else None
    )
    return {"prediction": label, "proba": proba}



@app.post("/entertainment/recommend")
def movie_recommend(req: MovieReq):
    key = req.title.lower()
    if key not in tmdb_title_to_idx:
        raise HTTPException(404, f"Title not found: {req.title}")
    idx = tmdb_title_to_idx[key]
    from sklearn.metrics.pairwise import linear_kernel
    sim = linear_kernel(tmdb_tfidf[idx:idx+1], tmdb_tfidf).flatten()
    sim[idx] = 0.0
    inds = np.argsort(-sim)[:req.k]
    out = []
    for j in inds:
        row = tmdb_df.iloc[j]
        out.append({
            "title": row.get('title'),
            "genres": row.get('genres_list', []),
            "rating": float(row.get('vote_average', 0) or 0),
            "overview": (row.get('overview', "") or "")[:220],
            "score": float(sim[j])
        })
    return {"items": out}


@app.post("/food/plan")
def food_plan(req: FoodPlanReq):
    tdee = tdee_calc(req.sex, req.age, req.height_cm,
                     req.weight_kg, req.activity)
    target = max(1200, tdee-300) if req.goal == "loss" else (tdee +
                                                             300 if req.goal == "gain" else tdee)
    split = macro_split(req.goal)
    tp = (target*split['protein'])/4
    tc = (target*split['carbs'])/4
    tf = (target*split['fat'])/9
    filt = diet_filter(food_table, req.diet_type)
    plan, totals, gaps = build_day_plan(filt, target, tp, tc, tf)
    return {
        "tdee": round(tdee, 1),
        "target_kcal": round(target, 1),
        "macros_g": {"protein": round(tp, 1), "carbs": round(tc, 1), "fat": round(tf, 1)},
        "plan": plan, "totals": totals, "gaps": gaps
    }


@app.post("/food/recommend")
def food_recommend(req: FoodLikesReq):
    from sklearn.metrics.pairwise import linear_kernel
    agg = None
    for nm in req.likes:
        i = food_name_to_idx.get(nm.lower())
        if i is None:
            continue
        s = linear_kernel(food_X[i:i+1], food_X).flatten()
        s[i] = 0.0
        agg = s if agg is None else (agg+s)
    if agg is None:
        return {"items": []}
    idxs = np.argsort(-agg)[:req.k]
    out = [{"name": recipes.iloc[j]['name'],
            "score": float(agg[j])} for j in idxs]
    return {"items": out}


@app.post("/food/project")
def food_project(req: ProjectReq):
    delta = ((req.plan_kcal - req.tdee) * 7.0) / 7700.0
    return {"delta_kg": round(delta, 3)}


@app.post("/social/sentiment")
def social_sentiment(req: SentimentReq):
    pred = sent_pipe.predict([req.text])[0]
    prob = sent_pipe.predict_proba([req.text])[0].tolist()
    classes = list(sent_pipe.classes_)
    return {"prediction": pred, "proba": dict(zip(classes, prob))}


@app.post("/social/whatsapp/insights")
async def whatsapp_insights(file: UploadFile = File(...)):
    content = await file.read()
    rows = parse_whatsapp_bytes(file.filename.lower(), content)
    df = pd.DataFrame(rows, columns=["timestamp", "sender", "text"])
    if df.empty:
        return {"parsed": 0, "by_sender": {}, "by_sentiment": {}, "by_hour": []}
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    df['sentiment'] = sent_pipe.predict(df['text'])
    return {
        "parsed": int(len(df)),
        "by_sender": df['sender'].value_counts().to_dict(),
        "by_sentiment": df['sentiment'].value_counts().to_dict(),
        "by_hour": df.groupby('hour').size().reset_index(name='count').to_dict(orient='records')
    }
