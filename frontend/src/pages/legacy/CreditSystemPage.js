import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Coins, CreditCard, TrendingUp, Zap, Package, BarChart3,
  ArrowUpRight, MessageSquare, FileText, Palette,
  Phone, CheckCircle, Crown, Star, Shield, Rocket, Loader2,
  Wallet, IndianRupee, Clock,
  RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CreditSystemPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [credits, setCredits] = useState(0);
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [totalRecharged, setTotalRecharged] = useState(0);
  const [avgDailyUsage, setAvgDailyUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const creditPacks = [
    { id: 'basic', name: 'Basic', credits: 500, price: 499, color: 'from-blue-500 to-blue-600', icon: Package, popular: false },
    { id: 'standard', name: 'Standard', credits: 1500, price: 999, color: 'from-purple-500 to-purple-600', icon: Star, popular: true },
    { id: 'premium', name: 'Premium', credits: 5000, price: 2499, color: 'from-amber-500 to-orange-600', icon: Crown, popular: false },
    { id: 'enterprise', name: 'Enterprise', credits: 15000, price: 4999, color: 'from-emerald-500 to-teal-600', icon: Rocket, popular: false },
  ];

  const moduleUsage = [
    { name: 'SMS', used: 0, total: 0, color: 'bg-blue-500', icon: MessageSquare, percent: 0 },
    { name: 'AI Paper', used: 0, total: 0, color: 'bg-purple-500', icon: FileText, percent: 0 },
    { name: 'Content', used: 0, total: 0, color: 'bg-pink-500', icon: Palette, percent: 0 },
    { name: 'WhatsApp', used: 0, total: 0, color: 'bg-green-500', icon: Phone, percent: 0 },
  ];

  const plans = [
    { id: 'basic', name: 'Basic', price: 499, credits: 500, features: ['500 Credits', 'Basic SMS', 'Email Support', '1 Admin'], color: 'from-blue-500 to-blue-600', current: false },
    { id: 'standard', name: 'Standard', price: 999, credits: 1500, features: ['1,500 Credits', 'SMS + WhatsApp', 'AI Paper (Basic)', '3 Admins', 'Priority Support'], color: 'from-purple-500 to-purple-600', current: false },
    { id: 'premium', name: 'Premium', price: 2499, credits: 5000, features: ['5,000 Credits', 'All Channels', 'AI Paper + Content', '10 Admins', 'Phone Support', 'Analytics'], color: 'from-amber-500 to-orange-600', current: false },
    { id: 'enterprise', name: 'Enterprise', price: 4999, credits: 15000, features: ['15,000 Credits', 'All Features', 'Dedicated Manager', 'Unlimited Admins', 'Custom Integrations', 'SLA 99.9%'], color: 'from-emerald-500 to-teal-600', current: false },
  ];

  const fetchCreditBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/credits/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setCredits(res.data.available_credits || res.data.credits || 0);
        setUsedThisMonth(res.data.used_this_month || 0);
        setTotalRecharged(res.data.total_recharged || 0);
        setAvgDailyUsage(res.data.avg_daily_usage || 0);
      }
    } catch (err) {
      console.error('Failed to fetch credit balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchUsageHistory = useCallback(async () => {
    try {
      setUsageLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/credits/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && Array.isArray(res.data.usage)) {
        setUsageHistory(res.data.usage);
      } else if (res.data && Array.isArray(res.data)) {
        setUsageHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch usage history:', err);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const schoolId = user?.school_id;
      if (!schoolId) return;
      const res = await axios.get(`${API}/subscription/status/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setSubscription(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchCreditBalance();
    fetchUsageHistory();
    fetchSubscription();
  }, [fetchCreditBalance, fetchUsageHistory, fetchSubscription]);

  const handlePurchasePack = (pack) => {
    setSelectedPack(pack);
    setShowPurchaseDialog(true);
  };

  const initiateRazorpayPayment = async (pack) => {
    setPurchaseLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setPurchaseLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      const configRes = await axios.get(`${API}/razorpay/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const razorpayKey = configRes.data.key_id;

      if (!razorpayKey) {
        toast.error('Payment gateway not configured. Please contact support.');
        setPurchaseLoading(false);
        return;
      }

      const orderRes = await axios.post(`${API}/razorpay/create-order`, {
        amount: pack.price * 100,
        currency: 'INR',
        plan_id: pack.id,
        credits: pack.credits,
        description: `${pack.name} Credit Pack - ${pack.credits} Credits`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const order = orderRes.data;

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Schooltino',
        description: `${pack.name} Credit Pack - ${pack.credits} Credits`,
        order_id: order.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(`${API}/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyRes.data.success) {
              await axios.post(`${API}/credits/add`, {
                credits: pack.credits,
                plan_id: pack.id,
                payment_id: response.razorpay_payment_id,
                amount_paid: pack.price
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });

              toast.success(`${pack.name} pack purchased! ${pack.credits.toLocaleString()} credits added to your account.`);
              setShowPurchaseDialog(false);
              setSelectedPack(null);
              fetchCreditBalance();
              fetchUsageHistory();
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Payment verification failed. If amount was deducted, please contact support.');
          }
          setPurchaseLoading(false);
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#f59e0b'
        },
        modal: {
          ondismiss: function () {
            setPurchaseLoading(false);
            toast.info('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setPurchaseLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay payment error:', err);
      toast.error(err.response?.data?.detail || 'Failed to initiate payment. Please try again.');
      setPurchaseLoading(false);
    }
  };

  const confirmPurchase = () => {
    if (selectedPack) {
      initiateRazorpayPayment(selectedPack);
    }
  };

  const handlePlanUpgrade = (plan) => {
    const pack = creditPacks.find(p => p.id === plan.id) || {
      id: plan.id,
      name: plan.name,
      credits: plan.credits,
      price: plan.price,
      color: plan.color,
      icon: Crown
    };
    initiateRazorpayPayment(pack);
  };

  const currentPlanId = subscription?.plan_type || subscription?.current_plan || null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Coins className="w-8 h-8" />
              Credit System
            </h1>
            <p className="text-amber-100 mt-2">
              Monitor usage, recharge credits & manage subscriptions
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              {balanceLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                <p className="text-2xl font-bold">{credits.toLocaleString()}</p>
              )}
              <p className="text-xs text-amber-100">Credits Balance</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{usedThisMonth.toLocaleString()}</p>
              <p className="text-xs text-amber-100">Used This Month</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{subscription?.status === 'active' ? (subscription?.plan_type || 'Active') : 'None'}</p>
              <p className="text-xs text-amber-100">Current Plan</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Usage
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Crown className="w-4 h-4" /> Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">Available Credits</p>
                    {balanceLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mt-2" />
                    ) : (
                      <p className="text-3xl font-bold text-amber-900">{credits.toLocaleString()}</p>
                    )}
                  </div>
                  <Coins className="w-10 h-10 text-amber-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Used This Month</p>
                    <p className="text-3xl font-bold text-blue-900">{usedThisMonth.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Total Recharged</p>
                    <p className="text-3xl font-bold text-green-900">₹{totalRecharged.toLocaleString()}</p>
                  </div>
                  <ArrowUpRight className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Avg Daily Usage</p>
                    <p className="text-3xl font-bold text-purple-900">{avgDailyUsage}</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Usage History</h3>
                <Button variant="outline" size="sm" onClick={fetchUsageHistory} disabled={usageLoading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${usageLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="overflow-x-auto">
                {usageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-gray-500">Loading usage history...</span>
                  </div>
                ) : usageHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No usage history found. Purchase credits to get started.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-3 px-2 text-gray-500 font-medium">Module</th>
                        <th className="text-left py-3 px-2 text-gray-500 font-medium">Description</th>
                        <th className="text-right py-3 px-2 text-gray-500 font-medium">Credits</th>
                        <th className="text-right py-3 px-2 text-gray-500 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageHistory.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2 text-gray-600">{item.date || new Date(item.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className={item.type === 'recharge' || item.credits > 0 ? 'border-green-300 text-green-700' : 'border-gray-300'}>
                              {item.module || item.type || 'Credit'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-gray-700">{item.description}</td>
                          <td className={`py-3 px-2 text-right font-semibold ${(item.credits || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {(item.credits || 0) > 0 ? '+' : ''}{(item.credits || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-600">{(item.balance || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Credit Packs</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {creditPacks.map(pack => (
                <Card key={pack.id} className={`border-0 shadow-md relative overflow-hidden ${pack.popular ? 'ring-2 ring-purple-500' : ''}`}>
                  {pack.popular && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">Popular</div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pack.color} flex items-center justify-center mx-auto mb-4`}>
                      <pack.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">{pack.name}</h4>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {pack.credits.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">Credits</p>
                    <p className="text-xl font-semibold text-gray-700 mb-4">₹{pack.price.toLocaleString()}</p>
                    <Button onClick={() => handlePurchasePack(pack)} className={`w-full bg-gradient-to-r ${pack.color} text-white`}>
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Credit Consumption by Module</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleUsage.map(mod => (
                <Card key={mod.name} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center`}>
                          <mod.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{mod.name}</p>
                          <p className="text-xs text-gray-500">{mod.used.toLocaleString()} / {mod.total.toLocaleString()} credits</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-700">{mod.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`${mod.color} h-3 rounded-full transition-all`} style={{ width: `${mod.percent}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 text-center">
                <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{usedThisMonth.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Credits Used</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{credits.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Credits Remaining</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 text-center">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {avgDailyUsage > 0 ? Math.floor(credits / avgDailyUsage) : '∞'}
                </p>
                <p className="text-sm text-gray-500">Estimated Days Left</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          {subscription && subscription.status === 'active' && (
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{subscription.plan_type || 'Active'} Plan</h3>
                      <p className="text-sm text-gray-500">Active since {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700 mt-1">Active</Badge>
                  </div>
                </div>
                {subscription.end_date && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{credits.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Available Credits</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">{new Date(subscription.end_date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">Next Renewal</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase Credit Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {plans.map(plan => {
                const isCurrent = currentPlanId === plan.id;
                return (
                  <Card key={plan.id} className={`border-0 shadow-md relative ${isCurrent ? 'ring-2 ring-purple-500' : ''}`}>
                    {isCurrent && (
                      <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">Current</div>
                    )}
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ₹{plan.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{plan.credits.toLocaleString()} Credits</p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full mt-4 bg-gradient-to-r ${plan.color} text-white`}
                        onClick={() => handlePlanUpgrade(plan)}
                        disabled={purchaseLoading}
                      >
                        {purchaseLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          {selectedPack && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedPack.color} flex items-center justify-center mx-auto mb-3`}>
                  <selectedPack.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedPack.name} Pack</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {selectedPack.credits.toLocaleString()} Credits
                </p>
                <p className="text-lg text-gray-600 mt-1">₹{selectedPack.price.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium">Payment via Razorpay</p>
                <p className="text-xs mt-1">Secure payment via UPI, Card, Net Banking & more</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPurchaseDialog(false)} disabled={purchaseLoading}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  onClick={confirmPurchase}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ₹{selectedPack.price.toLocaleString()}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
