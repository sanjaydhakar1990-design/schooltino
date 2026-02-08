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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="teachtino-dashboard">
      {/* Header */}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTinoAI(true)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <Brain className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileDialog(true)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50"
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
          <h2 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white rounded-xl border border-gray-200 p-5">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">My Classes</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{myClasses.length}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border border-gray-200 p-5">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Present Today</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{todayAttendance.present}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border border-gray-200 p-5">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Absent</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{todayAttendance.absent}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl border border-gray-200 p-5">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Notices</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{recentNotices.length}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <Bell className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            onClick={() => navigate('/app/attendance')}
          >
            <ClipboardCheck className="w-6 h-6" />
            <span className="text-sm">Mark Attendance</span>
          </Button>
          
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            onClick={() => navigate('/app/ai-paper')}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-sm">AI Paper</span>
          </Button>
          
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            onClick={() => setShowNoticeDialog(true)}
          >
            <Bell className="w-6 h-6" />
            <span className="text-sm">Send Notice</span>
          </Button>
          
          <Button
            className="h-auto py-4 flex flex-col gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            onClick={() => setShowLeaveDialog(true)}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-sm">Apply Leave</span>
          </Button>
        </div>

        {/* My Classes */}
        <Card className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                My Classes
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/classes')} className="text-gray-600 hover:bg-gray-100">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {myClasses.length === 0 ? (
                <p className="text-gray-600 col-span-full text-center py-4">No classes assigned</p>
              ) : (
                myClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-all"
                    onClick={() => navigate(`/app/classes/${cls.id}`)}
                  >
                    <h4 className="font-medium text-gray-800">{cls.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{cls.student_count || 0} students</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notices */}
        <Card className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              Recent Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentNotices.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No notices</p>
            ) : (
              <div className="space-y-3">
                {recentNotices.map((notice) => (
                  <div key={notice.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800">{notice.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{notice.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Leave Approvals - Only for Principal/VP */}
        {canApproveLeave && pendingLeaves.length > 0 && (
          <Card className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <div className="bg-amber-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                Pending Leave Approvals ({pendingLeaves.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pendingLeaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-800">{leave.user_name || 'Staff'}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{leave.leave_type} - {leave.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-lg" onClick={() => handleApproveLeave(leave.id)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-lg" onClick={() => handleRejectLeave(leave.id)}>
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => navigate('/app/classes')}
            className="flex flex-col items-center gap-1 p-2 text-gray-600"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs">Classes</span>
          </button>
          <button 
            onClick={() => navigate('/app/attendance')}
            className="flex flex-col items-center gap-1 p-2 text-gray-600"
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs">Attendance</span>
          </button>
          <button 
            onClick={() => navigate('/app/notices')}
            className="flex flex-col items-center gap-1 p-2 text-gray-600"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Notices</span>
          </button>
          <button 
            onClick={() => setShowTinoAI(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-600"
          >
            <Brain className="w-5 h-5" />
            <span className="text-xs">Tino AI</span>
          </button>
        </div>
      </nav>

      {/* Leave Application Dialog */}
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
                <Input
                  type="date"
                  value={leaveForm.from_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                  className="mt-2 border-gray-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <Input
                  type="date"
                  value={leaveForm.to_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                  className="mt-2 border-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Enter reason for leave..."
                className="mt-2 border-gray-200"
              />
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg" onClick={handleApplyLeave}>
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">Send Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Notice title..."
                className="mt-2 border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Content</label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Notice content..."
                rows={4}
                className="mt-2 border-gray-200"
              />
            </div>
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg" onClick={handleSendNotice}>
              <Send className="w-4 h-4 mr-2" />
              Send Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
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
