import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { FormCard } from '@/components/ui/form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { postMovieRecommend } from '@/api/client';
import { toast } from 'sonner';
import { Loader2, Film, Star } from 'lucide-react';

export default function Entertainment() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [k, setK] = useState('5');
  const [results, setResults] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await postMovieRecommend({ title, k: parseInt(k) });
      setResults(data.items || []);
      if (data.items?.length === 0) {
        toast.info('No recommendations found for this title');
      } else {
        toast.success(`Found ${data.items?.length} recommendations!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get recommendations');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Movie Recommendations"
        description="Get personalized movie suggestions based on your favorites"
      />

      <div className="mb-8">
        <FormCard title="Find Similar Movies" description="Enter a movie title to discover similar films">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Movie Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tangled"
                required
              />
            </div>
            <div>
              <Label htmlFor="k">Number of Recommendations</Label>
              <Input
                id="k"
                type="number"
                min="1"
                max="20"
                value={k}
                onChange={(e) => setK(e.target.value)}
                placeholder="5"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          </form>
        </FormCard>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold text-foreground mb-4">Recommended Movies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((movie, idx) => (
              <div key={idx} className="glass hover-lift p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold text-foreground line-clamp-2">{movie.title}</h4>
                  <div className="flex items-center gap-1 text-warning shrink-0 ml-2">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{movie.rating?.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {movie.genres?.split(',').slice(0, 3).map((genre: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {genre.trim()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{movie.overview}</p>
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Similarity: <span className="text-primary font-medium">{(movie.score * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-16">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Enter a movie title to get started</p>
        </div>
      )}
    </div>
  );
}
