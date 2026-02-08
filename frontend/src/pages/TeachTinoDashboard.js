import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  Users, BookOpen, Calendar, Bell, ClipboardCheck, 
  GraduationCap, Clock, FileText, Sparkles,
  Settings, LogOut, CheckCircle, XCircle,
  Send, User, CalendarDays, Loader2, Brain,
  BarChart3, Zap, Camera, Home, PlusCircle,
  Mic, ChevronRight, ChevronDown, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceAssistantFAB from '../components/VoiceAssistantFAB';
import StaffPhotoUpload from '../components/StaffPhotoUpload';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeachTinoDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expandedTabs, setExpandedTabs] = useState(['quick_stats', 'quick_actions']);
  
  const [myClasses, setMyClasses] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, total: 0 });
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showTinoAI, setShowTinoAI] = useState(false);
  
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual',
    from_date: '',
    to_date: '',
    reason: ''
  });
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: ''
  });

  const isPrincipal = user?.role === 'principal' || user?.role === 'vice_principal';
  const canApproveLeave = isPrincipal || user?.role === 'director';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, noticesRes, leavesRes] = await Promise.allSettled([
        axios.get(`${API}/classes?school_id=${user?.school_id}`),
        axios.get(`${API}/notices?limit=5`),
        axios.get(`${API}/leave/pending`)
      ]);

      if (classesRes.status === 'fulfilled') setMyClasses(classesRes.value.data?.slice(0, 6) || []);
      if (noticesRes.status === 'fulfilled') setRecentNotices(noticesRes.value.data?.slice(0, 3) || []);
      if (leavesRes.status === 'fulfilled') setPendingLeaves(leavesRes.value.data || []);
      
      setTodayAttendance({ present: 42, absent: 3, total: 45 });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/teachtino');
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.reason) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await axios.post(`${API}/leave/apply`, {
        ...leaveForm,
        school_id: user?.school_id
      });
      toast.success('Leave applied successfully!');
      setShowLeaveDialog(false);
      setLeaveForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
    } catch (error) {
      toast.error('Failed to apply leave');
    }
  };

  const handleSendNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await axios.post(`${API}/notices`, {
        ...noticeForm,
        target_audience: ['students', 'parents'],
        priority: 'normal',
        school_id: user?.school_id
      });
      toast.success('Notice sent!');
      setShowNoticeDialog(false);
      setNoticeForm({ title: '', content: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to send notice');
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await axios.post(`${API}/leave/${leaveId}/approve`);
      toast.success('Leave approved!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await axios.post(`${API}/leave/${leaveId}/reject`);
      toast.success('Leave rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const toggleTab = (tabId) => {
    setExpandedTabs(prev =>
      prev.includes(tabId)
        ? prev.filter(t => t !== tabId)
        : [...prev, tabId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabSections = [
    {
      id: 'quick_stats',
      label: 'Overview',
      icon: BarChart3,
      color: '#3B82F6',
      badge: null,
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {[
            { title: 'My Classes', value: myClasses.length, icon: BookOpen, color: '#3B82F6' },
            { title: 'Present Today', value: todayAttendance.present, icon: CheckCircle, color: '#10B981' },
            { title: 'Absent', value: todayAttendance.absent, icon: XCircle, color: '#EF4444' },
            { title: 'Notices', value: recentNotices.length, icon: Bell, color: '#F59E0B' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}12` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'quick_actions',
      label: 'Quick Actions',
      icon: Zap,
      color: '#8B5CF6',
      badge: null,
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {[
            { icon: ClipboardCheck, label: 'Mark Attendance', color: '#3B82F6', action: () => navigate('/app/attendance') },
            { icon: Sparkles, label: 'AI Paper', color: '#EC4899', action: () => navigate('/app/ai-paper') },
            { icon: Bell, label: 'Send Notice', color: '#F59E0B', action: () => setShowNoticeDialog(true) },
            { icon: Calendar, label: 'Apply Leave', color: '#8B5CF6', action: () => setShowLeaveDialog(true) },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${action.color}12` }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'my_classes',
      label: 'My Classes',
      icon: BookOpen,
      color: '#3B82F6',
      badge: myClasses.length > 0 ? `${myClasses.length} classes` : null,
      content: (
        <div className="p-4">
          {myClasses.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">No classes assigned</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {myClasses.map((cls) => (
                <button
                  key={cls.id}
                  className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all text-left"
                  onClick={() => navigate(`/app/classes/${cls.id}`)}
                >
                  <h4 className="font-medium text-gray-800 text-sm">{cls.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{cls.student_count || 0} students</p>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/app/classes')} className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            View All Classes <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )
    },
    {
      id: 'notices',
      label: 'Recent Notices',
      icon: Bell,
      color: '#F59E0B',
      badge: recentNotices.length > 0 ? `${recentNotices.length} new` : null,
      content: (
        <div className="p-4">
          {recentNotices.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">No notices</p>
          ) : (
            <div className="space-y-2">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-all">
                  <h4 className="font-medium text-gray-800 text-sm">{notice.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{notice.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    ...(canApproveLeave && pendingLeaves.length > 0 ? [{
      id: 'leave_approvals',
      label: 'Pending Leave Approvals',
      icon: AlertTriangle,
      color: '#EF4444',
      badge: `${pendingLeaves.length} pending`,
      content: (
        <div className="p-4 space-y-2">
          {pendingLeaves.slice(0, 3).map((leave) => (
            <div key={leave.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-800 text-sm">{leave.user_name || 'Staff'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{leave.leave_type} - {leave.reason}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 px-3" onClick={() => handleApproveLeave(leave.id)}>
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-lg h-8 px-3" onClick={() => handleRejectLeave(leave.id)}>
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="teachtino-dashboard">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">TeachTino</h1>
                <p className="text-xs text-gray-400">{user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowTinoAI(true)} className="text-gray-600 hover:bg-gray-100">
                <Brain className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowProfileDialog(true)} className="text-gray-600 hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="space-y-2">
          {tabSections.map((tab) => (
            <div key={tab.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleTab(tab.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tab.color}12` }}>
                    <tab.icon className="w-4 h-4" style={{ color: tab.color }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                      {tab.badge}
                    </span>
                  )}
                </div>
                {expandedTabs.includes(tab.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedTabs.includes(tab.id) && (
                <div className="border-t border-gray-100">
                  {tab.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          {[
            { icon: Home, label: 'Home', active: true, action: () => {} },
            { icon: BookOpen, label: 'Classes', action: () => navigate('/app/classes') },
            { icon: ClipboardCheck, label: 'Attendance', action: () => navigate('/app/attendance') },
            { icon: Bell, label: 'Notices', action: () => navigate('/app/notices') },
            { icon: Brain, label: 'Tino AI', action: () => setShowTinoAI(true) },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Leave Type</label>
              <select
                value={leaveForm.leave_type}
                onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                className="w-full mt-2 p-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="earned">Earned Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">From Date</label>
                <Input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })} className="mt-2 border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <Input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })} className="mt-2 border-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Enter reason for leave..." className="mt-2 border-gray-200" />
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg" onClick={handleApplyLeave}>
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">Send Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} placeholder="Notice title..." className="mt-2 border-gray-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Content</label>
              <Textarea value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} placeholder="Notice content..." rows={4} className="mt-2 border-gray-200" />
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg" onClick={handleSendNotice}>
              <Send className="w-4 h-4 mr-2" />
              Send Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">Profile & Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{user?.name}</h3>
                <p className="text-sm text-gray-600 mt-0.5">{user?.email}</p>
                <Badge className="mt-2 capitalize bg-blue-50 text-blue-600 border border-blue-100">{user?.role}</Badge>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <div className="bg-blue-50 p-1 rounded">
                  <Camera className="w-4 h-4 text-blue-500" />
                </div>
                Face Recognition Setup
              </h4>
              <StaffPhotoUpload 
                userId={user?.id}
                schoolId={user?.school_id}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VoiceAssistantFAB />
    </div>
  );
}
