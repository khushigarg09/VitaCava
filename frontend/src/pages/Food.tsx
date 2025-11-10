import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { FormCard } from '@/components/ui/form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { postFoodPlan, postFoodRecommend, postFoodProject } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, Utensils, TrendingUp } from 'lucide-react';

export default function Food() {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  
  const [planForm, setPlanForm] = useState({
    sex: 'male',
    age: '',
    height_cm: '',
    weight_kg: '',
    activity: 'moderate',
    goal: 'maintain',
    diet_type: 'nonveg',
  });

  const [plan, setPlan] = useState<any>(null);
  const [projection, setProjection] = useState<any>(null);
  const [likes, setLikes] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPlan(true);

    try {
      const payload = {
        ...planForm,
        age: parseInt(planForm.age),
        height_cm: parseFloat(planForm.height_cm),
        weight_kg: parseFloat(planForm.weight_kg),
      };
      const data = await postFoodPlan(payload);
      setPlan(data);
      toast.success('Meal plan generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate meal plan');
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleProjectSubmit = async () => {
    if (!plan) return;
    setLoadingProject(true);

    try {
      const data = await postFoodProject({
        plan_kcal: plan.target_kcal,
        tdee: plan.tdee,
      });
      setProjection(data);
      toast.success('7-day projection calculated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to project weight change');
    } finally {
      setLoadingProject(false);
    }
  };

  const handleRecsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecs(true);

    try {
      const likesList = likes.split(',').map(s => s.trim()).filter(s => s);
      const data = await postFoodRecommend({ likes: likesList, k: 5 });
      setRecommendations(data.items || []);
      toast.success('Food recommendations generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Meal Planner"
        description="Generate personalized meal plans and discover new foods"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
          <FormCard title="Plan Generator" description="Get a customized meal plan based on your profile">
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sex</Label>
                  <Select value={planForm.sex} onValueChange={(v) => setPlanForm({ ...planForm, sex: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={planForm.age}
                    onChange={(e) => setPlanForm({ ...planForm, age: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={planForm.height_cm}
                    onChange={(e) => setPlanForm({ ...planForm, height_cm: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={planForm.weight_kg}
                    onChange={(e) => setPlanForm({ ...planForm, weight_kg: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Activity Level</Label>
                <Select value={planForm.activity} onValueChange={(v) => setPlanForm({ ...planForm, activity: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Goal</Label>
                  <Select value={planForm.goal} onValueChange={(v) => setPlanForm({ ...planForm, goal: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loss">Weight Loss</SelectItem>
                      <SelectItem value="maintain">Maintain</SelectItem>
                      <SelectItem value="gain">Weight Gain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Diet Type</Label>
                  <Select value={planForm.diet_type} onValueChange={(v) => setPlanForm({ ...planForm, diet_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="vegegg">Veg + Egg</SelectItem>
                      <SelectItem value="nonveg">Non-Veg</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loadingPlan} className="w-full">
                {loadingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Utensils className="mr-2 h-4 w-4" />}
                Generate Plan
              </Button>
            </form>
          </FormCard>

          {plan && (
            <FormCard title="Plan Summary">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">TDEE</p>
                    <p className="text-2xl font-bold text-foreground">{plan.tdee}</p>
                    <p className="text-xs text-muted-foreground">kcal/day</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p className="text-2xl font-bold text-foreground">{plan.target_kcal}</p>
                    <p className="text-xs text-muted-foreground">kcal/day</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Macros (g)</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">P: {plan.macros_g?.protein}g</Badge>
                    <Badge variant="secondary">C: {plan.macros_g?.carbs}g</Badge>
                    <Badge variant="secondary">F: {plan.macros_g?.fat}g</Badge>
                  </div>
                </div>
                {projection && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-info/10 to-success/10 border border-info/20">
                    <p className="text-sm text-muted-foreground mb-1">7-Day Weight Change</p>
                    <p className="text-3xl font-bold text-foreground">
                      {projection.delta_kg > 0 ? '+' : ''}{projection.delta_kg.toFixed(2)} kg
                    </p>
                  </div>
                )}
                <Button onClick={handleProjectSubmit} disabled={loadingProject} variant="outline" className="w-full">
                  {loadingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                  Project 7 Days
                </Button>
              </div>
            </FormCard>
          )}
        </div>

        <FormCard title="You May Also Like" description="Get food recommendations based on your favorites">
          <form onSubmit={handleRecsSubmit} className="space-y-4">
            <div>
              <Label htmlFor="likes">Favorite Dishes (comma-separated)</Label>
              <Textarea
                id="likes"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="e.g., Paneer Tikka, Chicken Biryani, Pad Thai"
                rows={4}
                required
              />
            </div>
            <Button type="submit" disabled={loadingRecs} className="w-full">
              {loadingRecs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Utensils className="mr-2 h-4 w-4" />}
              Recommend Foods
            </Button>
          </form>

          {recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Recommendations</h4>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex justify-between items-center">
                    <span className="text-sm text-foreground">{rec.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {(rec.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FormCard>
      </div>

      {plan?.plan && (
        <FormCard title="Your Meal Plan">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Food</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Grams</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Kcal</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Protein</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Carbs</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Fat</th>
                </tr>
              </thead>
              <tbody>
                {plan.plan.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/30">
                    <td className="p-3 text-foreground">{item.food}</td>
                    <td className="p-3 text-right text-muted-foreground">{item.grams}</td>
                    <td className="p-3 text-right text-foreground font-medium">{item.kcal}</td>
                    <td className="p-3 text-right text-muted-foreground">{item.protein}g</td>
                    <td className="p-3 text-right text-muted-foreground">{item.carbs}g</td>
                    <td className="p-3 text-right text-muted-foreground">{item.fat}g</td>
                  </tr>
                ))}
                {plan.totals && (
                  <tr className="font-semibold bg-secondary/20">
                    <td className="p-3 text-foreground">Totals</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right text-foreground">{plan.totals.kcal}</td>
                    <td className="p-3 text-right text-foreground">{plan.totals.protein}g</td>
                    <td className="p-3 text-right text-foreground">{plan.totals.carbs}g</td>
                    <td className="p-3 text-right text-foreground">{plan.totals.fat}g</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {plan.gaps && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground w-full mb-1">Gaps:</p>
              <Badge variant="outline">Protein: {plan.gaps.protein}g</Badge>
              <Badge variant="outline">Carbs: {plan.gaps.carbs}g</Badge>
              <Badge variant="outline">Fat: {plan.gaps.fat}g</Badge>
            </div>
          )}
        </FormCard>
      )}
    </div>
  );
}
