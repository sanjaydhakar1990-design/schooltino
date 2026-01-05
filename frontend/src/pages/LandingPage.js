import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import ForgotPassword from '../components/ForgotPassword';
import {
  School,
  Sparkles,
  Users,
  Brain,
  Video,
  Smartphone,
  Globe,
  Shield,
  Check,
  ChevronRight,
  Play,
  Star,
  Zap,
  TrendingUp,
  Clock,
  IndianRupee,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  Download,
  Crown,
  GraduationCap,
  BookOpen,
  Calendar,
  Bell,
  BarChart3,
  Mic,
  FileText,
  Camera,
  Wifi,
  Lock,
  HeartHandshake,
  Rocket,
  Target,
  Award,
  MessageSquare,
  ChevronDown,
  Building,
  MapPin,
  Gift,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');
  const [loading, setLoading] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  
  // Registration form
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    mobile: '',
    school_name: ''
  });
  
  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Check if user is logged in
  useEffect(() => {
    if (user) {
      setShowInstall(true);
    }
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.school_name) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/create-director`, null, {
        params: {
          email: regForm.email,
          name: regForm.name,
          mobile: regForm.mobile,
          school_name: regForm.school_name
        }
      });
      
      toast.success('🎉 Account created! Check your credentials below.');
      
      // Show credentials in alert
      alert(`
✅ Registration Successful!

Your Login Credentials:
📧 Email: ${res.data.email}
🔑 Password: ${res.data.temporary_password}

⚠️ Please save these credentials and change your password after first login.

🎁 Your FREE Trial has started!
- All features: 30 days
- AI features: 3 days
      `);
      
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
      setShowInstall(true);
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/app/dashboard');
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Schooltino
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('transformation')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                Why Us
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-slate-600 hover:text-indigo-600 transition-colors">
                Pricing
              </button>
              <a href="/teachtino" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                TeachTino
              </a>
              <a href="/studytino" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                StudyTino
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <Button onClick={goToDashboard} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  <Rocket className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              ) : (
                <Button onClick={() => scrollToSection('register')} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  Start Free Trial
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                India's #1 AI-Powered School ERP
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Transform Your
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Traditional School
                </span>
                Into a Smart School
              </h1>
              
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Automate everything with <strong>AI + CCTV + Mobile Apps</strong>. 
                From attendance to fee collection, exam papers to parent communication - 
                all in one powerful platform.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <Button 
                  size="lg" 
                  onClick={() => scrollToSection('register')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8"
                >
                  Start 1 Month FREE Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => scrollToSection('features')}
                  className="text-lg px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  No Credit Card Required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  Setup in 5 Minutes
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">AI Dashboard</h3>
                    <p className="text-sm text-slate-500">Real-time school analytics</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Students', value: '2,847', icon: Users, color: 'bg-blue-500' },
                    { label: 'Attendance', value: '94.2%', icon: Calendar, color: 'bg-emerald-500' },
                    { label: 'Fee Collected', value: '₹24.5L', icon: IndianRupee, color: 'bg-amber-500' },
                    { label: 'AI Tasks', value: '156', icon: Sparkles, color: 'bg-purple-500' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4">
                      <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                        <stat.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-slate-400 text-sm mb-6">TRUSTED BY 500+ SCHOOLS ACROSS INDIA</p>
          <div className="flex justify-center items-center gap-12 opacity-50 flex-wrap">
            {['Delhi Public School', 'Kendriya Vidyalaya', 'DAV Schools', 'Ryan International', 'Amity Schools'].map((school, idx) => (
              <span key={idx} className="text-slate-600 font-semibold text-lg">{school}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Section - UPDATED */}
      <section id="transformation" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              From Chaos to Clarity in
              <span className="text-indigo-600"> 1 Month</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              See how Schooltino transforms every aspect of your school operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Before Schooltino</h3>
                  <p className="text-red-600">Traditional School Problems</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Manual attendance - 30+ mins daily wasted',
                  'Paper receipts - Records get lost',
                  'No parent communication system',
                  'Manual exam papers - Hours of work',
                  'No real-time monitoring',
                  'Data scattered in registers',
                  'No mobile access for anyone',
                  'CCTV just for recording - No AI',
                  'Old fee dues - Hard to track',
                  'Teacher salary - Manual calculations',
                  'No ID cards - Security risk',
                  'Twin students - Confusion in attendance'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-red-800 text-sm">
                    <span className="text-red-500 mt-1">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* After */}
            <div className="bg-emerald-50 rounded-2xl p-8 border-2 border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">After Schooltino</h3>
                  <p className="text-emerald-600">Smart School Benefits</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  '📸 Auto attendance via ANY CCTV - 0 mins!',
                  '💳 Digital fee + Auto receipts - Perfect records',
                  '📱 WhatsApp/SMS alerts to parents instantly',
                  '🤖 AI Paper Generator - 2 mins only!',
                  '🎯 Director AI Dashboard - Big Boss Control',
                  '☁️ All data in one secure cloud',
                  '📲 Mobile apps for everyone - FREE',
                  '🔍 AI Face Recognition - Works with any CCTV!',
                  '📊 Multi-year fee tracking (2-3 years)',
                  '💵 Teacher salary slip - Auto download',
                  '🎫 Auto ID Card generation - Instant!',
                  '👯 Twin detection - AI never confused!'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-emerald-800 text-sm">
                    <span className="text-emerald-500 mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* New Features Highlight */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">🚀 Latest Features Added!</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: '📸', title: 'AI Face Recognition', desc: 'Any CCTV brand works!' },
                { icon: '🎫', title: 'Auto ID Cards', desc: 'Student + Staff cards instant' },
                { icon: '💰', title: 'Multi-Year Fees', desc: '2-3 years old dues track' },
                { icon: '💵', title: 'Salary Tracking', desc: 'Teacher payslips download' }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <span className="text-4xl block mb-2">{item.icon}</span>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-indigo-200 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need,
              <span className="text-indigo-600"> Nothing You Don't</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              One platform to manage your entire school - teachers, students, parents, and staff
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Student Management', desc: 'Admission to alumni - complete lifecycle', color: 'from-blue-500 to-cyan-500' },
              { icon: GraduationCap, title: 'TeachTino Portal', desc: 'Dedicated dashboard for teachers', color: 'from-emerald-500 to-teal-500' },
              { icon: BookOpen, title: 'StudyTino Portal', desc: 'Student & parent access portal', color: 'from-orange-500 to-amber-500' },
              { icon: Brain, title: 'AI Paper Generator', desc: 'Create exam papers in 2 mins', color: 'from-purple-500 to-pink-500' },
              { icon: Mic, title: 'Voice Assistant', desc: 'Hindi + English voice commands', color: 'from-red-500 to-rose-500' },
              { icon: Camera, title: 'CCTV Integration', desc: 'AI-powered surveillance', color: 'from-slate-600 to-slate-800' },
              { icon: IndianRupee, title: 'Fee Management', desc: 'Online payments & tracking', color: 'from-green-500 to-emerald-500' },
              { icon: Bell, title: 'Notifications', desc: 'WhatsApp, SMS & Push alerts', color: 'from-yellow-500 to-orange-500' },
              { icon: Calendar, title: 'Attendance', desc: 'Biometric + Face recognition', color: 'from-indigo-500 to-blue-500' },
              { icon: BarChart3, title: 'Analytics', desc: 'Real-time performance insights', color: 'from-cyan-500 to-blue-500' },
              { icon: Globe, title: 'Website Sync', desc: 'Auto-update school website', color: 'from-teal-500 to-emerald-500' },
              { icon: Smartphone, title: 'Mobile Apps', desc: 'PWA apps - works offline!', color: 'from-pink-500 to-rose-500' }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-4">
              <Brain className="w-4 h-4" />
              Powered by GPT-4o AI
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI That Actually <span className="text-yellow-300">Saves Time</span>
            </h2>
            <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
              Our AI assistant helps teachers, students & management save 10+ hours every week
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'AI Question Papers', desc: 'Generate CBSE/ICSE pattern papers instantly for any subject & class', icon: FileText },
              { title: 'AI Lesson Plans', desc: 'Create weekly/monthly lesson plans aligned with NCERT syllabus', icon: BookOpen },
              { title: 'AI Content Studio', desc: 'Design pamphlets, certificates, ID cards with AI', icon: Sparkles },
              { title: 'Voice Commands', desc: '"Show me Class 10 attendance" - Just speak!', icon: Mic },
              { title: 'Smart Analytics', desc: 'AI identifies weak students & suggests improvements', icon: TrendingUp },
              { title: 'Auto Reports', desc: 'Generate report cards, fee receipts automatically', icon: BarChart3 }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-colors">
                <item.icon className="w-10 h-10 text-yellow-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-indigo-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: Advanced Features Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full text-red-700 text-sm font-bold mb-4">
              🔥 Competitor ki tarah sab features + MORE!
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              India's Most <span className="text-red-600">Feature-Rich</span> School ERP
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Vidhyalaya, Fedena, Entab - sabse zyada features sirf Schooltino mein!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🎯', title: 'Director AI', desc: 'Big Boss command center - Daily orders & monitoring', isNew: true },
              { icon: '📸', title: 'AI Face Recognition', desc: 'CCTV + Auto attendance - Twin detection bhi!', isNew: true },
              { icon: '💰', title: 'Multi-Year Fees', desc: '2-3 saal purani fees track karein', isNew: true },
              { icon: '💵', title: 'Salary Tracking', desc: 'Teachers ka salary - Due/Credited status', isNew: true },
              { icon: '🏥', title: 'Health Module', desc: 'Student health records & immunization', isNew: false },
              { icon: '🚌', title: 'Transport', desc: 'Vehicle tracking & route management', isNew: false },
              { icon: '🚪', title: 'Front Office', desc: 'Visitor management & gate pass', isNew: false },
              { icon: '📅', title: 'Auto Timetable', desc: 'AI-powered schedule generator', isNew: false },
              { icon: '👆', title: 'Biometric', desc: 'Fingerprint attendance support', isNew: false },
              { icon: '🗣️', title: 'Ask Tino', desc: 'Hindi voice assistant', isNew: false },
              { icon: '📝', title: 'AI Papers', desc: '2 min mein exam paper', isNew: false },
              { icon: '📊', title: 'Analytics', desc: 'Real-time dashboards', isNew: false }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                  feature.isNew ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      {feature.title}
                      {feature.isNew && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">NEW</span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button 
              size="lg" 
              onClick={() => scrollToSection('register')}
              className="bg-red-600 hover:bg-red-700"
            >
              Try All Features FREE for 1 Month
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* NEW: Pricing Section - Updated Plans */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-bold mb-4">
              🎉 1 Month FREE Trial - All AI Features Included!
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, <span className="text-indigo-600">Affordable</span> Pricing
            </h2>
            <p className="text-lg text-slate-600">
              From ₹1,000/month - India's most affordable AI School ERP
            </p>
          </div>
          
          {/* Pricing Grid - 6 Plans */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Plan 1: Basic */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-xl transition-all hover:border-slate-300">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <Building className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Basic ERP</h3>
              <p className="text-slate-500 text-sm mb-4">No AI - Simple Management</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-slate-900">₹9,999</span>
                <span className="text-slate-500">/year</span>
              </div>
              <p className="text-emerald-600 text-sm mb-4">₹1,000/month</p>
              <ul className="space-y-2 mb-6 text-sm">
                {['Unlimited Students', 'Attendance', 'Fee Collection', 'Timetable', 'Reports', 'SMS Alerts'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={() => scrollToSection('register')} variant="outline" className="w-full">
                Get Started
              </Button>
            </div>

            {/* Plan 2: AI Powered - MOST POPULAR */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative transform md:scale-105 shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-xl font-bold mb-1">AI Powered</h3>
              <p className="text-indigo-200 text-sm mb-4">Full AI Features</p>
              <div className="mb-1">
                <span className="text-4xl font-bold">₹17,999</span>
                <span className="text-indigo-200">/year</span>
              </div>
              <p className="text-emerald-300 text-sm mb-4">₹1,999/month</p>
              <ul className="space-y-2 mb-6 text-sm">
                {['Everything in Basic', 'AI Voice Assistant', 'AI Paper Generator', 'AI Summary', 'Director AI Dashboard', 'AI Accountant'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-indigo-100">
                    <Check className="w-4 h-4 text-yellow-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={() => scrollToSection('register')} className="w-full bg-white text-indigo-700 hover:bg-indigo-50">
                Start Free Trial
              </Button>
            </div>

            {/* Plan 3: CCTV + Biometric - RECOMMENDED */}
            <div className="bg-white rounded-2xl border-2 border-emerald-300 p-6 hover:shadow-xl transition-all relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">CCTV + Biometric</h3>
              <p className="text-slate-500 text-sm mb-4">AI Face Recognition</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-slate-900">₹27,999</span>
                <span className="text-slate-500">/year</span>
              </div>
              <p className="text-emerald-600 text-sm mb-4">₹2,999/month</p>
              <ul className="space-y-2 mb-6 text-sm">
                {['Everything in AI Powered', 'CCTV Integration (Any Brand)', 'AI Face Recognition', 'Auto Attendance', 'Twin Detection', 'Biometric'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={() => scrollToSection('register')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Start Free Trial
              </Button>
            </div>

            {/* Plan 4: GPS Tracking - COMING SOON */}
            <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-6 relative opacity-75">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                COMING SOON
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Bus GPS + CCTV</h3>
              <p className="text-slate-500 text-sm mb-4">Transport Fleet Tracking</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-slate-900">₹37,999</span>
                <span className="text-slate-500">/year</span>
              </div>
              <p className="text-amber-600 text-sm mb-4">₹3,999/month</p>
              <ul className="space-y-2 mb-6 text-sm">
                {['Everything in CCTV', 'Live Bus GPS', 'Route Optimization', 'Parent Alerts', 'Driver Management', 'Fuel Analytics'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600">
                    <Check className="w-4 h-4 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button disabled variant="outline" className="w-full">
                Coming Soon
              </Button>
            </div>

            {/* Plan 5: AI Teacher Clone - COMING SOON */}
            <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-6 relative opacity-75">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                COMING SOON
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">AI Teacher Clone</h3>
              <p className="text-slate-500 text-sm mb-4">HeyGen AI Avatar</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-slate-900">₹47,999</span>
                <span className="text-slate-500">/year</span>
              </div>
              <p className="text-purple-600 text-sm mb-4">₹4,999/month (per class)</p>
              <ul className="space-y-2 mb-6 text-sm">
                {['Everything in GPS', 'AI Teacher Avatar', 'Personalized Videos', 'Multi-language', 'AI Doubt Solving', '24/7 AI Tutor'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600">
                    <Check className="w-4 h-4 text-purple-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button disabled variant="outline" className="w-full">
                Coming Soon
              </Button>
            </div>

            {/* Free Trial Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">1 Month FREE Trial</h3>
              <p className="text-emerald-100 text-sm mb-4">Try before you buy!</p>
              <div className="mb-4">
                <span className="text-4xl font-bold">FREE</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                {['All AI features included', 'CCTV + Biometric access', 'Up to ₹27,999 plan', 'No credit card needed', 'Cancel anytime'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-emerald-100">
                    <Check className="w-4 h-4 text-white" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={() => scrollToSection('register')} className="w-full bg-white text-emerald-700 hover:bg-emerald-50">
                Start FREE Trial Now
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 mb-4">Trusted by 500+ Schools across India</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              <span className="text-lg font-bold text-slate-400">🏫 MP Schools</span>
              <span className="text-lg font-bold text-slate-400">🏫 Delhi NCR</span>
              <span className="text-lg font-bold text-slate-400">🏫 Maharashtra</span>
              <span className="text-lg font-bold text-slate-400">🏫 Gujarat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Registration & Login Section */}
      <section id="register" className="py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to Transform Your School?
              </h2>
              <p className="text-lg text-indigo-200 mb-8">
                Join 500+ schools already using Schooltino. Start your 1 MONTH free trial today - no credit card required.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Clock, text: 'Setup in under 5 minutes' },
                  { icon: Shield, text: 'Bank-level data security' },
                  { icon: HeartHandshake, text: 'Dedicated support team' },
                  { icon: Wifi, text: 'Works offline too!' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <span className="text-indigo-100">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full border-2 border-indigo-900 flex items-center justify-center text-white text-xs font-bold">
                        {['RS', 'PK', 'AK', 'VK'][i - 1]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-indigo-200">500+ schools, 4.9 rating</p>
                  </div>
                </div>
                <p className="text-indigo-100 italic">
                  "Schooltino has completely transformed how we manage our school. The AI features alone save us 20+ hours every week!"
                </p>
                <p className="text-sm text-indigo-300 mt-2">- Principal, Delhi Public School</p>
              </div>
            </div>
            
            {/* Form Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              {showInstall && user ? (
                /* Show Install/Dashboard Option after Login */
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome, {user.name}!</h3>
                  <p className="text-slate-500 mb-8">Your account is ready. Install the app or go to dashboard.</p>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={goToDashboard}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-14 text-lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Install & Open Dashboard
                    </Button>
                    
                    <p className="text-sm text-slate-500">
                      Tip: Click "Add to Home Screen" in your browser to install the app
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex mb-8 bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab('register')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'register'
                          ? 'bg-white text-indigo-600 shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      New School? Register
                    </button>
                    <button
                      onClick={() => setActiveTab('login')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                        activeTab === 'login'
                          ? 'bg-white text-indigo-600 shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Existing User? Login
                    </button>
                  </div>
                  
                  {activeTab === 'register' ? (
                    <form onSubmit={handleRegister} className="space-y-5">
                      <div>
                        <Label className="text-slate-700">Your Name *</Label>
                        <Input
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          placeholder="e.g., Rajesh Sharma"
                          className="h-12 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700">Email Address *</Label>
                        <Input
                          type="email"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                          placeholder="director@yourschool.com"
                          className="h-12 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700">Mobile Number</Label>
                        <Input
                          value={regForm.mobile}
                          onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                          placeholder="+91 9876543210"
                          className="h-12 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700">School Name *</Label>
                        <Input
                          value={regForm.school_name}
                          onChange={(e) => setRegForm({ ...regForm, school_name: e.target.value })}
                          placeholder="e.g., Delhi Public School"
                          className="h-12 mt-1"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Start 30 Days FREE Trial
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      <p className="text-center text-sm text-slate-500">
                        By registering, you agree to our Terms & Privacy Policy
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div>
                        <Label className="text-slate-700">Email Address</Label>
                        <Input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          placeholder="your@email.com"
                          className="h-12 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700">Password</Label>
                        <Input
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="Enter your password"
                          className="h-12 mt-1"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-2" />
                            Login to Dashboard
                          </>
                        )}
                      </Button>
                      
                      <p className="text-center text-sm text-slate-500">
                        Forgot password? Contact support
                      </p>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Portals Section - TeachTino & StudyTino */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Already a User? <span className="text-indigo-600">Login to Your Portal</span>
            </h2>
            <p className="text-slate-600">Teachers and Students have their own dedicated portals</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* TeachTino Card */}
            <a 
              href="/teachtino"
              className="group bg-white rounded-2xl p-8 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-800">TeachTino</h3>
                  <p className="text-emerald-600">Teacher Portal</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                Create lesson plans, question papers, track attendance, and manage your classroom with AI assistance.
              </p>
              <div className="flex items-center text-emerald-600 font-medium">
                Teacher Login <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </a>
            
            {/* StudyTino Card */}
            <a 
              href="/studytino"
              className="group bg-white rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-800">StudyTino</h3>
                  <p className="text-blue-600">Student & Parent Portal</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                Track homework, get AI study help, view results, and stay connected with school updates.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Student Login <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      {/* Have Questions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Have Questions?</h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Our team is here to help you transform your school. Get in touch!
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a 
                href="tel:+917879967616"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full transition-colors"
              >
                <Phone className="w-5 h-5" />
                +91 7879967616
              </a>
              <a 
                href="https://schooltino.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full transition-colors"
              >
                <Globe className="w-5 h-5" />
                schooltino.in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Schooltino</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2026 Schooltino. All rights reserved. AI + CCTV + Apps = Smart School
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
