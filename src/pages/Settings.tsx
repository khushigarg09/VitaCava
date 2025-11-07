import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { FormCard } from '@/components/ui/form-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { updateBaseURL, testAPI } from '@/api/client';
import { toast } from 'sonner';
import { Moon, Sun, Check, Loader2 } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('VITE_API_URL') || import.meta.env.VITE_API_URL || 'http://localhost:8000'
  );
  const [testing, setTesting] = useState(false);

  const handleSaveUrl = () => {
    updateBaseURL(apiUrl);
    toast.success('API URL updated successfully!');
  };

  const handleTestAPI = async () => {
    setTesting(true);
    try {
      const data = await testAPI();
      toast.success('API connection successful!', {
        description: JSON.stringify(data),
      });
    } catch (error: any) {
      toast.error('API connection failed', {
        description: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Customize your VitaCava experience"
      />

      <div className="space-y-6">
        <FormCard title="Appearance" description="Customize the look and feel">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-warning" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </FormCard>

        <FormCard title="API Configuration" description="Configure your backend connection">
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiUrl">API Base URL</Label>
              <Input
                id="apiUrl"
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the base URL of your VitaCava backend API
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveUrl} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Save URL
              </Button>
              <Button onClick={handleTestAPI} variant="outline" disabled={testing} className="flex-1">
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </div>
        </FormCard>

        <FormCard title="About" description="Application information">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="text-foreground font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="text-foreground font-medium">Production</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-success font-medium">● Active</span>
            </div>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
