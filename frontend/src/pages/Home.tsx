import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { Button } from '@/components/ui/button';
import { Activity, Film, Target, Smile, TrendingUp, Footprints, Flame, Moon, Utensils, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const moodData = [
  { day: 'Mon', mood: 7 },
  { day: 'Tue', mood: 8 },
  { day: 'Wed', mood: 6 },
  { day: 'Thu', mood: 9 },
  { day: 'Fri', mood: 8 },
  { day: 'Sat', mood: 10 },
  { day: 'Sun', mood: 9 },
];

const sentimentData = [
  { type: 'Positive', count: 45 },
  { type: 'Neutral', count: 30 },
  { type: 'Negative', count: 25 },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Welcome back!"
        description="Your personal AI companion dashboard"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Health Score"
          value="85%"
          icon={Activity}
          trend={{ value: 5, positive: true }}
          subtitle="Predictions ready"
        />
        <StatCard
          title="Movie Recs"
          value="12"
          icon={Film}
          subtitle="Available recommendations"
        />
        <StatCard
          title="Today's Target"
          value="2,400"
          icon={Target}
          subtitle="kcal target"
        />
        <StatCard
          title="Mood Today"
          value="😊"
          icon={Smile}
          subtitle="Positive vibes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard title="Today at a Glance" description="Your daily metrics">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
              <Footprints className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">8,543</p>
              <p className="text-xs text-muted-foreground">Steps</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent/5 border border-accent/10">
              <Flame className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">1,847</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-info/5 border border-info/10">
              <Moon className="w-8 h-8 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">7.5h</p>
              <p className="text-xs text-muted-foreground">Sleep</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Mood Trend" description="Last 7 days">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sentiment Split" description="Message analysis">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="glass-strong p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate('/food')}
            className="h-auto py-6 flex-col gap-2 bg-gradient-to-br from-accent to-accent/70 hover:from-accent/90 hover:to-accent/60"
          >
            <Utensils className="w-6 h-6" />
            <span>Generate Meal Plan</span>
          </Button>
          <Button
            onClick={() => navigate('/entertainment')}
            className="h-auto py-6 flex-col gap-2 bg-gradient-to-br from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60"
          >
            <Film className="w-6 h-6" />
            <span>Get Movie Recs</span>
          </Button>
          <Button
            onClick={() => navigate('/social')}
            className="h-auto py-6 flex-col gap-2 bg-gradient-to-br from-info to-info/70 hover:from-info/90 hover:to-info/60"
          >
            <MessageSquare className="w-6 h-6" />
            <span>Check Mood</span>
          </Button>
          <Button
            onClick={() => navigate('/social')}
            className="h-auto py-6 flex-col gap-2 bg-gradient-to-br from-warning to-warning/70 hover:from-warning/90 hover:to-warning/60"
          >
            <TrendingUp className="w-6 h-6" />
            <span>Upload WhatsApp</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
