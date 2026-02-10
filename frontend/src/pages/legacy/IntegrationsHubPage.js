import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Puzzle, CreditCard, MessageSquare, BookOpen,
  Cloud, IndianRupee, Smartphone, Mail,
  Bell, FileText, Calculator, Settings, Zap, Lock, RefreshCw,
  ExternalLink, Phone, X, Check, AlertCircle, Loader2,
  Brain, Shield, HardDrive, Flame, Key
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_CONFIG = {
  Payment: {
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  Communication: {
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  AI: {
    icon: Brain,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  Accounting: {
    icon: Calculator,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  Authentication: {
    icon: Shield,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  Storage: {
    icon: Cloud,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
};

const INTEGRATION_ICONS = {
  razorpay: IndianRupee,
  ccavenue: CreditCard,
  paytm: Smartphone,
  twilio_sms: Phone,
  whatsapp_business: MessageSquare,
  email_smtp: Mail,
  firebase_fcm: Bell,
  openai: Brain,
  elevenlabs: Zap,
  google_vision: Zap,
  tally_erp: BookOpen,
  zoho_books: FileText,
  google_oauth: Key,
  aadhaar_verify: Shield,
  aws_s3: HardDrive,
  google_cloud: Cloud,
  firebase_db: Flame,
};

const CONFIG_FIELDS = {
  razorpay: [{ key: 'key_id', label: 'Razorpay Key ID' }, { key: 'key_secret', label: 'Key Secret', type: 'password' }],
  twilio_sms: [{ key: 'account_sid', label: 'Account SID' }, { key: 'auth_token', label: 'Auth Token', type: 'password' }, { key: 'from_number', label: 'From Number' }],
  whatsapp_business: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'phone_number_id', label: 'Phone Number ID' }],
  openai: [{ key: 'api_key', label: 'OpenAI API Key', type: 'password' }],
  elevenlabs: [{ key: 'api_key', label: 'ElevenLabs API Key', type: 'password' }],
  tally_erp: [{ key: 'server_url', label: 'Tally Server URL' }, { key: 'port', label: 'Port' }],
  google_oauth: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password' }],
  aws_s3: [{ key: 'access_key', label: 'Access Key ID' }, { key: 'secret_key', label: 'Secret Access Key', type: 'password' }, { key: 'bucket', label: 'Bucket Name' }, { key: 'region', label: 'Region' }],
  email_smtp: [{ key: 'host', label: 'SMTP Host' }, { key: 'port', label: 'Port' }, { key: 'username', label: 'Username' }, { key: 'password', label: 'Password', type: 'password' }],
  zoho_books: [{ key: 'org_id', label: 'Organization ID' }, { key: 'auth_token', label: 'Auth Token', type: 'password' }],
  google_cloud: [{ key: 'project_id', label: 'Project ID' }, { key: 'credentials_json', label: 'Credentials JSON', type: 'password' }],
  firebase_db: [{ key: 'project_id', label: 'Project ID' }, { key: 'api_key', label: 'API Key', type: 'password' }],
  firebase_fcm: [{ key: 'server_key', label: 'Server Key', type: 'password' }],
  google_vision: [{ key: 'api_key', label: 'API Key', type: 'password' }],
  ccavenue: [{ key: 'merchant_id', label: 'Merchant ID' }, { key: 'access_code', label: 'Access Code' }, { key: 'working_key', label: 'Working Key', type: 'password' }],
  paytm: [{ key: 'merchant_id', label: 'Merchant ID' }, { key: 'merchant_key', label: 'Merchant Key', type: 'password' }],
  aadhaar_verify: [{ key: 'api_key', label: 'Verification API Key', type: 'password' }],
};

const stats = [
  { label: '17+ Integrations', icon: Puzzle },
  { label: 'Plug & Play', icon: Zap },
  { label: 'Secure APIs', icon: Lock },
  { label: 'Auto-Sync', icon: RefreshCw },
];

const API_BASE = '/api';

export default function IntegrationsHubPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(null);
  const [configValues, setConfigValues] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const getToken = useCallback(() => {
    return localStorage.getItem('token') || '';
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/list`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConnect = async (integrationId, config = {}) => {
    setActionLoading(integrationId);
    try {
      const res = await fetch(`${API_BASE}/integrations/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ integration_id: integrationId, config })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setConfiguring(null);
        setConfigValues({});
        await fetchIntegrations();
      } else {
        toast.error(data.detail || 'Connection failed');
      }
    } catch (err) {
      toast.error('Failed to connect integration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (integrationId) => {
    setActionLoading(integrationId);
    try {
      const res = await fetch(`${API_BASE}/integrations/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ integration_id: integrationId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchIntegrations();
      } else {
        toast.error(data.detail || 'Disconnection failed');
      }
    } catch (err) {
      toast.error('Failed to disconnect integration');
    } finally {
      setActionLoading(null);
    }
  };

  const openConfigure = (integration) => {
    setConfiguring(integration.id);
    setConfigValues(integration.config || {});
  };

  const handleSaveConfig = (integrationId) => {
    handleConnect(integrationId, configValues);
  };

  const categorized = {};
  integrations.forEach(item => {
    if (!categorized[item.category]) categorized[item.category] = [];
    categorized[item.category].push(item);
  });

  const categoryOrder = ['Payment', 'Communication', 'AI', 'Accounting', 'Authentication', 'Storage'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 md:p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Puzzle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Integrations Hub</h1>
            <p className="text-violet-100 mt-1">Connect third-party services to supercharge your school</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-violet-600" />
              </div>
              <span className="font-semibold text-gray-800 text-sm">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {categoryOrder.map(catName => {
        const items = categorized[catName];
        if (!items || items.length === 0) return null;
        const catConfig = CATEGORY_CONFIG[catName];
        const CatIcon = catConfig.icon;
        return (
          <div key={catName} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catConfig.color} flex items-center justify-center`}>
                <CatIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{catName}</h2>
              <Badge variant="secondary" className="ml-2">{items.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => {
                const IntIcon = INTEGRATION_ICONS[item.id] || Puzzle;
                const isConnected = item.status === 'connected';
                const isLoading = actionLoading === item.id;
                const isConfigOpen = configuring === item.id;
                const fields = CONFIG_FIELDS[item.id] || [];

                return (
                  <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl ${catConfig.bgColor} flex items-center justify-center`}>
                          <IntIcon className={`w-6 h-6 ${catConfig.textColor}`} />
                        </div>
                        <Badge className={isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {isConnected ? (
                            <><Check className="w-3 h-3 mr-1" /> Connected</>
                          ) : (
                            <><AlertCircle className="w-3 h-3 mr-1" /> Not Connected</>
                          )}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{item.description}</p>

                      {isConfigOpen ? (
                        <div className="space-y-3 border-t pt-3">
                          {fields.length > 0 ? fields.map(field => (
                            <div key={field.key}>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">{field.label}</label>
                              <input
                                type={field.type || 'text'}
                                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                value={configValues[field.key] || ''}
                                onChange={(e) => setConfigValues(prev => ({...prev, [field.key]: e.target.value}))}
                                placeholder={field.label}
                              />
                            </div>
                          )) : (
                            <p className="text-xs text-gray-400">No configuration needed. Click Save to connect.</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={isLoading}
                              onClick={() => handleSaveConfig(item.id)}
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setConfiguring(null); setConfigValues({}); }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {isConnected ? (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => openConfigure(item)}
                              >
                                <Settings className="w-4 h-4 mr-1" /> Configure
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={isLoading}
                                onClick={() => handleDisconnect(item.id)}
                              >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full bg-violet-600 hover:bg-violet-700"
                              disabled={isLoading}
                              onClick={() => openConfigure(item)}
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                              Setup
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Card className="border-0 shadow-md bg-gradient-to-r from-violet-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Need a custom integration?</h3>
          <p className="text-gray-500 mb-4">We can build custom integrations tailored to your school's needs.</p>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Mail className="w-4 h-4 mr-2" /> Contact Us
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
