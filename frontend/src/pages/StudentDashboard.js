/**
 * StudyTino Dashboard - Student Portal
 * Simple, Clean, Light Theme - Mobile First
 * Inspired by: MyLeadingCampus, BloomByte
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  User, Calendar, Bell, BookOpen, Clock, CheckCircle, XCircle,
  Download, LogOut, School, ChevronRight, Search, Settings, 
  FileText, CalendarDays, AlertTriangle, Loader2, Brain, 
  Send, CreditCard, Wallet, Mic, Phone, Lock, Home,
  Eye, Paperclip, Star, ClipboardList, MessageCircle, Users,
  Trophy, Activity, AlertOctagon
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceAssistantFAB from '../components/VoiceAssistantFAB';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StudyTinoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  
  // Dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [showActivitiesDialog, setShowActivitiesDialog] = useState(false);
  
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatGroup, setChatGroup] = useState(null);
  
  // Complaint State
  const [complaintForm, setComplaintForm] = useState({
    complaint_to: 'teacher',
    category: 'academic',
    subject: '',
    description: '',
    is_anonymous: false
  });
  
  // Activities State
  const [myActivities, setMyActivities] = useState([]);
  
  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    from_date: '',
    to_date: '',
    reason: ''
  });
  
  const [isBlocked, setIsBlocked] = useState(false);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('hi-IN', { 
    weekday: 'long', day: 'numeric', month: 'long'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, noticesRes, homeworkRes] = await Promise.allSettled([
        axios.get(`${API}/student/dashboard`),
        axios.get(`${API}/student/notices`),
        axios.get(`${API}/student/homework`)
      ]);

      if (dashboardRes.status === 'fulfilled') {
        const data = dashboardRes.value.data;
        setProfile(data.profile);
        if (data.profile?.status === 'blocked') setIsBlocked(true);
      }
      
      // Use API data or fallback to mock
      setNotices(noticesRes.status === 'fulfilled' ? noticesRes.value.data : [
        { id: '1', title: 'Winter Break Notice', content: 'School closed 25 Dec - 1 Jan', priority: 'high', created_at: new Date().toISOString() },
        { id: '2', title: 'Annual Sports Day', content: '15th January - All must participate', priority: 'normal', created_at: new Date().toISOString() }
      ]);

      setHomework(homeworkRes.status === 'fulfilled' ? homeworkRes.value.data : [
        { id: '1', subject: 'Mathematics', topic: 'Exercise 5.3', due_date: '2026-01-04', status: 'pending' },
        { id: '2', subject: 'English', topic: 'Essay Writing', due_date: '2026-01-05', status: 'pending' }
      ]);

      // Mock syllabus and attendance
      setSyllabus([
        { subject: 'Mathematics', completed: 60, current: 'Quadratic Equations' },
        { subject: 'Science', completed: 55, current: 'Light Reflection' },
        { subject: 'Hindi', completed: 70, current: 'नेताजी का चश्मा' },
        { subject: 'English', completed: 50, current: 'The Hundred Dresses' }
      ]);
      setAttendance({ present: 85, total: 100 });

    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.reason) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await axios.post(`${API}/student/leaves`, leaveForm);
      toast.success('Leave application submitted!');
      setShowLeaveDialog(false);
    } catch (error) {
      toast.error('Failed to apply leave');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendingHomework = homework.filter(h => h.status === 'pending').length;
  const unreadNotices = notices.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Account Blocked</h1>
          <p className="text-slate-600 mb-6">Please contact school office.</p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50" data-testid="studytino-dashboard">
      {/* Header - Simple & Clean */}
      <header className="sticky top-0 z-50 bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{profile?.name || 'Student'}</h1>
                <p className="text-xs text-slate-500">{profile?.class_name || 'Class'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setVoiceModalOpen(true)} className="text-purple-600">
                <Mic className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileDialog(true)}>
                <Settings className="w-5 h-5 text-slate-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-20">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-5">
            <p className="text-amber-100 text-sm">{getGreeting()}</p>
            <h2 className="text-xl font-bold mt-1">{profile?.name?.split(' ')[0] || 'Student'}!</h2>
            <p className="text-amber-100 text-sm mt-1">{dateStr}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{attendance.present}%</p>
                <p className="text-xs text-amber-100">Attendance</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{pendingHomework}</p>
                <p className="text-xs text-amber-100">Homework</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{notices.length}</p>
                <p className="text-xs text-amber-100">Notices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Simple Grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Wallet, label: 'Pay Fees', color: 'bg-green-500', path: '/studytino/fees' },
            { icon: FileText, label: 'Receipts', color: 'bg-blue-500', path: '/studytino/receipts' },
            { icon: CalendarDays, label: 'Leave', color: 'bg-rose-500', action: () => setShowLeaveDialog(true) },
            { icon: Brain, label: 'AI Help', color: 'bg-purple-500', action: () => setShowAIHelper(true) },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action || (() => navigate(item.path))}
              className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all"
              data-testid={`quick-action-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-2`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Notices Section */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-500" />
                Notices
                {unreadNotices > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">{unreadNotices}</Badge>
                )}
              </h3>
              <Button variant="ghost" size="sm" className="text-amber-600 text-xs">
                View All <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {notices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => { setSelectedNotice(notice); setShowNoticeDialog(true); }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    notice.priority === 'high' ? 'bg-red-50 border border-red-100' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{notice.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{notice.content}</p>
                    </div>
                    {notice.priority === 'high' && (
                      <Badge className="bg-red-500 text-white text-[10px]">Important</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Homework Section */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Homework
                {pendingHomework > 0 && (
                  <Badge className="bg-amber-500 text-white text-xs">{pendingHomework}</Badge>
                )}
              </h3>
            </div>
            <div className="space-y-2">
              {homework.slice(0, 3).map((hw) => (
                <div key={hw.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{hw.subject}</p>
                    <p className="text-xs text-slate-500">{hw.topic}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={hw.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                      {hw.status === 'pending' ? 'Pending' : 'Done'}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Due: {new Date(hw.due_date).toLocaleDateString('hi-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Progress */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              Syllabus Progress
            </h3>
            <div className="space-y-3">
              {syllabus.map((subject, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{subject.subject}</span>
                    <span className="text-slate-500">{subject.completed}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${subject.completed}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Current: {subject.current}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Online Exam CTA */}
        <Card 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate('/app/exams')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Take Online Exam</p>
                  <p className="text-sm text-indigo-100">Practice tests available</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Tino AI CTA */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-8 h-8" />
              <div>
                <p className="font-bold">StudyTino AI</p>
                <p className="text-xs text-amber-100">Your personal study assistant</p>
              </div>
            </div>
            <Button 
              onClick={() => setVoiceModalOpen(true)}
              className="w-full bg-white text-amber-700 hover:bg-amber-50"
            >
              <Mic className="w-4 h-4 mr-2" />
              Ask Tino AI
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          {[
            { icon: Home, label: 'Home', active: true },
            { icon: BookOpen, label: 'Study', path: '/app/exams' },
            { icon: Bell, label: 'Notices' },
            { icon: Wallet, label: 'Fees', path: '/studytino/fees' },
            { icon: Brain, label: 'AI', action: () => setVoiceModalOpen(true) },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.action || (item.path ? () => navigate(item.path) : undefined)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                item.active ? 'text-amber-600 bg-amber-50' : 'text-slate-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

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
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From</label>
                <Input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm(f => ({ ...f, from_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">To</label>
                <Input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm(f => ({ ...f, to_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Enter reason..." />
            </div>
            <Button onClick={handleApplyLeave} className="w-full bg-amber-600 hover:bg-amber-700">
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Detail Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notice Details</DialogTitle>
          </DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">{selectedNotice.title}</h3>
              <p className="text-slate-600">{selectedNotice.content}</p>
              <p className="text-sm text-slate-400">
                Posted: {new Date(selectedNotice.created_at).toLocaleDateString('hi-IN')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-lg">{profile?.name}</p>
                <p className="text-sm text-slate-500">{profile?.class_name}</p>
              </div>
            </div>
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID</span>
                <span className="font-medium">{profile?.student_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission No</span>
                <span className="font-medium">{profile?.admission_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact</span>
                <span className="font-medium">{profile?.mobile}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Helper Dialog */}
      <Dialog open={showAIHelper} onOpenChange={setShowAIHelper}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              StudyTino AI Helper
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-slate-500 mb-4">Ask any study-related question!</p>
            <Button onClick={() => { setShowAIHelper(false); setVoiceModalOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
              <Mic className="w-4 h-4 mr-2" />
              Talk to Tino AI
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Assistant */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
}
