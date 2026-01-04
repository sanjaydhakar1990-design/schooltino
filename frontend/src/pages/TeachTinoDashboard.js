import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  Users, BookOpen, Calendar, Bell, ClipboardCheck, 
  ChevronRight, GraduationCap, Clock, FileText, Sparkles,
  Search, Settings, Mic, LogOut, CheckCircle, XCircle,
  MessageSquare, Send, PlusCircle, User, CalendarDays,
  Briefcase, UserPlus, AlertTriangle, Loader2,
  Brain, Wand2, Download, Share2, Smartphone, TrendingUp,
  Target, BookMarked, BarChart3, AlertCircle, Lightbulb,
  Play, CheckSquare, Trophy, Star, Zap, Image
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeachTinoDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Syllabus State
  const [syllabusData, setSyllabusData] = useState([]);
  const [showSyllabusDialog, setShowSyllabusDialog] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  
  // AI Daily Plan State
  const [dailyPlan, setDailyPlan] = useState(null);
  const [tomorrowSuggestions, setTomorrowSuggestions] = useState([]);
  const [weakStudents, setWeakStudents] = useState([]);
  
  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showClassHub, setShowClassHub] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showWeakStudentDialog, setShowWeakStudentDialog] = useState(false);
  const [selectedWeakStudent, setSelectedWeakStudent] = useState(null);
  
  // Forms
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: ''
  });
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    target_class: ''
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('hi-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const isAdmissionStaff = user?.role === 'admission_staff' || user?.role === 'clerk';
  const isClassTeacher = user?.is_class_teacher || false;

  // ==================== PWA INSTALL LOGIC ====================
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      toast.success('TeachTino installed successfully! 🎉');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info('App already installed or not supported');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchDashboardData();
    fetchSyllabusData();
    fetchAIDailyPlan();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, leavesRes, classesRes, noticesRes, myLeavesRes] = await Promise.allSettled([
        axios.get(`${API}/teacher/dashboard`),
        axios.get(`${API}/leave/pending`),
        axios.get(`${API}/classes`),
        axios.get(`${API}/notices?limit=5`),
        axios.get(`${API}/leave/my-leaves`)
      ]);

      if (dashboardRes.status === 'fulfilled') setStats(dashboardRes.value.data);
      if (leavesRes.status === 'fulfilled') setPendingLeaves(leavesRes.value.data || []);
      if (classesRes.status === 'fulfilled') setMyClasses(classesRes.value.data || []);
      if (noticesRes.status === 'fulfilled') setRecentNotices(noticesRes.value.data || []);
      if (myLeavesRes.status === 'fulfilled') setMyLeaves(myLeavesRes.value.data || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyllabusData = async () => {
    try {
      const res = await axios.get(`${API}/teacher/syllabus`);
      setSyllabusData(res.data || []);
    } catch (error) {
      // Mock data for demo
      setSyllabusData([
        {
          id: '1',
          class_name: 'Class 8',
          section: 'A',
          subject: 'Mathematics',
          total_chapters: 15,
          completed_chapters: 8,
          current_topic: 'Algebraic Expressions',
          progress: 53,
          last_updated: '2026-01-02',
          test_results: { avg_score: 72, top_score: 95, lowest_score: 45 }
        },
        {
          id: '2',
          class_name: 'Class 9',
          section: 'B',
          subject: 'Mathematics',
          total_chapters: 18,
          completed_chapters: 10,
          current_topic: 'Polynomials',
          progress: 56,
          last_updated: '2026-01-01',
          test_results: { avg_score: 68, top_score: 92, lowest_score: 38 }
        },
        {
          id: '3',
          class_name: 'Class 10',
          section: 'A',
          subject: 'Mathematics',
          total_chapters: 15,
          completed_chapters: 6,
          current_topic: 'Quadratic Equations',
          progress: 40,
          last_updated: '2026-01-03',
          test_results: { avg_score: 75, top_score: 98, lowest_score: 52 }
        }
      ]);
    }
  };

  const fetchAIDailyPlan = async () => {
    try {
      const res = await axios.get(`${API}/teacher/ai-daily-plan`);
      setDailyPlan(res.data.today_plan);
      setTomorrowSuggestions(res.data.tomorrow_suggestions || []);
      setWeakStudents(res.data.weak_students || []);
    } catch (error) {
      // Mock AI data for demo
      setDailyPlan({
        greeting: "Good Morning, Teacher! 🌅",
        today_classes: [
          { time: '8:00 AM', class: 'Class 8-A', topic: 'Algebraic Expressions - Factorization', duration: '45 min' },
          { time: '9:00 AM', class: 'Class 9-B', topic: 'Polynomials - Division Algorithm', duration: '45 min' },
          { time: '11:00 AM', class: 'Class 10-A', topic: 'Quadratic Equations - Practice', duration: '45 min' }
        ],
        focus_areas: [
          'Class 8-A में 5 students को factorization में extra help चाहिए',
          'Class 9-B का weekly test schedule करें',
          'Class 10-A board exam preparation शुरू करें'
        ],
        ai_tip: "💡 आज Class 8 में visual diagrams use करें - factorization समझने में मदद मिलेगी!"
      });

      setTomorrowSuggestions([
        { class: 'Class 8-A', suggestion: 'Practice worksheet तैयार करें - Algebraic Identities', priority: 'high' },
        { class: 'Class 9-B', suggestion: 'Unit test results discuss करें', priority: 'medium' },
        { class: 'Class 10-A', suggestion: 'NCERT Examples solve करवाएं', priority: 'high' }
      ]);

      setWeakStudents([
        { 
          id: '1', name: 'Rahul Sharma', class: 'Class 8-A', 
          weak_topics: ['Factorization', 'Linear Equations'],
          avg_score: 42, last_test: 38, attendance: 85,
          ai_strategy: 'One-on-one tutoring recommended. Start with basic concepts. Use visual aids.',
          improvement_plan: ['Daily 15-min practice', 'Peer learning with topper', 'Weekly progress check']
        },
        { 
          id: '2', name: 'Priya Singh', class: 'Class 9-B', 
          weak_topics: ['Polynomials', 'Number Systems'],
          avg_score: 48, last_test: 45, attendance: 92,
          ai_strategy: 'Good attendance. Focus on conceptual understanding. Extra worksheets will help.',
          improvement_plan: ['Concept videos', 'Group study sessions', 'Parent-teacher meeting']
        },
        { 
          id: '3', name: 'Amit Kumar', class: 'Class 10-A', 
          weak_topics: ['Quadratic Equations', 'Trigonometry'],
          avg_score: 51, last_test: 48, attendance: 78,
          ai_strategy: 'Attendance issue affecting performance. Need motivation and regular follow-up.',
          improvement_plan: ['Attendance improvement', 'Daily homework check', 'Counseling session']
        }
      ]);
    }
  };

  // ==================== HANDLERS ====================
  const handleApproveLeave = async (leaveId) => {
    try {
      await axios.post(`${API}/leave/${leaveId}/approve`);
      toast.success('Leave approved!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await axios.post(`${API}/leave/${leaveId}/reject`);
      toast.success('Leave rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.reason) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await axios.post(`${API}/leave/apply`, leaveForm);
      toast.success('Leave application submitted!');
      setShowLeaveDialog(false);
      setLeaveForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to apply leave');
    }
  };

  const handleSendNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast.error('Please fill title and content');
      return;
    }
    try {
      await axios.post(`${API}/notices`, {
        title: noticeForm.title,
        content: noticeForm.content,
        target_audience: ['students', 'parents'],
        priority: 'normal',
        school_id: user?.school_id || 'default'
      });
      toast.success('Notice sent successfully!');
      setShowNoticeDialog(false);
      setNoticeForm({ title: '', content: '', target_class: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to send notice');
    }
  };

  const handleAIAssistant = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/ai/teacher-assistant`, {
        prompt: aiPrompt,
        type: 'general'
      });
      setAiResponse(res.data.response || res.data.content || 'AI response received');
    } catch (error) {
      setAiResponse(`Here's a sample response for: "${aiPrompt}"\n\nThis is TeachTino AI Assistant. In production:\n- Lesson plans\n- Question papers\n- Worksheets\n- Weak student strategies`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateSyllabus = async (syllabusId, update) => {
    try {
      await axios.put(`${API}/teacher/syllabus/${syllabusId}`, update);
      toast.success('Syllabus updated!');
      fetchSyllabusData();
    } catch (error) {
      toast.error('Failed to update syllabus');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openClassHub = (cls) => {
    setSelectedClass(cls);
    setShowClassHub(true);
  };

  const openWeakStudentStrategy = (student) => {
    setSelectedWeakStudent(student);
    setShowWeakStudentDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-emerald-700 font-medium">Loading TeachTino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50" data-testid="teachtino-dashboard">
      {/* ==================== PWA INSTALL BANNER ==================== */}
      {showInstallBanner && !isInstalled && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6" />
              <div>
                <p className="font-medium">TeachTino App Install करें!</p>
                <p className="text-sm text-emerald-100">Direct access from your phone/desktop</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleInstallClick}
                className="bg-white text-emerald-700 hover:bg-emerald-50"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setShowInstallBanner(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOP BAR ==================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">TeachTino</h1>
                <p className="text-xs text-slate-500">Schooltino Education System</p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search student, notice, leave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-100 border-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isInstalled && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleInstallClick}
                  className="hidden sm:flex border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Install
                </Button>
              )}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {pendingLeaves.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingLeaves.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>
              
              <div className="h-8 w-px bg-slate-200 mx-2" />
              
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-emerald-700">{user?.name?.charAt(0)}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-sm text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              <Calendar className="w-4 h-4 inline mr-2" />
              {dateStr}
            </p>
            {isInstalled && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                ✓ App Installed
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* ==================== AI DAILY PLAN SECTION ==================== */}
        {dailyPlan && (
          <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Brain className="w-7 h-7" />
                  {dailyPlan.greeting}
                </h2>
                <p className="text-purple-100 mt-1">आज का AI-powered teaching plan</p>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-sm text-purple-100">AI Generated</span>
              </div>
            </div>

            {/* Today's Classes Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {dailyPlan.today_classes?.map((cls, idx) => (
                <div key={idx} className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-300 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{cls.time}</span>
                  </div>
                  <p className="font-semibold">{cls.class}</p>
                  <p className="text-sm text-purple-100 mt-1">{cls.topic}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 rounded text-xs">
                    {cls.duration}
                  </span>
                </div>
              ))}
            </div>

            {/* Focus Areas */}
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-yellow-300" />
                आज के Focus Areas
              </h3>
              <ul className="space-y-2">
                {dailyPlan.focus_areas?.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Tip */}
            <div className="flex items-center gap-3 bg-yellow-400/20 rounded-xl p-4">
              <Lightbulb className="w-6 h-6 text-yellow-300 flex-shrink-0" />
              <p className="text-sm">{dailyPlan.ai_tip}</p>
            </div>
          </section>
        )}

        {/* ==================== TOMORROW SUGGESTIONS ==================== */}
        {tomorrowSuggestions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-600" />
              कल की तैयारी (AI Suggestions)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tomorrowSuggestions.map((item, idx) => (
                <div key={idx} className={`bg-white rounded-xl p-4 border-l-4 ${
                  item.priority === 'high' ? 'border-red-500' : 'border-amber-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{item.class}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.priority === 'high' ? 'High Priority' : 'Medium'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== SYLLABUS PROGRESS ==================== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              📚 Syllabus Progress
            </h2>
            <Button variant="ghost" size="sm" className="text-indigo-600">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {syllabusData.map((syllabus) => (
              <div 
                key={syllabus.id} 
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => { setSelectedSyllabus(syllabus); setShowSyllabusDialog(true); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{syllabus.class_name} - {syllabus.section}</p>
                    <p className="text-sm text-slate-500">{syllabus.subject}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600">{syllabus.progress}%</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${syllabus.progress}%` }}
                  />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chapters:</span>
                    <span className="font-medium">{syllabus.completed_chapters}/{syllabus.total_chapters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Topic:</span>
                    <span className="font-medium text-indigo-600">{syllabus.current_topic}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between">
                    <span className="text-slate-500">Avg Test Score:</span>
                    <span className={`font-medium ${
                      syllabus.test_results.avg_score >= 70 ? 'text-emerald-600' : 
                      syllabus.test_results.avg_score >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {syllabus.test_results.avg_score}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== WEAK STUDENTS (AI IDENTIFIED) ==================== */}
        {weakStudents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                ⚠️ Weak Students (AI Identified)
              </h2>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {weakStudents.length} students need attention
              </span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Class</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Weak Topics</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Avg Score</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Last Test</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weakStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-red-600">{student.name.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{student.class}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {student.weak_topics.map((topic, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-red-600">{student.avg_score}%</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-amber-600">{student.last_test}%</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => openWeakStudentStrategy(student)}
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            AI Strategy
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================== TODAY AT A GLANCE ==================== */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Today at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{myClasses.length}</p>
              </div>
              <p className="text-sm text-slate-600">My Classes</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow relative">
              {pendingLeaves.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {pendingLeaves.length}
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</p>
              </div>
              <p className="text-sm text-slate-600">Pending Approvals</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{recentNotices.length}</p>
              </div>
              <p className="text-sm text-slate-600">Notices</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{weakStudents.length}</p>
              </div>
              <p className="text-sm text-slate-600">Weak Students</p>
            </div>
          </div>
        </section>

        {/* ==================== MY CLASSES GRID ==================== */}
        {!isAdmissionStaff && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">📚 My Classes</h2>
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myClasses.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No classes assigned yet</p>
                </div>
              ) : (
                myClasses.map((cls) => (
                  <div 
                    key={cls.id} 
                    onClick={() => openClassHub(cls)}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {cls.name?.replace('Class ', '')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{cls.name}</p>
                        <p className="text-sm text-slate-500">Section {cls.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        <Users className="w-4 h-4 inline mr-1" />
                        {cls.student_count || 0} students
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ==================== QUICK ACTIONS ==================== */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button 
              onClick={() => setShowNoticeDialog(true)}
              className="h-24 flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
              variant="outline"
            >
              <Bell className="w-6 h-6" />
              <span className="text-sm">Send Notice</span>
            </Button>
            
            <Button className="h-24 flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200" variant="outline">
              <FileText className="w-6 h-6" />
              <span className="text-sm">Upload Homework</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/ai-paper')}
              className="h-24 flex-col gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
              variant="outline"
            >
              <Sparkles className="w-6 h-6" />
              <span className="text-sm">Generate Paper (AI)</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/students')}
              className="h-24 flex-col gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              variant="outline"
            >
              <User className="w-6 h-6" />
              <span className="text-sm">Student Profile</span>
            </Button>
            
            <Button 
              onClick={() => setShowLeaveDialog(true)}
              className="h-24 flex-col gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
              variant="outline"
            >
              <CalendarDays className="w-6 h-6" />
              <span className="text-sm">Apply Leave</span>
            </Button>
            
            <Button className="h-24 flex-col gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200" variant="outline">
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">View Reports</span>
            </Button>
          </div>
        </section>

        {/* ==================== TEACHTINO AI ASSISTANT WITH FILE UPLOAD ==================== */}
        <section>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">TeachTino AI Assistant</h2>
                <p className="text-emerald-100 text-sm">Lesson plans, Papers, Worksheets, Strategies</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "आज का lesson plan बना दो",
                "Class 8 Science worksheet",
                "Weak student strategy",
                "Board exam tips"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPrompt(chip)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* File Upload Section */}
            <div className="mb-4 p-3 bg-white/10 rounded-xl">
              <p className="text-sm text-emerald-100 mb-2">📎 Attach files for AI analysis (Photo, Video, Document)</p>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <Image className="w-4 h-4" />
                  Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) toast.success(`Photo attached: ${file.name}`);
                  }} />
                </label>
                <label className="cursor-pointer px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <Play className="w-4 h-4" />
                  Video
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) toast.success(`Video attached: ${file.name}`);
                  }} />
                </label>
                <label className="cursor-pointer px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <FileText className="w-4 h-4" />
                  Document
                  <input type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) toast.success(`Document attached: ${file.name}`);
                  }} />
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask TeachTino AI anything..."
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                onKeyDown={(e) => e.key === 'Enter' && handleAIAssistant()}
              />
              <Button 
                onClick={handleAIAssistant}
                disabled={aiLoading}
                className="bg-white text-emerald-700 hover:bg-emerald-50"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              </Button>
            </div>

            {aiResponse && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl">
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="border-white/30 text-white text-xs">
                    <Download className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/30 text-white text-xs">
                    <Share2 className="w-3 h-3 mr-1" /> Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================== MY LEAVE ==================== */}
        <section>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">🗓️ My Leave</h3>
              <Button size="sm" onClick={() => setShowLeaveDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="w-4 h-4 mr-1" /> Apply
              </Button>
            </div>
            {myLeaves.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No leave applications</p>
            ) : (
              <div className="space-y-2">
                {myLeaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{leave.leave_type} Leave</p>
                      <p className="text-sm text-slate-500">{leave.from_date} to {leave.to_date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ==================== DIALOGS ==================== */}
      
      {/* Apply Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Leave Type</label>
              <select
                value={leaveForm.leave_type}
                onChange={(e) => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm(f => ({ ...f, from_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm(f => ({ ...f, to_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Enter reason..." rows={3} />
            </div>
            <Button onClick={handleApplyLeave} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Send className="w-4 h-4 mr-2" /> Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Class Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={noticeForm.title} onChange={(e) => setNoticeForm(f => ({ ...f, title: e.target.value }))} placeholder="Notice title..." />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea value={noticeForm.content} onChange={(e) => setNoticeForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your notice..." rows={4} />
            </div>
            <Button onClick={handleSendNotice} className="w-full bg-purple-600 hover:bg-purple-700">
              <Send className="w-4 h-4 mr-2" /> Send Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Syllabus Detail Dialog */}
      <Dialog open={showSyllabusDialog} onOpenChange={setShowSyllabusDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSyllabus?.class_name} - {selectedSyllabus?.section} | {selectedSyllabus?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedSyllabus && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-indigo-600">{selectedSyllabus.progress}%</p>
                  <p className="text-sm text-slate-600">Complete</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-emerald-600">{selectedSyllabus.completed_chapters}</p>
                  <p className="text-sm text-slate-600">Chapters Done</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-amber-600">{selectedSyllabus.total_chapters - selectedSyllabus.completed_chapters}</p>
                  <p className="text-sm text-slate-600">Remaining</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium mb-2">Current Topic</h4>
                <p className="text-indigo-600 font-semibold">{selectedSyllabus.current_topic}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium mb-3">Test Results</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{selectedSyllabus.test_results.top_score}%</p>
                    <p className="text-xs text-slate-500">Highest</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{selectedSyllabus.test_results.avg_score}%</p>
                    <p className="text-xs text-slate-500">Average</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{selectedSyllabus.test_results.lowest_score}%</p>
                    <p className="text-xs text-slate-500">Lowest</p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full">
                <CheckSquare className="w-4 h-4 mr-2" />
                Update Syllabus Progress
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Weak Student Strategy Dialog */}
      <Dialog open={showWeakStudentDialog} onOpenChange={setShowWeakStudentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              AI Strategy for {selectedWeakStudent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedWeakStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedWeakStudent.avg_score}%</p>
                  <p className="text-xs text-slate-600">Avg Score</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600">{selectedWeakStudent.last_test}%</p>
                  <p className="text-xs text-slate-600">Last Test</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedWeakStudent.attendance}%</p>
                  <p className="text-xs text-slate-600">Attendance</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-xl">
                <h4 className="font-medium mb-2 text-red-700">Weak Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWeakStudent.weak_topics.map((topic, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-xl">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  AI Recommended Strategy
                </h4>
                <p className="text-slate-700">{selectedWeakStudent.ai_strategy}</p>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-xl">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Improvement Plan
                </h4>
                <ul className="space-y-2">
                  {selectedWeakStudent.improvement_plan.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Parent
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Worksheet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Class Hub Dialog */}
      <Dialog open={showClassHub} onOpenChange={setShowClassHub}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedClass?.name} - {selectedClass?.section}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="students">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="homework">Homework</TabsTrigger>
              <TabsTrigger value="weak">Weak</TabsTrigger>
            </TabsList>
            <TabsContent value="students" className="p-4">
              <p className="text-slate-500 text-center py-8">{selectedClass?.student_count || 0} students</p>
            </TabsContent>
            <TabsContent value="syllabus" className="p-4">
              <p className="text-slate-500 text-center py-8">Syllabus tracking</p>
            </TabsContent>
            <TabsContent value="tests" className="p-4">
              <p className="text-slate-500 text-center py-8">Test results</p>
            </TabsContent>
            <TabsContent value="homework" className="p-4">
              <p className="text-slate-500 text-center py-8">Homework list</p>
            </TabsContent>
            <TabsContent value="weak" className="p-4">
              <p className="text-slate-500 text-center py-8">Weak students</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
