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

const API = (process.env.REACT_APP_BACKEND_URL || '') || '';

export default function StudyTinoLoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { studentLogin } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [loginType, setLoginType] = useState('student');
  const [loginMethod, setLoginMethod] = useState('id');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    mobile: '',
    password: '',
    parent_id: ''
  });

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    
    if (!form.student_id) {
      toast.error(isHindi ? 'Student ID enter kijiye' : 'Enter Student ID');
      return;
    }
    if (!form.password) {
      toast.error(isHindi ? 'Password enter kijiye' : 'Enter Password');
      return;
    }

    setLoading(true);
    try {
      const payload = { student_id: form.student_id, password: form.password };

      await studentLogin(payload);
      toast.success(isHindi ? 'Login successful!' : 'Login successful!');
      navigate('/student-dashboard');
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Login failed');
      toast.error(msg);
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
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : 'Login failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">StudyTino</h1>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-white/80 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            ← {isHindi ? 'Schooltino par wapas jaayen' : 'Back to Schooltino'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Descriptive Text */}
          <div className="text-white animate-slide-up">
            <h2 className="text-4xl font-bold mb-4">
              {isHindi ? 'आपके बच्चे की पढ़ाई' : 'Your Child\'s Learning'} 
              <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                {isHindi ? 'एक नज़र में' : 'At a Glance'}
              </span>
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              {isHindi 
                ? 'StudyTino छात्रों और अभिभावकों को स्कूल की सभी जानकारी एक ही जगह पर देता है। होमवर्क, परीक्षा परिणाम, उपस्थिति, और बहुत कुछ।'
                : 'StudyTino gives students and parents access to all school information in one place. Homework, exam results, attendance, and more.'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 gradient-card-blue rounded-lg flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">
                  {isHindi ? 'पढ़ाई की प्रगति' : 'Learning Progress'}
                </h3>
                <p className="text-xs text-white/70">
                  {isHindi ? 'परीक्षा परिणाम और होमवर्क' : 'Exam results & homework'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 gradient-card-blue rounded-lg flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">
                  {isHindi ? 'अभिभावक जुड़ाव' : 'Parent Connect'}
                </h3>
                <p className="text-xs text-white/70">
                  {isHindi ? 'सभी बच्चों की जानकारी' : 'All children\'s info'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 gradient-card-blue rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">
                  {isHindi ? 'उपस्थिति ट्रैकिंग' : 'Attendance Track'}
                </h3>
                <p className="text-xs text-white/70">
                  {isHindi ? 'दैनिक अपडेट' : 'Daily updates'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 gradient-card-blue rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">
                  {isHindi ? 'शैक्षणिक सामग्री' : 'Academic Content'}
                </h3>
                <p className="text-xs text-white/70">
                  {isHindi ? 'कक्षा का काम' : 'Class materials'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
              {/* Student/Parent Toggle */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => {
                    setLoginType('student');
                    setLoginMethod('id');
                    setForm({ ...form, mobile: '', dob: '', parent_id: '', password: '' });
                  }}
                  className={`flex-1 p-4 rounded-xl border transition-all ${
                    loginType === 'student'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white'
                      : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white/70'
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 mx-auto mb-1.5`} />
                  <p className="font-medium text-sm">
                    {isHindi ? 'Student' : 'Student'}
                  </p>
                </button>
                <button
                  onClick={() => {
                    setLoginType('parent');
                    setLoginMethod('mobile');
                    setForm({ ...form, student_id: '', parent_id: '', mobile: '', password: '' });
                  }}
                  className={`flex-1 p-4 rounded-xl border transition-all ${
                    loginType === 'parent'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white'
                      : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white/70'
                  }`}
                >
                  <Heart className={`w-5 h-5 mx-auto mb-1.5`} />
                  <p className="font-medium text-sm">
                    {isHindi ? 'Parent' : 'Parent'}
                  </p>
                </button>
              </div>

              {/* Login Form Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  {loginType === 'student' ? (
                    <><GraduationCap className="w-5 h-5 text-blue-500" /> {t('student_login')}</>
                  ) : (
                    <><Heart className="w-5 h-5 text-blue-500" /> {t('login')}</>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {loginType === 'student'
                    ? (isHindi ? 'Student ID aur Password se login kijiye' : 'Login with Student ID and Password')
                    : (isHindi ? 'Parent ID ya Mobile se login kijiye' : 'Login with Parent ID or Mobile')}
                </p>
              </div>

              {loginType === 'parent' && (
                <div className="flex gap-2 mb-6">
                  <Button
                    type="button"
                    variant={loginMethod === 'id' ? 'default' : 'outline'}
                    className={`flex-1 ${loginMethod === 'id' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-gray-200 text-gray-600'}`}
                    onClick={() => setLoginMethod('id')}
                  >
                    <IdCard className="w-4 h-4 mr-2" />
                    Parent ID
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === 'mobile' ? 'default' : 'outline'}
                    className={`flex-1 ${loginMethod === 'mobile' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-gray-200 text-gray-600'}`}
                    onClick={() => setLoginMethod('mobile')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Mobile
                  </Button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={loginType === 'student' ? handleStudentLogin : handleParentLogin} className="space-y-4">
                {loginType === 'student' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{isHindi ? 'Student ID' : 'Student ID'}</Label>
                    <div className="relative mt-2">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        value={form.student_id}
                        onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                        placeholder="STU-SCH-2026-00001"
                        className="pl-10 h-11 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {loginType === 'parent' && loginMethod === 'id' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Parent ID</Label>
                    <div className="relative mt-2">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={form.parent_id}
                        onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                        placeholder="PAR-2026-00001"
                        className="pl-10 h-11 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {loginType === 'parent' && loginMethod === 'mobile' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="9876543210"
                        className="pl-10 h-11 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                {loginType === 'student' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('password')}</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
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

                {loginType === 'parent' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{t('password')}</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 border-gray-200 bg-white text-gray-900 focus:border-blue-500"
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

                <Button 
                  type="submit" 
                  className="btn-primary w-full h-11 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  {t('login')}
                </Button>
              </form>

              {loginType === 'parent' && (
                <p className="text-center text-xs text-gray-500 mt-5">
                  {isHindi 
                    ? 'Password school se mila hai. Forgot? Contact school.'
                    : 'Password provided by school. Forgot? Contact school.'}
                </p>
              )}
              {loginType === 'student' && (
                <p className="text-center text-xs text-gray-500 mt-5">
                  {isHindi 
                    ? 'Student ID aur Password school se mila hai. Bhool gaye? School se contact kijiye.'
                    : 'Student ID and Password provided by school. Forgot? Contact school.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-sm border-t border-white/20 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/70 text-sm">
            StudyTino {isHindi ? 'Schooltino का हिस्सा है' : 'is part of'} Schooltino - {isHindi ? 'स्मार्ट स्कूल प्रबंधन प्रणाली' : 'Smart School Management System'}
          </p>
        </div>
      </footer>
    </div>
  );
}
