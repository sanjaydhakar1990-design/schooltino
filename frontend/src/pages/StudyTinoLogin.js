import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import ForgotPassword from '../components/ForgotPassword';
import {
  BookOpen,
  Brain,
  Sparkles,
  Calendar,
  FileText,
  Download,
  Check,
  Loader2,
  Lock,
  Bell,
  Star,
  Smartphone,
  Trophy,
  Target,
  Clock,
  PenTool,
  MessageCircle,
  Lightbulb,
  GraduationCap,
  Users,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudyTinoLogin() {
  const { user, studentLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    studentId: '',
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
    // Redirect if already logged in as student
    if (user && user.role === 'student') {
      navigate('/student-dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await studentLogin(loginForm.studentId, loginForm.password);
      toast.success('Welcome to StudyTino! 📚');
      navigate('/student-dashboard');
    } catch (error) {
      toast.error('Invalid Student ID or Password');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('StudyTino installed! 📱');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      toast.info('Add to Home Screen from browser menu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-800">StudyTino</h1>
              <p className="text-xs text-blue-600">AI Learning Companion</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isInstalled && (
              <Button 
                onClick={handleInstall}
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Schooltino
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Features */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              For Students & Parents
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Your Smart Study
              <span className="block text-blue-600">Buddy is Here! 🎯</span>
            </h2>
            
            <p className="text-lg text-slate-600 mb-8">
              StudyTino helps you track homework, get AI help with studies, 
              see your results, and stay connected with your school.
            </p>

            {/* Feature List */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Brain, title: 'AI Study Helper', desc: 'Get help with any subject' },
                { icon: PenTool, title: 'Homework Tracker', desc: 'Never miss an assignment' },
                { icon: Trophy, title: 'Results & Progress', desc: 'See how you\'re doing' },
                { icon: Calendar, title: 'School Calendar', desc: 'Events & holidays' },
                { icon: Bell, title: 'Instant Notices', desc: 'Stay updated always' },
                { icon: MessageCircle, title: 'Ask Questions', desc: 'AI answers 24/7' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-blue-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{feature.title}</h4>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fun Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-blue-200 text-sm">Happy Students</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">1M+</p>
                  <p className="text-blue-200 text-sm">Questions Solved</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">4.9⭐</p>
                  <p className="text-blue-200 text-sm">Student Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Login Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Student Login</h3>
              <p className="text-slate-500 mt-2">Access your StudyTino dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label className="text-slate-700">Student ID</Label>
                <Input
                  type="text"
                  value={loginForm.studentId}
                  onChange={(e) => setLoginForm({ ...loginForm, studentId: e.target.value })}
                  placeholder="e.g., STD-2026-123456"
                  className="h-12 mt-1 border-blue-200 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Your Student ID is on your ID card
                </p>
              </div>
              
              <div>
                <Label className="text-slate-700">Password</Label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  className="h-12 mt-1 border-blue-200 focus:border-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Login to StudyTino
                  </>
                )}
              </Button>
              
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mt-3"
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
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Smartphone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-blue-800 mb-1">Install StudyTino App</h4>
                <p className="text-sm text-blue-600 mb-3">
                  Study anytime, even offline!
                </p>
                <Button 
                  onClick={handleInstall}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
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

            {/* Parent Note */}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 text-sm">For Parents</h4>
                  <p className="text-xs text-amber-700">
                    Use your child's Student ID to track their progress, attendance, and homework.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Forgot password? Contact your school office.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-blue-200">
            StudyTino is part of <span className="font-semibold">Schooltino</span> - 
            India's #1 AI-Powered School Management System
          </p>
          <p className="text-sm text-blue-300 mt-2">
            📞 +91 7879967616 | 🌐 schooltino.in
          </p>
        </div>
      </footer>
    </div>
  );
}
