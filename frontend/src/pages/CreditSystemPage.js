import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Coins, CreditCard, TrendingUp, Zap, Package, BarChart3,
  ArrowUpRight, ArrowDownRight, MessageSquare, FileText, Palette,
  Phone, CheckCircle, Crown, Star, Shield, Rocket, Loader2,
  Wallet, IndianRupee, Globe, Smartphone, Building2, Clock,
  RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CreditSystemPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [credits, setCredits] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);

  const usageHistory = [
    { id: 1, date: '2026-02-09', module: 'SMS', description: 'Bulk SMS to Class 10 Parents', credits: -120, balance: 5000 },
    { id: 2, date: '2026-02-08', module: 'AI Paper', description: 'Math Paper Generation - Class 12', credits: -50, balance: 5120 },
    { id: 3, date: '2026-02-07', module: 'Content', description: 'AI Content Studio - 5 posts', credits: -30, balance: 5170 },
    { id: 4, date: '2026-02-06', module: 'WhatsApp', description: 'Fee Reminder to All Parents', credits: -200, balance: 5200 },
    { id: 5, date: '2026-02-05', module: 'Recharge', description: 'Credit Pack Purchase - Standard', credits: 5000, balance: 5400 },
    { id: 6, date: '2026-02-04', module: 'SMS', description: 'Attendance Alerts', credits: -80, balance: 400 },
    { id: 7, date: '2026-02-03', module: 'AI Paper', description: 'Science Paper - Class 9', credits: -50, balance: 480 },
    { id: 8, date: '2026-02-02', module: 'Content', description: 'Newsletter Generation', credits: -20, balance: 530 },
  ];

  const creditPacks = [
    { id: 'basic', name: 'Basic', credits: 1000, price: 499, color: 'from-blue-500 to-blue-600', icon: Package, popular: false },
    { id: 'standard', name: 'Standard', credits: 5000, price: 1999, color: 'from-purple-500 to-purple-600', icon: Star, popular: true },
    { id: 'premium', name: 'Premium', credits: 15000, price: 4999, color: 'from-amber-500 to-orange-600', icon: Crown, popular: false },
    { id: 'enterprise', name: 'Enterprise', credits: 'Unlimited', price: 9999, color: 'from-emerald-500 to-teal-600', icon: Rocket, popular: false },
  ];

  const moduleUsage = [
    { name: 'SMS', used: 1200, total: 2000, color: 'bg-blue-500', icon: MessageSquare, percent: 60 },
    { name: 'AI Paper', used: 350, total: 800, color: 'bg-purple-500', icon: FileText, percent: 44 },
    { name: 'Content', used: 180, total: 500, color: 'bg-pink-500', icon: Palette, percent: 36 },
    { name: 'WhatsApp', used: 800, total: 1500, color: 'bg-green-500', icon: Phone, percent: 53 },
  ];

  const monthlyTrend = [
    { month: 'Sep', used: 1200 },
    { month: 'Oct', used: 1800 },
    { month: 'Nov', used: 1500 },
    { month: 'Dec', used: 2200 },
    { month: 'Jan', used: 1900 },
    { month: 'Feb', used: 1100 },
  ];

  const plans = [
    { id: 'free', name: 'Free', price: 0, credits: 100, features: ['100 Credits/month', 'Basic SMS', 'Email Support', '1 Admin'], color: 'from-gray-400 to-gray-500', current: false },
    { id: 'starter', name: 'Starter', price: 999, credits: 2000, features: ['2,000 Credits/month', 'SMS + WhatsApp', 'AI Paper (Basic)', '3 Admins', 'Priority Support'], color: 'from-blue-500 to-blue-600', current: false },
    { id: 'growth', name: 'Growth', price: 2999, credits: 10000, features: ['10,000 Credits/month', 'All Channels', 'AI Paper + Content', '10 Admins', 'Phone Support', 'Analytics'], color: 'from-purple-500 to-purple-600', current: true },
    { id: 'enterprise', name: 'Enterprise', price: 7999, credits: 'Unlimited', features: ['Unlimited Credits', 'All Features', 'Dedicated Manager', 'Unlimited Admins', 'Custom Integrations', 'SLA 99.9%'], color: 'from-amber-500 to-orange-600', current: false },
  ];

  const quickAmounts = [500, 1000, 2000, 5000];

  const handlePurchasePack = (pack) => {
    setSelectedPack(pack);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = () => {
    if (selectedPack) {
      const newCredits = selectedPack.credits === 'Unlimited' ? 99999 : credits + selectedPack.credits;
      setCredits(newCredits);
      toast.success(`${selectedPack.name} pack purchased! ${selectedPack.credits === 'Unlimited' ? 'Unlimited' : selectedPack.credits.toLocaleString()} credits added`);
      setShowPurchaseDialog(false);
      setSelectedPack(null);
    }
  };

  const handleRecharge = () => {
    const amount = parseInt(rechargeAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum recharge amount is ₹100');
      return;
    }
    const creditsToAdd = Math.floor(amount * 2);
    setCredits(prev => prev + creditsToAdd);
    toast.success(`₹${amount} recharged! ${creditsToAdd.toLocaleString()} credits added via ${paymentMethod.toUpperCase()}`);
    setRechargeAmount('');
  };

  const maxMonthly = Math.max(...monthlyTrend.map(m => m.used));

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
              <p className="text-2xl font-bold">{credits.toLocaleString()}</p>
              <p className="text-xs text-amber-100">Credits Balance</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">2,530</p>
              <p className="text-xs text-amber-100">Used This Month</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">Growth</p>
              <p className="text-xs text-amber-100">Current Plan</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Usage
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Crown className="w-4 h-4" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="recharge" className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> Recharge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">Available Credits</p>
                    <p className="text-3xl font-bold text-amber-900">{credits.toLocaleString()}</p>
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
                    <p className="text-3xl font-bold text-blue-900">2,530</p>
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
                    <p className="text-3xl font-bold text-green-900">₹8,497</p>
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
                    <p className="text-3xl font-bold text-purple-900">84</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Usage History</h3>
              <div className="overflow-x-auto">
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
                    {usageHistory.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-600">{item.date}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={item.module === 'Recharge' ? 'border-green-300 text-green-700' : 'border-gray-300'}>{item.module}</Badge>
                        </td>
                        <td className="py-3 px-2 text-gray-700">{item.description}</td>
                        <td className={`py-3 px-2 text-right font-semibold ${item.credits > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {item.credits > 0 ? '+' : ''}{item.credits.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">{item.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      {typeof pack.credits === 'number' ? pack.credits.toLocaleString() : pack.credits}
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

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Usage Trend</h3>
              <div className="flex items-end gap-4 h-48">
                {monthlyTrend.map(item => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">{item.used.toLocaleString()}</span>
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-lg transition-all"
                        style={{ height: `${(item.used / maxMonthly) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{item.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 text-center">
                <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">8,630</p>
                <p className="text-sm text-gray-500">Total Credits Used</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">+12%</p>
                <p className="text-sm text-gray-500">Growth vs Last Month</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-5 text-center">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">22 Days</p>
                <p className="text-sm text-gray-500">Estimated Credits Left</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Growth Plan</h3>
                    <p className="text-sm text-gray-500">Active since Jan 15, 2026</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-700">₹2,999<span className="text-sm font-normal text-gray-500">/month</span></p>
                  <Badge className="bg-green-100 text-green-700 mt-1">Active</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/60 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">10,000</p>
                  <p className="text-xs text-gray-500">Monthly Credits</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">10</p>
                  <p className="text-xs text-gray-500">Admin Users</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">Mar 15</p>
                  <p className="text-xs text-gray-500">Next Renewal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Compare Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {plans.map(plan => (
                <Card key={plan.id} className={`border-0 shadow-md relative ${plan.current ? 'ring-2 ring-purple-500' : ''}`}>
                  {plan.current && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">Current</div>
                  )}
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                      {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-4 ${plan.current ? 'bg-gray-200 text-gray-500' : `bg-gradient-to-r ${plan.color} text-white`}`}
                      disabled={plan.current}
                      onClick={() => {
                        if (!plan.current) toast.success(`Upgrade to ${plan.name} plan initiated!`);
                      }}
                    >
                      {plan.current ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recharge" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-amber-500" />
                  Recharge Credits
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Quick Recharge</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {quickAmounts.map(amt => (
                        <Button
                          key={amt}
                          variant={rechargeAmount === String(amt) ? 'default' : 'outline'}
                          className={rechargeAmount === String(amt) ? 'bg-amber-500 hover:bg-amber-600' : ''}
                          onClick={() => setRechargeAmount(String(amt))}
                        >
                          ₹{amt.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Custom Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount (min ₹100)"
                      value={rechargeAmount}
                      onChange={e => setRechargeAmount(e.target.value)}
                      className="mt-1"
                    />
                    {rechargeAmount && parseInt(rechargeAmount) >= 100 && (
                      <p className="text-xs text-green-600 mt-1">
                        You'll get {(parseInt(rechargeAmount) * 2).toLocaleString()} credits
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { id: 'upi', label: 'UPI', icon: Smartphone },
                        { id: 'card', label: 'Card', icon: CreditCard },
                        { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                      ].map(method => (
                        <Button
                          key={method.id}
                          variant={paymentMethod === method.id ? 'default' : 'outline'}
                          className={`flex items-center gap-2 ${paymentMethod === method.id ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <method.icon className="w-4 h-4" />
                          {method.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleRecharge}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                    disabled={!rechargeAmount || parseInt(rechargeAmount) < 100}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Recharge Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="p-6">
                  <h4 className="font-bold text-gray-900 mb-3">Current Balance</h4>
                  <div className="flex items-center gap-3">
                    <Coins className="w-12 h-12 text-amber-500" />
                    <div>
                      <p className="text-4xl font-bold text-amber-700">{credits.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Available Credits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h4 className="font-bold text-gray-900 mb-3">Conversion Rate</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">₹1</span>
                      <span className="font-medium text-gray-900">= 2 Credits</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">1 SMS</span>
                      <span className="font-medium text-gray-900">= 1 Credit</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">1 AI Paper</span>
                      <span className="font-medium text-gray-900">= 10 Credits</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">1 WhatsApp Msg</span>
                      <span className="font-medium text-gray-900">= 2 Credits</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h4 className="font-bold text-gray-900 mb-3">Recent Recharges</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">₹1,999 - Standard Pack</span>
                      </div>
                      <span className="text-xs text-gray-400">Feb 5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">₹499 - Basic Pack</span>
                      </div>
                      <span className="text-xs text-gray-400">Jan 20</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">₹4,999 - Premium Pack</span>
                      </div>
                      <span className="text-xs text-gray-400">Jan 5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  {typeof selectedPack.credits === 'number' ? selectedPack.credits.toLocaleString() : selectedPack.credits} Credits
                </p>
                <p className="text-lg text-gray-600 mt-1">₹{selectedPack.price.toLocaleString()}</p>
              </div>
              <div>
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'upi', label: 'UPI', icon: Smartphone },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                  ].map(method => (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? 'default' : 'outline'}
                      className={paymentMethod === method.id ? 'bg-amber-500 hover:bg-amber-600' : ''}
                      onClick={() => setPaymentMethod(method.id)}
                      size="sm"
                    >
                      <method.icon className="w-3 h-3 mr-1" />
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPurchaseDialog(false)}>Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white" onClick={confirmPurchase}>
                  Pay ₹{selectedPack.price.toLocaleString()}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}