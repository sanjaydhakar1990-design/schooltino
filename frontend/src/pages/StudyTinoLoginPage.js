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

  const [loginType, setLoginType] = useState('student');
  const [loginMethod, setLoginMethod] = useState('id');
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
      toast.error(isHindi ? 'Student ID enter kijiye' : 'Enter Student ID');
      return;
    }
    if (loginMethod === 'mobile' && !form.mobile) {
      toast.error(isHindi ? 'Mobile Number enter kijiye' : 'Enter Mobile Number');
      return;
    }
    if (loginMethod === 'id' && !form.password) {
      toast.error(isHindi ? 'Password enter kijiye' : 'Enter Password');
      return;
    }
    if (loginMethod === 'mobile' && !form.dob) {
      toast.error(isHindi ? 'Date of Birth enter kijiye' : 'Enter Date of Birth');
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
        toast.success(isHindi ? 'Login successful!' : 'Login successful!');
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
      toast.error(isHindi ? 'Parent ID enter kijiye' : 'Enter Parent ID');
      return;
    }
    if (loginMethod === 'mobile' && !form.mobile) {
      toast.error(isHindi ? 'Mobile Number enter kijiye' : 'Enter Mobile Number');
      return;
    }
    if (!form.password) {
      toast.error(isHindi ? 'Password enter kijiye' : 'Enter Password');
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
        toast.success(isHindi ? 'Login successful!' : 'Login successful!');
        navigate('/parent-portal');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || (isHindi ? 'Login failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">StudyTino</h1>
          <p className="text-gray-400 text-sm">
            {isHindi ? 'Student & Parent Portal' : 'Student & Parent Portal'}
          </p>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => {
              setLoginType('student');
              setLoginMethod('id');
              setForm({ ...form, student_id: '', parent_id: '', mobile: '', password: '', dob: '' });
            }}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              loginType === 'student'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            <GraduationCap className={`w-7 h-7 mx-auto mb-1.5 ${loginType === 'student' ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={`font-medium text-sm ${loginType === 'student' ? 'text-blue-600' : 'text-gray-500'}`}>
              {isHindi ? 'Student' : 'Student'}
            </p>
          </button>
          <button
            onClick={() => {
              setLoginType('parent');
              setLoginMethod('mobile');
              setForm({ ...form, student_id: '', parent_id: '', mobile: '', password: '', dob: '' });
            }}
            className={`flex-1 p-4 rounded-xl border transition-all ${
              loginType === 'parent'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            <Heart className={`w-7 h-7 mx-auto mb-1.5 ${loginType === 'parent' ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={`font-medium text-sm ${loginType === 'parent' ? 'text-blue-600' : 'text-gray-500'}`}>
              {isHindi ? 'Parent' : 'Parent'}
            </p>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 pb-2">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              {loginType === 'student' ? (
                <><GraduationCap className="w-5 h-5 text-blue-500" /> {isHindi ? 'Student Login' : 'Student Login'}</>
              ) : (
                <><Heart className="w-5 h-5 text-blue-500" /> {isHindi ? 'Parent Login' : 'Parent Login'}</>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {loginType === 'student'
                ? (isHindi ? 'Student ID ya Mobile se login kijiye' : 'Login with Student ID or Mobile')
                : (isHindi ? 'Parent ID ya Mobile se login kijiye' : 'Login with Parent ID or Mobile')}
            </p>
          </div>
          <div className="p-5 pt-3">
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={loginMethod === 'id' ? 'default' : 'outline'}
                className={`flex-1 ${loginMethod === 'id' ? 'bg-blue-500 hover:bg-blue-600' : 'border-gray-200 text-gray-600'}`}
                onClick={() => setLoginMethod('id')}
              >
                <IdCard className="w-4 h-4 mr-2" />
                {loginType === 'student' ? 'Student ID' : 'Parent ID'}
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'mobile' ? 'default' : 'outline'}
                className={`flex-1 ${loginMethod === 'mobile' ? 'bg-blue-500 hover:bg-blue-600' : 'border-gray-200 text-gray-600'}`}
                onClick={() => setLoginMethod('mobile')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>

            <form onSubmit={loginType === 'student' ? handleStudentLogin : handleParentLogin} className="space-y-4">
              {loginMethod === 'id' && (
                <div>
                  <Label className="text-sm text-gray-700">{loginType === 'student' ? 'Student ID' : 'Parent ID'}</Label>
                  <div className="relative mt-1">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={loginType === 'student' ? form.student_id : form.parent_id}
                      onChange={(e) => setForm({ 
                        ...form, 
                        [loginType === 'student' ? 'student_id' : 'parent_id']: e.target.value 
                      })}
                      placeholder={loginType === 'student' ? 'STU-2026-00001' : 'PAR-2026-00001'}
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {loginMethod === 'mobile' && (
                <div>
                  <Label className="text-sm text-gray-700">Mobile Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="9876543210"
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500"
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {(loginType === 'parent' || loginMethod === 'id') && (
                <div>
                  <Label className="text-sm text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="********"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {loginType === 'student' && loginMethod === 'mobile' && (
                <div>
                  <Label className="text-sm text-gray-700">{isHindi ? 'Date of Birth' : 'Date of Birth'}</Label>
                  <Input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="h-11 mt-1 border-gray-200 focus:border-blue-500"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 font-medium rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                {isHindi ? 'Login' : 'Login'}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              {isHindi 
                ? 'Password school se mila hai. Forgot? Contact school.'
                : 'Password provided by school. Forgot? Contact school.'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500">
              {isHindi ? 'Students can view homework, attendance, results' : 'Students can view homework, attendance, results'}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-2">
              <Heart className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">
              {isHindi ? 'Parents can view all children\'s info in one place' : 'Parents can view all children\'s info in one place'}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-gray-400 hover:text-blue-500 transition-colors"
          >
            {isHindi ? 'Staff / Admin Login' : 'Staff / Admin Login'} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
