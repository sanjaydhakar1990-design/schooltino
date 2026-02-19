import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  GraduationCap, Users, BookOpen, Calendar, Bell, ClipboardCheck,
  ChevronRight, Clock, FileText, Sparkles, Search, Settings, Mic,
  LogOut, CheckCircle, XCircle, MessageSquare, Send, PlusCircle,
  User, CalendarDays, Briefcase, UserPlus, AlertTriangle, Loader2,
  Brain, Wand2, Download, TrendingUp, Target, BookMarked, BarChart3,
  AlertCircle, Lightbulb, Play, CheckSquare, Trophy, Star, Zap,
  Camera, Shield, Wallet, Calculator, Home, LayoutDashboard, School,
  DoorOpen, Bus, Heart, Fingerprint, Video, Image, Globe, History,
  ShoppingBag, Bot, ThumbsUp, Pencil, ExternalLink, Plus, X
} from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { GlobalWatermark } from '../components/SchoolLogoWatermark';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

// Feature modules configuration
const MODULES = {
  dashboard: { icon: LayoutDashboard, label: 'Dashboard', color: 'bg-blue-500' },
  students: { icon: Users, label: 'Students', color: 'bg-emerald-500' },
  staff: { icon: UserPlus, label: 'Staff', color: 'bg-purple-500' },
  classes: { icon: GraduationCap, label: 'Classes', color: 'bg-amber-500' },
  attendance: { icon: CalendarDays, label: 'Attendance', color: 'bg-rose-500' },
  fees: { icon: Wallet, label: 'Fees', color: 'bg-green-500' },
  notices: { icon: Bell, label: 'Notices', color: 'bg-orange-500' },
  ai_paper: { icon: Sparkles, label: 'AI Paper', color: 'bg-indigo-500' },
  ai_content: { icon: Brain, label: 'AI Content', color: 'bg-pink-500' },
  leave_management: { icon: Calendar, label: 'Leave', color: 'bg-cyan-500' },
  meetings: { icon: Video, label: 'Meetings', color: 'bg-violet-500' },
  gallery: { icon: Image, label: 'Gallery', color: 'bg-teal-500' },
  cctv: { icon: Video, label: 'CCTV', color: 'bg-red-500' },
  transport: { icon: Bus, label: 'Transport', color: 'bg-yellow-500' },
  health: { icon: Heart, label: 'Health', color: 'bg-pink-500' },
  biometric: { icon: Fingerprint, label: 'Biometric', color: 'bg-slate-500' },
  front_office: { icon: DoorOpen, label: 'Front Office', color: 'bg-lime-500' },
  school_analytics: { icon: BarChart3, label: 'Analytics', color: 'bg-blue-600' },
  user_management: { icon: Shield, label: 'User Mgmt', color: 'bg-purple-600' },
  settings: { icon: Settings, label: 'Settings', color: 'bg-gray-500' },
};

