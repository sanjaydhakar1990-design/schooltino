import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { School, Eye, EyeOff, Loader2, GraduationCap, Users, Shield, ChevronRight, Crown } from 'lucide-react';
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
  
  // SECRET: Super Admin hidden login
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [superAdminForm, setSuperAdminForm] = useState({ email: '', password: '' });
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  
  // Admin/Staff login form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Student login form
  const [studentForm, setStudentForm] = useState({
    student_id: '',
    password: '',
    mobile: '',
    dob: ''
  });

  const [studentLoginMethod, setStudentLoginMethod] = useState('id'); // 'id' or 'mobile'

  // SECRET: Logo click handler - 5 clicks to reveal Super Admin
  const handleSecretClick = () => {
    const newCount = secretClickCount + 1;
    setSecretClickCount(newCount);
    
    if (newCount >= 5) {
      setShowSuperAdmin(true);
      setSecretClickCount(0);
    }
    
    // Reset after 3 seconds
    setTimeout(() => setSecretClickCount(0), 3000);
  };

  // Super Admin Login Handler
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

  // Check if initial setup is needed
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

  // Role-based redirect after login
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
      
      // Auto login
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Beautiful School Image with Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
          alt="Modern School"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/90 via-blue-700/85 to-blue-800/90"></div>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-center p-12">
          {/* SECRET: Click logo 5 times to reveal Super Admin */}
          <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={handleSecretClick}>
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
              <School className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white font-heading">Smart School</h1>
          </div>
          <h2 className="text-5xl font-bold text-white mb-6 font-heading leading-tight">
            School<br />Management System
          </h2>
          <p className="text-slate-300 text-xl max-w-md mb-8">
            AI + CCTV + Apps - Complete automation for modern schools.
          </p>
          
          {/* Portal Highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Admin Portal</p>
                <p className="text-sm text-slate-400">For Directors & Principals</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-blue-400/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">TeachTino</p>
                <p className="text-sm text-slate-400">For Teachers & Staff</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-blue-300/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">StudyTino</p>
                <p className="text-sm text-slate-400">For Students & Parents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo - SECRET: Click 5 times */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center cursor-pointer" onClick={handleSecretClick}>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <School className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-heading">Smart School</h1>
          </div>

          {/* SECRET: Super Admin Login Modal */}
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
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    disabled={superAdminLoading}
                  >
                    {superAdminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Access Control Panel'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full text-white/60 hover:text-white"
                    onClick={() => {setShowSuperAdmin(false); setError('');}}
                  >
                    Cancel
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Initial Setup Screen */}
          {setupRequired ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-gray-800">Initial Setup</h2>
                <p className="text-gray-400 mt-2">Create your Director account to get started</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm" data-testid="auth-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleDirectorSetup} className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Director Name"
                    required
                    className="h-12"
                    data-testid="setup-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="director@school.com"
                    required
                    className="h-12"
                    data-testid="setup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      required
                      className="h-12 pr-10"
                      data-testid="setup-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 btn-primary" disabled={loading} data-testid="setup-btn">
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
            /* Login Forms */
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
                <p className="text-gray-400 text-sm mt-1">Select your portal and login</p>
              </div>

              <Tabs value={activePortal} onValueChange={setActivePortal} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100 rounded-lg">
                  <TabsTrigger value="admin" className="py-2.5 rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <Shield className="w-4 h-4 mr-1.5" />
                    Admin
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="py-2.5 rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <Users className="w-4 h-4 mr-1.5" />
                    Teacher
                  </TabsTrigger>
                  <TabsTrigger value="student" className="py-2.5 rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm">
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    Student
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm" data-testid="auth-error">
                    {error}
                  </div>
                )}

                {/* Admin & Teacher Login - Same form */}
                <TabsContent value="admin" className="space-y-5">
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@school.com"
                        required
                        className="h-12"
                        data-testid="admin-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="h-12 pr-10"
                          data-testid="admin-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-blue-500 hover:bg-blue-600" disabled={loading} data-testid="admin-login-btn">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Login
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="teacher" className="space-y-5">
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="teacher@school.com"
                        required
                        className="h-12"
                        data-testid="teacher-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="h-12 pr-10"
                          data-testid="teacher-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-blue-500 hover:bg-blue-600" disabled={loading} data-testid="teacher-login-btn">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Login to TeachTino
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="student" className="space-y-5">
                  {/* Student Login Method Toggle */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStudentLoginMethod('id')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        studentLoginMethod === 'id' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      Student ID + Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentLoginMethod('mobile')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        studentLoginMethod === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      Mobile + DOB
                    </button>
                  </div>

                  <form onSubmit={handleStudentLogin} className="space-y-5">
                    {studentLoginMethod === 'id' ? (
                      <>
                        <div className="space-y-2">
                          <Label>Student ID</Label>
                          <Input
                            name="student_id"
                            value={studentForm.student_id}
                            onChange={handleStudentChange}
                            placeholder="STD-2025-XXXXXX"
                            required
                            className="h-12 font-mono"
                            data-testid="student-id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <div className="relative">
                            <Input
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              value={studentForm.password}
                              onChange={handleStudentChange}
                              placeholder="••••••••"
                              required
                              className="h-12 pr-10"
                              data-testid="student-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Parent Mobile Number</Label>
                          <Input
                            name="mobile"
                            value={studentForm.mobile}
                            onChange={handleStudentChange}
                            placeholder="7879967616"
                            required
                            className="h-12"
                            data-testid="student-mobile"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input
                            name="dob"
                            type="date"
                            value={studentForm.dob}
                            onChange={handleStudentChange}
                            required
                            className="h-12"
                            data-testid="student-dob"
                          />
                        </div>
                      </>
                    )}
                    <Button type="submit" className="w-full h-12 bg-blue-500 hover:bg-blue-600" disabled={loading} data-testid="student-login-btn">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Login to StudyTino
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500">
                  {activePortal === 'admin' && 'Director, Principal, Vice Principal - Login here'}
                  {activePortal === 'teacher' && 'Teachers & Staff - Get credentials from your school admin'}
                  {activePortal === 'student' && 'Students - Use credentials provided during admission'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
