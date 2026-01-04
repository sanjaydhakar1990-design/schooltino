import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import {
  CreditCard,
  Check,
  Crown,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  AlertTriangle,
  Zap,
  Shield,
  HeadphonesIcon,
  Star,
  ArrowRight,
  BadgePercent,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';
import { useRazorpay } from 'react-razorpay';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SubscriptionPage() {
  const { user, schoolId } = useAuth();
  const { error: razorpayError, isLoading: razorpayLoading, Razorpay } = useRazorpay();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [activating, setActivating] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [plansRes, subRes, configRes] = await Promise.all([
        axios.get(`${API}/subscription/plans`),
        schoolId ? axios.get(`${API}/subscription/current/${schoolId}`, { headers }) : Promise.resolve({ data: null }),
        axios.get(`${API}/payments/config`)
      ]);
      setPlans(plansRes.data.plans);
      setCurrentSub(subRes.data);
      setPaymentConfig(configRes.data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = useCallback(async (planType) => {
    if (!schoolId) {
      toast.error('Please complete school registration first');
      return;
    }

    // Check if Razorpay is configured
    if (!paymentConfig?.configured) {
      toast.error('Payment gateway not configured. Please contact support.');
      return;
    }

    setActivating(planType);
    
    try {
      const token = localStorage.getItem('token');
      
      // Create order
      const orderRes = await axios.post(`${API}/payments/create-order`, {
        plan_type: planType,
        school_id: schoolId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { order_id, amount, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: "INR",
        name: "Schooltino",
        description: `${planType === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: order_id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              school_id: schoolId,
              plan_type: planType
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyRes.data.success) {
              toast.success('Payment successful! Subscription activated.');
              fetchData();
            }
          } catch (error) {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: () => {
            setActivating(null);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setActivating(null);
    }
  }, [Razorpay, schoolId, user, paymentConfig]);

  const handleActivate = async (planId) => {
    if (!schoolId) {
      toast.error('Please complete school registration first');
      return;
    }

    // For paid plans, use Razorpay
    if (planId !== 'free_trial' && paymentConfig?.configured) {
      handlePayment(planId);
      return;
    }

    // For free trial or if Razorpay not configured
    setActivating(planId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/subscription/activate`, {
        plan_type: planId,
        school_id: schoolId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan activated successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to activate plan');
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="subscription-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
          <Crown className="w-8 h-8 text-amber-500" />
          Subscription Plans
        </h1>
        <p className="text-slate-500 mt-2">
          Choose the perfect plan for your school
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSub && currentSub.status !== 'no_subscription' && (
        <div className={`rounded-2xl p-6 ${
          currentSub.status === 'active' 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
            : 'bg-amber-50 border-2 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {currentSub.status === 'active' ? (
                  <>
                    <Check className="w-6 h-6" />
                    Active: {currentSub.plan_type === 'free_trial' ? 'Free Trial' : 
                             currentSub.plan_type === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6" />
                    Subscription {currentSub.status}
                  </>
                )}
              </h2>
              {currentSub.status === 'active' && (
                <div className="mt-2 flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {currentSub.days_remaining} days remaining
                  </span>
                  {currentSub.ai_active ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      AI: {currentSub.ai_days_remaining} days left
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 opacity-75">
                      <Sparkles className="w-4 h-4" />
                      AI trial ended
                    </span>
                  )}
                </div>
              )}
            </div>
            {currentSub.status === 'expired' && (
              <Button className="bg-amber-600 hover:bg-amber-700">
                Renew Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentSub?.plan_type === plan.id && currentSub?.status === 'active';
          const isPopular = plan.id === 'yearly';
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
                isPopular
                  ? 'border-indigo-500 shadow-xl scale-105'
                  : 'border-slate-200 hover:border-indigo-200 hover:shadow-lg'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                  plan.id === 'free_trial' ? 'bg-emerald-100' :
                  plan.id === 'monthly' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {plan.id === 'free_trial' ? <Zap className="w-7 h-7 text-emerald-600" /> :
                   plan.id === 'monthly' ? <CreditCard className="w-7 h-7 text-blue-600" /> :
                   <Crown className="w-7 h-7 text-purple-600" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.duration}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.original_price && (
                  <p className="text-sm text-slate-400 line-through">{plan.original_price}</p>
                )}
                <p className="text-3xl font-bold text-slate-900">{plan.price_display}</p>
                {plan.savings && (
                  <p className="text-sm text-emerald-600 font-medium flex items-center justify-center gap-1 mt-1">
                    <BadgePercent className="w-4 h-4" />
                    {plan.savings}
                  </p>
                )}
                {plan.ai_note && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1 rounded-full inline-block">
                    ⚡ {plan.ai_note}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleActivate(plan.id)}
                disabled={isCurrentPlan || activating === plan.id}
                className={`w-full ${
                  isCurrentPlan 
                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                    : isPopular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {activating === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : plan.id === 'free_trial' ? (
                  <>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></>
                ) : (
                  <>Subscribe Now <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-8">
          All Plans Include
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Secure Data', desc: 'Bank-level security for your data' },
            { icon: Sparkles, title: 'AI Features', desc: 'Smart automation & insights' },
            { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Always here to help you' },
            { icon: Star, title: 'Free Updates', desc: 'Latest features automatically' }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="text-center py-8">
        <p className="text-slate-500">
          Questions about pricing? Contact us at{' '}
          <a href="mailto:support@schooltino.in" className="text-indigo-600 font-medium">
            support@schooltino.in
          </a>
        </p>
      </div>
    </div>
  );
}
