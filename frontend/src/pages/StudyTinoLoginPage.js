import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  GraduationCap, Heart, Phone, Lock, Eye, EyeOff, LogIn, Loader2,
  User, IdCard, ArrowRight, BookOpen, Users
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function StudyTinoLoginPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [loginType, setLoginType] = useState('student'); // 'student' or 'parent'
  const [loginMethod, setLoginMethod] = useState('id'); // 'id' or 'mobile'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    parent_id: '',
    mobile: '',
    password: '',
    dob: ''
  });

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    
    if (loginMethod === 'id' && !form.student_id) {
      toast.error(isHindi ? 'Student ID डालें' : 'Enter Student ID');
      return;
    }
    if (loginMethod === 'mobile' && !form.mobile) {
      toast.error(isHindi ? 'Mobile Number डालें' : 'Enter Mobile Number');
      return;
    }
    if (loginMethod === 'id' && !form.password) {
      toast.error(isHindi ? 'Password डालें' : 'Enter Password');
      return;
    }
    if (loginMethod === 'mobile' && !form.dob) {
      toast.error(isHindi ? 'जन्मतिथि डालें' : 'Enter Date of Birth');
      return;
    }

    setLoading(true);
    try {
      const payload = loginMethod === 'id' 
        ? { student_id: form.student_id, password: form.password }
        : { mobile: form.mobile, dob: form.dob };

      const response = await axios.post(`${API}/api/students/login`, payload);
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.student));
        toast.success(isHindi ? 'Login सफल!' : 'Login successful!');
        navigate('/student-dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'Login failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async (e) => {
    e.preventDefault();
    
    if (loginMethod === 'id' && !form.parent_id) {
      toast.error(isHindi ? 'Parent ID डालें' : 'Enter Parent ID');
      return;
    }
    if (loginMethod === 'mobile' && !form.mobile) {
      toast.error(isHindi ? 'Mobile Number डालें' : 'Enter Mobile Number');
      return;
    }
    if (!form.password) {
      toast.error(isHindi ? 'Password डालें' : 'Enter Password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/parent/login`, {
        mobile: loginMethod === 'mobile' ? form.mobile : null,
        parent_id: loginMethod === 'id' ? form.parent_id : null,
        password: form.password
      });
      
      if (response.data.success) {
        localStorage.setItem('parent_token', response.data.token);
        localStorage.setItem('parent_data', JSON.stringify(response.data.parent));
        toast.success(isHindi ? 'Login सफल!' : 'Login successful!');
        navigate('/parent-portal');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'Login failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">StudyTino</h1>
          <p className="text-slate-500">
            {isHindi ? 'छात्र और अभिभावक पोर्टल' : 'Student & Parent Portal'}
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setLoginType('student');
              setLoginMethod('id');
              setForm({ ...form, student_id: '', parent_id: '', mobile: '', password: '', dob: '' });
            }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              loginType === 'student'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${loginType === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <p className={`font-medium ${loginType === 'student' ? 'text-indigo-700' : 'text-slate-600'}`}>
              {isHindi ? 'छात्र' : 'Student'}
            </p>
          </button>
          <button
            onClick={() => {
              setLoginType('parent');
              setLoginMethod('mobile');
              setForm({ ...form, student_id: '', parent_id: '', mobile: '', password: '', dob: '' });
            }}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              loginType === 'parent'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <Heart className={`w-8 h-8 mx-auto mb-2 ${loginType === 'parent' ? 'text-purple-600' : 'text-slate-400'}`} />
            <p className={`font-medium ${loginType === 'parent' ? 'text-purple-700' : 'text-slate-600'}`}>
              {isHindi ? 'अभिभावक' : 'Parent'}
            </p>
          </button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {loginType === 'student' ? (
                <><GraduationCap className="w-5 h-5 text-indigo-600" /> {isHindi ? 'छात्र Login' : 'Student Login'}</>
              ) : (
                <><Heart className="w-5 h-5 text-purple-600" /> {isHindi ? 'अभिभावक Login' : 'Parent Login'}</>
              )}
            </CardTitle>
            <CardDescription>
              {loginType === 'student'
                ? (isHindi ? 'Student ID या Mobile से login करें' : 'Login with Student ID or Mobile')
                : (isHindi ? 'Parent ID या Mobile से login करें' : 'Login with Parent ID or Mobile')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Method Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={loginMethod === 'id' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLoginMethod('id')}
              >
                <IdCard className="w-4 h-4 mr-2" />
                {loginType === 'student' ? 'Student ID' : 'Parent ID'}
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'mobile' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setLoginMethod('mobile')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>

            <form onSubmit={loginType === 'student' ? handleStudentLogin : handleParentLogin} className="space-y-4">
              {/* ID Field */}
              {loginMethod === 'id' && (
                <div>
                  <Label>{loginType === 'student' ? 'Student ID' : 'Parent ID'}</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={loginType === 'student' ? form.student_id : form.parent_id}
                      onChange={(e) => setForm({ 
                        ...form, 
                        [loginType === 'student' ? 'student_id' : 'parent_id']: e.target.value 
                      })}
                      placeholder={loginType === 'student' ? 'STU-2026-00001' : 'PAR-2026-00001'}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Field */}
              {loginMethod === 'mobile' && (
                <div>
                  <Label>Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="9876543210"
                      className="pl-10"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {/* Password or DOB */}
              {(loginType === 'parent' || loginMethod === 'id') && (
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="********"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* DOB for Student Mobile Login */}
              {loginType === 'student' && loginMethod === 'mobile' && (
                <div>
                  <Label>{isHindi ? 'जन्मतिथि' : 'Date of Birth'}</Label>
                  <Input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className={`w-full ${loginType === 'student' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                {isHindi ? 'Login करें' : 'Login'}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-4">
              {isHindi 
                ? 'Password school से मिला है। भूल गए? School से संपर्क करें।'
                : 'Password provided by school. Forgot? Contact school.'}
            </p>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/70 backdrop-blur p-3 rounded-xl border border-slate-200">
            <GraduationCap className="w-6 h-6 text-indigo-500 mb-2" />
            <p className="text-xs text-slate-600">
              {isHindi ? 'छात्र अपना homework, attendance, results देख सकते हैं' : 'Students can view homework, attendance, results'}
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur p-3 rounded-xl border border-slate-200">
            <Heart className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-xs text-slate-600">
              {isHindi ? 'Parents सभी बच्चों की जानकारी एक जगह देख सकते हैं' : 'Parents can view all children\'s info in one place'}
            </p>
          </div>
        </div>

        {/* Staff Login Link */}
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            {isHindi ? 'Staff / Admin Login →' : 'Staff / Admin Login →'}
          </button>
        </div>
      </div>
    </div>
  );
}
