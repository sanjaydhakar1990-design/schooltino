import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    // Redirect if already logged in - teachers go to TeachTino Dashboard
    if (user) {
      if (user.role === 'student') {
        navigate('/student-dashboard');
      } else if (user.role === 'director') {
        navigate('/app/dashboard');
      } else if (user.role === 'teacher' || user.role === 'principal' || user.role === 'vice_principal') {
        // Teachers go to TeachTino Dashboard with enhanced features
        navigate('/teacher-dashboard');
      } else {
        // Other staff go to Unified Portal
        navigate('/portal');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(loginForm.email, loginForm.password);
      // Allow all staff roles to login via TeachTino
      const allowedRoles = ['teacher', 'principal', 'vice_principal', 'co_director', 'admin_staff', 'accountant', 'admission_staff', 'clerk'];
      if (allowedRoles.includes(loggedUser.role) || loggedUser.role === 'director') {
        toast.success(`Welcome, ${loggedUser.name}! 🎓`);
        // Director goes to admin dashboard
        if (loggedUser.role === 'director') {
          navigate('/app/dashboard');
        } else if (loggedUser.role === 'teacher' || loggedUser.role === 'principal' || loggedUser.role === 'vice_principal') {
          // Teachers go to TeachTino Dashboard with enhanced features
          navigate('/teacher-dashboard');
        } else {
          // Other staff go to Unified Portal
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
        toast.success('TeachTino installed! 📱');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      toast.info('Add to Home Screen from browser menu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-800">TeachTino</h1>
              <p className="text-xs text-emerald-600">AI-Powered Teacher Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isInstalled && (
              <Button 
                onClick={handleInstall}
                variant="outline" 
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            <a href="/" className="text-emerald-600 hover:text-emerald-800 text-sm">
              ← Back to Schooltino
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Features */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              For Teachers Only
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Your AI Teaching
              <span className="block text-emerald-600">Assistant is Here</span>
            </h2>
            
            <p className="text-lg text-slate-600 mb-8">
              TeachTino helps you create lesson plans, question papers, worksheets, 
              and manage your classroom - all powered by AI.
            </p>

            {/* Feature List */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Brain, title: 'AI Lesson Plans', desc: 'Generate daily plans instantly' },
                { icon: FileText, title: 'Question Papers', desc: 'Create exam papers in 2 mins' },
                { icon: Calendar, title: 'Attendance', desc: 'Mark attendance quickly' },
                { icon: BarChart3, title: 'Student Analytics', desc: 'Track weak & strong students' },
                { icon: Mic, title: 'Voice Commands', desc: 'Hindi + English supported' },
                { icon: Target, title: 'Syllabus Tracker', desc: 'Track your progress' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{feature.title}</h4>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-emerald-600 text-white rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="italic mb-3">
                "TeachTino AI has reduced my paper-work by 70%. I can now focus more on actual teaching!"
              </p>
              <p className="text-emerald-200 text-sm">- Science Teacher, DPS Noida</p>
            </div>
          </div>

          {/* Right - Login Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-emerald-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Teacher Login</h3>
              <p className="text-slate-500 mt-2">Access your TeachTino dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label className="text-slate-700">Email Address</Label>
                <Input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="teacher@school.com"
                  className="h-12 mt-1 border-emerald-200 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div>
                <Label className="text-slate-700">Password</Label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  className="h-12 mt-1 border-emerald-200 focus:border-emerald-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Login to TeachTino
                  </>
                )}
              </Button>
              
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center justify-center gap-1 mt-3"
              >
                <Key className="w-3 h-3" />
                Forgot Password?
              </button>
            </form>

            {/* Forgot Password Modal */}
            <ForgotPassword 
              isOpen={showForgotPassword} 
              onClose={() => setShowForgotPassword(false)}
              onSuccess={() => toast.success('Password reset! Please login.')}
            />

            {/* Install App Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <Smartphone className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-semibold text-emerald-800 mb-1">Install TeachTino App</h4>
                <p className="text-sm text-emerald-600 mb-3">
                  Get quick access from your home screen
                </p>
                <Button 
                  onClick={handleInstall}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
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

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account? Ask your school admin to create one.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-emerald-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-emerald-200">
            TeachTino is part of <span className="font-semibold">Schooltino</span> - 
            India's #1 AI-Powered School Management System
          </p>
          <p className="text-sm text-emerald-300 mt-2">
            📞 +91 7879967616 | 🌐 schooltino.in
          </p>
        </div>
      </footer>
    </div>
  );
}
