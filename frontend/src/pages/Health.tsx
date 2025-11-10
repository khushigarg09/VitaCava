import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { FormCard } from '@/components/ui/form-card';
import { ChartCard } from '@/components/ui/chart-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, Activity } from 'lucide-react';

export default function Health() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    steps: '',
    calories: '',
    distance: '',
    active_minutes: '',
    sedentary_minutes: '',
  });
  const [result, setResult] = useState<{ prediction: number; proba?: number[] } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Match backend model's expected feature names
    const payload = {
    steps: parseFloat(formData.steps),
    calories: parseFloat(formData.calories),
    distance: parseFloat(formData.distance),
    active_minutes: parseFloat(formData.active_minutes),
};


      const res = await api.post('/health/predict', payload);
      const data = res.data;
      setResult(data);
      setHistory((prev) => [...prev, { ...payload, ...data, timestamp: new Date() }]);
      toast.success('Health prediction generated!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Health Prediction"
        description="Track your activity and get AI-powered health insights"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormCard title="Activity Input" description="Enter your daily activity metrics">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="steps">Steps</Label>
              <Input
                id="steps"
                type="number"
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                placeholder="e.g., 8543"
                required
              />
            </div>
            <div>
              <Label htmlFor="calories">Calories Burned</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="e.g., 1847"
                required
              />
            </div>
            <div>
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                placeholder="e.g., 6.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="active_minutes">Active Minutes</Label>
              <Input
                id="active_minutes"
                type="number"
                value={formData.active_minutes}
                onChange={(e) => setFormData({ ...formData, active_minutes: e.target.value })}
                placeholder="e.g., 45"
                required
              />
            </div>
            <div>
              <Label htmlFor="sedentary_minutes">Sedentary Minutes</Label>
              <Input
                id="sedentary_minutes"
                type="number"
                value={formData.sedentary_minutes}
                onChange={(e) => setFormData({ ...formData, sedentary_minutes: e.target.value })}
                placeholder="e.g., 300"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Predict Health Score
                </>
              )}
            </Button>
          </form>
        </FormCard>

        <div className="space-y-6">
          {result && (
            <FormCard title="Prediction Result">
              <div className="space-y-4">
                <div className="text-center p-8 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Predicted Health Score</p>
                  <p className="text-6xl font-bold text-primary mb-2">{result.prediction}</p>
                  {result.proba && Array.isArray(result.proba) && (
                    <p className="text-sm text-muted-foreground">
                      Confidence: {(Math.max(...result.proba) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </FormCard>
          )}

          <ChartCard title="Recent Predictions" description="Your prediction history">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No predictions yet</p>
            ) : (
              <div className="space-y-2">
                {history.slice(-5).reverse().map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {item.TotalSteps} steps, {item.Calories} kcal
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {item.prediction}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
