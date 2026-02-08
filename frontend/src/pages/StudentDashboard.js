import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  User, Calendar, Bell, BookOpen, Clock, CheckCircle, XCircle,
  Download, LogOut, School, ChevronRight, ChevronDown, Search, Settings, 
  FileText, CalendarDays, AlertTriangle, Loader2, Brain, 
  Send, CreditCard, Wallet, Mic, Phone, Lock, Home,
  Eye, Paperclip, Star, ClipboardList, MessageCircle, Users,
  Trophy, Activity, AlertOctagon, Award, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceAssistantFAB from '../components/VoiceAssistantFAB';
import AdmitCardSection from '../components/AdmitCardSection';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StudyTinoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expandedTabs, setExpandedTabs] = useState(['quick_actions', 'notices']);
  
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [showActivitiesDialog, setShowActivitiesDialog] = useState(false);
  const [showAdmitCardDialog, setShowAdmitCardDialog] = useState(false);
  
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatGroup, setChatGroup] = useState(null);
  
  const [complaintForm, setComplaintForm] = useState({
    complaint_to: 'teacher',
    category: 'academic',
    subject: '',
    description: '',
    is_anonymous: false
  });
  
  const [myActivities, setMyActivities] = useState([]);
  
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingFees, setPendingFees] = useState(null);
  
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    from_date: '',
    to_date: '',
    reason: ''
  });
  
  const [isBlocked, setIsBlocked] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

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
    const hasSeenWelcome = localStorage.getItem('studytino_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true);
      localStorage.setItem('studytino_welcome_seen', 'true');
    }
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
      
      setNotices(noticesRes.status === 'fulfilled' ? noticesRes.value.data : [
        { id: '1', title: 'Winter Break Notice', content: 'School closed 25 Dec - 1 Jan', priority: 'high', created_at: new Date().toISOString() },
        { id: '2', title: 'Annual Sports Day', content: '15th January - All must participate', priority: 'normal', created_at: new Date().toISOString() }
      ]);

      setHomework(homeworkRes.status === 'fulfilled' ? homeworkRes.value.data : [
        { id: '1', subject: 'Mathematics', topic: 'Exercise 5.3', due_date: '2026-01-04', status: 'pending' },
        { id: '2', subject: 'English', topic: 'Essay Writing', due_date: '2026-01-05', status: 'pending' }
      ]);

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

  const openClassChat = async () => {
    try {
      const res = await axios.get(`${API}/chat/groups/class/${profile?.class_id}?school_id=${profile?.school_id}`);
      setChatGroup(res.data);
      const msgRes = await axios.get(`${API}/chat/messages/${res.data.id}?limit=50`);
      setChatMessages(msgRes.data.messages || []);
      setShowChatDialog(true);
    } catch (error) {
      toast.error('Failed to load chat');
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !chatGroup) return;
    try {
      const res = await axios.post(`${API}/chat/messages/send`, {
        group_id: chatGroup.id,
        content: newMessage,
        sender_id: user?.id,
        sender_name: profile?.name || user?.name,
        sender_role: 'student'
      });
      setChatMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.subject || !complaintForm.description) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await axios.post(`${API}/complaints/create`, {
        student_id: user?.id,
        student_name: profile?.name || user?.name,
        class_id: profile?.class_id,
        class_name: profile?.class_name,
        school_id: profile?.school_id,
        ...complaintForm
      });
      toast.success('Complaint submitted successfully');
      setShowComplaintDialog(false);
      setComplaintForm({ complaint_to: 'teacher', category: 'academic', subject: '', description: '', is_anonymous: false });
    } catch (error) {
      toast.error('Failed to submit complaint');
    }
  };

  const openActivities = async () => {
    try {
      const res = await axios.get(`${API}/activities/student/${user?.id}`);
      setMyActivities(res.data.activities || []);
      setShowActivitiesDialog(true);
    } catch (error) {
      setMyActivities([]);
      setShowActivitiesDialog(true);
    }
  };

  const handlePayFees = useCallback(async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setPaymentProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway loading failed');
        setPaymentProcessing(false);
        return;
      }
      const orderRes = await axios.post(`${API}/razorpay/create-order`, {
        amount: Math.round(Number(paymentAmount) * 100),
        student_id: user?.id,
        student_name: profile?.name || user?.name,
        school_id: profile?.school_id || 'default',
        fee_type: 'tuition',
        description: `Fee Payment - ${profile?.name}`
      });
      const { order_id, key_id, amount } = orderRes.data;
      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        name: 'Schooltino',
        description: `Fee Payment - ${profile?.class_name}`,
        order_id: order_id,
        handler: async (response) => {
          try {
            await axios.post(`${API}/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              student_id: user?.id,
              school_id: profile?.school_id || 'default'
            });
            toast.success('Payment successful!');
            setShowPaymentDialog(false);
            setPaymentAmount('');
          } catch (verifyError) {
            toast.error('Payment verification failed. Please contact school.');
          }
        },
        prefill: {
          name: profile?.name || user?.name,
          email: user?.email || '',
          contact: profile?.mobile || ''
        },
        theme: { color: '#3B82F6' },
        modal: { ondismiss: () => { setPaymentProcessing(false); } }
      };
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setPaymentProcessing(false);
    }
  }, [paymentAmount, user, profile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTab = (tabId) => {
    setExpandedTabs(prev =>
      prev.includes(tabId)
        ? prev.filter(t => t !== tabId)
        : [...prev, tabId]
    );
  };

  const pendingHomework = homework.filter(h => h.status === 'pending').length;
  const unreadNotices = notices.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 bg-white rounded-xl border border-gray-200">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Account Blocked</h1>
          <p className="text-gray-600 mb-6">Please contact school office.</p>
          <Button onClick={handleLogout} variant="outline" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    );
  }

  const tabSections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: School,
      color: '#3B82F6',
      badge: null,
      content: (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-xl font-bold text-blue-700">{attendance.present}%</p>
              <p className="text-xs text-blue-500">Attendance</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
              <p className="text-xl font-bold text-amber-700">{pendingHomework}</p>
              <p className="text-xs text-amber-500">Homework</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
              <p className="text-xl font-bold text-red-700">{notices.length}</p>
              <p className="text-xs text-red-500">Notices</p>
            </div>
          </div>
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
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-4">
          {[
            { icon: Award, label: 'Admit Card', color: '#3B82F6', action: () => setShowAdmitCardDialog(true) },
            { icon: Wallet, label: 'Pay Fees', color: '#10B981', action: () => setShowPaymentDialog(true) },
            { icon: MessageCircle, label: 'Class Chat', color: '#3B82F6', action: () => openClassChat() },
            { icon: AlertOctagon, label: 'Complaint', color: '#EF4444', action: () => setShowComplaintDialog(true) },
            { icon: Trophy, label: 'Activities', color: '#F59E0B', action: () => openActivities() },
            { icon: CalendarDays, label: 'Leave', color: '#8B5CF6', action: () => setShowLeaveDialog(true) },
            { icon: Brain, label: 'AI Help', color: '#8B5CF6', action: () => setShowAIHelper(true) },
            { icon: User, label: 'Profile', color: '#06B6D4', action: () => setShowProfileDialog(true) },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="flex flex-col items-center p-2 md:p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-1 md:mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${item.color}12` }}>
                <item.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: item.color }} />
              </div>
              <span className="text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'notices',
      label: 'Notices',
      icon: Bell,
      color: '#EF4444',
      badge: unreadNotices > 0 ? `${unreadNotices} new` : null,
      content: (
        <div className="p-4 space-y-2">
          {notices.slice(0, 3).map((notice) => (
            <div
              key={notice.id}
              onClick={() => { setSelectedNotice(notice); setShowNoticeDialog(true); }}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                notice.priority === 'high' ? 'bg-red-50 border border-red-100' : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{notice.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{notice.content}</p>
                </div>
                {notice.priority === 'high' && (
                  <Badge className="bg-red-50 text-red-600 border border-red-100 text-[10px] rounded-full">Important</Badge>
                )}
              </div>
            </div>
          ))}
          {notices.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">No notices yet</p>
          )}
        </div>
      )
    },
    {
      id: 'homework',
      label: 'Homework',
      icon: BookOpen,
      color: '#F59E0B',
      badge: pendingHomework > 0 ? `${pendingHomework} pending` : null,
      content: (
        <div className="p-4 space-y-2">
          {homework.slice(0, 3).map((hw) => (
            <div key={hw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="font-medium text-gray-800 text-sm">{hw.subject}</p>
                <p className="text-xs text-gray-500">{hw.topic}</p>
              </div>
              <div className="text-right">
                <Badge className={hw.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100 rounded-full' : 'bg-green-50 text-green-600 border border-green-100 rounded-full'}>
                  {hw.status === 'pending' ? 'Pending' : 'Done'}
                </Badge>
                <p className="text-[10px] text-gray-400 mt-1">
                  Due: {new Date(hw.due_date).toLocaleDateString('hi-IN')}
                </p>
              </div>
            </div>
          ))}
          {homework.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">No homework assigned</p>
          )}
        </div>
      )
    },
    {
      id: 'syllabus',
      label: 'Syllabus Progress',
      icon: ClipboardList,
      color: '#10B981',
      badge: null,
      content: (
        <div className="p-4 space-y-3">
          {syllabus.map((subject, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{subject.subject}</span>
                <span className="text-gray-500">{subject.completed}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 border border-gray-100">
                <div 
                  className={`h-2 rounded-full ${
                    idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-600'
                  }`}
                  style={{ width: `${subject.completed}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">Current: {subject.current}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'exams',
      label: 'Online Exams',
      icon: FileText,
      color: '#6366F1',
      badge: null,
      content: (
        <div className="p-4">
          <button 
            onClick={() => navigate('/app/exams')}
            className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">Take Online Exam</p>
                <p className="text-xs text-gray-500">Practice tests available</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      )
    },
    {
      id: 'ai_helper',
      label: 'StudyTino AI',
      icon: Brain,
      color: '#8B5CF6',
      badge: null,
      content: (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">StudyTino AI</p>
              <p className="text-xs text-gray-400">Your personal study assistant</p>
            </div>
          </div>
          <Button onClick={() => setVoiceModalOpen(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            <Mic className="w-4 h-4 mr-2" />
            Ask Tino AI
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="studytino-dashboard">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-base">{profile?.name || 'Student'}</h1>
                <p className="text-xs text-gray-400">{profile?.class_name || 'Class'} - {profile?.school_name || 'School'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setVoiceModalOpen(true)} className="text-blue-500">
                <Mic className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileDialog(true)}>
                <Settings className="w-5 h-5 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-2 pb-20">
        <div className="mb-4">
          <p className="text-gray-400 text-sm">{getGreeting()},</p>
          <h2 className="text-2xl font-bold text-gray-800">{profile?.name?.split(' ')[0] || 'Student'}!</h2>
          <p className="text-xs text-gray-500 mt-1">{dateStr}</p>
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
            { icon: Home, label: 'Home', active: true },
            { icon: BookOpen, label: 'Study', action: () => navigate('/app/exams') },
            { icon: Bell, label: 'Notices' },
            { icon: Wallet, label: 'Fees', action: () => setShowPaymentDialog(true) },
            { icon: Brain, label: 'AI', action: () => setVoiceModalOpen(true) },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.action || undefined}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                item.active ? 'text-blue-500 bg-blue-50' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-800">Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium">Leave Type</label>
              <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 px-3 mt-1 text-gray-700">
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">From</label>
                <Input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm(f => ({ ...f, from_date: e.target.value }))} className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">To</label>
                <Input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm(f => ({ ...f, to_date: e.target.value }))} className="border-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">Reason</label>
              <Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Enter reason..." className="border-gray-200" />
            </div>
            <Button onClick={handleApplyLeave} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
              <Send className="w-4 h-4 mr-2" /> Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notice Details</DialogTitle>
          </DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">{selectedNotice.title}</h3>
              <p className="text-gray-600">{selectedNotice.content}</p>
              <p className="text-sm text-gray-400">Posted: {new Date(selectedNotice.created_at).toLocaleDateString('hi-IN')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-800">My Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">{profile?.name}</p>
                <p className="text-sm text-gray-400">{profile?.class_name}</p>
              </div>
            </div>
            <div className="space-y-2 p-4 bg-gray-50 rounded-xl text-sm border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">Student ID</span>
                <span className="font-medium text-gray-700">{profile?.student_id}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-500">Admission No</span>
                <span className="font-medium text-gray-700">{profile?.admission_no}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-500">Contact</span>
                <span className="font-medium text-gray-700">{profile?.mobile}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIHelper} onOpenChange={setShowAIHelper}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-500" />
              </div>
              StudyTino AI Helper
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Ask any study-related question!</p>
            <Button onClick={() => { setShowAIHelper(false); setVoiceModalOpen(true); }} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
              <Mic className="w-4 h-4 mr-2" /> Talk to Tino AI
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-500" />
              </div>
              {chatGroup?.name || 'Class Chat'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                    msg.sender_id === user?.id ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.sender_id !== user?.id && <p className="text-xs font-medium text-blue-600 mb-1">{msg.sender_name}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} className="border-gray-200" />
            <Button onClick={sendChatMessage} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-red-50 rounded flex items-center justify-center">
                <AlertOctagon className="w-4 h-4 text-red-500" />
              </div>
              Submit Complaint
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitComplaint} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Complaint To</Label>
              <select value={complaintForm.complaint_to} onChange={(e) => setComplaintForm(prev => ({ ...prev, complaint_to: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-700">
                <option value="teacher">Class Teacher</option>
                <option value="admin">Admin/Principal</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Category</Label>
              <select value={complaintForm.category} onChange={(e) => setComplaintForm(prev => ({ ...prev, category: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-700">
                <option value="academic">Academic Issues</option>
                <option value="bullying">Bullying/Harassment</option>
                <option value="facilities">Facilities</option>
                <option value="teacher">Teacher Related</option>
                <option value="fees">Fees Related</option>
                <option value="transport">Transport</option>
                <option value="food">Food/Canteen</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Subject</Label>
              <Input value={complaintForm.subject} onChange={(e) => setComplaintForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Brief subject..." className="border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Description</Label>
              <Textarea value={complaintForm.description} onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe in detail..." rows={3} className="border-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anonymous" checked={complaintForm.is_anonymous} onChange={(e) => setComplaintForm(prev => ({ ...prev, is_anonymous: e.target.checked }))} className="rounded border-gray-200" />
              <label htmlFor="anonymous" className="text-sm text-gray-600">Submit Anonymously</label>
            </div>
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">Submit Complaint</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivitiesDialog} onOpenChange={setShowActivitiesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-amber-50 rounded flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              My Activities
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {myActivities.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No activities found</p>
            ) : (
              myActivities.map((act, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800">{act.title || act.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{act.description || act.type}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-green-50 rounded flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-500" />
              </div>
              Pay Fees Online
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-gray-600 font-medium">Amount (INR)</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount..." className="mt-1 border-gray-200" min="1" />
            </div>
            <Button onClick={handlePayFees} disabled={paymentProcessing} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
              {paymentProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {paymentProcessing ? 'Processing...' : 'Pay Now'}
            </Button>
            <p className="text-xs text-center text-gray-400">Secured by Razorpay</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdmitCardDialog} onOpenChange={setShowAdmitCardDialog}>
        <DialogContent className="max-w-2xl bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                <Award className="w-4 h-4 text-blue-500" />
              </div>
              Admit Card
            </DialogTitle>
          </DialogHeader>
          <AdmitCardSection studentId={user?.id} profile={profile} />
        </DialogContent>
      </Dialog>

      <VoiceAssistantFAB />
    </div>
  );
}
