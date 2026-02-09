import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Crown } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'admin', label: 'Admin' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'student', label: 'Student' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {showSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-8 rounded-xl w-full max-w-sm">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <Crown className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Platform Owner</h2>
            </div>
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <input type="email" placeholder="Email" value={superAdminForm.email} onChange={(e) => setSuperAdminForm({...superAdminForm, email: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
              <input type="password" placeholder="Password" value={superAdminForm.password} onChange={(e) => setSuperAdminForm({...superAdminForm, password: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium" disabled={superAdminLoading}>
                {superAdminLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Access'}
              </button>
              <button type="button" className="w-full py-2 text-gray-400 hover:text-white text-sm" onClick={() => {setShowSuperAdmin(false); setError('');}}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8 cursor-pointer" onClick={handleSecretClick}>
          <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {setupRequired ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Initial Setup</h2>
              <p className="text-sm text-gray-500 mb-6">Create your Director account</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
              <form onSubmit={handleDirectorSetup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="Director Name" required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="director@school.com" required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create password" required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex border-b border-gray-200 mb-6">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }} className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

              {activeTab !== 'student' ? (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={activeTab === 'teacher' ? 'teacher@school.com' : 'admin@school.com'} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Enter password" required className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                    <button onClick={() => setStudentLoginMethod('id')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${studentLoginMethod === 'id' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Student ID</button>
                    <button onClick={() => setStudentLoginMethod('mobile')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${studentLoginMethod === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Mobile + DOB</button>
                  </div>
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    {studentLoginMethod === 'id' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID</label>
                          <input name="student_id" value={studentForm.student_id} onChange={handleStudentChange} placeholder="STD-2025-XXXXXX" required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                          <input name="password" type="password" value={studentForm.password} onChange={handleStudentChange} placeholder="Enter password" required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                          <input name="mobile" value={studentForm.mobile} onChange={handleStudentChange} placeholder="Parent mobile number" required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                          <input name="dob" type="date" value={studentForm.dob} onChange={handleStudentChange} required className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                      </>
                    )}
                    <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Powered by Schooltino</p>
      </div>
    </div>
  );
}
