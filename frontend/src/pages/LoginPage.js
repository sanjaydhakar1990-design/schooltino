import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { School, Eye, EyeOff, Loader2, GraduationCap, Users, Shield, ChevronRight, Crown, BookOpen, CalendarCheck, MessageSquare, BarChart3, Bell } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, setUser, setToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [activePortal, setActivePortal] = useState('admin');
  
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [superAdminForm, setSuperAdminForm] = useState({ email: '', password: '' });
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const [studentForm, setStudentForm] = useState({
    student_id: '',
    password: '',
    mobile: '',
    dob: ''
  });

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

  useEffect(() => {
    checkSetup();
  }, []);

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
      case 'teacher':
      case 'admission_staff':
      case 'clerk':
      case 'staff':
        return '/teacher-dashboard';
      case 'student':
        return '/student-dashboard';
      case 'director':
      case 'principal':
      case 'vice_principal':
      case 'admin':
      case 'accountant':
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
      const redirectPath = getRedirectPath(userData.role);
      navigate(redirectPath);
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
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'director'
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
      let payload = {};
      if (studentLoginMethod === 'id') {
        payload = { student_id: studentForm.student_id, password: studentForm.password };
      } else {
        payload = { mobile: studentForm.mobile, dob: studentForm.dob };
      }
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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStudentChange = (e) => {
    setStudentForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#1565c0]"></div>

        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-16 w-56 h-56 bg-indigo-400/15 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleSecretClick}>
              <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Schooltino</h1>
                <p className="text-xs text-blue-200">Smart School Management</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Complete School<br />Management System
            </h2>
            <p className="text-blue-200 text-lg mb-10 leading-relaxed">
              AI-powered platform for managing students, staff, fees, attendance, and everything your school needs.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: 'Student Management', desc: 'Admission to alumni' },
                { icon: CalendarCheck, label: 'Attendance', desc: 'Biometric & manual' },
                { icon: BarChart3, label: 'Fee Tracking', desc: 'Online payments' },
                { icon: BookOpen, label: 'Academics', desc: 'Exams & reports' },
                { icon: MessageSquare, label: 'Communication', desc: 'SMS & notifications' },
                { icon: Bell, label: 'Smart Alerts', desc: 'Real-time updates' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white/8 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <feature.icon className="w-4 h-4 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{feature.label}</p>
                    <p className="text-xs text-blue-300/80">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-blue-200/70">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Admin Portal</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200/70">
              <Users className="w-4 h-4" />
              <span className="text-xs">TeachTino</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200/70">
              <GraduationCap className="w-4 h-4" />
              <span className="text-xs">StudyTino</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center cursor-pointer" onClick={handleSecretClick}>
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Schooltino</h1>
              <p className="text-[11px] text-gray-400">Smart School Management</p>
            </div>
          </div>

          {showSuperAdmin && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-amber-500/30">
                <div className="flex items-center gap-3 mb-6 justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Platform Owner</h2>
                </div>
                <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Owner Email"
                    value={superAdminForm.email}
                    onChange={(e) => setSuperAdminForm({...superAdminForm, email: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={superAdminForm.password}
                    onChange={(e) => setSuperAdminForm({...superAdminForm, password: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" disabled={superAdminLoading}>
                    {superAdminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Access Control Panel'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-white/60 hover:text-white" onClick={() => {setShowSuperAdmin(false); setError('');}}>
                    Cancel
                  </Button>
                </form>
              </div>
            </div>
          )}

          {setupRequired ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Initial Setup</h2>
                <p className="text-gray-400 mt-2 text-sm">Create your Director account to get started</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm" data-testid="auth-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleDirectorSetup} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Director Name" required className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="setup-name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="director@school.com" required className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="setup-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Create a strong password" required className="h-12 pr-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="setup-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 text-base font-semibold" disabled={loading} data-testid="setup-btn">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Create Director Account
                </Button>
              </form>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This setup can only be done once. You&apos;ll use this account to create all other staff accounts.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-400 text-sm mt-1.5">Select your portal and login to continue</p>
              </div>

              <Tabs value={activePortal} onValueChange={setActivePortal} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                  <TabsTrigger value="admin" className="py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20 transition-all">
                    <Shield className="w-4 h-4 mr-1.5" />
                    Admin
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20 transition-all">
                    <Users className="w-4 h-4 mr-1.5" />
                    Teacher
                  </TabsTrigger>
                  <TabsTrigger value="student" className="py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/20 transition-all">
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    Student
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm" data-testid="auth-error">
                    {error}
                  </div>
                )}

                <TabsContent value="admin" className="space-y-5 mt-0">
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="admin@school.com" required className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="admin-email" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Password</Label>
                        <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot Password?</button>
                      </div>
                      <div className="relative">
                        <Input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="••••••••" required className="h-12 pr-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="admin-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 text-base font-semibold" disabled={loading} data-testid="admin-login-btn">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Log in
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                  <p className="text-center text-xs text-gray-400">Director, Principal, Vice Principal - Login here</p>
                </TabsContent>

                <TabsContent value="teacher" className="space-y-5 mt-0">
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="teacher@school.com" required className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="teacher-email" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Password</Label>
                        <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot Password?</button>
                      </div>
                      <div className="relative">
                        <Input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="••••••••" required className="h-12 pr-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="teacher-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 text-base font-semibold" disabled={loading} data-testid="teacher-login-btn">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Log in to TeachTino
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                  <p className="text-center text-xs text-gray-400">Teachers & Staff - Get credentials from your school admin</p>
                </TabsContent>

                <TabsContent value="student" className="space-y-5 mt-0">
                  <div className="flex gap-1.5 p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                    <button type="button" onClick={() => setStudentLoginMethod('id')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${studentLoginMethod === 'id' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      Student ID
                    </button>
                    <button type="button" onClick={() => setStudentLoginMethod('mobile')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${studentLoginMethod === 'mobile' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      Mobile + DOB
                    </button>
                  </div>

                  <form onSubmit={handleStudentLogin} className="space-y-5">
                    {studentLoginMethod === 'id' ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Student ID</Label>
                          <Input name="student_id" value={studentForm.student_id} onChange={handleStudentChange} placeholder="STD-2025-XXXXXX" required className="h-12 font-mono rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="student-id" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Password</Label>
                          <div className="relative">
                            <Input name="password" type={showPassword ? 'text' : 'password'} value={studentForm.password} onChange={handleStudentChange} placeholder="••••••••" required className="h-12 pr-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="student-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Parent Mobile Number</Label>
                          <Input name="mobile" value={studentForm.mobile} onChange={handleStudentChange} placeholder="9876543210" required className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="student-mobile" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                          <Input name="dob" type="date" value={studentForm.dob} onChange={handleStudentChange} required className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" data-testid="student-dob" />
                        </div>
                      </>
                    )}
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 text-base font-semibold" disabled={loading} data-testid="student-login-btn">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Log in to StudyTino
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                  <p className="text-center text-xs text-gray-400">Students - Use credentials provided during admission</p>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by Schooltino - Smart School Management
          </p>
        </div>
      </div>
    </div>
  );
}
