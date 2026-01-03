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
  Users, BookOpen, Calendar, Bell, ClipboardCheck, 
  ChevronRight, GraduationCap, Clock, FileText, Sparkles,
  Search, Settings, Mic, LogOut, CheckCircle, XCircle,
  MessageSquare, Send, PlusCircle, User, CalendarDays,
  Briefcase, UserPlus, AlertTriangle, Home, Loader2,
  Brain, Wand2, Download, Share2
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
  
  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showClassHub, setShowClassHub] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Leave form
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: ''
  });

  // Notice form
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

  // Determine if user is Admission Staff
  const isAdmissionStaff = user?.role === 'admission_staff' || user?.role === 'clerk';
  const isClassTeacher = user?.is_class_teacher || false;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch teacher dashboard data
      const [dashboardRes, leavesRes, classesRes, noticesRes, myLeavesRes] = await Promise.allSettled([
        axios.get(`${API}/teacher/dashboard`),
        axios.get(`${API}/leave/pending`),
        axios.get(`${API}/classes`),
        axios.get(`${API}/notices?limit=5`),
        axios.get(`${API}/leave/my-leaves`)
      ]);

      if (dashboardRes.status === 'fulfilled') {
        setStats(dashboardRes.value.data);
      }
      if (leavesRes.status === 'fulfilled') {
        setPendingLeaves(leavesRes.value.data || []);
      }
      if (classesRes.status === 'fulfilled') {
        setMyClasses(classesRes.value.data || []);
      }
      if (noticesRes.status === 'fulfilled') {
        setRecentNotices(noticesRes.value.data || []);
      }
      if (myLeavesRes.status === 'fulfilled') {
        setMyLeaves(myLeavesRes.value.data || []);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

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
      // Mock response for demo
      setAiResponse(`Here's a sample response for: "${aiPrompt}"\n\nThis is a demo of TeachTino AI Assistant. In production, this will generate:\n- Lesson plans\n- Question papers\n- Worksheets\n- Explanations for difficult topics`);
    } finally {
      setAiLoading(false);
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
      {/* ==================== TOP BAR ==================== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & School */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">TeachTino</h1>
                <p className="text-xs text-slate-500">Schooltino Education System</p>
              </div>
            </div>

            {/* Center: Search */}
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

            {/* Right: User Info & Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                {pendingLeaves.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingLeaves.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <Mic className="w-5 h-5 text-slate-600" />
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
                  <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isClassTeacher ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                    {isClassTeacher ? 'Class Teacher' : user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Date Bar */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              <Calendar className="w-4 h-4 inline mr-2" />
              {dateStr}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                Period 3
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ==================== SECTION 1: TODAY AT A GLANCE ==================== */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Today at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* My Classes Today */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{myClasses.length}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">My Classes</p>
              <p className="text-xs text-slate-400 mt-1">Periods: 6</p>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer relative">
              {pendingLeaves.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {pendingLeaves.length}
                </span>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingLeaves.length}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">Pending Approvals</p>
              <p className="text-xs text-slate-400 mt-1">Leave requests</p>
            </div>

            {/* Notices */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{recentNotices.length}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">Notices</p>
              <p className="text-xs text-slate-400 mt-1">Draft: 0 | Sent: {recentNotices.length}</p>
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">Tasks</p>
              <p className="text-xs text-slate-400 mt-1">Pending work</p>
            </div>
          </div>
        </section>

        {/* ==================== SECTION 2: APPROVAL INBOX ==================== */}
        {(isClassTeacher || pendingLeaves.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">📥 Approval Inbox</h2>
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {pendingLeaves.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-slate-500">No pending approvals 🎉</p>
                </div>
              ) : (
                pendingLeaves.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mt-1">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{leave.applicant_name || 'Student'}</p>
                          <p className="text-sm text-slate-600">
                            {leave.leave_type} Leave: {leave.from_date} to {leave.to_date} ({leave.days || 1} days)
                          </p>
                          <p className="text-sm text-slate-500 mt-1">{leave.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApproveLeave(leave.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRejectLeave(leave.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ==================== SECTION 3: MY CLASSES (Grid) ==================== */}
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
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        Homework: Posted
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ==================== ADMISSION STAFF VARIANT ==================== */}
        {isAdmissionStaff && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">📋 Admissions Panel</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <Button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 mb-6" size="lg">
                <UserPlus className="w-5 h-5 mr-2" />
                New Admission
              </Button>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-slate-900">5</p>
                  <p className="text-sm text-slate-600">Draft</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-amber-600">3</p>
                  <p className="text-sm text-slate-600">Pending Approval</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-emerald-600">25</p>
                  <p className="text-sm text-slate-600">Approved</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-rose-600">2</p>
                  <p className="text-sm text-slate-600">Rejected</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== SECTION 4: QUICK ACTIONS ==================== */}
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
            
            <Button 
              className="h-24 flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              variant="outline"
            >
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
            
            <Button 
              className="h-24 flex-col gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
              variant="outline"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">Report Issue</span>
            </Button>
          </div>
        </section>

        {/* ==================== SECTION 5: TEACHTINO AI ASSISTANT ==================== */}
        <section>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">TeachTino AI Assistant</h2>
                <p className="text-emerald-100 text-sm">Your teaching helper - Lesson plans, Papers, Worksheets</p>
              </div>
            </div>
            
            {/* Prompt Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                "आज का lesson plan बना दो",
                "Class 8 Science worksheet",
                "10 marks MCQ + answer key",
                "Difficult topic को easy diagram में समझाओ"
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

            {/* Input */}
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
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Mic className="w-5 h-5" />
              </Button>
            </div>

            {/* AI Response */}
            {aiResponse && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl">
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="border-white/30 text-white text-xs">
                    <Download className="w-3 h-3 mr-1" /> Save Draft
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/30 text-white text-xs">
                    <Share2 className="w-3 h-3 mr-1" /> Share to Class
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================== SECTION 6: NOTICES & HOMEWORK ==================== */}
        <section>
          <Tabs defaultValue="notices" className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="notices">📢 Notices</TabsTrigger>
                <TabsTrigger value="homework">📝 Homework</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="notices" className="p-4">
              {recentNotices.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No notices yet</p>
              ) : (
                <div className="space-y-3">
                  {recentNotices.slice(0, 5).map((notice) => (
                    <div key={notice.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{notice.title}</p>
                        <p className="text-xs text-slate-500">{new Date(notice.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-xs">Edit</Button>
                        <Button size="sm" variant="ghost" className="text-xs">Resend</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="homework" className="p-4">
              <p className="text-center text-slate-500 py-8">Homework feature coming soon...</p>
            </TabsContent>
          </Tabs>
        </section>

        {/* ==================== SECTION 7: MY LEAVE ==================== */}
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
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Enter reason for leave..."
                rows={3}
              />
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
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notice title..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your notice..."
                rows={4}
              />
            </div>
            <Button onClick={handleSendNotice} className="w-full bg-purple-600 hover:bg-purple-700">
              <Send className="w-4 h-4 mr-2" /> Send Notice
            </Button>
          </div>
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
              <TabsTrigger value="leaves">Leaves</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="homework">Homework</TabsTrigger>
              <TabsTrigger value="papers">Papers</TabsTrigger>
            </TabsList>
            <TabsContent value="students" className="p-4">
              <p className="text-slate-500 text-center py-8">
                {selectedClass?.student_count || 0} students in this class
              </p>
            </TabsContent>
            <TabsContent value="leaves" className="p-4">
              <p className="text-slate-500 text-center py-8">No pending leaves</p>
            </TabsContent>
            <TabsContent value="notices" className="p-4">
              <p className="text-slate-500 text-center py-8">No notices sent to this class</p>
            </TabsContent>
            <TabsContent value="homework" className="p-4">
              <p className="text-slate-500 text-center py-8">No homework assigned</p>
            </TabsContent>
            <TabsContent value="papers" className="p-4">
              <p className="text-slate-500 text-center py-8">No papers generated</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