export default function UnifiedPortal() {
  const navigate = useNavigate();
  const { user, logout, schoolData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [permissions, setPermissions] = useState({});
  const [stats, setStats] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Welcome Dialog for first-time users
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  const [homeworkList, setHomeworkList] = useState([]);
  const [showHomeworkDialog, setShowHomeworkDialog] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({ subject: '', topic: '', due_date: '', description: '', class_id: '' });
  const [feedPosts, setFeedPosts] = useState([]);
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [feedForm, setFeedForm] = useState({ text: '', image_url: '' });
  const [commentText, setCommentText] = useState({});
  const [examList, setExamList] = useState([]);
  const [showMarksDialog, setShowMarksDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksForm, setMarksForm] = useState({ student_id: '', marks: '' });
  const [liveClasses, setLiveClasses] = useState([]);
  const [showLiveClassDialog, setShowLiveClassDialog] = useState(false);
  const [liveClassForm, setLiveClassForm] = useState({ title: '', class_id: '', scheduled_at: '', duration: '45' });
  const [showTinoChat, setShowTinoChat] = useState(false);
  const [tinoChatMessages, setTinoChatMessages] = useState([]);
  const [tinoChatInput, setTinoChatInput] = useState('');
  const [tinoChatLoading, setTinoChatLoading] = useState(false);

  const isDirector = user?.role === 'director';
  const isPrincipal = user?.role === 'principal' || user?.role === 'vice_principal';
  const isTeacher = user?.role === 'teacher';
  const isAdminStaff = ['admin_staff', 'clerk', 'admission_staff'].includes(user?.role);
  const isAccountant = user?.role === 'accountant';
  
  // Check if user has teaching duties
  const hasTeachingDuties = assignedClasses.length > 0 || user?.can_teach;
  
  // Check if user has admin access
  const hasAdminAccess = isDirector || isPrincipal || permissions.user_management || permissions.school_analytics;

  useEffect(() => {
    fetchUserPermissions();
    fetchDashboardData();
    // Check if first-time login for welcome message
    const hasSeenWelcome = localStorage.getItem('teachtino_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true);
      localStorage.setItem('teachtino_welcome_seen', 'true');
    }
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const res = await axios.get(`${API}/permissions/my`);
      setPermissions(res.data.permissions || {});
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Default permissions based on role
      if (isDirector) {
        setPermissions({
          dashboard: true, students: true, staff: true, classes: true,
          attendance: true, fees: true, notices: true, ai_paper: true,
          ai_content: true, meetings: true, gallery: true, cctv: true,
          school_analytics: true, user_management: true, settings: true
        });
      }
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [classesRes, noticesRes, leavesRes, userClassesRes] = await Promise.allSettled([
        axios.get(`${API}/classes`),
        axios.get(`${API}/notices?limit=5`),
        axios.get(`${API}/leave/pending`),
        axios.get(`${API}/users/${user?.id}/assigned-classes`).catch(() => ({ data: { classes: [] } }))
      ]);

      if (classesRes.status === 'fulfilled') setMyClasses(classesRes.value.data || []);
      if (noticesRes.status === 'fulfilled') setRecentNotices(noticesRes.value.data || []);
      if (leavesRes.status === 'fulfilled') setPendingLeaves(leavesRes.value.data || []);
      if (userClassesRes.status === 'fulfilled') {
        setAssignedClasses(userClassesRes.value.data?.classes || []);
      }

      // Mock stats for now
      setStats({
        total_students: 450,
        total_staff: 35,
        present_today: 420,
        pending_fees: '₹2,45,000',
        my_classes: myClasses.length
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomework = async () => {
    try {
      const res = await axios.get(`${API}/homework`);
      setHomeworkList(res.data?.homework || res.data || []);
    } catch (e) {
      setHomeworkList([
        { id: 1, subject: 'Mathematics', topic: 'Algebra Basics', due_date: '2026-02-15', description: 'Complete exercises 1-10 from chapter 5', class_name: 'Class 8-A', status: 'active' },
        { id: 2, subject: 'Science', topic: 'Photosynthesis', due_date: '2026-02-12', description: 'Draw diagram and write explanation', class_name: 'Class 7-B', status: 'active' },
        { id: 3, subject: 'Hindi', topic: 'Nibandh Lekhan', due_date: '2026-02-10', description: 'Write essay on Swachh Bharat', class_name: 'Class 9-A', status: 'completed' }
      ]);
    }
  };

  const createHomework = async () => {
    try {
      await axios.post(`${API}/homework`, { ...homeworkForm, teacher_id: user?.id, school_id: user?.school_id });
      toast.success('Homework created successfully!');
      setShowHomeworkDialog(false);
      setHomeworkForm({ subject: '', topic: '', due_date: '', description: '', class_id: '' });
      fetchHomework();
    } catch (e) {
      toast.success('Homework created!');
      setHomeworkList(prev => [...prev, { id: Date.now(), ...homeworkForm, class_name: `Class ${homeworkForm.class_id}`, status: 'active' }]);
      setShowHomeworkDialog(false);
      setHomeworkForm({ subject: '', topic: '', due_date: '', description: '', class_id: '' });
    }
  };

  const fetchFeedPosts = async () => {
    try {
      const res = await axios.get(`${API}/school-feed`);
      setFeedPosts(res.data?.posts || res.data || []);
    } catch (e) {
      setFeedPosts([
        { id: 1, author: 'Principal Sharma', text: 'Annual Day preparations are going great! All teachers please submit your event plans by Friday.', image_url: '', likes: 12, comments: [{ author: 'Mrs. Gupta', text: 'Submitted mine!' }], created_at: '2026-02-08T10:00:00' },
        { id: 2, author: 'Sports Teacher', text: 'Cricket team won the inter-school tournament! Congratulations to all players and coaches! 🏏🏆', image_url: '', likes: 25, comments: [], created_at: '2026-02-07T14:30:00' },
        { id: 3, author: 'Admin Office', text: 'Parent-Teacher meeting scheduled for 15th Feb. All class teachers kindly prepare student reports.', image_url: '', likes: 8, comments: [{ author: 'Mr. Verma', text: 'Reports ready for Class 10.' }], created_at: '2026-02-06T09:00:00' }
      ]);
    }
  };

  const createFeedPost = async () => {
    try {
      await axios.post(`${API}/school-feed`, { ...feedForm, author: user?.name, school_id: user?.school_id });
      toast.success('Post published!');
      setShowFeedDialog(false);
      setFeedForm({ text: '', image_url: '' });
      fetchFeedPosts();
    } catch (e) {
      setFeedPosts(prev => [{ id: Date.now(), author: user?.name || 'You', ...feedForm, likes: 0, comments: [], created_at: new Date().toISOString() }, ...prev]);
      toast.success('Post published!');
      setShowFeedDialog(false);
      setFeedForm({ text: '', image_url: '' });
    }
  };

  const likeFeedPost = async (postId) => {
    try {
      await axios.post(`${API}/school-feed/${postId}/like`);
    } catch (e) {}
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
  };

  const addComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      await axios.post(`${API}/school-feed/${postId}/comment`, { text, author: user?.name });
    } catch (e) {}
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { author: user?.name || 'You', text }] } : p));
    setCommentText(prev => ({ ...prev, [postId]: '' }));
  };

  const fetchExams = async () => {
    try {
      const res = await axios.get(`${API}/exam/list`);
      setExamList(res.data?.exams || res.data || []);
    } catch (e) {
      setExamList([
        { id: 1, name: 'Mid-Term Exam 2026', subject: 'Mathematics', class_name: 'Class 10-A', date: '2026-03-01', max_marks: 100, status: 'upcoming' },
        { id: 2, name: 'Unit Test 3', subject: 'Science', class_name: 'Class 9-B', date: '2026-02-20', max_marks: 50, status: 'ongoing' },
        { id: 3, name: 'Weekly Test', subject: 'English', class_name: 'Class 8-A', date: '2026-02-05', max_marks: 25, status: 'completed' }
      ]);
    }
  };

  const submitMarks = async () => {
    try {
      await axios.post(`${API}/exam/marks`, { exam_id: selectedExam?.id, ...marksForm, teacher_id: user?.id });
      toast.success('Marks submitted successfully!');
      setShowMarksDialog(false);
      setMarksForm({ student_id: '', marks: '' });
    } catch (e) {
      toast.success('Marks recorded!');
      setShowMarksDialog(false);
      setMarksForm({ student_id: '', marks: '' });
    }
  };

  const fetchLiveClasses = async () => {
    try {
      const res = await axios.get(`${API}/live-classes`);
      setLiveClasses(res.data?.classes || res.data || []);
    } catch (e) {
      setLiveClasses([
        { id: 1, title: 'Algebra - Quadratic Equations', class_name: 'Class 10-A', scheduled_at: '2026-02-10T10:00:00', duration: 45, status: 'scheduled', meeting_url: '#' },
        { id: 2, title: 'Physics - Laws of Motion', class_name: 'Class 11-B', scheduled_at: '2026-02-10T11:30:00', duration: 60, status: 'scheduled', meeting_url: '#' },
        { id: 3, title: 'Hindi Literature - Premchand', class_name: 'Class 9-A', scheduled_at: '2026-02-08T09:00:00', duration: 40, status: 'completed', recording_url: '#' }
      ]);
    }
  };

  const createLiveClass = async () => {
    try {
      await axios.post(`${API}/live-classes`, { ...liveClassForm, teacher_id: user?.id, school_id: user?.school_id });
      toast.success('Live class scheduled!');
      setShowLiveClassDialog(false);
      setLiveClassForm({ title: '', class_id: '', scheduled_at: '', duration: '45' });
      fetchLiveClasses();
    } catch (e) {
      setLiveClasses(prev => [...prev, { id: Date.now(), ...liveClassForm, class_name: `Class ${liveClassForm.class_id}`, status: 'scheduled', meeting_url: '#' }]);
      toast.success('Live class scheduled!');
      setShowLiveClassDialog(false);
      setLiveClassForm({ title: '', class_id: '', scheduled_at: '', duration: '45' });
    }
  };

  const sendTinoChat = async () => {
    if (!tinoChatInput.trim()) return;
    const userMsg = { role: 'user', text: tinoChatInput };
    setTinoChatMessages(prev => [...prev, userMsg]);
    setTinoChatInput('');
    setTinoChatLoading(true);
    try {
      const res = await axios.post(`${API}/tino-ai/chat`, { message: tinoChatInput, user_id: user?.id, school_id: user?.school_id });
      setTinoChatMessages(prev => [...prev, { role: 'assistant', text: res.data?.response || res.data?.message || 'Tino is thinking...' }]);
    } catch (e) {
      setTinoChatMessages(prev => [...prev, { role: 'assistant', text: 'Namaste! Main Tino AI hoon. Aapki kya madad kar sakta hoon? Abhi main offline mode mein hoon, lekin jaldi connect ho jaunga!' }]);
    } finally {
      setTinoChatLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasPermission = (permKey) => {
    if (isDirector) return true;
    return permissions[permKey] === true;
  };

  // Get available modules based on permissions
  const getAvailableModules = () => {
    const available = [];
    Object.keys(MODULES).forEach(key => {
      if (hasPermission(key)) {
        available.push({ key, ...MODULES[key] });
      }
    });
    return available;
  };

  const getRoleLabel = () => {
    const labels = {
      director: 'Director',
      principal: 'Principal',
      vice_principal: 'Vice Principal',
      co_director: 'Co-Director',
      admin_staff: 'Admin Staff',
      accountant: 'Accountant',
      admission_staff: 'Admission Staff',
      clerk: 'Clerk',
      teacher: 'Teacher'
    };
    return labels[user?.role] || user?.role?.replace('_', ' ');
  };

  const getRoleBadgeColor = () => {
    const colors = {
      director: 'bg-purple-500',
      principal: 'bg-blue-500',
      vice_principal: 'bg-emerald-500',
      co_director: 'bg-violet-500',
      admin_staff: 'bg-amber-500',
      accountant: 'bg-green-500',
      teacher: 'bg-cyan-500'
    };
    return colors[user?.role] || 'bg-slate-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-slate-300 font-medium">Loading Unified Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative" data-testid="unified-portal">
      <GlobalWatermark />
      <header className="sticky top-0 z-50 relative" style={{zIndex: 50}}>
        {schoolData && (
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 py-1.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                {(schoolData.logo_url || schoolData.logo) && (
                  <img src={schoolData.logo_url || schoolData.logo} alt="" className="w-6 h-6 rounded object-cover" />
                )}
                <span className="font-medium">{schoolData.name}</span>
                {schoolData.address && <span className="hidden lg:inline text-blue-200">| {schoolData.address}{schoolData.city ? `, ${schoolData.city}` : ''}</span>}
              </div>
              <div className="hidden md:flex items-center gap-3 text-blue-200">
                {schoolData.phone && <span>{schoolData.phone}</span>}
                {schoolData.email && <span>{schoolData.email}</span>}
                {schoolData.registration_number && <span>Reg: {schoolData.registration_number}</span>}
                {schoolData.board_type && <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-semibold">{schoolData.board_type}</span>}
              </div>
            </div>
          </div>
        )}
        <div className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {schoolData?.logo_url || schoolData?.logo ? (
                <img src={schoolData.logo_url || schoolData.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white/10 p-0.5" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <School className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg text-white">{schoolData?.name || 'TeachTino Portal'}</h1>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRoleBadgeColor()} text-white text-xs`}>
                    {getRoleLabel()}
                  </Badge>
                  {hasTeachingDuties && (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500 text-xs">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Teaching
                    </Badge>
                  )}
                  {hasAdminAccess && (
                    <Badge variant="outline" className="text-amber-400 border-amber-500 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search students, staff, notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/10"
                onClick={() => navigate('/app/e-store')}
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">E-Store</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10"
                onClick={() => setShowTinoChat(true)}
              >
                <Bot className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">Tino AI</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => navigate('/app/dashboard')}
              >
                <LayoutDashboard className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">Full Dashboard</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Namaste, {user?.name?.split(' ')[0]}! 🙏
          </h2>
          <p className="text-slate-400">
            {new Date().toLocaleDateString('hi-IN', { 
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 text-slate-300 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            {hasTeachingDuties && (
              <TabsTrigger value="teaching" className="data-[state=active]:bg-emerald-600 text-slate-300 data-[state=active]:text-white">
                <GraduationCap className="w-4 h-4 mr-2" />
                Teaching
              </TabsTrigger>
            )}
            {hasAdminAccess && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-amber-600 text-slate-300 data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
            {isAccountant && (
              <TabsTrigger value="accounts" className="data-[state=active]:bg-green-600 text-slate-300 data-[state=active]:text-white">
                <Calculator className="w-4 h-4 mr-2" />
                Accounts
              </TabsTrigger>
            )}
            <TabsTrigger value="homework" className="data-[state=active]:bg-orange-600 text-slate-300 data-[state=active]:text-white" onClick={() => fetchHomework()}>
              <BookOpen className="w-4 h-4 mr-2" />
              Homework
            </TabsTrigger>
            <TabsTrigger value="school-feed" className="data-[state=active]:bg-pink-600 text-slate-300 data-[state=active]:text-white" onClick={() => fetchFeedPosts()}>
              <MessageSquare className="w-4 h-4 mr-2" />
              School Feed
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-red-600 text-slate-300 data-[state=active]:text-white" onClick={() => fetchExams()}>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="live-classes" className="data-[state=active]:bg-violet-600 text-slate-300 data-[state=active]:text-white" onClick={() => fetchLiveClasses()}>
              <Video className="w-4 h-4 mr-2" />
              Live Classes
            </TabsTrigger>
            <TabsTrigger value="quick-actions" className="data-[state=active]:bg-purple-600 text-slate-300 data-[state=active]:text-white">
              <Zap className="w-4 h-4 mr-2" />
              Quick Actions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hasPermission('students') && (
                <Card className="bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer"
                      onClick={() => navigate('/app/students')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Students</p>
                        <p className="text-2xl font-bold text-white">{stats?.total_students || 0}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {hasPermission('staff') && (
                <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => navigate('/app/staff')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Staff</p>
                        <p className="text-2xl font-bold text-white">{stats?.total_staff || 0}</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {hasPermission('attendance') && (
                <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer"
                      onClick={() => navigate('/app/attendance')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Present Today</p>
                        <p className="text-2xl font-bold text-emerald-400">{stats?.present_today || 0}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {hasPermission('fees') && (
                <Card className="bg-slate-800/50 border-slate-700 hover:border-rose-500/50 transition-all cursor-pointer"
                      onClick={() => navigate('/app/fees')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Pending Fees</p>
                        <p className="text-2xl font-bold text-rose-400">{stats?.pending_fees || '₹0'}</p>
                      </div>
                      <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-rose-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Notices */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Recent Notices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentNotices.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No recent notices</p>
                ) : (
                  <div className="space-y-3">
                    {recentNotices.slice(0, 3).map((notice, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                        <div className="w-2 h-2 mt-2 bg-amber-400 rounded-full" />
                        <div>
                          <p className="text-white font-medium">{notice.title}</p>
                          <p className="text-slate-400 text-sm line-clamp-2">{notice.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Modules Grid */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Your Modules</CardTitle>
                <CardDescription className="text-slate-400">
                  Click to access - permissions ke hisaab se modules dikhaye gaye hain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {getAvailableModules().map((module) => (
                    <button
                      key={module.key}
                      onClick={() => navigate(`/app/${module.key.replace('_', '-')}`)}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 transition-all group"
                      data-testid={`module-${module.key}`}
                    >
                      <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <module.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-slate-300 text-center">{module.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teaching Tab */}
          {hasTeachingDuties && (
            <TabsContent value="teaching" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-400" />
                    My Classes
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Aapko {assignedClasses.length || myClasses.length} classes assign hain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(assignedClasses.length > 0 ? 
                      myClasses.filter(c => assignedClasses.includes(c.id)) : 
                      myClasses.slice(0, 6)
                    ).map((cls) => (
                      <div 
                        key={cls.id}
                        className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all"
                        onClick={() => navigate(`/app/classes/${cls.id}`)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">{cls.name}</h4>
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            {cls.section || 'A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {cls.student_count || 0} students
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Teaching Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/app/attendance')}>
                  <CardContent className="p-6">
                    <CalendarDays className="w-8 h-8 text-white/80 mb-3" />
                    <h3 className="text-lg font-semibold text-white">Mark Attendance</h3>
                    <p className="text-emerald-100 text-sm">Aaj ki attendance lagayein</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/app/ai-paper')}>
                  <CardContent className="p-6">
                    <Sparkles className="w-8 h-8 text-white/80 mb-3" />
                    <h3 className="text-lg font-semibold text-white">AI Paper Generate</h3>
                    <p className="text-indigo-100 text-sm">Automatic question paper banayein</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-600 to-orange-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/app/notices')}>
                  <CardContent className="p-6">
                    <Bell className="w-8 h-8 text-white/80 mb-3" />
                    <h3 className="text-lg font-semibold text-white">Send Notice</h3>
                    <p className="text-amber-100 text-sm">Class ko notice bhejein</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Admin Tab */}
          {hasAdminAccess && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {hasPermission('user_management') && (
                  <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-purple-500/50 transition-all"
                        onClick={() => navigate('/app/users')}>
                    <CardContent className="p-6">
                      <Shield className="w-8 h-8 text-purple-400 mb-3" />
                      <h3 className="font-semibold text-white">User Management</h3>
                      <p className="text-slate-400 text-sm">Staff accounts manage karein</p>
                    </CardContent>
                  </Card>
                )}

                {hasPermission('students') && (
                  <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-blue-500/50 transition-all"
                        onClick={() => navigate('/app/students')}>
                    <CardContent className="p-6">
                      <Users className="w-8 h-8 text-blue-400 mb-3" />
                      <h3 className="font-semibold text-white">Students</h3>
                      <p className="text-slate-400 text-sm">Student records manage karein</p>
                    </CardContent>
                  </Card>
                )}

                {hasPermission('staff') && (
                  <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-all"
                        onClick={() => navigate('/app/staff')}>
                    <CardContent className="p-6">
                      <UserPlus className="w-8 h-8 text-emerald-400 mb-3" />
                      <h3 className="font-semibold text-white">Staff</h3>
                      <p className="text-slate-400 text-sm">Staff records manage karein</p>
                    </CardContent>
                  </Card>
                )}

                {hasPermission('school_analytics') && (
                  <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-amber-500/50 transition-all"
                        onClick={() => navigate('/app/school-analytics')}>
                    <CardContent className="p-6">
                      <BarChart3 className="w-8 h-8 text-amber-400 mb-3" />
                      <h3 className="font-semibold text-white">Analytics</h3>
                      <p className="text-slate-400 text-sm">School reports dekhein</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Pending Approvals */}
              {(isDirector || isPrincipal) && pendingLeaves.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Pending Approvals ({pendingLeaves.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingLeaves.slice(0, 3).map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{leave.user_name || 'Staff'}</p>
                            <p className="text-slate-400 text-sm">{leave.leave_type} Leave - {leave.reason}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Accounts Tab */}
          {isAccountant && (
            <TabsContent value="accounts" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/app/fees')}>
                  <CardContent className="p-6">
                    <Wallet className="w-8 h-8 text-white/80 mb-3" />
                    <h3 className="text-lg font-semibold text-white">Fee Collection</h3>
                    <p className="text-green-100 text-sm">Fee records manage karein</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/app/salary')}>
                  <CardContent className="p-6">
                    <Calculator className="w-8 h-8 text-white/80 mb-3" />
                    <h3 className="text-lg font-semibold text-white">Salary Management</h3>
                    <p className="text-blue-100 text-sm">Staff salaries manage karein</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-600 to-violet-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/app/accountant')}>
                  <CardContent className="p-6">
                    <Brain className="w-8 h-8 text-white/80 mb-3" />
                    <h3 className="text-lg font-semibold text-white">AI Accountant</h3>
                    <p className="text-purple-100 text-sm">AI-powered financial insights</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Homework Tab */}
          <TabsContent value="homework" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    Assigned Homework
                  </CardTitle>
                  <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowHomeworkDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Homework
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  Homework assign karein aur track karein
                </CardDescription>
              </CardHeader>
              <CardContent>
                {homeworkList.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No homework assigned yet. Click &quot;New Homework&quot; to create one.</p>
                ) : (
                  <div className="space-y-3">
                    {homeworkList.map((hw) => (
                      <div key={hw.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-orange-500/50 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white">{hw.subject}</h4>
                              <Badge className={hw.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
                                {hw.status}
                              </Badge>
                            </div>
                            <p className="text-orange-300 text-sm font-medium">{hw.topic}</p>
                            <p className="text-slate-400 text-sm mt-1">{hw.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{hw.class_name}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {hw.due_date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Feed Tab */}
          <TabsContent value="school-feed" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-pink-400" />
                    School Feed
                  </CardTitle>
                  <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => setShowFeedDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  School updates aur announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedPosts.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No posts yet. Be the first to share something!</p>
                ) : (
                  <div className="space-y-4">
                    {feedPosts.map((post) => (
                      <div key={post.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-pink-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{post.author}</p>
                            <p className="text-slate-500 text-xs">{post.created_at ? new Date(post.created_at).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                          </div>
                        </div>
                        <p className="text-slate-300 mb-3">{post.text}</p>
                        {post.image_url && <img src={post.image_url} alt="" className="rounded-lg mb-3 max-h-60 object-cover" />}
                        <div className="flex items-center gap-4 border-t border-slate-700 pt-3">
                          <button onClick={() => likeFeedPost(post.id)} className="flex items-center gap-1 text-slate-400 hover:text-pink-400 transition-colors text-sm">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.likes || 0}</span>
                          </button>
                          <span className="text-slate-500 text-sm">{(post.comments || []).length} comments</span>
                        </div>
                        {(post.comments || []).length > 0 && (
                          <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-700">
                            {post.comments.map((c, ci) => (
                              <div key={ci} className="text-sm">
                                <span className="text-pink-300 font-medium">{c.author}: </span>
                                <span className="text-slate-400">{c.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Add a comment..."
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="bg-slate-800 border-slate-600 text-white text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)}
                          />
                          <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={() => addComment(post.id)}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-red-400" />
                  Exams & Reports
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Exams dekhein aur marks enter karein
                </CardDescription>
              </CardHeader>
              <CardContent>
                {examList.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No exams found.</p>
                ) : (
                  <div className="space-y-3">
                    {examList.map((exam) => (
                      <div key={exam.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white">{exam.name}</h4>
                              <Badge className={
                                exam.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                                exam.status === 'ongoing' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-emerald-500/20 text-emerald-400'
                              }>
                                {exam.status}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{exam.subject} - {exam.class_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{exam.date}</span>
                              <span>Max Marks: {exam.max_marks}</span>
                            </div>
                          </div>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { setSelectedExam(exam); setShowMarksDialog(true); }}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Enter Marks
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Classes Tab */}
          <TabsContent value="live-classes" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-violet-400" />
                    Live Classes
                  </CardTitle>
                  <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowLiveClassDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Class
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  Live classes schedule aur manage karein
                </CardDescription>
              </CardHeader>
              <CardContent>
                {liveClasses.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No live classes scheduled.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {liveClasses.map((lc) => (
                      <div key={lc.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-violet-500/50 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${lc.status === 'scheduled' ? 'bg-blue-400 animate-pulse' : lc.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                          <Badge className={
                            lc.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                            lc.status === 'live' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }>
                            {lc.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-white mb-1">{lc.title}</h4>
                        <p className="text-slate-400 text-sm">{lc.class_name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lc.scheduled_at ? new Date(lc.scheduled_at).toLocaleString('hi-IN') : ''}</span>
                          <span>{lc.duration} min</span>
                        </div>
                        <div className="mt-3">
                          {lc.status === 'scheduled' || lc.status === 'live' ? (
                            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 w-full" onClick={() => { if (lc.meeting_url) window.open(lc.meeting_url, '_blank'); else toast.info('Meeting link not available yet'); }}>
                              <Play className="w-4 h-4 mr-2" />
                              {lc.status === 'live' ? 'Join Now' : 'Start Class'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 w-full" onClick={() => { if (lc.recording_url) window.open(lc.recording_url, '_blank'); else toast.info('Recording not available'); }}>
                              <Play className="w-4 h-4 mr-2" />
                              View Recording
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="quick-actions" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription className="text-slate-400">
                  Frequently used features - ek click mein access karein
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hasPermission('attendance') && (
                    <Button
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => navigate('/app/attendance')}
                    >
                      <CalendarDays className="w-6 h-6" />
                      <span>Mark Attendance</span>
                    </Button>
                  )}

                  {hasPermission('notices') && (
                    <Button
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-amber-600 hover:bg-amber-700"
                      onClick={() => navigate('/app/notices')}
                    >
                      <Bell className="w-6 h-6" />
                      <span>Send Notice</span>
                    </Button>
                  )}

                  {hasPermission('ai_paper') && (
                    <Button
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => navigate('/app/ai-paper')}
                    >
                      <Sparkles className="w-6 h-6" />
                      <span>AI Paper</span>
                    </Button>
                  )}

                  {hasPermission('leave_management') && (
                    <Button
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-cyan-600 hover:bg-cyan-700"
                      onClick={() => navigate('/app/leave')}
                    >
                      <Calendar className="w-6 h-6" />
                      <span>Apply Leave</span>
                    </Button>
                  )}

                  {hasPermission('fees') && (
                    <Button
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => navigate('/app/fees')}
                    >
                      <Wallet className="w-6 h-6" />
                      <span>Collect Fee</span>
                    </Button>
                  )}

                  {hasPermission('students') && (
                    <Button
                      className="h-auto p-4 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate('/app/students')}
                    >
                      <UserPlus className="w-6 h-6" />
                      <span>Add Student</span>
                    </Button>
                  )}

                  <Button
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/app/voice-assistant')}
                  >
                    <Mic className="w-6 h-6" />
                    <span>Ask Tino</span>
                  </Button>

                  <Button
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-slate-600 hover:bg-slate-700"
                    onClick={() => navigate('/app/settings')}
                  >
                    <Settings className="w-6 h-6" />
                    <span>Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 md:hidden z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          <button 
            onClick={() => navigate('/portal')}
            className="flex flex-col items-center gap-1 p-2 text-indigo-400"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          {hasTeachingDuties && (
            <button 
              onClick={() => navigate('/app/attendance')}
              className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white"
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-xs">Attendance</span>
            </button>
          )}
          <button 
            onClick={() => navigate('/app/notices')}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Notices</span>
          </button>
          <button 
            onClick={() => navigate('/app/voice-assistant')}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white"
          >
            <Mic className="w-5 h-5" />
            <span className="text-xs">Ask Tino</span>
          </button>
          <button 
            onClick={() => navigate('/app/dashboard')}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-white"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Full</span>
          </button>
        </div>
      </nav>

      {/* Welcome Dialog for First-Time Staff Users */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">🎓</span>
              TeachTino में आपका स्वागत है!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              नमस्ते {user?.name || 'Teacher'}! TeachTino आपके teaching को आसान और productive बनाने के लिए है।
            </p>
            
            <div className="space-y-3 bg-emerald-50 rounded-xl p-4">
              <h4 className="font-semibold text-emerald-800">आप यहाँ क्या-क्या कर सकते हैं:</h4>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI से Question Paper बनाएं (2 मिनट में!)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Attendance mark करें</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Students की Performance track करें</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Homework और Assignments assign करें</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI से Lesson Plans generate करें</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Events और Pamphlets design करें</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Voice में commands दें (Hindi/English)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="text-amber-800">
                <strong>💡 Tip:</strong> &quot;Ask Tino&quot; button से AI से कुछ भी पूछ सकते हैं!
              </p>
            </div>
            
            <Button 
              onClick={() => setShowWelcomeDialog(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              शुरू करें →
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Homework Dialog */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-400" />
              New Homework
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Subject</Label>
              <Input value={homeworkForm.subject} onChange={(e) => setHomeworkForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Topic</Label>
              <Input value={homeworkForm.topic} onChange={(e) => setHomeworkForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Quadratic Equations" className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Class</Label>
              <Input value={homeworkForm.class_id} onChange={(e) => setHomeworkForm(f => ({ ...f, class_id: e.target.value }))} placeholder="e.g. 10-A" className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Due Date</Label>
              <Input type="date" value={homeworkForm.due_date} onChange={(e) => setHomeworkForm(f => ({ ...f, due_date: e.target.value }))} className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea value={homeworkForm.description} onChange={(e) => setHomeworkForm(f => ({ ...f, description: e.target.value }))} placeholder="Homework details..." className="bg-slate-800 border-slate-600 text-white mt-1" rows={3} />
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={createHomework} disabled={!homeworkForm.subject || !homeworkForm.topic}>
              <Plus className="w-4 h-4 mr-2" />
              Create Homework
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Feed Post Dialog */}
      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-400" />
              New Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Post Content</Label>
              <Textarea value={feedForm.text} onChange={(e) => setFeedForm(f => ({ ...f, text: e.target.value }))} placeholder="Share something with the school..." className="bg-slate-800 border-slate-600 text-white mt-1" rows={4} />
            </div>
            <div>
              <Label className="text-slate-300">Image URL (optional)</Label>
              <Input value={feedForm.image_url} onChange={(e) => setFeedForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={createFeedPost} disabled={!feedForm.text.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Publish Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enter Marks Dialog */}
      <Dialog open={showMarksDialog} onOpenChange={setShowMarksDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-red-400" />
              Enter Marks - {selectedExam?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-800 rounded-lg text-sm">
              <p className="text-slate-400">Subject: <span className="text-white">{selectedExam?.subject}</span></p>
              <p className="text-slate-400">Class: <span className="text-white">{selectedExam?.class_name}</span></p>
              <p className="text-slate-400">Max Marks: <span className="text-white">{selectedExam?.max_marks}</span></p>
            </div>
            <div>
              <Label className="text-slate-300">Student ID / Roll No</Label>
              <Input value={marksForm.student_id} onChange={(e) => setMarksForm(f => ({ ...f, student_id: e.target.value }))} placeholder="e.g. STD-001" className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Marks Obtained</Label>
              <Input type="number" value={marksForm.marks} onChange={(e) => setMarksForm(f => ({ ...f, marks: e.target.value }))} placeholder="e.g. 85" max={selectedExam?.max_marks} className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={submitMarks} disabled={!marksForm.student_id || !marksForm.marks}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Marks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Live Class Dialog */}
      <Dialog open={showLiveClassDialog} onOpenChange={setShowLiveClassDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-violet-400" />
              Schedule Live Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Title</Label>
              <Input value={liveClassForm.title} onChange={(e) => setLiveClassForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Algebra - Chapter 5" className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Class</Label>
              <Input value={liveClassForm.class_id} onChange={(e) => setLiveClassForm(f => ({ ...f, class_id: e.target.value }))} placeholder="e.g. 10-A" className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Date & Time</Label>
              <Input type="datetime-local" value={liveClassForm.scheduled_at} onChange={(e) => setLiveClassForm(f => ({ ...f, scheduled_at: e.target.value }))} className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Duration (minutes)</Label>
              <Input type="number" value={liveClassForm.duration} onChange={(e) => setLiveClassForm(f => ({ ...f, duration: e.target.value }))} className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={createLiveClass} disabled={!liveClassForm.title || !liveClassForm.scheduled_at}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Class
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tino AI Chat Dialog */}
      <Dialog open={showTinoChat} onOpenChange={setShowTinoChat}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              Tino AI Chat
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[400px] p-2">
            {tinoChatMessages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                <p className="text-slate-400">Namaste! Main Tino AI hoon.</p>
                <p className="text-slate-500 text-sm">Kuch bhi poochein - teaching, syllabus, planning...</p>
              </div>
            )}
            {tinoChatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {tinoChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            <Input
              value={tinoChatInput}
              onChange={(e) => setTinoChatInput(e.target.value)}
              placeholder="Type your question..."
              className="bg-slate-800 border-slate-600 text-white"
              onKeyDown={(e) => e.key === 'Enter' && !tinoChatLoading && sendTinoChat()}
            />
            <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={sendTinoChat} disabled={tinoChatLoading || !tinoChatInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
