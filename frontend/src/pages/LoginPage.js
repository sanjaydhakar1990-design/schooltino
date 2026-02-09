import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Crown, GraduationCap, Users, CalendarCheck, Wallet, Shield, Bus, Brain, MessageSquare, Smartphone, BarChart3, BookOpen, Fingerprint, CheckCircle2, ArrowRight, Rss, ShoppingBag, Building2, FileText, Globe, Layers } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const featureShowcase = [
  {
    icon: Rss,
    title: 'School Feed',
    tagline: 'A digital window to schooling\u2014watch them grow, guide them better.',
    desc: 'Share daily moments, announcements, and activities with parents in one personalized, interactive feed.',
    bullets: [
      'Share photos and videos of classroom activities with parents',
      'Teachers and students can comment and engage with posts instantly',
      'Record and organize classroom activities with ease',
    ],
    gradient: 'from-blue-500 to-cyan-400',
    bgGradient: 'from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-500',
  },
  {
    icon: Wallet,
    title: 'Student Wallet',
    tagline: 'Tap, pay, and track\u2014no more cash chaos',
    desc: 'Parents can recharge a digital wallet for their children, which schools can use for regular fees, event fees, activities, or any ad-hoc charges.',
    bullets: [
      'Rechargeable wallet managed by parents',
      'Ideal for school trips, events, and small fees',
      'Secure and trackable transactions',
      'Enables cashless school operations',
    ],
    gradient: 'from-purple-500 to-pink-400',
    bgGradient: 'from-purple-50 to-pink-50',
    iconBg: 'bg-purple-500',
  },
  {
    icon: Fingerprint,
    title: 'AI-Powered Staff Attendance',
    tagline: 'Smile, scan, and start\u2014AI takes the roll call',
    desc: 'Marking attendance is now effortless and accurate. With AI-driven facial recognition and geo-verification, staff can check in via their mobile phones.',
    bullets: [
      'Uses mobile-based geo-facial recognition',
      'Eliminates the need for RFID or biometric hardware',
      'Geo-fencing ensures attendance authenticity',
      'Data automatically synced and stored securely',
    ],
    gradient: 'from-teal-500 to-emerald-400',
    bgGradient: 'from-teal-50 to-emerald-50',
    iconBg: 'bg-teal-500',
  },
  {
    icon: Bus,
    title: 'NFC & GPS Tracking for Transport',
    tagline: 'Board, tap, and track\u2014school transport made easy',
    desc: 'Students simply tap their NFC-enabled ID cards on vehicle attender\'s phone to mark attendance during boarding. Combined with real-time GPS tracking.',
    bullets: [
      'Attendance via NFC tap on mobile',
      'Live GPS tracking of school buses',
      'Instant notifications to parents',
      'No costly hardware installation',
    ],
    gradient: 'from-orange-500 to-amber-400',
    bgGradient: 'from-orange-50 to-amber-50',
    iconBg: 'bg-orange-500',
  },
  {
    icon: Building2,
    title: 'Multi-Branch Management',
    tagline: 'Unify, monitor, and lead\u2014stay smartly synced',
    desc: 'Manage all your branches with a single login. Get a unified view of operations across locations\u2014whether it\'s attendance, fees, academics, or transport.',
    bullets: [
      'Unified dashboard for all branches',
      'Cross-campus performance monitoring',
      'Centralized fee and attendance tracking',
      'Simplified reporting and decision-making',
    ],
    gradient: 'from-indigo-500 to-blue-400',
    bgGradient: 'from-indigo-50 to-blue-50',
    iconBg: 'bg-indigo-500',
  },
  {
    icon: FileText,
    title: 'Exam & Report Card Management',
    tagline: 'Conduct, compute, and release\u2014results in minutes',
    desc: 'Build your exam framework the way you want it. Whether it\'s by Term, Assessment, Subject, Activity, or Rubric\u2014you design, grade, and report exactly as needed.',
    bullets: [
      'Supports custom exam hierarchies',
      'Customizable report card designs',
      'Auto-calculate totals, averages, or weighted scores',
      'Publish digital report cards easily',
    ],
    gradient: 'from-pink-500 to-rose-400',
    bgGradient: 'from-pink-50 to-rose-50',
    iconBg: 'bg-pink-500',
  },
  {
    icon: Shield,
    title: 'Visit Management',
    tagline: 'Know who\'s in\u2014real-time visitor tracking',
    desc: 'Digitally manage and monitor all visitor entries and exits\u2014parents, vendors, or guests. Keep your school safe with a seamless visitor log and approval system.',
    bullets: [
      'Secure visitor entry with OTP & approval flow',
      'Real-time tracking of in-and-out logs',
      'Print visitor badges on arrival',
      'Full history available for audits',
    ],
    gradient: 'from-emerald-500 to-green-400',
    bgGradient: 'from-emerald-50 to-green-50',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: ShoppingBag,
    title: 'School Online e-Store',
    tagline: 'No lines, no rush\u2014just seamless school shopping',
    desc: 'From books to uniforms, create a custom e-store for your school. No code required. Parents can place orders online and receive items directly via the school store.',
    bullets: [
      'No-code store setup',
      'Secure online payments',
      'Easy order tracking',
      'Direct delivery to students',
    ],
    gradient: 'from-violet-500 to-purple-400',
    bgGradient: 'from-violet-50 to-purple-50',
    iconBg: 'bg-violet-500',
  },
  {
    icon: MessageSquare,
    title: 'Integrated Communication System',
    tagline: 'All Messages, One Platform, Zero Confusion',
    desc: 'Automate alerts and engage your school community effortlessly with multi-channel communication.',
    bullets: [
      'Event-based SMS, email, notifications & WhatsApp',
      'DLT-approved SMS templates',
      'Built-in surveys & observation forms',
    ],
    gradient: 'from-sky-500 to-blue-400',
    bgGradient: 'from-sky-50 to-blue-50',
    iconBg: 'bg-sky-500',
  },
  {
    icon: Smartphone,
    title: 'Unified Mobile App',
    tagline: 'One app. All roles. Total convenience',
    desc: 'The mobile app goes beyond routine tasks\u2014it\'s a single app for all school stakeholders.',
    bullets: [
      'Admin/Management monitor fees and key operations anytime',
      'Teachers manage lectures, planning, homework, and exams',
      'Parents handle daily school tasks with ease',
      'Students access all their learning in one place',
    ],
    gradient: 'from-rose-500 to-pink-400',
    bgGradient: 'from-rose-50 to-pink-50',
    iconBg: 'bg-rose-500',
  },
  {
    icon: Globe,
    title: 'Integrations',
    tagline: 'Integrate to Innovate\u2014The Smart Way',
    desc: 'Seamless integrations with industry-standard tools and platforms to extend your school\'s capabilities.',
    bullets: [
      'Tally integration for financial sync',
      'Razorpay & payment gateway support',
      'WhatsApp & SMS API integrations',
      'Biometric device connectivity',
    ],
    gradient: 'from-amber-500 to-yellow-400',
    bgGradient: 'from-amber-50 to-yellow-50',
    iconBg: 'bg-amber-500',
  },
];

