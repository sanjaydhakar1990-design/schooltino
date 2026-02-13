import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import ForgotPassword from '../components/ForgotPassword';
import {
  GraduationCap,
  BookOpen,
  Brain,
  Sparkles,
  Calendar,
  Users,
  FileText,
  Mic,
  Download,
  Check,
  Loader2,
  Lock,
  ArrowRight,
  Play,
  Target,
  Clock,
  Wand2,
  BarChart3,
  Star,
  Smartphone,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeachTinoLogin() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'student') {
        navigate('/student-dashboard');
      } else if (user.role === 'director') {
        navigate('/app/dashboard');
      } else {
        navigate('/portal');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(loginForm.email, loginForm.password);
      const allowedRoles = ['teacher', 'principal', 'vice_principal', 'co_director', 'admin_staff', 'accountant', 'admission_staff', 'clerk'];
      if (allowedRoles.includes(loggedUser.role) || loggedUser.role === 'director') {
        toast.success(`Welcome, ${loggedUser.name}!`);
        if (loggedUser.role === 'director') {
          navigate('/app/dashboard');
        } else {
          navigate('/portal');
        }
      } else if (loggedUser.role === 'student') {
        toast.info('Students should use StudyTino portal');
        navigate('/studytino');
      } else {
        toast.error('Access denied for this role');
      }
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('TeachTino installed!');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      toast.info('Add to Home Screen from browser menu');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">TeachTino</h1>
                <p className="text-xs text-blue-100">AI-Powered Teacher Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!isInstalled && (
                <Button 
                  onClick={handleInstall}
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
              <a href="/" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                Back to Schooltino
              </a>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center py-16">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                For Teachers Only
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
                Your AI Teaching
                <span className="block text-blue-200">Assistant is Here</span>
              </h2>
              
              <p className="text-base text-blue-100 mb-8 leading-relaxed">
                TeachTino helps you create lesson plans, question papers, worksheets, 
                and manage your classroom - all powered by AI.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Brain, title: 'AI Lesson Plans', desc: 'Generate daily plans instantly', color: 'blue' },
                  { icon: FileText, title: 'Question Papers', desc: 'Create exam papers in 2 mins', color: 'green' },
                  { icon: Calendar, title: 'Attendance', desc: 'Mark attendance quickly', color: 'amber' },
                  { icon: BarChart3, title: 'Student Analytics', desc: 'Track weak & strong students', color: 'purple' },
                  { icon: Mic, title: 'Voice Commands', desc: 'Hindi + English supported', color: 'red' },
                  { icon: Target, title: 'Syllabus Tracker', desc: 'Track your progress', color: 'teal' }
                ].map((feature, idx) => {
                  const colorMap = {
                    blue: 'bg-blue-500/20 text-blue-200',
                    green: 'bg-emerald-500/20 text-emerald-200',
                    amber: 'bg-amber-500/20 text-amber-200',
                    purple: 'bg-purple-500/20 text-purple-200',
                    red: 'bg-red-500/20 text-red-200',
                    teal: 'bg-teal-500/20 text-teal-200'
                  };
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                      <div className={`w-10 h-10 ${colorMap[feature.color]} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{feature.title}</h4>
                        <p className="text-xs text-blue-100">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl p-5">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />)}
                </div>
                <p className="italic text-sm mb-2">
                  "TeachTino AI has reduced my paper-work by 70%. I can now focus more on actual teaching!"
                </p>
                <p className="text-blue-100 text-xs">- Science Teacher, DPS Noida</p>
              </div>
            </div>

            <div className="animate-slide-up">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <GraduationCap className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t('teacher_login')}</h3>
                  <p className="text-gray-500 text-sm mt-1">Access your TeachTino dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label className="text-gray-700 text-sm">{t('email')}</Label>
                    <Input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="teacher@school.com"
                      className="h-11 mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-700 text-sm">{t('password')}</Label>
                    <Input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder={t('enter_password')}
                      className="h-11 mt-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full h-12 text-base font-medium rounded-lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        {t('login')}
                      </>
                    )}
                  </Button>
                  
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center gap-1 mt-2"
                  >
                    <Key className="w-3 h-3" />
                    {t('forgot_password')}
                  </button>
                </form>

                <ForgotPassword 
                  isOpen={showForgotPassword} 
                  onClose={() => setShowForgotPassword(false)}
                  onSuccess={() => toast.success('Password reset! Please login.')}
                />

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center border border-blue-100">
                    <Smartphone className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Install TeachTino App</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Get quick access from your home screen
                    </p>
                    <Button 
                      onClick={handleInstall}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm"
                      disabled={isInstalled}
                    >
                      {isInstalled ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Already Installed
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Install Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Don't have an account? Ask your school admin to create one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-0">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300 text-sm">
            TeachTino is part of <span className="font-semibold">Schooltino</span> - Smart School Management System
          </p>
          <p className="text-xs text-gray-400 mt-2">
            +91 7879967616 | schooltino.in
          </p>
        </div>
      </footer>
    </div>
  );
}
