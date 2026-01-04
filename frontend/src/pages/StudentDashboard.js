import { useState, useEffect } from 'react';
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
  User, Calendar, Bell, BookOpen, Clock, CheckCircle, XCircle,
  Download, LogOut, School, ChevronRight, ChevronDown, Search,
  Settings, FileText, CalendarDays, AlertTriangle, Loader2,
  Brain, Wand2, Smartphone, Send, PlusCircle, MessageSquare,
  Home, Paperclip, Eye, Archive, AlertCircle, Phone, 
  ChevronLeft, Star, Sparkles, BookMarked, ClipboardList,
  Users, Lock, UserPlus, Check, CreditCard, Wallet
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudyTinoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [leaveStatus, setLeaveStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  
  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Parent Mode - Multiple Children
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [isParentMode, setIsParentMode] = useState(false);
  
  // Dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showHomeworkDialog, setShowHomeworkDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  
  // Selected items
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedHomework, setSelectedHomework] = useState(null);
  
  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    from_date: '',
    to_date: '',
    reason: '',
    half_day: false
  });
  
  // AI Helper
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Blocked Account State
  const [isBlocked, setIsBlocked] = useState(false);
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('hi-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long'
  });

  // ==================== PWA INSTALL ====================
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      toast.success('StudyTino installed! 🎉');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info('App already installed');
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
  }, [selectedChild]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const studentId = selectedChild?.id || user?.student_id;
      
      const [dashboardRes, noticesRes, homeworkRes, leavesRes] = await Promise.allSettled([
        axios.get(`${API}/student/dashboard`),
        axios.get(`${API}/student/notices`),
        axios.get(`${API}/student/homework`),
        axios.get(`${API}/student/leaves`)
      ]);

      if (dashboardRes.status === 'fulfilled') {
        const data = dashboardRes.value.data;
        setProfile(data.profile);
        if (data.profile?.status === 'blocked' || data.profile?.status === 'suspended') {
          setIsBlocked(true);
        }
      }
      
      if (noticesRes.status === 'fulfilled') {
        setNotices(noticesRes.value.data || []);
      } else {
        // Mock notices
        setNotices([
          {
            id: '1',
            title: 'Winter Break Announcement',
            content: 'School will remain closed from 25th Dec to 1st Jan for winter holidays.',
            posted_by: 'Principal',
            priority: 'high',
            valid_till: '2026-01-01',
            created_at: '2026-01-02',
            audience: 'All',
            has_attachment: true,
            is_read: false
          },
          {
            id: '2',
            title: 'Annual Sports Day',
            content: 'Annual sports day will be held on 15th January. All students must participate.',
            posted_by: 'Director',
            priority: 'normal',
            valid_till: '2026-01-15',
            created_at: '2026-01-01',
            audience: 'All',
            has_attachment: false,
            is_read: true
          },
          {
            id: '3',
            title: 'Class 8 PTM Notice',
            content: 'Parent-Teacher Meeting for Class 8 on 10th January at 10 AM.',
            posted_by: 'Class Teacher',
            priority: 'normal',
            valid_till: '2026-01-10',
            created_at: '2025-12-30',
            audience: 'Class 8',
            has_attachment: false,
            is_read: false
          }
        ]);
      }

      if (homeworkRes.status === 'fulfilled') {
        setHomework(homeworkRes.value.data || []);
      } else {
        // Mock homework
        setHomework([
          {
            id: '1',
            subject: 'Mathematics',
            topic: 'Algebraic Expressions - Exercise 5.3',
            teacher: 'Mrs. Sharma',
            due_date: '2026-01-04',
            status: 'pending',
            description: 'Complete all questions from Exercise 5.3 (Q1-Q15)',
            attachment_url: null
          },
          {
            id: '2',
            subject: 'English',
            topic: 'Essay Writing - My School',
            teacher: 'Mr. Verma',
            due_date: '2026-01-05',
            status: 'pending',
            description: 'Write a 300-word essay on "My School Life"',
            attachment_url: null
          },
          {
            id: '3',
            subject: 'Science',
            topic: 'Chapter 7 - Light Reflection',
            teacher: 'Mrs. Gupta',
            due_date: '2026-01-03',
            status: 'submitted',
            description: 'Read chapter and answer back exercise questions',
            attachment_url: null
          }
        ]);
      }

      if (leavesRes.status === 'fulfilled') {
        const leaves = leavesRes.value.data || [];
        const pending = leaves.find(l => l.status === 'pending');
        setLeaveStatus(pending ? 'pending' : (leaves.length > 0 ? leaves[0].status : 'no_leave'));
      } else {
        setLeaveStatus('no_leave');
      }

      // Mock alerts
      setAlerts([
        { id: '1', type: 'exam', message: 'Unit Test tomorrow - Mathematics', priority: 'high' }
      ]);

      // Fetch Syllabus and Exams
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch syllabus based on school's board
        const syllabusBoard = user?.school_board || 'NCERT'; // Default to NCERT
        const classNum = user?.class_name?.replace(/[^0-9]/g, '') || '10';
        
        const [syllabusRes, examsRes] = await Promise.allSettled([
          axios.get(`${API}/syllabus/${syllabusBoard}/syllabus/${classNum}`),
          axios.get(`${API}/exams`, { headers })
        ]);

        if (syllabusRes.status === 'fulfilled' && syllabusRes.value.data.subjects) {
          const subjects = syllabusRes.value.data.subjects;
          const syllabusProgress = Object.entries(subjects).map(([subject, data]) => ({
            subject,
            book: data.book,
            total_chapters: data.chapters?.length || 0,
            completed_chapters: Math.floor((data.chapters?.length || 0) * 0.4), // Mock progress
            current_chapter: data.chapters?.[Math.floor((data.chapters?.length || 0) * 0.4)]?.name || 'Chapter 1',
            chapters: data.chapters?.slice(0, 5) || []
          }));
          setSyllabus(syllabusProgress);
        } else {
          // Fallback mock syllabus
          setSyllabus([
            { subject: 'Mathematics', book: 'गणित - 10', total_chapters: 15, completed_chapters: 6, current_chapter: 'Quadratic Equations' },
            { subject: 'Science', book: 'विज्ञान - 10', total_chapters: 16, completed_chapters: 7, current_chapter: 'Control and Coordination' },
            { subject: 'Hindi', book: 'क्षितिज भाग-2', total_chapters: 17, completed_chapters: 8, current_chapter: 'नेताजी का चश्मा' },
            { subject: 'English', book: 'First Flight', total_chapters: 11, completed_chapters: 5, current_chapter: 'The Hundred Dresses' },
            { subject: 'Social Science', book: 'सामाजिक विज्ञान', total_chapters: 23, completed_chapters: 10, current_chapter: 'Federalism' }
          ]);
        }

        if (examsRes.status === 'fulfilled') {
          const exams = examsRes.value.data || [];
          // Filter upcoming exams (not yet attempted)
          const upcoming = exams.filter(e => !e.already_attempted).slice(0, 3);
          setUpcomingExams(upcoming);
        } else {
          setUpcomingExams([]);
        }
      } catch (syllabusError) {
        console.log('Syllabus fetch fallback');
        setSyllabus([
          { subject: 'Mathematics', total_chapters: 15, completed_chapters: 6, current_chapter: 'Quadratic Equations' },
          { subject: 'Science', total_chapters: 16, completed_chapters: 7, current_chapter: 'Control and Coordination' }
        ]);
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HANDLERS ====================
  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.reason) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await axios.post(`${API}/student/leaves`, leaveForm);
      toast.success('Leave application submitted!');
      setShowLeaveDialog(false);
      setLeaveForm({ leave_type: 'sick', from_date: '', to_date: '', reason: '', half_day: false });
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to apply leave');
    }
  };

  const handleMarkNoticeRead = async (noticeId) => {
    try {
      await axios.post(`${API}/student/notices/${noticeId}/read`);
      setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, is_read: true } : n));
    } catch (error) {
      // Silently fail
    }
  };

  const handleAIHelper = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/student/ai-helper`, { prompt: aiPrompt });
      setAiResponse(res.data.response);
    } catch (error) {
      // Safe study assistant mock
      setAiResponse(`📚 StudyTino AI Helper:\n\n"${aiPrompt}" ke baare mein:\n\nYeh ek important topic hai! Main aapko simple Hindi mein samjhata hoon:\n\n1. Pehle basic concepts clear karo\n2. Examples se practice karo\n3. Daily revision important hai\n\n💡 Tip: Chapter ko 2-3 baar padhne se concept clear ho jayega!\n\nKoi aur doubt hai toh zaroor pucho! 📖`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openNotice = (notice) => {
    setSelectedNotice(notice);
    setShowNoticeDialog(true);
    if (!notice.is_read) handleMarkNoticeRead(notice.id);
  };

  const openHomework = (hw) => {
    setSelectedHomework(hw);
    setShowHomeworkDialog(true);
  };

  // Calculate stats
  const unreadNotices = notices.filter(n => !n.is_read).length;
  const pendingHomework = homework.filter(h => h.status === 'pending').length;
  const todayHomework = homework.filter(h => {
    const due = new Date(h.due_date);
    return due.toDateString() === today.toDateString() && h.status === 'pending';
  });
  const weekHomework = homework.filter(h => {
    const due = new Date(h.due_date);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return due <= weekEnd && h.status === 'pending';
  });

  // 7-day calendar
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return {
      date,
      day: date.toLocaleDateString('hi-IN', { weekday: 'short' }),
      dateNum: date.getDate(),
      isToday: i === 0,
      hasNotice: notices.some(n => new Date(n.created_at).toDateString() === date.toDateString()),
      hasHomework: homework.some(h => new Date(h.due_date).toDateString() === date.toDateString())
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto" />
          <p className="mt-4 text-amber-700 font-medium">Loading StudyTino...</p>
        </div>
      </div>
    );
  }

  // ==================== BLOCKED ACCOUNT VIEW ====================
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Access Blocked</h1>
          <p className="text-slate-600 mb-6">
            Your account access has been restricted. Please contact the school office for assistance.
          </p>
          <div className="flex flex-col gap-3">
            <Button className="w-full bg-amber-600 hover:bg-amber-700">
              <Phone className="w-4 h-4 mr-2" />
              Contact Office
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50" data-testid="studytino-dashboard">
      {/* ==================== PWA INSTALL BANNER ==================== */}
      {showInstallBanner && !isInstalled && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6" />
              <div>
                <p className="font-medium text-sm">StudyTino App Install करें!</p>
                <p className="text-xs text-amber-100">Direct phone se access</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleInstallClick}
                className="bg-white text-amber-700 hover:bg-amber-50"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
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
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-amber-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-slate-900">
                    {profile?.name || 'Student'} 
                  </h1>
                  <span className="text-sm text-slate-500">| {profile?.class_name || 'Class'}</span>
                </div>
                {/* Parent Mode Child Selector */}
                {isParentMode && children.length > 1 && (
                  <button 
                    onClick={() => setShowChildSelector(true)}
                    className="text-xs text-amber-600 flex items-center gap-1"
                  >
                    Switch Child <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isInstalled && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleInstallClick}
                  className="text-amber-600"
                >
                  <Download className="w-5 h-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadNotices > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotices}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileDialog(true)}>
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
        {/* ==================== IMPORTANT ALERT (if exists) ==================== */}
        {alerts.length > 0 && alerts[0].priority === 'high' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">{alerts[0].message}</p>
              <p className="text-sm text-red-600 mt-1">⚠️ Important Alert</p>
            </div>
          </div>
        )}

        {/* ==================== SECTION A: TODAY AT A GLANCE ==================== */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {dateStr}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {/* New Notices */}
            <div 
              onClick={() => navigate('/student/notices')}
              className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer relative"
            >
              {unreadNotices > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotices}
                </span>
              )}
              <Bell className="w-6 h-6 text-purple-500 mb-2" />
              <p className="text-lg font-bold text-slate-900">{notices.length}</p>
              <p className="text-xs text-slate-500">Notices</p>
            </div>

            {/* Homework Pending */}
            <div 
              onClick={() => setShowHomeworkDialog(true)}
              className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer relative"
            >
              {pendingHomework > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingHomework}
                </span>
              )}
              <BookOpen className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-lg font-bold text-slate-900">{pendingHomework}</p>
              <p className="text-xs text-slate-500">Homework</p>
            </div>

            {/* Leave Status */}
            <div 
              onClick={() => navigate('/student/leaves')}
              className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all cursor-pointer"
            >
              <CalendarDays className="w-6 h-6 text-emerald-500 mb-2" />
              <p className={`text-sm font-bold ${
                leaveStatus === 'pending' ? 'text-amber-600' :
                leaveStatus === 'approved' ? 'text-emerald-600' :
                'text-slate-600'
              }`}>
                {leaveStatus === 'pending' ? 'Pending' :
                 leaveStatus === 'approved' ? 'Approved' :
                 leaveStatus === 'rejected' ? 'Rejected' :
                 'No Leave'}
              </p>
              <p className="text-xs text-slate-500">Leave</p>
            </div>
          </div>
        </section>

        {/* ==================== ONLINE EXAMS SECTION ==================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">📝 Online Exams</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-indigo-600"
              onClick={() => navigate('/app/exams')}
            >
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div 
            onClick={() => navigate('/app/exams')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Take Online Exam</p>
                  <p className="text-sm text-white/80">Computer lab mein exam do</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* ==================== SYLLABUS PROGRESS SECTION ==================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">📖 Syllabus Progress</h2>
            <span className="text-xs text-slate-500">
              Board: {user?.school_board || 'NCERT'}
            </span>
          </div>
          
          {syllabus.length > 0 ? (
            <div className="space-y-3">
              {syllabus.slice(0, 4).map((subject, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                        idx === 0 ? 'bg-blue-500' : 
                        idx === 1 ? 'bg-emerald-500' : 
                        idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                      }`}>
                        {subject.subject?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{subject.subject}</p>
                        <p className="text-xs text-slate-400">{subject.book}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {subject.completed_chapters}/{subject.total_chapters}
                      </p>
                      <p className="text-xs text-slate-400">chapters</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        idx === 0 ? 'bg-blue-500' : 
                        idx === 1 ? 'bg-emerald-500' : 
                        idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(subject.completed_chapters / subject.total_chapters) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      📍 Current: <span className="font-medium text-slate-700">{subject.current_chapter}</span>
                    </p>
                    <span className="text-xs text-emerald-600 font-medium">
                      {Math.round((subject.completed_chapters / subject.total_chapters) * 100)}% done
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Syllabus loading...</p>
            </div>
          )}
        </section>

        {/* ==================== UPCOMING EXAMS SECTION ==================== */}
        {upcomingExams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">📝 Upcoming Online Tests</h2>
            </div>
            <div className="space-y-2">
              {upcomingExams.map((exam) => (
                <div 
                  key={exam.id}
                  onClick={() => navigate('/app/exams')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{exam.title}</p>
                      <p className="text-sm text-white/80">{exam.subject} • {exam.duration} min • {exam.total_marks} marks</p>
                    </div>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== SECTION B: LATEST NOTICE (Big Card) ==================== */}
        {notices.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">📢 Latest Notice</h2>
            </div>
            <div 
              onClick={() => openNotice(notices[0])}
              className={`bg-white rounded-xl border-2 ${
                notices[0].priority === 'high' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
              } p-4 cursor-pointer hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!notices[0].is_read && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                    {notices[0].audience}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Valid till: {new Date(notices[0].valid_till).toLocaleDateString('hi-IN')}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{notices[0].title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2 mb-3">{notices[0].content}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">By: {notices[0].posted_by}</span>
                <div className="flex gap-2">
                  {notices[0].has_attachment && (
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  )}
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs h-7">
                    <Eye className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== SECTION C: HOMEWORK ==================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">📚 Homework</h2>
            <Button variant="ghost" size="sm" className="text-amber-600 text-xs">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-slate-100 rounded-none">
                <TabsTrigger value="today" className="text-sm">
                  Today ({todayHomework.length})
                </TabsTrigger>
                <TabsTrigger value="week" className="text-sm">
                  This Week ({weekHomework.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="p-0">
                {todayHomework.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                    <p className="text-sm">No homework due today! 🎉</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todayHomework.map(hw => (
                      <div 
                        key={hw.id} 
                        onClick={() => openHomework(hw)}
                        className="p-4 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{hw.subject}</p>
                            <p className="text-sm text-slate-600">{hw.topic}</p>
                            <p className="text-xs text-slate-400 mt-1">{hw.teacher}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            hw.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {hw.status === 'pending' ? 'Pending' : 'Done'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="week" className="p-0">
                {weekHomework.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                    <p className="text-sm">All homework complete! 🌟</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {weekHomework.map(hw => (
                      <div 
                        key={hw.id}
                        onClick={() => openHomework(hw)}
                        className="p-4 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{hw.subject}</p>
                            <p className="text-sm text-slate-600">{hw.topic}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">{hw.teacher}</span>
                              <span className="text-xs text-red-500">
                                Due: {new Date(hw.due_date).toLocaleDateString('hi-IN')}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            hw.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {hw.status === 'pending' ? 'Pending' : 'Done'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* ==================== SECTION D: QUICK ACTIONS ==================== */}
        <section>
          <h2 className="font-semibold text-slate-800 mb-3">⚡ Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Fee Pay Button - Prominent */}
            <Button 
              onClick={() => navigate('/fee-payment')}
              className="h-20 flex-col gap-1 bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
              data-testid="fee-pay-button"
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-semibold">Fee Pay 💳</span>
            </Button>
            
            <Button 
              onClick={() => setShowLeaveDialog(true)}
              className="h-20 flex-col gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
              variant="outline"
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-xs">Apply Leave</span>
            </Button>
            
            <Button 
              className="h-20 flex-col gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
              variant="outline"
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-xs">My Leaves</span>
            </Button>
            
            <Button 
              className="h-20 flex-col gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              variant="outline"
            >
              <Bell className="w-5 h-5" />
              <span className="text-xs">All Notices</span>
            </Button>
            
            <Button 
              className="h-20 flex-col gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
              variant="outline"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Homework</span>
            </Button>
            
            <Button 
              className="h-20 flex-col gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              variant="outline"
            >
              <Phone className="w-5 h-5" />
              <span className="text-xs">Contact</span>
            </Button>
          </div>
        </section>

        {/* ==================== SECTION E: CALENDAR STRIP ==================== */}
        <section>
          <h2 className="font-semibold text-slate-800 mb-3">📅 This Week</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex justify-between">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${
                    day.isToday ? 'bg-amber-500 text-white' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{day.day}</span>
                  <span className={`text-lg font-bold ${day.isToday ? '' : 'text-slate-900'}`}>
                    {day.dateNum}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {day.hasNotice && (
                      <span className={`w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-white' : 'bg-purple-500'}`} />
                    )}
                    {day.hasHomework && (
                      <span className={`w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-white' : 'bg-blue-500'}`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Notice
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Homework
              </span>
            </div>
          </div>
        </section>

        {/* ==================== SECTION F: STUDYTINO AI HELPER ==================== */}
        <section>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold">StudyTino AI Helper</h2>
                <p className="text-amber-100 text-xs">Safe study assistant</p>
              </div>
            </div>
            
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "Is homework ko samjhao",
                "Topic easy Hindi me",
                "5 MCQ practice"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => { setAiPrompt(chip); setShowAIHelper(true); }}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <Button 
              onClick={() => setShowAIHelper(true)}
              className="w-full bg-white text-amber-700 hover:bg-amber-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask StudyTino AI
            </Button>
          </div>
        </section>
      </main>

      {/* ==================== DIALOGS ==================== */}

      {/* Apply Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-rose-500" />
              Apply for Leave
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Leave Type</label>
              <select
                value={leaveForm.leave_type}
                onChange={(e) => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
              >
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input 
                  type="date" 
                  value={leaveForm.from_date} 
                  onChange={(e) => setLeaveForm(f => ({ ...f, from_date: e.target.value }))} 
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input 
                  type="date" 
                  value={leaveForm.to_date} 
                  onChange={(e) => setLeaveForm(f => ({ ...f, to_date: e.target.value }))} 
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="half_day"
                checked={leaveForm.half_day}
                onChange={(e) => setLeaveForm(f => ({ ...f, half_day: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="half_day" className="text-sm">Half Day Leave</label>
            </div>
            
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea 
                value={leaveForm.reason} 
                onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))} 
                placeholder="Leave reason likhein..." 
                rows={3} 
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Attachment (Optional)</label>
              <Input type="file" className="mt-1" />
            </div>
            
            <Button onClick={handleApplyLeave} className="w-full bg-rose-600 hover:bg-rose-700">
              <Send className="w-4 h-4 mr-2" />
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Detail Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📢 Notice Details</DialogTitle>
          </DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-slate-100 rounded text-xs">{selectedNotice.audience}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedNotice.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedNotice.priority === 'high' ? 'Important' : 'Normal'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedNotice.title}</h3>
              <p className="text-slate-600">{selectedNotice.content}</p>
              <div className="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-500">
                <p>Posted by: {selectedNotice.posted_by}</p>
                <p>Posted: {new Date(selectedNotice.created_at).toLocaleDateString('hi-IN')}</p>
                <p>Valid till: {new Date(selectedNotice.valid_till).toLocaleDateString('hi-IN')}</p>
              </div>
              {selectedNotice.has_attachment && (
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Attachment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Homework Detail Dialog */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📚 Homework Details</DialogTitle>
          </DialogHeader>
          {selectedHomework && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {selectedHomework.subject}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedHomework.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedHomework.status === 'pending' ? 'Pending' : 'Submitted'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedHomework.topic}</h3>
              <p className="text-slate-600">{selectedHomework.description}</p>
              <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
                <p><span className="text-slate-500">Teacher:</span> {selectedHomework.teacher}</p>
                <p><span className="text-slate-500">Due Date:</span> <span className="text-red-600 font-medium">{new Date(selectedHomework.due_date).toLocaleDateString('hi-IN')}</span></p>
              </div>
              {selectedHomework.attachment_url && (
                <Button variant="outline" className="w-full">
                  <Paperclip className="w-4 h-4 mr-2" />
                  View Attachment
                </Button>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={() => { setAiPrompt(`"${selectedHomework.topic}" samjhao`); setShowAIHelper(true); setShowHomeworkDialog(false); }}
                  variant="outline" 
                  className="flex-1"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Ask AI
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-4 h-4 mr-2" />
                  Mark Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>👤 My Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-lg">{profile?.name || 'Student'}</p>
                <p className="text-sm text-slate-500">{profile?.class_name} - {profile?.section}</p>
              </div>
            </div>
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Student ID</span>
                <span className="text-sm font-medium">{profile?.student_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Admission No</span>
                <span className="text-sm font-medium">{profile?.admission_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Father Name</span>
                <span className="text-sm font-medium">{profile?.father_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Contact</span>
                <span className="text-sm font-medium">{profile?.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <span className="text-sm font-medium text-emerald-600">Active</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => { setShowProfileDialog(false); setShowPasswordDialog(true); }}
            >
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔐 Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <Input type="password" placeholder="Current password" />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="New password" />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700">
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Helper Dialog */}
      <Dialog open={showAIHelper} onOpenChange={setShowAIHelper}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              StudyTino AI Helper
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Safe study assistant - sirf study related help. Ask questions in Hindi or English!
            </p>
            <div className="flex gap-2">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Apna doubt pucho..."
                onKeyDown={(e) => e.key === 'Enter' && handleAIHelper()}
              />
              <Button 
                onClick={handleAIHelper}
                disabled={aiLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </Button>
            </div>
            {aiResponse && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {[
                "Algebra easy me samjhao",
                "5 MCQ banao",
                "Summary likho"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPrompt(chip)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
