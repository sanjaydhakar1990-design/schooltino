/**
 * Schooltino Landing Page - Simple, Professional, Clean
 * Inspired by: Entrar, MyLeadingCampus, Vidyalaya
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import ForgotPassword from '../components/ForgotPassword';
import {
  School, Sparkles, Users, Brain, Video, Smartphone, Globe,
  Shield, Check, ChevronRight, Star, IndianRupee, Phone, Mail,
  ArrowRight, Loader2, GraduationCap, BookOpen, Calendar, Bell,
  BarChart3, Mic, FileText, Camera, Lock, Rocket, Award,
  MessageSquare, Building, Gift, Fingerprint, Bus, Heart,
  Wallet, UserCog, Clock, Play, Eye, EyeOff, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { PWAInstallButton } from '../components/PWAInstallPrompt';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [regForm, setRegForm] = useState({
    name: '', email: '', mobile: '', school_name: ''
  });
  
  const [loginForm, setLoginForm] = useState({
    email: '', password: ''
  });

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.school_name) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/create-director`, null, {
        params: regForm
      });
      
      toast.success('Account created successfully!');
      alert(`✅ Registration Successful!\n\nEmail: ${res.data.email}\nPassword: ${res.data.temporary_password}\n\n⚠️ Please save these credentials!`);
      setActiveTab('login');
      setLoginForm({ email: res.data.email, password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome to Schooltino!');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Features data
  const features = [
    { icon: Users, title: 'Student Management', desc: 'Complete student lifecycle from admission to alumni', color: 'bg-blue-500' },
    { icon: UserCog, title: 'Staff & HR', desc: 'Salary, attendance, leave management', color: 'bg-emerald-500' },
    { icon: Wallet, title: 'Fee Management', desc: 'Online payments, receipts, defaulter tracking', color: 'bg-amber-500' },
    { icon: Calendar, title: 'Attendance', desc: 'Biometric, CCTV, manual - all integrated', color: 'bg-purple-500' },
    { icon: Brain, title: 'AI Assistant', desc: 'Voice commands, paper generation, insights', color: 'bg-rose-500' },
    { icon: Video, title: 'CCTV Integration', desc: 'Auto attendance, security alerts, monitoring', color: 'bg-indigo-500' },
    { icon: BookOpen, title: 'Exam System', desc: 'Online exams, AI paper generation, results', color: 'bg-cyan-500' },
    { icon: Bus, title: 'Transport', desc: 'Route management, GPS tracking, fee collection', color: 'bg-orange-500' },
    { icon: Heart, title: 'Health Module', desc: 'Medical records, vaccinations, health checkups', color: 'bg-pink-500' },
    { icon: MessageSquare, title: 'Communication', desc: 'SMS, notices, parent portal, meetings', color: 'bg-teal-500' },
    { icon: Fingerprint, title: 'Biometric', desc: 'Fingerprint & face recognition attendance', color: 'bg-violet-500' },
    { icon: BarChart3, title: 'Analytics', desc: 'Reports, insights, performance tracking', color: 'bg-lime-500' },
  ];

  // Pricing data with Monthly and Yearly options
  const [billingCycle, setBillingCycle] = useState('yearly'); // monthly or yearly
  
  const pricing = [
    { 
      name: 'Basic ERP', 
      monthlyPrice: '999', 
      yearlyPrice: '9,999',
      perStudentPrice: '10',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Small Schools (upto 200 students)',
      features: ['Student & Staff Management', 'Fee Collection & Receipts', 'Attendance (Manual/Biometric)', 'SMS/WhatsApp Alerts', 'Reports & Analytics', 'Mobile App Access'],
      popular: false,
      savings: '₹1,989/year'
    },
    { 
      name: 'AI Powered', 
      monthlyPrice: '1,999', 
      yearlyPrice: '17,999',
      perStudentPrice: '20',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Medium Schools (200-500 students)',
      features: ['Everything in Basic', 'Tino Brain AI Assistant 🧠', 'AI Paper Generator', 'Voice Commands (Hindi/English)', 'Smart Reports & Insights', 'Parent Portal'],
      popular: true,
      savings: '₹5,989/year'
    },
    { 
      name: 'Enterprise', 
      monthlyPrice: '2,999', 
      yearlyPrice: '27,999',
      perStudentPrice: '30',
      period: billingCycle === 'monthly' ? '/month' : '/year',
      desc: 'Large Schools (500+ students)',
      features: ['Everything in AI', 'CCTV Integration 📹', 'Face Recognition Attendance', 'GPS Bus Tracking 🚌', 'Multi-Branch Support', 'Priority Support'],
      popular: false,
      savings: '₹7,989/year'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Schooltino</span>
            </div>
            
            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-slate-600 hover:text-indigo-600 text-sm font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-slate-600 hover:text-indigo-600 text-sm font-medium">
                Pricing
              </button>
              <a href="/teachtino" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                TeachTino
              </a>
              <a href="/studytino" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                StudyTino
              </a>
            </div>
            
            {/* CTA Button */}
            <Button 
              onClick={() => scrollToSection('register')} 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
                <Gift className="w-4 h-4" />
                1 Month FREE Trial
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
                Smart School
                <span className="block text-indigo-600">Management System</span>
              </h1>
              
              <p className="text-lg text-slate-600 mb-8">
                <strong>AI + CCTV + Apps</strong> - Complete automation for modern schools. 
                Manage students, staff, fees, attendance - all in one platform.
              </p>
              
              {/* Key Highlights */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Brain, text: 'AI Powered' },
                  { icon: Video, text: 'CCTV Ready' },
                  { icon: Smartphone, text: 'Mobile Apps' },
                  { icon: Shield, text: '100% Secure' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => scrollToSection('register')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('features')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  See Features
                </Button>
              </div>
            </div>
            
            {/* Right - Login/Register Card */}
            <div id="register">
              <Card className="shadow-xl border-0">
                <CardContent className="p-6">
                  {/* Tabs */}
                  <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('login')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setActiveTab('register')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                  
                  {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                        <Input
                          type="email"
                          placeholder="director@school.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 w-full text-center"
                      >
                        Forgot Password?
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Your Name *</label>
                        <Input
                          placeholder="Enter your name"
                          value={regForm.name}
                          onChange={(e) => setRegForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">School Name *</label>
                        <Input
                          placeholder="Enter school name"
                          value={regForm.school_name}
                          onChange={(e) => setRegForm(f => ({ ...f, school_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Email *</label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={regForm.email}
                          onChange={(e) => setRegForm(f => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Mobile</label>
                        <Input
                          placeholder="+91 98765 43210"
                          value={regForm.mobile}
                          onChange={(e) => setRegForm(f => ({ ...f, mobile: e.target.value }))}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Free Trial'}
                      </Button>
                      <p className="text-xs text-slate-500 text-center">
                        By registering, you agree to our Terms & Privacy Policy
                      </p>
                    </form>
                  )}
                  
                  {/* Quick Access Links */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-sm text-slate-500 text-center mb-3">Quick Access</p>
                    <div className="grid grid-cols-2 gap-3">
                      <a 
                        href="/teachtino" 
                        className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm font-medium">TeachTino</span>
                      </a>
                      <a 
                        href="/studytino" 
                        className="flex items-center justify-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">StudyTino</span>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Schools' },
              { value: '50,000+', label: 'Students' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' }
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-indigo-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              40+ modules to manage every aspect of your school efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center mb-3`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Highlight Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl font-bold mb-6">
                Meet Tino AI - Your School's Smart Assistant
              </h2>
              <p className="text-indigo-100 mb-8">
                Voice commands, instant insights, automated paper generation, and smart predictions. 
                Tino AI understands your school and helps you make better decisions.
              </p>
              <div className="space-y-4">
                {[
                  'Generate exam papers in seconds',
                  'Voice commands in Hindi & English',
                  'Smart attendance insights',
                  'Fee defaulter predictions',
                  'Student performance analysis'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Tino AI</p>
                    <p className="text-sm text-indigo-200">Your AI Assistant</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm">"Class 10 ka Science paper generate karo"</p>
                  </div>
                  <div className="bg-indigo-500/50 rounded-lg p-3 ml-8">
                    <p className="text-sm">✅ Paper generated with 50 marks, 25 questions covering all chapters...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">🎯 Schooltino Kyu Choose Karein?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-indigo-200">Schools Trust Us</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold mb-2">50%</div>
              <div className="text-indigo-200">Sasta Than Competitors</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-indigo-200">AI Support</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-indigo-200">Hindi Support</div>
            </div>
          </div>
          
          {/* Main Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-bold text-lg mb-2">Tino Brain AI</h3>
              <p className="text-indigo-200 text-sm">Hindi mein baat karo - "Aaj kitne bachhe absent hain?" AI turant jawab dega!</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">📹</div>
              <h3 className="font-bold text-lg mb-2">CCTV + Biometric</h3>
              <p className="text-indigo-200 text-sm">Face recognition se automatic attendance - No proxy possible!</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🚌</div>
              <h3 className="font-bold text-lg mb-2">GPS Bus Tracking</h3>
              <p className="text-indigo-200 text-sm">Parents ko real-time bus location dikhe - "Bus late hai" notification automatic!</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-bold text-lg mb-2">AI Paper Generator</h3>
              <p className="text-indigo-200 text-sm">Chapter select karo, AI paper bana dega - NCERT syllabus ke according!</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-lg mb-2">Fee Management</h3>
              <p className="text-indigo-200 text-sm">Online + Cash payment - Receipt turant student app mein!</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-bold text-lg mb-2">Parent App</h3>
              <p className="text-indigo-200 text-sm">Parents ko sab kuch phone par - Attendance, Fees, Results, Bus Location!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Affordable Pricing</h2>
            <p className="text-slate-600 mb-6">50% cheaper than competitors with 3x more features</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-indigo-600' : 'text-slate-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative w-14 h-7 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-indigo-600' : 'text-slate-500'}`}>
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                  Save upto ₹7,989/year
                </span>
              )}
            </div>
            
            {/* Per-Student Pricing Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-amber-800 text-sm">
                <strong>💡 Per-Student Pricing bhi available hai!</strong><br/>
                Large schools ke liye: ₹10-30/student/month - Jitne students, utna pay karo
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative overflow-hidden ${plan.popular ? 'border-indigo-600 border-2 shadow-xl scale-105' : 'border-slate-200'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                    ⭐ Most Popular
                  </div>
                )}
                {billingCycle === 'yearly' && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-br-lg">
                    Save {plan.savings}
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-slate-400 text-sm">₹</span>
                    <span className="text-4xl font-bold text-slate-900">
                      {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    या ₹{plan.perStudentPrice}/student/month
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => scrollToSection('register')}
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-slate-500 text-sm mt-8">
            All plans include 1 month FREE trial • No credit card required
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-slate-400 mb-8">
            Join 500+ schools already using Schooltino
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => scrollToSection('register')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <a 
              href="https://wa.me/917879967616?text=Hi%20Schooltino!%20I%20want%20to%20know%20more%20about%20your%20school%20management%20system."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp: +91 78799 67616
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            📞 Call/WhatsApp for demo • Free school visit available
          </p>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/917879967616?text=Hi%20Schooltino!%20I%20want%20demo%20for%20my%20school."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
        title="Chat on WhatsApp"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Footer */}
      <footer className="py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <School className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Schooltino</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-Powered School Management System for modern schools.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/teachtino" className="hover:text-white">TeachTino</a></li>
                <li><a href="/studytino" className="hover:text-white">StudyTino</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +91 7879967616
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  support@schooltino.in
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            © 2026 Schooltino. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPassword 
          isOpen={showForgotPassword} 
          onClose={() => setShowForgotPassword(false)} 
          portalType="admin"
        />
      )}
    </div>
  );
}
