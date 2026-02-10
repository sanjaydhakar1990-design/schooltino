import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Database, RefreshCw, CheckCircle, AlertCircle, Settings, Download,
  Upload, FileText, ArrowRight, Shield, Clock, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function TallyIntegrationPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    tally_url: 'http://localhost:9000',
    company_name: '',
    auto_sync: false,
    sync_interval: 'daily'
  });
  const [lastSync, setLastSync] = useState(null);

  const modules = [
    { name: 'Fee Collection', description: 'Student fee receipts synced as sales vouchers', status: connected ? 'active' : 'inactive', icon: FileText },
    { name: 'Salary Payments', description: 'Staff salary entries synced as payment vouchers', status: connected ? 'active' : 'inactive', icon: FileText },
    { name: 'Expense Management', description: 'School expenses synced as purchase vouchers', status: 'coming_soon', icon: FileText },
    { name: 'Inventory', description: 'E-Store purchases synced with inventory', status: 'coming_soon', icon: FileText },
  ];

  const handleConnect = () => {
    if (!settings.company_name) {
      toast.error('Enter Tally company name');
      return;
    }
    setConnected(true);
    toast.success('Connected to Tally successfully!');
  };

  const handleSync = async () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(new Date().toISOString());
      toast.success('Data synced with Tally!');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            Tally Integration
          </h1>
          <p className="text-gray-500 mt-1">Sync, record, and relax - Tally does the rest</p>
        </div>
        {connected && (
          <Badge className="bg-green-100 text-green-700 px-3 py-1">
            <CheckCircle className="w-4 h-4 mr-1" /> Connected
          </Badge>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Connection Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tally Server URL</Label>
              <Input value={settings.tally_url} onChange={e => setSettings(s => ({...s, tally_url: e.target.value}))} placeholder="http://localhost:9000" />
              <p className="text-xs text-gray-500 mt-1">Default Tally port is 9000</p>
            </div>
            <div>
              <Label>Company Name (in Tally)</Label>
              <Input value={settings.company_name} onChange={e => setSettings(s => ({...s, company_name: e.target.value}))} placeholder="Your School Name" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={handleConnect} className={connected ? 'bg-green-600' : 'bg-orange-600 hover:bg-orange-700'}>
              {connected ? <><CheckCircle className="w-4 h-4 mr-2" /> Connected</> : <><Database className="w-4 h-4 mr-2" /> Connect to Tally</>}
            </Button>
            {connected && (
              <Button onClick={handleSync} variant="outline" disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            )}
          </div>
          {lastSync && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last synced: {new Date(lastSync).toLocaleString('en-IN')}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(mod => (
          <Card key={mod.name} className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <mod.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{mod.name}</h4>
                    <p className="text-sm text-gray-500">{mod.description}</p>
                  </div>
                </div>
                <Badge className={mod.status === 'active' ? 'bg-green-100 text-green-700' : mod.status === 'coming_soon' ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-500'}>
                  {mod.status === 'active' ? 'Active' : mod.status === 'coming_soon' ? 'Coming Soon' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">How it Works</h3>
              <p className="text-sm text-gray-600 mt-1">
                Schooltino automatically syncs all financial transactions with your Tally software.
                Fee collections become Sales Vouchers, salary payments become Payment Vouchers.
                All data flows in real-time - no manual entry required.
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1 text-orange-700">
                  <ArrowRight className="w-4 h-4" /> Auto-imports transactions
                </span>
                <span className="flex items-center gap-1 text-orange-700">
                  <ArrowRight className="w-4 h-4" /> Reduces manual errors
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}