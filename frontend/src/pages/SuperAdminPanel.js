/**
 * Super Admin Panel - Platform Owner Dashboard
 * SECRET URL: /owner-x7k9m2 (hidden from public)
 * Manage all schools, subscriptions, earnings, API usage
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Building2, Users, IndianRupee, TrendingUp, School, 
  AlertCircle, CheckCircle, Clock, Search, Filter,
  MoreVertical, Eye, Edit, Ban, RefreshCw, Download,
  MessageSquare, Settings, LogOut, BarChart3, Calendar,
  CreditCard, HelpCircle, ChevronRight, Mail, Phone,
  Crown, Shield, Sparkles, Activity, XCircle, Key, 
  Zap, Database, AlertTriangle, Play, Pause, DollarSign,
  Bot, Mic, CreditCard as PaymentIcon, TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

// SECRET API ENDPOINT - matches backend
const API = `${process.env.REACT_APP_BACKEND_URL}/api/owner-console-x7k9m2`;

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ownerToken'));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  const [schools, setSchools] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [apiUsage, setApiUsage] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [costAlerts, setCostAlerts] = useState(null);
  
  // WhatsApp Management
  const [whatsappConfig, setWhatsappConfig] = useState(null);
  const [messagePacks, setMessagePacks] = useState([]);
  const [schoolsWhatsApp, setSchoolsWhatsApp] = useState([]);
  const [whatsappUsage, setWhatsappUsage] = useState(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [showAssignPackModal, setShowAssignPackModal] = useState(false);
  const [showWhatsAppConfigModal, setShowWhatsAppConfigModal] = useState(false);
  const [newPack, setNewPack] = useState({ name: '', messages_count: 1000, price: 500, validity_days: 30 });
  const [assignPack, setAssignPack] = useState({ school_id: '', pack_id: '', amount_paid: 0, payment_method: 'cash' });
  const [waConfig, setWaConfig] = useState({ api_key: '', api_secret: '', instance_id: '', phone_number: '' });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected school for details
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState(null);
  
  // Trial modal
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialConfig, setTrialConfig] = useState({ days: 30, features: 'all' });
  const [targetSchoolId, setTargetSchoolId] = useState(null);
  
  // API Key modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ service: '', api_key: '', secret_key: '', monthly_limit: '' });

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
    }
  }, [isLoggedIn]);

  const verifyToken = async () => {
    try {
      const res = await axios.get(`${API}/verify?token=${token}`);
      if (res.data.valid) {
        setAdmin(res.data.admin);
        setIsLoggedIn(true);
      }
    } catch (error) {
      localStorage.removeItem('ownerToken');
      setToken(null);
      setIsLoggedIn(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/login`, loginForm);
      localStorage.setItem('ownerToken', res.data.access_token);
      setToken(res.data.access_token);
      setAdmin(res.data.admin);
      setIsLoggedIn(true);
      toast.success('Welcome Platform Owner!');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    setToken(null);
    setAdmin(null);
    setIsLoggedIn(false);
    toast.success('Logged out');
  };

  const loadDashboard = async () => {
    try {
      const res = await axios.get(`${API}/dashboard?token=${token}`);
      setDashboard(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    }
  };

  const loadSchools = async () => {
    try {
      const params = new URLSearchParams({ token });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await axios.get(`${API}/schools?${params}`);
      setSchools(res.data.schools);
    } catch (error) {
      toast.error('Failed to load schools');
    }
  };

  const loadSchoolDetails = async (schoolId) => {
    try {
      const res = await axios.get(`${API}/schools/${schoolId}?token=${token}`);
      setSchoolDetails(res.data);
      setSelectedSchool(schoolId);
    } catch (error) {
      toast.error('Failed to load school details');
    }
  };

  const loadEarnings = async () => {
    try {
      const res = await axios.get(`${API}/earnings?token=${token}`);
      setEarnings(res.data);
    } catch (error) {
      toast.error('Failed to load earnings');
    }
  };

  const loadTickets = async () => {
    try {
      const res = await axios.get(`${API}/support-tickets?token=${token}`);
      setTickets(res.data.tickets);
    } catch (error) {
      toast.error('Failed to load tickets');
    }
  };

  const loadApiUsage = async () => {
    try {
      const res = await axios.get(`${API}/api-usage?token=${token}`);
      setApiUsage(res.data);
    } catch (error) {
      toast.error('Failed to load API usage');
    }
  };

  const loadApiKeys = async () => {
    try {
      const res = await axios.get(`${API}/api-keys?token=${token}`);
      setApiKeys(res.data.keys || []);
    } catch (error) {
      toast.error('Failed to load API keys');
    }
  };

  const loadCostAlerts = async () => {
    try {
      const res = await axios.get(`${API}/cost-alerts?token=${token}`);
      setCostAlerts(res.data);
    } catch (error) {
      console.error('Failed to load cost alerts');
    }
  };

  const updateSchoolStatus = async (schoolId, status, reason = '') => {
    try {
      await axios.put(`${API}/schools/${schoolId}/status?token=${token}`, {
        school_id: schoolId,
        status,
        reason
      });
      toast.success(`School ${status}`);
      loadSchools();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const extendTrial = async (schoolId, days) => {
    try {
      await axios.post(`${API}/subscriptions/${schoolId}/extend-trial?days=${days}&token=${token}`);
      toast.success(`Trial extended by ${days} days`);
      loadSchools();
    } catch (error) {
      toast.error('Failed to extend trial');
    }
  };

  const startTrial = async (schoolId) => {
    try {
      await axios.post(`${API}/trial/start/${schoolId}?days=${trialConfig.days}&features=${trialConfig.features}&token=${token}`);
      toast.success(`Trial started for ${trialConfig.days} days`);
      setShowTrialModal(false);
      loadSchools();
    } catch (error) {
      toast.error('Failed to start trial');
    }
  };

  const convertToPaid = async (schoolId, planType, billingCycle, amount) => {
    try {
      await axios.post(`${API}/trial/convert-to-paid/${schoolId}?plan_type=${planType}&billing_cycle=${billingCycle}&amount=${amount}&token=${token}`);
      toast.success('Converted to paid subscription');
      loadSchools();
    } catch (error) {
      toast.error('Failed to convert');
    }
  };

  const saveApiKey = async () => {
    try {
      await axios.post(`${API}/api-keys?token=${token}`, newApiKey);
      toast.success(`${newApiKey.service} API key saved`);
      setShowApiKeyModal(false);
      setNewApiKey({ service: '', api_key: '', secret_key: '', monthly_limit: '' });
      loadApiKeys();
    } catch (error) {
      toast.error('Failed to save API key');
    }
  };

  useEffect(() => {
    if (activeTab === 'schools' && isLoggedIn) loadSchools();
    if (activeTab === 'earnings' && isLoggedIn) loadEarnings();
    if (activeTab === 'support' && isLoggedIn) loadTickets();
    if (activeTab === 'api-usage' && isLoggedIn) { loadApiUsage(); loadCostAlerts(); }
    if (activeTab === 'api-keys' && isLoggedIn) loadApiKeys();
  }, [activeTab, isLoggedIn]);

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Super Admin</CardTitle>
            <p className="text-white/60">Schooltino Platform Control</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Admin Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" disabled={loading}>
                {loading ? 'Logging in...' : 'Login as Super Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Super Admin Panel</h1>
              <p className="text-xs text-white/60">Schooltino Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">Welcome, {admin?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/60 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-72px)]">
          <nav className="p-4 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'schools', label: 'Schools', icon: Building2 },
              { id: 'earnings', label: 'Earnings', icon: IndianRupee },
              { id: 'whatsapp', label: 'WhatsApp Business', icon: MessageSquare },
              { id: 'api-usage', label: 'API Usage & Costs', icon: Zap },
              { id: 'api-keys', label: 'API Keys', icon: Key },
              { id: 'support', label: 'Support Tickets', icon: HelpCircle },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Schools</p>
                        <p className="text-3xl font-bold">{dashboard.schools.total}</p>
                        <p className="text-sm text-blue-200 mt-1">+{dashboard.schools.recent_30_days} this month</p>
                      </div>
                      <Building2 className="w-12 h-12 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100">Total Earnings</p>
                        <p className="text-3xl font-bold">₹{dashboard.earnings.total.toLocaleString()}</p>
                        <p className="text-sm text-emerald-200 mt-1">Recurring: ₹{(dashboard.earnings.monthly_recurring + dashboard.earnings.yearly_recurring).toLocaleString()}</p>
                      </div>
                      <IndianRupee className="w-12 h-12 text-emerald-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Active Schools</p>
                        <p className="text-3xl font-bold">{dashboard.schools.active}</p>
                        <p className="text-sm text-purple-200 mt-1">{dashboard.schools.trial} on trial</p>
                      </div>
                      <CheckCircle className="w-12 h-12 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100">Total Users</p>
                        <p className="text-3xl font-bold">{dashboard.users.total_students + dashboard.users.total_staff}</p>
                        <p className="text-sm text-amber-200 mt-1">{dashboard.users.total_students} students</p>
                      </div>
                      <Users className="w-12 h-12 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Basic ERP</span>
                        <span className="font-semibold">{dashboard.subscriptions.by_plan.basic}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">AI Powered</span>
                        <span className="font-semibold text-indigo-600">{dashboard.subscriptions.by_plan.ai_powered}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Enterprise</span>
                        <span className="font-semibold text-amber-600">{dashboard.subscriptions.by_plan.enterprise}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Support Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-red-600">{dashboard.support.open_issues}</span>
                      </div>
                      <div>
                        <p className="font-medium">Open Tickets</p>
                        <p className="text-sm text-slate-500">Needs attention</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('schools')}>
                      <Building2 className="w-4 h-4 mr-2" /> View All Schools
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('support')}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Check Tickets
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Schools Tab */}
          {activeTab === 'schools' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Schools Management</h2>
                <Button onClick={loadSchools}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
                <Button onClick={loadSchools}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Schools List */}
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">School</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Plan</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Students</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schools.map((school) => (
                      <tr key={school.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{school.name}</p>
                            <p className="text-sm text-slate-500">{school.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            school.subscription?.plan_type === 'enterprise' ? 'bg-amber-100 text-amber-700' :
                            school.subscription?.plan_type === 'ai_powered' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {school.subscription?.plan_type || 'Trial'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {school.is_trial ? 'Trial' : school.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {school.stats?.students || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => loadSchoolDetails(school.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => extendTrial(school.id, 15)}>
                              <Clock className="w-4 h-4" />
                            </Button>
                            {school.is_active ? (
                              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => updateSchoolStatus(school.id, 'suspended')}>
                                <Ban className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="text-green-500" onClick={() => updateSchoolStatus(school.id, 'active')}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* School Details Modal */}
              {schoolDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{schoolDetails.school.name}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSchoolDetails(null)}>
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Email</p>
                          <p className="font-medium">{schoolDetails.school.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Phone</p>
                          <p className="font-medium">{schoolDetails.school.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Students</p>
                          <p className="font-medium">{schoolDetails.stats.students}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Staff</p>
                          <p className="font-medium">{schoolDetails.stats.staff}</p>
                        </div>
                      </div>

                      {schoolDetails.subscription && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Subscription</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Plan:</span>
                              <span className="ml-2 font-medium">{schoolDetails.subscription.plan_type}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Amount:</span>
                              <span className="ml-2 font-medium">₹{schoolDetails.subscription.amount}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Valid Until:</span>
                              <span className="ml-2 font-medium">{schoolDetails.subscription.valid_until}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Status:</span>
                              <span className="ml-2 font-medium">{schoolDetails.subscription.status}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {schoolDetails.director && (
                        <div>
                          <h4 className="font-medium mb-2">Director</h4>
                          <p>{schoolDetails.director.name}</p>
                          <p className="text-sm text-slate-500">{schoolDetails.director.email}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={() => extendTrial(selectedSchool, 30)}>
                          Extend Trial 30 Days
                        </Button>
                        <Button variant="outline">
                          Edit Subscription
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && earnings && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Earnings Report</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-slate-500">Total Earnings</p>
                    <p className="text-3xl font-bold text-emerald-600">₹{earnings.total_earnings.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-slate-500">Pending Payments</p>
                    <p className="text-3xl font-bold text-amber-600">₹{earnings.pending_payments.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-slate-500">Total Transactions</p>
                    <p className="text-3xl font-bold">{earnings.total_transactions}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(earnings.monthly_breakdown || {}).slice(0, 6).map(([month, amount]) => (
                      <div key={month} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium">{month}</span>
                        <span className="text-emerald-600 font-semibold">₹{amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnings.recent_payments.slice(0, 10).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.school_name || 'School'}</p>
                          <p className="text-sm text-slate-500">{payment.created_at?.slice(0, 10)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${payment.status === 'success' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            ₹{payment.amount?.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">{payment.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>

              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                      <p className="text-slate-600">No open tickets! All issues resolved.</p>
                    </CardContent>
                  </Card>
                ) : (
                  tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                ticket.status === 'open' ? 'bg-red-100 text-red-700' :
                                ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {ticket.status}
                              </span>
                              <span className="text-sm text-slate-500">{ticket.school_name}</span>
                            </div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-sm text-slate-600 mt-1">{ticket.message}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Respond
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Admin Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium">{admin?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{admin?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Role</p>
                    <p className="font-medium capitalize">{admin?.role}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* API Usage Tab */}
          {activeTab === 'api-usage' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">API Usage & Costs</h2>
              
              {/* Cost Alerts */}
              {costAlerts && costAlerts.total_alerts > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <div>
                        <p className="font-medium text-red-700">{costAlerts.total_alerts} Cost Alerts</p>
                        <p className="text-sm text-red-600">{costAlerts.critical} critical, {costAlerts.warnings} warnings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {apiUsage && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-violet-200">OpenAI / Emergent LLM</p>
                            <p className="text-2xl font-bold">{apiUsage.summary.openai.total_queries} queries</p>
                            <p className="text-sm text-violet-200">Est. Cost: ₹{(apiUsage.summary.openai.estimated_cost * 83).toFixed(0)}</p>
                          </div>
                          <Bot className="w-10 h-10 text-violet-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-pink-200">ElevenLabs Voice</p>
                            <p className="text-2xl font-bold">{apiUsage.summary.elevenlabs.total_requests} requests</p>
                            <p className="text-sm text-pink-200">Est. Cost: ₹{(apiUsage.summary.elevenlabs.estimated_cost * 83).toFixed(0)}</p>
                          </div>
                          <Mic className="w-10 h-10 text-pink-200" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200">Razorpay</p>
                            <p className="text-2xl font-bold">₹{apiUsage.summary.razorpay.total_amount.toLocaleString()}</p>
                            <p className="text-sm text-blue-200">Fees: ₹{apiUsage.summary.razorpay.estimated_fees.toFixed(0)}</p>
                          </div>
                          <PaymentIcon className="w-10 h-10 text-blue-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total Cost */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500">Total Estimated Monthly Cost</p>
                          <p className="text-4xl font-bold text-red-600">₹{(apiUsage.summary.total_estimated_cost * 83).toFixed(0)}</p>
                        </div>
                        <TrendingDown className="w-12 h-12 text-red-300" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Consumers */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top API Consumers (OpenAI)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(apiUsage.top_openai_consumers || []).map((school, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="font-medium">{school.school_name}</p>
                              <p className="text-sm text-slate-500">{school.queries} queries</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-violet-600">{school.tokens} tokens</p>
                              <p className="text-xs text-slate-500">~₹{(school.tokens * 0.001).toFixed(0)}</p>
                            </div>
                          </div>
                        ))}
                        {(!apiUsage.top_openai_consumers || apiUsage.top_openai_consumers.length === 0) && (
                          <p className="text-center text-slate-500 py-4">No usage data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!apiUsage && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Loading API usage data...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">API Keys Management</h2>
                <Button onClick={() => setShowApiKeyModal(true)}>
                  <Key className="w-4 h-4 mr-2" /> Add API Key
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OpenAI / Emergent */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-violet-500" />
                      OpenAI / Emergent LLM
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiKeys.find(k => k.service === 'openai' || k.service === 'emergent') ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">API Key</span>
                          <span className="font-mono text-sm">{apiKeys.find(k => k.service === 'openai' || k.service === 'emergent')?.api_key}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">Not configured</p>
                    )}
                  </CardContent>
                </Card>

                {/* ElevenLabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-pink-500" />
                      ElevenLabs Voice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiKeys.find(k => k.service === 'elevenlabs') ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">API Key</span>
                          <span className="font-mono text-sm">{apiKeys.find(k => k.service === 'elevenlabs')?.api_key}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">Not configured</p>
                    )}
                  </CardContent>
                </Card>

                {/* Razorpay */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PaymentIcon className="w-5 h-5 text-blue-500" />
                      Razorpay Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiKeys.find(k => k.service === 'razorpay') ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Key ID</span>
                          <span className="font-mono text-sm">{apiKeys.find(k => k.service === 'razorpay')?.api_key}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Secret</span>
                          <span className="font-mono text-sm">***hidden***</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">Not configured</p>
                    )}
                  </CardContent>
                </Card>

                {/* Twilio/SMS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      Twilio SMS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiKeys.find(k => k.service === 'twilio') ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Account SID</span>
                          <span className="font-mono text-sm">{apiKeys.find(k => k.service === 'twilio')?.api_key}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">Not configured</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Add API Key Modal */}
              {showApiKeyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Add API Key</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <select
                        value={newApiKey.service}
                        onChange={(e) => setNewApiKey({...newApiKey, service: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Select Service</option>
                        <option value="openai">OpenAI</option>
                        <option value="emergent">Emergent LLM</option>
                        <option value="elevenlabs">ElevenLabs</option>
                        <option value="razorpay">Razorpay</option>
                        <option value="twilio">Twilio</option>
                        <option value="sendgrid">SendGrid</option>
                      </select>
                      <Input
                        placeholder="API Key"
                        value={newApiKey.api_key}
                        onChange={(e) => setNewApiKey({...newApiKey, api_key: e.target.value})}
                      />
                      {newApiKey.service === 'razorpay' && (
                        <Input
                          placeholder="Secret Key"
                          type="password"
                          value={newApiKey.secret_key}
                          onChange={(e) => setNewApiKey({...newApiKey, secret_key: e.target.value})}
                        />
                      )}
                      <Input
                        placeholder="Monthly Limit (₹) - Optional"
                        type="number"
                        value={newApiKey.monthly_limit}
                        onChange={(e) => setNewApiKey({...newApiKey, monthly_limit: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveApiKey} className="flex-1">Save</Button>
                        <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