const stats = [
  { value: '21,000+', label: 'Institutions Empowered', icon: GraduationCap },
  { value: '300+', label: 'Support Engineers', icon: Users },
  { value: '200+', label: 'R&D and Tech Experts', icon: Brain },
  { value: '150+', label: 'Awards', icon: BarChart3 },
];

export default function LoginPage() {
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
        return '/teacher-dashboard';
      case 'student':
        return '/student-dashboard';
      default:
        return '/dashboard';
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
      navigate('/dashboard');
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
      const res = await axios.post(`${API}/api/students/login`, null, { params: payload });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify({ ...res.data.student, role: 'student' }));
      setToken(res.data.access_token);
      setUser({ ...res.data.student, role: 'student' });
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
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

  const tabs = [
    { id: 'admin', label: 'Admin' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'student', label: 'Student' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
              <button type="button" className="w-full py-2 text-gray-400 hover:text-white text-sm" onClick={() => {setShowSuperAdmin(false); setError('');}}>Cancel</button>
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
            <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#stats" className="hover:text-white transition-colors">About</a>
              <a href="#login" className="px-5 py-2 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors border border-white/20 text-white">Request Demo</a>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm text-blue-200 mb-6 border border-white/10">
                <Sparkle /> Cloud-Based School ERP
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
                The Brain of an{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">EdTech.</span>
                <br />
                The Soul of an{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Educator.</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                A cloud-based, AI-powered School ERP that simplifies everything — from admissions and fees to exams and transport. Go paperless, automate workflows, and manage your school anytime, anywhere.
              </p>
              <p className="text-sm font-semibold text-white/50 mb-6">Built for today. Ready for tomorrow.</p>
              <div className="flex flex-wrap gap-4">
                <a href="#login" className="px-8 py-3.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all shadow-lg shadow-white/10 flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#features" className="px-8 py-3.5 bg-white/10 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all border border-white/20">
                  See Features
                </a>
              </div>
            </div>

            <div id="login" className="animate-slide-up">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto lg:ml-auto relative">
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="director@school.com" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create password" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <button type="submit" className="w-full py-3 btn-primary" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Account'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                    <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                      {tabs.map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                    {activeTab !== 'student' ? (
                      <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={activeTab === 'teacher' ? 'teacher@school.com' : 'admin@school.com'} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                          <div className="relative">
                            <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Enter password" required className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <button type="submit" className="w-full py-3 btn-primary" disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                          <button onClick={() => setStudentLoginMethod('id')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${studentLoginMethod === 'id' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Student ID</button>
                          <button onClick={() => setStudentLoginMethod('mobile')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${studentLoginMethod === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Mobile + DOB</button>
                        </div>
                        <form onSubmit={handleStudentLogin} className="space-y-4">
                          {studentLoginMethod === 'id' ? (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student ID</label>
                                <input name="student_id" value={studentForm.student_id} onChange={handleStudentChange} placeholder="STD-2025-XXXXXX" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                                <input name="password" type="password" value={studentForm.password} onChange={handleStudentChange} placeholder="Enter password" required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
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
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
                          </button>
                        </form>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="stats" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Perseverance Personified</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Next-Gen EdTech Starts Here</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-8 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  idx === 0 ? 'gradient-card-blue' : idx === 1 ? 'gradient-card-teal' : idx === 2 ? 'gradient-card-purple' : 'gradient-card-orange'
                }`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Integrated Intelligence</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
              Cloud-First School ERP
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-lg">
              Everything you need to run a modern school, powered by AI and built for the cloud.
            </p>
          </div>

          <div className="space-y-20">
            {featureShowcase.map((feature, idx) => {
              const isReversed = idx % 2 !== 0;
              return (
                <div key={idx} className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-16 items-center`}>
                  <div className="flex-1 w-full">
                    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${feature.bgGradient} p-8 lg:p-12 aspect-[4/3] flex items-center justify-center`}>
                      <div className="absolute inset-0 opacity-5">
                        <div className={`absolute top-6 right-6 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl`}></div>
                        <div className={`absolute bottom-6 left-6 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl`}></div>
                      </div>
                      <div className="relative z-10 w-full">
                        <FeatureIllustration feature={feature} index={idx} />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5 shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className={`text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}`}>
                      {feature.tagline}
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">{feature.desc}</p>
                    <ul className="space-y-3 mb-8">
                      {feature.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-sm">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <a href="#login" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors group">
                      Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="py-16 gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Ready to Transform Your School?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-300">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#stats" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#login" className="hover:text-white transition-colors">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-300">Modules</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Student Management</li>
                <li>Fee Management</li>
                <li>Attendance Tracking</li>
                <li>Transport & GPS</li>
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

function FeatureIllustration({ feature, index }) {
  const illustrations = [
    () => (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 max-w-xs mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"><span className="text-white text-xs font-bold">AB</span></div>
            <div><div className="h-3 w-24 bg-gray-200 rounded"></div><div className="h-2 w-16 bg-gray-100 rounded mt-1"></div></div>
          </div>
          <div className="h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl mb-3 flex items-center justify-center"><Rss className="w-10 h-10 text-blue-400" /></div>
          <div className="flex gap-4"><div className="h-2 w-12 bg-gray-100 rounded"></div><div className="h-2 w-12 bg-gray-100 rounded"></div><div className="h-2 w-12 bg-gray-100 rounded"></div></div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 max-w-[200px] mx-auto -mt-2 ml-8">
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-green-400"></div><div className="h-2 w-20 bg-gray-200 rounded"></div></div>
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs mx-auto">
        <div className="flex items-center justify-between mb-4"><span className="text-sm font-bold text-gray-800">Student Wallet</span><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></div>
        <div className="text-3xl font-extrabold text-gray-900 mb-1">&#8377;2,450</div>
        <div className="text-xs text-gray-400 mb-4">Available Balance</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-sm font-bold text-purple-700">&#8377;500</div><div className="text-[10px] text-purple-500">Recharge</div></div>
          <div className="bg-pink-50 rounded-xl p-3 text-center"><div className="text-sm font-bold text-pink-700">&#8377;150</div><div className="text-[10px] text-pink-500">Spent Today</div></div>
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Staff Attendance</div>
        <div className="space-y-3">
          {['Rahul S.', 'Priya M.', 'Amit K.'].map((name, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${['bg-teal-500','bg-emerald-500','bg-green-500'][i]}`}>{name[0]}</div><span className="text-xs font-medium text-gray-700">{name}</span></div>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Present</span>
            </div>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Bus Tracking</div>
        <div className="h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl mb-3 flex items-center justify-center relative">
          <Bus className="w-10 h-10 text-orange-500" />
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white rounded-full px-2 py-0.5 shadow-sm"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-[10px] font-medium">Live</span></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500"><span>Route: A-12</span><span className="text-orange-600 font-medium">ETA: 8 min</span></div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Branch Overview</div>
        <div className="space-y-2">
          {['Main Campus', 'East Branch', 'West Branch'].map((name, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-500" /><span className="text-xs font-medium text-gray-700">{name}</span></div>
              <span className="text-xs text-indigo-600 font-semibold">{[450, 320, 280][i]}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Report Card</div>
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
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Visitor Log</div>
        <div className="space-y-2">
          {[['Parent Visit', '10:30 AM', 'green'], ['Vendor', '11:15 AM', 'blue'], ['Guest', '02:00 PM', 'amber']].map(([type, time, color], i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2"><Shield className={`w-4 h-4 text-${color}-500`} /><span className="text-xs text-gray-700">{type}</span></div>
              <span className="text-[10px] text-gray-400">{time}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">School Store</div>
        <div className="grid grid-cols-2 gap-2">
          {[['Notebooks', '&#8377;120'], ['Uniform', '&#8377;850'], ['Books', '&#8377;450'], ['Bag', '&#8377;1,200']].map(([item, price], i) => (
            <div key={i} className="bg-violet-50 rounded-xl p-3 text-center">
              <ShoppingBag className="w-5 h-5 text-violet-500 mx-auto mb-1" />
              <div className="text-[10px] font-medium text-gray-700">{item}</div>
              <div className="text-xs font-bold text-violet-700" dangerouslySetInnerHTML={{__html: price}}></div>
            </div>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Communication Hub</div>
        <div className="space-y-2">
          {[['SMS Sent', '1,247', 'sky'], ['WhatsApp', '856', 'green'], ['Email', '432', 'blue']].map(([channel, count, color], i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2"><MessageSquare className={`w-4 h-4 text-${color}-500`} /><span className="text-xs text-gray-700">{channel}</span></div>
              <span className="text-xs font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Mobile App</div>
        <div className="grid grid-cols-3 gap-2">
          {[['Admin', Users], ['Teacher', BookOpen], ['Parent', Users], ['Student', GraduationCap], ['Guard', Shield], ['Driver', Bus]].map(([role, Icon], i) => (
            <div key={i} className="bg-rose-50 rounded-xl p-2 text-center">
              <Icon className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <div className="text-[9px] font-medium text-gray-600">{role}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    () => (
      <div className="bg-white rounded-2xl shadow-lg p-5 max-w-xs mx-auto">
        <div className="text-sm font-bold text-gray-800 mb-3">Integrations</div>
        <div className="grid grid-cols-2 gap-2">
          {[['Tally', 'bg-amber-100 text-amber-700'], ['Razorpay', 'bg-blue-100 text-blue-700'], ['WhatsApp', 'bg-green-100 text-green-700'], ['Biometric', 'bg-purple-100 text-purple-700']].map(([name, cls], i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${cls}`}>
              <Globe className="w-5 h-5 mx-auto mb-1" />
              <div className="text-[10px] font-bold">{name}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  ];

  const IllustrationComp = illustrations[index] || illustrations[0];
  return <IllustrationComp />;
}

function Sparkle() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" />
    </svg>
  );
}
