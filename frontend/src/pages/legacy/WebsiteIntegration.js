import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { 
  Globe, Link2, Copy, Check, RefreshCw, Loader2,
  Code, ExternalLink, Unplug, Plug
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function WebsiteIntegration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    website_url: '',
    sync_notices: true,
    sync_events: true,
    sync_gallery: true,
    sync_results: false
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/website/config`);
      if (res.data && res.data.website_url) {
        setConfig(res.data);
        setForm({
          website_url: res.data.website_url,
          sync_notices: res.data.sync_notices,
          sync_events: res.data.sync_events,
          sync_gallery: res.data.sync_gallery,
          sync_results: res.data.sync_results
        });
      }
    } catch (error) {
      console.error('Config fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.website_url) {
      toast.error('Please enter your website URL');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${API}/website/configure`, form);
      setConfig(res.data);
      toast.success('Website integration configured!');
    } catch (error) {
      toast.error('Configuration failed');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const getPublicAPIUrl = (endpoint) => {
    // This would use actual school_id in production
    return `${(process.env.REACT_APP_BACKEND_URL || '')}/api/public/school/{school_id}/${endpoint}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="website-integration">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Globe className="w-8 h-8" />
              Website Integration
            </h1>
            <p className="text-blue-100 mt-2">
              अपनी school website को Schooltino से connect करो - One click sync!
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full ${config ? 'bg-green-500' : 'bg-slate-500'}`}>
            {config ? (
              <span className="flex items-center gap-2"><Plug className="w-4 h-4" /> Connected</span>
            ) : (
              <span className="flex items-center gap-2"><Unplug className="w-4 h-4" /> Not Connected</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            Configure Integration
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Your School Website URL</Label>
              <Input
                value={form.website_url}
                onChange={(e) => setForm(f => ({ ...f, website_url: e.target.value }))}
                placeholder="https://yourschool.com"
                type="url"
                required
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <p className="font-medium text-slate-700">What to sync?</p>
              
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  📢 Notices & Announcements
                </Label>
                <Switch
                  checked={form.sync_notices}
                  onCheckedChange={(val) => setForm(f => ({ ...f, sync_notices: val }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  📅 Events & Calendar
                </Label>
                <Switch
                  checked={form.sync_events}
                  onCheckedChange={(val) => setForm(f => ({ ...f, sync_events: val }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  🖼️ Photo Gallery
                </Label>
                <Switch
                  checked={form.sync_gallery}
                  onCheckedChange={(val) => setForm(f => ({ ...f, sync_gallery: val }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  📊 Results (Public)
                </Label>
                <Switch
                  checked={form.sync_results}
                  onCheckedChange={(val) => setForm(f => ({ ...f, sync_results: val }))}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {config ? 'Update Configuration' : 'Connect Website'}
            </Button>
          </form>
        </div>

        {/* API Information */}
        <div className="space-y-4">
          {/* Embed Code */}
          {config && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-600" />
                Embed Code
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                इस code को अपनी website के {'<head>'} section में add करो:
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-green-400 rounded-lg text-xs overflow-x-auto">
{`<script src="https://schooltino.com/widget.js" 
  data-school="${user?.school_id || 'YOUR_SCHOOL_ID'}" 
  data-key="${config.api_key || 'YOUR_API_KEY'}">
</script>`}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`<script src="https://schooltino.com/widget.js" data-school="${user?.school_id}" data-key="${config.api_key}"></script>`)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Public API Endpoints */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Public API Endpoints
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              अपनी website के developer को ये APIs दो:
            </p>
            <div className="space-y-3">
              {[
                { name: 'School Info', endpoint: 'info' },
                { name: 'Notices', endpoint: 'notices' },
                { name: 'Events', endpoint: 'events' },
                { name: 'Gallery', endpoint: 'gallery' },
                { name: 'Results', endpoint: 'results' }
              ].map(api => (
                <div key={api.endpoint} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <code className="flex-1 text-xs text-blue-600 truncate">
                    GET /api/public/school/[id]/{api.endpoint}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard(getPublicAPIUrl(api.endpoint))}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">🔄 How it works</h3>
            <ol className="text-sm text-blue-700 space-y-2">
              <li>1. Configure your website URL above</li>
              <li>2. Add the embed code to your website</li>
              <li>3. Update content in Schooltino → Auto-syncs to website!</li>
              <li>4. Notices, Events, Gallery - sab ek jagah se manage</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-slate-900">Auto Sync</h4>
          <p className="text-sm text-slate-500 mt-1">एक बार update करो, दोनों जगह reflect हो</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-slate-900">Any Website</h4>
          <p className="text-sm text-slate-500 mt-1">WordPress, Wix, custom - सबके साथ काम करे</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Code className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-slate-900">Easy Setup</h4>
          <p className="text-sm text-slate-500 mt-1">Copy-paste code, done!</p>
        </div>
      </div>
    </div>
  );
}
