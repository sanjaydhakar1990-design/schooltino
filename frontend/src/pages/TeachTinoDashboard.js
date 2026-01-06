/**
 * TeachTino Dashboard - Simplified & Clean
 * For Teachers, Principals, VPs, and Staff
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  Mic, ChevronRight, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceAssistantFAB from '../components/VoiceAssistantFAB';
import StaffPhotoUpload from '../components/StaffPhotoUpload';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeachTinoDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Data states
  const [myClasses, setMyClasses] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, total: 0 });
  
  // Dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showTinoAI, setShowTinoAI] = useState(false);
  
  // Forms
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
      
      // Mock attendance for demo
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="teachtino-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">TeachTino</h1>
                <p className="text-xs text-slate-500">{user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTinoAI(true)}
                className="text-slate-600"
              >
                <Brain className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileDialog(true)}
                className="text-slate-600"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-rose-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-slate-500">
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">My Classes</p>
                  <p className="text-2xl font-bold text-slate-900">{myClasses.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Present Today</p>
                  <p className="text-2xl font-bold text-emerald-600">{todayAttendance.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Absent</p>
                  <p className="text-2xl font-bold text-rose-600">{todayAttendance.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Notices</p>
                  <p className="text-2xl font-bold text-amber-600">{recentNotices.length}</p>
                </div>
                <Bell className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate('/app/attendance')}
          >
            <ClipboardCheck className="w-6 h-6" />
            <span>Mark Attendance</span>
          </Button>
          
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => navigate('/app/ai-paper')}
          >
            <Sparkles className="w-6 h-6" />
            <span>AI Paper</span>
          </Button>
          
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-amber-600 hover:bg-amber-700"
            onClick={() => setShowNoticeDialog(true)}
          >
            <Bell className="w-6 h-6" />
            <span>Send Notice</span>
          </Button>
          
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowLeaveDialog(true)}
          >
            <Calendar className="w-6 h-6" />
            <span>Apply Leave</span>
          </Button>
        </div>

        {/* My Classes */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                My Classes
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/classes')}>
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {myClasses.length === 0 ? (
                <p className="text-slate-500 col-span-full text-center py-4">No classes assigned</p>
              ) : (
                myClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 cursor-pointer transition-all"
                    onClick={() => navigate(`/app/classes/${cls.id}`)}
                  >
                    <h4 className="font-medium text-slate-900">{cls.name}</h4>
                    <p className="text-sm text-slate-500">{cls.student_count || 0} students</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notices */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Recent Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No notices</p>
            ) : (
              <div className="space-y-3">
                {recentNotices.map((notice) => (
                  <div key={notice.id} className="p-3 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900">{notice.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2">{notice.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Leave Approvals - Only for Principal/VP */}
        {canApproveLeave && pendingLeaves.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Pending Leave Approvals ({pendingLeaves.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingLeaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{leave.user_name || 'Staff'}</p>
                      <p className="text-sm text-slate-500">{leave.leave_type} - {leave.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600" onClick={() => handleApproveLeave(leave.id)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectLeave(leave.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'home' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => navigate('/app/classes')}
            className="flex flex-col items-center gap-1 p-2 text-slate-500"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Classes</span>
          </button>
          <button 
            onClick={() => navigate('/app/attendance')}
            className="flex flex-col items-center gap-1 p-2 text-slate-500"
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs">Attendance</span>
          </button>
          <button 
            onClick={() => navigate('/app/notices')}
            className="flex flex-col items-center gap-1 p-2 text-slate-500"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Notices</span>
          </button>
          <button 
            onClick={() => setShowTinoAI(true)}
            className="flex flex-col items-center gap-1 p-2 text-slate-500"
          >
            <Brain className="w-5 h-5" />
            <span className="text-xs">Tino AI</span>
          </button>
        </div>
      </nav>

      {/* Leave Application Dialog */}
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
                onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg"
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="earned">Earned Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={leaveForm.from_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={leaveForm.to_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Enter reason for leave..."
              />
            </div>
            <Button className="w-full" onClick={handleApplyLeave}>
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Notice title..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Notice content..."
                rows={4}
              />
            </div>
            <Button className="w-full" onClick={handleSendNotice}>
              <Send className="w-4 h-4 mr-2" />
              Send Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile & Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">{user?.name}</h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <Badge className="mt-1 capitalize">{user?.role}</Badge>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Face Recognition Setup
              </h4>
              <StaffPhotoUpload 
                userId={user?.id}
                onComplete={() => toast.success('Photo uploaded!')}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tino AI Modal */}
      <VoiceAssistantFAB isOpen={showTinoAI} onClose={() => setShowTinoAI(false)} />
    </div>
  );
}
