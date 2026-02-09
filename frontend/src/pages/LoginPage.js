import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Crown, GraduationCap, Users, CalendarCheck, Wallet, Shield, Bus, Brain, MessageSquare, Smartphone, BarChart3, BookOpen, Fingerprint } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const features = [
  { icon: Users, title: 'Student Management', desc: 'Complete admission, enrollment & records' },
  { icon: CalendarCheck, title: 'Smart Attendance', desc: 'AI-powered attendance tracking' },
  { icon: Wallet, title: 'Fee Management', desc: 'Online payments & auto receipts' },
  { icon: BarChart3, title: 'Exam & Reports', desc: 'Conduct exams, generate report cards' },
  { icon: Bus, title: 'Transport Tracking', desc: 'GPS tracking & route management' },
  { icon: MessageSquare, title: 'Communication', desc: 'SMS, notifications & announcements' },
  { icon: Brain, title: 'AI-Powered Tools', desc: 'AI paper generation & content studio' },
  { icon: Shield, title: 'Visit Management', desc: 'Secure visitor entry & tracking' },
  { icon: Smartphone, title: 'Mobile App', desc: 'One app for all stakeholders' },
  { icon: BookOpen, title: 'Multi-Branch', desc: 'Manage all branches from one place' },
  { icon: Fingerprint, title: 'Biometric', desc: 'Biometric attendance integration' },
  { icon: GraduationCap, title: 'Certificates', desc: 'Generate certificates & admit cards' },
];

const stats = [
  { value: '21,000+', label: 'Institutions' },
  { value: '300+', label: 'Support Team' },
  { value: '200+', label: 'Tech Experts' },
  { value: '150+', label: 'Awards' },
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
    <div className="min-h-screen flex flex-col">
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

      <div className="gradient-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center py-12 lg:py-20">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm text-blue-200 mb-6">
                <Sparkle /> Cloud-Based School ERP
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
                The Brain of an <span className="text-blue-300">EdTech.</span><br />
                The Soul of an <span className="text-purple-300">Educator.</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                A cloud-based, AI-powered School ERP that simplifies everything — from admissions and fees to exams and transport. Go paperless, automate workflows, and manage your school anytime, anywhere.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#login" className="px-8 py-3.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow-lg">
                  Get Started
                </a>
                <a href="#features" className="px-8 py-3.5 bg-white/10 backdrop-blur text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20">
                  See Features
                </a>
              </div>
            </div>

            <div id="login" className="animate-slide-up">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto lg:ml-auto">
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

      <div id="stats" className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Next-Gen EdTech Starts Here</h2>
            <p className="text-gray-500 mt-1">Trusted by institutions across the country</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-3xl font-extrabold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="features" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Integrated Intelligence in a Cloud-First School ERP</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Everything you need to run a modern school, powered by AI and built for the cloud.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card p-6 group" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  idx % 6 === 0 ? 'gradient-card-blue' :
                  idx % 6 === 1 ? 'gradient-card-purple' :
                  idx % 6 === 2 ? 'gradient-card-teal' :
                  idx % 6 === 3 ? 'gradient-card-orange' :
                  idx % 6 === 4 ? 'gradient-card-pink' :
                  'gradient-card-indigo'
                }`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="font-bold">Schooltino</span>
          </div>
          <p className="text-gray-400 text-sm">Built for today. Ready for tomorrow.</p>
        </div>
      </footer>
    </div>
  );
}

function Sparkle() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" />
    </svg>
  );
}
