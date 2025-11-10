import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { FormCard } from '@/components/ui/form-card';
import { ChartCard } from '@/components/ui/chart-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { postSocialSentiment, postWhatsAppInsights } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Upload, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Social() {
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  const handleSentimentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSentiment(true);

    try {
      const data = await postSocialSentiment({ text });
      setSentiment(data);
      toast.success('Sentiment analyzed!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze sentiment');
    } finally {
      setLoadingSentiment(false);
    }
  };

  const handleWhatsAppUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingWhatsApp(true);
    try {
      const data = await postWhatsAppInsights(file);
      setInsights(data);
      toast.success('WhatsApp chat analyzed!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze chat');
    } finally {
      setLoadingWhatsApp(false);
    }
  };

  const getProbabilityBars = (proba: any) => {
    return [
      { label: 'Negative', value: proba.negative || 0, color: 'hsl(var(--destructive))' },
      { label: 'Neutral', value: proba.neutral || 0, color: 'hsl(var(--muted-foreground))' },
      { label: 'Positive', value: proba.positive || 0, color: 'hsl(var(--success))' },
    ];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Social Insights"
        description="Analyze sentiment and chat patterns using AI"
      />

      <Tabs defaultValue="sentiment" className="space-y-6">
        <TabsList className="glass-strong">
          <TabsTrigger value="sentiment">Live Sentiment</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormCard title="Text Analysis" description="Enter text to predict sentiment">
              <form onSubmit={handleSentimentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="text">Your Text</Label>
                  <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={loadingSentiment} className="w-full">
                  {loadingSentiment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Predict Sentiment
                    </>
                  )}
                </Button>
              </form>
            </FormCard>

            {sentiment && (
              <FormCard title="Sentiment Result">
                <div className="space-y-4">
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Predicted Sentiment</p>
                    <p className="text-4xl font-bold text-primary capitalize mb-2">
                      {sentiment.prediction}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {getProbabilityBars(sentiment.proba).map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-foreground font-medium">{(item.value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${item.value * 100}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FormCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <FormCard title="Upload Chat" description="Upload WhatsApp chat export (HTML or TXT)">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <Input
                  type="file"
                  accept=".html,.txt"
                  onChange={handleWhatsAppUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={loadingWhatsApp}
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium mb-1">
                    {loadingWhatsApp ? 'Analyzing...' : 'Click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">HTML or TXT files only</p>
                </Label>
              </div>
            </div>
          </FormCard>

          {insights && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Messages Parsed</p>
                      <p className="text-3xl font-bold text-foreground">{insights.parsed || 0}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Top Sender</p>
                      <p className="text-xl font-bold text-foreground">
                        {insights.by_sender ? Object.keys(insights.by_sender)[0] : 'N/A'}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Positive Messages</p>
                      <p className="text-3xl font-bold text-success">
                        {insights.by_sentiment?.positive || 0}
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-success" />
                  </div>
                </div>
              </div>

              {insights.by_hour && insights.by_hour.length > 0 && (
                <ChartCard title="Messages by Hour" description="Activity distribution throughout the day">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={insights.by_hour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
