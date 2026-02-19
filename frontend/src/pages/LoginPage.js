import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Crown, GraduationCap, Users, Wallet, Shield, Brain, MessageSquare, Smartphone, BarChart3, BookOpen, Fingerprint, CheckCircle2, ArrowRight, Globe, Layers, Lock, Zap, Cloud, Cpu, School, Apple, UserCircle } from 'lucide-react';
import axios from 'axios';

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

const k12Tabs = [
  { id: 'enrollment', label: 'Enrollment Conversion', icon: Users },
  { id: 'admissions', label: 'Amplify Admissions', icon: BarChart3 },
  { id: 'attendance', label: 'Digitalise Attendance', icon: Fingerprint },
  { id: 'finance', label: 'Paperless Finance', icon: Wallet },
  { id: 'website', label: 'No-Code Website', icon: Globe },
  { id: 'dashboard', label: 'Unified Dashboard', icon: Layers },
  { id: 'testbuilder', label: 'AI-driven Test Builder', icon: Brain },
  { id: 'assignment', label: 'Smart Assignment', icon: BookOpen },
  { id: 'edtech', label: 'EdTech Tools', icon: GraduationCap },
  { id: 'content', label: 'Interactive Content', icon: Smartphone },
];

const k12Features = {
  enrollment: {
    title: 'Online Admissions. Streamlined from Enquiry to Enrollment.',
    desc: 'Create & analyse campaigns anytime to complete admissions faster \u2014 all from one centralised dashboard.',
    bullets: [
      '24/7 online admission forms - accessible from anywhere',
      'Ensure safety with OTP security for both walk-in & online enquiries',
      'Record & track prospective enrollments through a smart follow-up mechanism',
      'Simplify with a fully configurable multi-tier process',
      'Hassle-free fee collection with integrated payment gateways',
    ],
    gradient: 'from-blue-500 to-cyan-400',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  admissions: {
    title: 'Boost Admissions with Built-In SEO & Smart Digital Campaign Tools',
    desc: 'Launch impactful digital campaigns with a comprehensive dashboard, built-in SEO tools and real-time prospect tracking.',
    bullets: [
      'Create & launch custom campaigns instantly',
      'Auto-capture leads from every channel & campaign',
      'Boost reach with bulk campaign blasts',
      'Track leads in real time with follow-up insights',
    ],
    gradient: 'from-purple-500 to-pink-400',
    bgGradient: 'from-purple-50 to-pink-50',
  },
  attendance: {
    title: 'Smarter Attendance. Safer Campus.',
    desc: 'Accurately mark attendance with location and face verification \u2014 without hardware, without hassle.',
    bullets: [
      'Mobile-based geo-facial recognition',
      'No RFID or biometric devices required',
      'Geo-fencing for authentic check-ins',
      'Auto-synced & secure attendance logs',
    ],
    gradient: 'from-teal-500 to-emerald-400',
    bgGradient: 'from-teal-50 to-emerald-50',
  },
  finance: {
    title: 'Smart Fees Collection & Tally Integrated Accounting',
    desc: 'Simplify collections with configurable setups, flexible concessions, digital payments, and features that are easy & transparent.',
    bullets: [
      'Online & walk-in payment support',
      'Customizable fee heads & categories',
      'Fully tailored fee reports',
      'Smart pay with auto sibling concessions',
    ],
    gradient: 'from-orange-500 to-amber-400',
    bgGradient: 'from-orange-50 to-amber-50',
  },
  website: {
    title: 'Personalise Templates That Fit Your Brand.',
    desc: 'Build a unique, SEO-ready website and social media assets that showcase your institute\'s identity.',
    bullets: [
      'Use customizable, ready-made templates \u2014 no coding needed',
      'Launch a professional, SEO-optimised site in minutes',
      'Custom banners for promotions & lead capture',
      'Social media-ready posts with designer templates',
    ],
    gradient: 'from-indigo-500 to-blue-400',
    bgGradient: 'from-indigo-50 to-blue-50',
  },
  dashboard: {
    title: 'Attendance. Performance. Discipline. 360\u00b0 Student Analytics',
    desc: 'Get a complete overview of every student, from academics to attendance, and soft skills \u2014 all in one place.',
    bullets: [
      'Gain a 360\u00b0 view of student information at a glance',
      'Monitor student attributes & discipline records',
      'Access & compare examination performance across the years',
      'Track attendance trends and spot irregularities instantly',
    ],
    gradient: 'from-pink-500 to-rose-400',
    bgGradient: 'from-pink-50 to-rose-50',
  },
  testbuilder: {
    title: 'Assess Smarter. Adapt Better. Perform Higher.',
    desc: 'Create personalised, intelligent assessments in minutes \u2014 designed for next gen classrooms.',
    bullets: [
      '650,000+ question bank organised by difficulty, depth & Bloom\'s Taxonomy levels',
      'AI-powered proctoring for secure online exams',
      'Instantly generate question papers for online, offline, or hybrid examinations',
    ],
    gradient: 'from-emerald-500 to-green-400',
    bgGradient: 'from-emerald-50 to-green-50',
  },
  assignment: {
    title: 'Homework Reinvented. Feedback Made Easy.',
    desc: 'Streamline homework & classwork effortlessly. Monitor submissions, keep parents informed, & provide feedback.',
    bullets: [
      'Assign tasks with attachments, notes, and deadlines',
      'Enable real-time parent notifications',
      'Track statuses like "Turned In", "Returned" or "Feedback Given"',
      'Evaluate and grade online with helpful feedback tools',
    ],
    gradient: 'from-violet-500 to-purple-400',
    bgGradient: 'from-violet-50 to-purple-50',
  },
  edtech: {
    title: 'Curriculum-Aligned Digital Learning Tools',
    desc: 'From immersive labs to art rooms \u2014 equip students with tools that turn complex lessons into memorable learning experiences.',
    bullets: [
      'Use simulations for Maths, Science, English & Social Studies',
      'Explore the Organism Encyclopedia and Periodic Table interactively',
      'Access tools like the 2D Graph Plotter, Log Table, and Abacus',
      'Teach art and creativity with drawing & painting tools',
    ],
    gradient: 'from-sky-500 to-blue-400',
    bgGradient: 'from-sky-50 to-blue-50',
  },
  content: {
    title: 'Personalised Learning Paths for Every Student',
    desc: 'Tailor digital learning to meet the needs of diverse learners. With immersive learning tools make every classroom experience impactful.',
    bullets: [
      'Customise lessons by learning level or style',
      'Interactive content keeps students engaged',
      'Track progress with real-time analytics',
      'AI-powered recommendations for each student',
    ],
    gradient: 'from-rose-500 to-pink-400',
    bgGradient: 'from-rose-50 to-pink-50',
  },
};

const stats = [
  { value: '21,000+', label: 'Institutions Empowered', icon: GraduationCap },
  { value: '300+', label: 'Support Engineers', icon: Users },
  { value: '200+', label: 'R&D and Tech Experts', icon: Brain },
  { value: '150+', label: 'Awards', icon: BarChart3 },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, setUser, setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [activeTab, setActiveTab] = useState('admin');
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [superAdminForm, setSuperAdminForm] = useState({ email: '', password: '' });
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [studentForm, setStudentForm] = useState({ student_id: '', password: '', mobile: '', dob: '' });
  const [studentLoginMethod, setStudentLoginMethod] = useState('id');
  const [activeFeatureTab, setActiveFeatureTab] = useState('enrollment');

  const handleSecretClick = () => {
    const newCount = secretClickCount + 1;
    setSecretClickCount(newCount);
    if (newCount >= 5) {
      setShowSuperAdmin(true);
      setSecretClickCount(0);
    }
    setTimeout(() => setSecretClickCount(0), 3000);
  };

  const handleSuperAdminLogin = async (e) => {
    e.preventDefault();
    setSuperAdminLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/owner-console-x7k9m2/login`, superAdminForm);
      localStorage.setItem('ownerToken', res.data.access_token);
      navigate('/owner-x7k9m2');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setSuperAdminLoading(false);
    }
  };

  useEffect(() => { checkSetup(); }, []);

  const checkSetup = async () => {
    try {
      const res = await axios.get(`${API}/api/auth/check-setup`);
      setSetupRequired(res.data.setup_required);
    } catch (err) {
      console.error('Setup check failed');
    } finally {
      setCheckingSetup(false);
    }
  };

  const getRedirectPath = (role) => {
    switch (role) {
      case 'teacher': case 'admission_staff': case 'clerk': case 'staff':
        return '/portal';
      case 'student':
        return '/student-dashboard';
      default:
        return '/app/dashboard';
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(formData.email, formData.password);
      navigate(getRedirectPath(userData.role));
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectorSetup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/setup-director`, {
        email: formData.email, password: formData.password, name: formData.name, role: 'director'
      });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.access_token);
      setUser(res.data.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let payload = studentLoginMethod === 'id'
        ? { student_id: studentForm.student_id, password: studentForm.password }
        : { mobile: studentForm.mobile, dob: studentForm.dob };
      const res = await axios.post(`${API}/api/students/login`, payload);
      const { access_token, student } = res.data;
      localStorage.setItem('token', access_token);
      const userData = { ...student, role: 'student' };
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      if (student.school_id) {
        localStorage.setItem('schoolId', student.school_id);
      }
      navigate('/student-dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleStudentChange = (e) => setStudentForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const portalTabs = [
    { id: 'admin', appLabel: 'Admin App', brand: 'SchoolTino', Icon: Shield, gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/40', bgActive: 'bg-gradient-to-br from-blue-50 to-indigo-50', borderActive: 'border-blue-400', textActive: 'text-blue-700', brandColor: 'text-blue-600' },
    { id: 'teacher', appLabel: 'Teacher App', brand: 'TeachTino', Icon: BookOpen, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/40', bgActive: 'bg-gradient-to-br from-emerald-50 to-teal-50', borderActive: 'border-emerald-400', textActive: 'text-emerald-700', brandColor: 'text-emerald-600' },
    { id: 'student', appLabel: 'Student App', brand: 'StudyTino', Icon: GraduationCap, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/40', bgActive: 'bg-gradient-to-br from-violet-50 to-purple-50', borderActive: 'border-violet-400', textActive: 'text-violet-700', brandColor: 'text-violet-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      {showSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <Crown className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Platform Owner</h2>
            </div>
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <input type="email" placeholder="Email" value={superAdminForm.email} onChange={(e) => setSuperAdminForm({...superAdminForm, email: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
              <input type="password" placeholder="Password" value={superAdminForm.password} onChange={(e) => setSuperAdminForm({...superAdminForm, password: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm" />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold" disabled={superAdminLoading}>
                {superAdminLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Access'}
              </button>
              <button type="button" className="w-full py-2 text-gray-400 hover:text-white text-sm" onClick={() => {setShowSuperAdmin(false); setError('');}}>{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}

      <div className="gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleSecretClick}>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Schooltino</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-sm text-white/70">
              <a href="#features" className="hidden sm:inline hover:text-white transition-colors">Features</a>
              <a href="#login" className="px-4 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors border border-white/20 text-white text-xs sm:text-sm">{t('sign_in')}</a>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center py-8 lg:py-24">
            <div className="animate-fade-in order-2 lg:order-1 hidden lg:block">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm text-blue-200 mb-6 border border-white/10">
                <Sparkle /> Cloud-Based School ERP
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
                The Launchpad of{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">21st-Century Skills.</span>
                <br />
                The Takeoff for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Smart Future.</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                Reboot schools with advanced K-12 Suite. Boost school's real potential by automating finance, academic, administrative, management, human resource, inventory, transport, and operational requirements.
              </p>
              <p className="text-sm font-semibold text-white/50 mb-6">Schooltino &middot; TeachTino &middot; StudyTino — One Platform, All Connected.</p>
              <div className="flex flex-wrap gap-4">
                <a href="#login" className="px-8 py-3.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all shadow-lg shadow-white/10 flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#features" className="px-8 py-3.5 bg-white/10 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all border border-white/20">
                  See Features
                </a>
              </div>
            </div>

            <div className="lg:hidden animate-fade-in order-1 text-center mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Smart School ERP</span>
                {' '}for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Smart Future.</span>
              </h1>
              <p className="text-sm text-white/60 mb-2">Schooltino &middot; TeachTino &middot; StudyTino</p>
            </div>

            <div id="login" className="animate-slide-up order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto lg:ml-auto relative">
                <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                {setupRequired ? (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Initial Setup</h2>
                    <p className="text-sm text-gray-500 mb-6">Create your Director account</p>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
                    <form onSubmit={handleDirectorSetup} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Director Name" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('email')}</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="director@school.com" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('password')}</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create password" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <button type="submit" className="w-full py-3 btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Account'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{t('welcome_back')}</h2>
                    <p className="text-sm text-gray-500 mb-6">{t('login_subtitle')}</p>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {portalTabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }} className={`relative flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-300 border-2 ${isActive ? `${tab.bgActive} ${tab.borderActive} shadow-lg` : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'}`}>
                            <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-300 ${isActive ? `bg-gradient-to-br ${tab.gradient} shadow-lg ${tab.glow}` : 'bg-gray-200'}`}>
                              <tab.Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                              {isActive && <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>}
                            </div>
                            <span className={`text-[10px] font-medium leading-tight transition-colors duration-300 ${isActive ? tab.textActive : 'text-gray-400'}`}>{tab.appLabel}</span>
                            <span className={`text-xs font-bold leading-tight transition-colors duration-300 ${isActive ? tab.brandColor : 'text-gray-600'}`}>{tab.brand}</span>
                          </button>
                        );
                      })}
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                    {activeTab !== 'student' ? (
                      <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('email')}</label>
                          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={activeTab === 'teacher' ? 'teacher@school.com' : 'admin@school.com'} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('password')}</label>
                          <div className="relative">
                            <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder={t('enter_password')} required className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <button type="submit" className="w-full py-3 btn-primary" disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('sign_in')}
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                          <button onClick={() => setStudentLoginMethod('id')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${studentLoginMethod === 'id' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t('student_id')}</button>
                          <button onClick={() => setStudentLoginMethod('mobile')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${studentLoginMethod === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Mobile + DOB</button>
                        </div>
                        <form onSubmit={handleStudentLogin} className="space-y-4">
                          {studentLoginMethod === 'id' ? (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('student_id')}</label>
                                <input name="student_id" value={studentForm.student_id} onChange={handleStudentChange} placeholder="STD-2025-XXXXXX" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('password')}</label>
                                <input name="password" type="password" value={studentForm.password} onChange={handleStudentChange} placeholder={t('enter_password')} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                                <input name="mobile" value={studentForm.mobile} onChange={handleStudentChange} placeholder="Parent mobile number" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                                <input name="dob" type="date" value={studentForm.dob} onChange={handleStudentChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                              </div>
                            </>
                          )}
                          <button type="submit" className="w-full py-3 btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('sign_in')}
                          </button>
                        </form>
                      </>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-4">
                      New school?{' '}
                      <button onClick={() => navigate('/register')} className="text-blue-600 hover:text-blue-700 font-semibold">Register Here</button>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="stats" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Perseverance Personified</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">Next-Gen EdTech Starts Here</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-4 sm:p-8 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                  idx === 0 ? 'gradient-card-blue' : idx === 1 ? 'gradient-card-teal' : idx === 2 ? 'gradient-card-purple' : 'gradient-card-orange'
                }`}>
                  <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-3 sm:gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0"><Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0"><Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">User-friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0"><Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Cloud-first</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0"><Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">AI-enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-10">
            <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Be Your Own Pilot</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              Navigate Your Space Station
            </h2>
            <p className="text-gray-500 mt-2 sm:mt-3 max-w-2xl mx-auto text-sm sm:text-lg">
              360° aerial view with AI-powered tools for full throttle school management.
            </p>
          </div>

          <div className="flex overflow-x-auto gap-2 mb-8 lg:mb-12 bg-gray-50 rounded-2xl p-2 sm:p-3 border border-gray-100 -mx-4 sm:mx-0 scrollbar-hide">
            {k12Tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeFeatureTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {(() => {
            const feature = k12Features[activeFeatureTab];
            const tabInfo = k12Tabs.find(t => t.id === activeFeatureTab);
            return (
              <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center animate-fade-in">
                <div className="flex-1 w-full">
                  <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${feature.bgGradient} p-8 lg:p-12 aspect-[4/3] flex items-center justify-center`}>
                    <div className="absolute inset-0 opacity-5">
                      <div className={`absolute top-6 right-6 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl`}></div>
                      <div className={`absolute bottom-6 left-6 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl`}></div>
                    </div>
                    <div className="relative z-10 w-full">
                      <K12Illustration tabId={activeFeatureTab} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    {tabInfo && <tabInfo.icon className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6 text-lg">{feature.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {feature.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all group">
                    Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="py-12 sm:py-16 gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">Ready to Transform Your School?</h2>
          <p className="text-white/70 text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of institutions already using our platform to simplify school management.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#login" className="px-8 py-3.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#features" className="px-8 py-3.5 bg-white/10 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all border border-white/20">
              View All Features
            </a>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-card-blue flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Schooltino</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Smart School Management System. Built for today. Ready for tomorrow.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-300">Product Suite</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#login" className="hover:text-white transition-colors">Schooltino (Admin)</a></li>
                <li><a href="/teachtino" className="hover:text-white transition-colors">TeachTino (Teachers)</a></li>
                <li><a href="/studytino" className="hover:text-white transition-colors">StudyTino (Students & Parents)</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">K-12 Suite</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-300">Modules</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Admissions & Enrollment</li>
                <li>Fee Management & Razorpay</li>
                <li>AI Attendance & Exams</li>
                <li>Transport & GPS Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-300">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>Schooltino &mdash; Smart School Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function K12Illustration({ tabId }) {
  const illustrations = {
    enrollment: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Online Admissions</div>
        <div className="space-y-2 mb-3">
          {['Enquiry Received', 'Form Submitted', 'Fee Paid', 'Enrolled'].map((step, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i < 3 ? 'bg-blue-500' : 'bg-gray-300'}`}>{i + 1}</div>
              <span className="text-xs text-gray-700">{step}</span>
              {i < 3 && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </div>
          ))}
        </div>
        <div className="text-center text-[10px] text-blue-600 font-medium">4 Steps to Complete Admission</div>
      </div>
    ),
    admissions: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Campaign Dashboard</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-purple-700">1,247</div><div className="text-[10px] text-purple-500">Total Leads</div></div>
          <div className="bg-pink-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-pink-700">89%</div><div className="text-[10px] text-pink-500">Conversion</div></div>
        </div>
        <div className="h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-end px-2 pb-2 gap-1">
          {[40, 60, 45, 80, 65, 90, 75].map((h, i) => <div key={i} className="flex-1 bg-gradient-to-t from-purple-500 to-pink-400 rounded-t" style={{height: `${h}%`}}></div>)}
        </div>
      </div>
    ),
    attendance: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Smart Attendance</div>
        <div className="space-y-3">
          {['Rahul S.', 'Priya M.', 'Amit K.'].map((name, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${['bg-teal-500','bg-emerald-500','bg-green-500'][i]}`}>{name[0]}</div><span className="text-xs font-medium text-gray-700">{name}</span></div>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Present</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-teal-600"><Fingerprint className="w-3.5 h-3.5" /> Geo-facial verified</div>
      </div>
    ),
    finance: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Fee Collection</div>
        <div className="text-2xl font-extrabold text-gray-900 mb-1">&#8377;12,45,000</div>
        <div className="text-xs text-gray-400 mb-3">Total Collected This Month</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-orange-50 rounded-xl p-3 text-center"><div className="text-sm font-bold text-orange-700">&#8377;8.5L</div><div className="text-[10px] text-orange-500">Online</div></div>
          <div className="bg-amber-50 rounded-xl p-3 text-center"><div className="text-sm font-bold text-amber-700">&#8377;3.9L</div><div className="text-[10px] text-amber-500">Walk-in</div></div>
        </div>
      </div>
    ),
    website: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Website Builder</div>
        <div className="bg-indigo-50 rounded-xl p-4 mb-3 text-center">
          <Globe className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <div className="text-xs font-semibold text-indigo-700">www.yourschool.edu</div>
          <div className="text-[10px] text-indigo-500 mt-1">SEO Optimized & Live</div>
        </div>
        <div className="flex gap-2">
          {['Home', 'About', 'Admissions', 'Gallery'].map((p, i) => (
            <div key={i} className="flex-1 bg-gray-50 rounded-lg p-1.5 text-center text-[9px] text-gray-600">{p}</div>
          ))}
        </div>
      </div>
    ),
    dashboard: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Student 360°</div>
        <div className="space-y-2">
          {[['Mathematics', 'A+', 95], ['Science', 'A', 88], ['English', 'A+', 92]].map(([sub, grade, marks], i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-xs text-gray-700">{sub}</span>
              <div className="flex items-center gap-2"><span className="text-xs text-pink-600 font-bold">{grade}</span>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" style={{width:`${marks}%`}}></div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-[10px] text-gray-500">Attendance: 94% | Discipline: Excellent</div>
      </div>
    ),
    testbuilder: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">AI Test Builder</div>
        <div className="bg-emerald-50 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-emerald-500" /><span className="text-xs font-semibold text-emerald-700">650,000+ Questions</span></div>
          <div className="flex gap-1">
            {['Easy', 'Medium', 'Hard'].map((d, i) => (
              <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full ${['bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-red-100 text-red-600'][i]}`}>{d}</span>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {['Class 10 - Maths Final', 'Class 8 - Science Mid-Term'].map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-[10px] text-gray-700">{p}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">Ready</span>
            </div>
          ))}
        </div>
      </div>
    ),
    assignment: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Homework Tracker</div>
        <div className="space-y-2">
          {[['Math Worksheet', 'Turned In', 'green'], ['Science Lab', 'Pending', 'amber'], ['English Essay', 'Feedback Given', 'blue']].map(([title, status, color], i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2"><BookOpen className={`w-4 h-4 text-${color}-500`} /><span className="text-xs text-gray-700">{title}</span></div>
              <span className={`text-[9px] bg-${color}-100 text-${color}-600 px-2 py-0.5 rounded-full`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    edtech: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Digital Learning</div>
        <div className="grid grid-cols-2 gap-2">
          {[['Virtual Lab', 'bg-sky-50 text-sky-600'], ['Periodic Table', 'bg-blue-50 text-blue-600'], ['Graph Plotter', 'bg-cyan-50 text-cyan-600'], ['Art Studio', 'bg-teal-50 text-teal-600']].map(([name, cls], i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${cls}`}>
              <GraduationCap className="w-5 h-5 mx-auto mb-1" />
              <div className="text-[10px] font-bold">{name}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    content: () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Learning Paths</div>
        <div className="space-y-2">
          {[['Adaptive Math', 85, 'rose'], ['Science Explorer', 72, 'pink'], ['Language Arts', 90, 'fuchsia']].map(([title, progress, color], i) => (
            <div key={i} className="p-2.5 rounded-lg bg-gray-50">
              <div className="flex justify-between mb-1"><span className="text-xs text-gray-700">{title}</span><span className="text-[10px] text-gray-500">{progress}%</span></div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r from-${color}-500 to-pink-400 rounded-full`} style={{width:`${progress}%`}}></div></div>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  const Comp = illustrations[tabId] || illustrations.enrollment;
  return <Comp />;
}

function Sparkle() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" />
    </svg>
  );
}
