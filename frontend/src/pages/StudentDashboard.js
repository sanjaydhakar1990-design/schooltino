/**
 * StudyTino Dashboard - Student Portal
 * Simple, Clean, Light Theme - Mobile First
 * Inspired by: MyLeadingCampus, BloomByte
 */
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
  Download, LogOut, School, ChevronRight, Search, Settings, 
  FileText, CalendarDays, AlertTriangle, Loader2, Brain, 
  Send, CreditCard, Wallet, Mic, Phone, Lock, Home,
  Eye, Paperclip, Star, ClipboardList, MessageCircle, Users,
  Trophy, Activity, AlertOctagon, Award
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceAssistantFAB from '../components/VoiceAssistantFAB';
import AdmitCardSection from '../components/AdmitCardSection';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Load Razorpay script
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
  const [showAdmitCardDialog, setShowAdmitCardDialog] = useState(false);
  
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
  
  // Payment State
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingFees, setPendingFees] = useState(null);
  
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

  // Open Class Chat
  const openClassChat = async () => {
    try {
      // Get or create class group
      const res = await axios.get(`${API}/chat/groups/class/${profile?.class_id}?school_id=${profile?.school_id}`);
      setChatGroup(res.data);
      
      // Load messages
      const msgRes = await axios.get(`${API}/chat/messages/${res.data.id}?limit=50`);
      setChatMessages(msgRes.data.messages || []);
      
      setShowChatDialog(true);
    } catch (error) {
      toast.error('Failed to load chat');
    }
  };

  // Send Chat Message
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

  // Submit Complaint
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
      setComplaintForm({
        complaint_to: 'teacher',
        category: 'academic',
        subject: '',
        description: '',
        is_anonymous: false
      });
    } catch (error) {
      toast.error('Failed to submit complaint');
    }
  };

  // Open Activities
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

  // Razorpay Payment Handler
  const handlePayFees = useCallback(async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setPaymentProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Payment gateway loading failed');
        setPaymentProcessing(false);
        return;
      }

      // Create order
      const orderRes = await axios.post(`${API}/razorpay/create-order`, {
        amount: Math.round(Number(paymentAmount) * 100), // Convert to paise
        student_id: user?.id,
        student_name: profile?.name || user?.name,
        school_id: profile?.school_id || 'default',
        fee_type: 'tuition',
        description: `Fee Payment - ${profile?.name}`
      });

      const { order_id, key_id, amount } = orderRes.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        name: 'Schooltino',
        description: `Fee Payment - ${profile?.class_name}`,
        order_id: order_id,
        handler: async (response) => {
          try {
            // Verify payment
            await axios.post(`${API}/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              student_id: user?.id,
              school_id: profile?.school_id || 'default'
            });
            
            toast.success('🎉 Payment successful!');
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
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
          }
        }
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
      {/* Header - Responsive */}
      <header className="sticky top-0 z-50 bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base md:text-lg">{profile?.name || 'Student'}</h1>
                <p className="text-xs md:text-sm text-slate-500">{profile?.class_name || 'Class'} • {profile?.school_name || 'School'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
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

      <main className="max-w-4xl mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6 pb-20">
        {/* Welcome Card - Responsive */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-amber-100 text-sm">{getGreeting()}</p>
                <h2 className="text-xl md:text-2xl font-bold mt-1">{profile?.name?.split(' ')[0] || 'Student'}!</h2>
                <p className="text-amber-100 text-sm mt-1">{dateStr}</p>
              </div>
              
              {/* Quick Stats - Responsive Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-0">
                <div className="bg-white/20 rounded-lg p-2 md:p-4 text-center">
                  <p className="text-xl md:text-2xl font-bold">{attendance.present}%</p>
                  <p className="text-xs text-amber-100">Attendance</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2 md:p-4 text-center">
                  <p className="text-xl md:text-2xl font-bold">{pendingHomework}</p>
                  <p className="text-xs text-amber-100">Homework</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2 md:p-4 text-center">
                  <p className="text-xl md:text-2xl font-bold">{notices.length}</p>
                  <p className="text-xs text-amber-100">Notices</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Responsive Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
          {[
            { icon: Award, label: 'Admit Card', color: 'bg-indigo-600', action: () => setShowAdmitCardDialog(true) },
            { icon: Wallet, label: 'Pay Fees', color: 'bg-green-500', action: () => setShowPaymentDialog(true) },
            { icon: MessageCircle, label: 'Class Chat', color: 'bg-blue-500', action: () => openClassChat() },
            { icon: AlertOctagon, label: 'Complaint', color: 'bg-rose-500', action: () => setShowComplaintDialog(true) },
            { icon: Trophy, label: 'Activities', color: 'bg-amber-500', action: () => openActivities() },
            { icon: CalendarDays, label: 'Leave', color: 'bg-purple-500', action: () => setShowLeaveDialog(true) },
            { icon: Brain, label: 'AI Help', color: 'bg-violet-500', action: () => setShowAIHelper(true) },
            { icon: User, label: 'Profile', color: 'bg-teal-500', action: () => setShowProfileDialog(true) },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action || (() => navigate(item.path))}
              className="flex flex-col items-center p-2 md:p-3 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all"
              data-testid={`quick-action-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 ${item.color} rounded-xl flex items-center justify-center mb-1 md:mb-2`}>
                <item.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-[10px] md:text-xs font-medium text-slate-700 text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Two Column Layout for PC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Notices Section */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 md:p-5">
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
                {notices.length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-sm">No notices yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Homework Section */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 md:p-5">
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
                {homework.length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-sm">No homework assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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

      {/* Class Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              {chatGroup?.name || 'Class Chat'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-lg">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                    msg.sender_id === user?.id 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-white border rounded-bl-sm'
                  }`}>
                    {msg.sender_id !== user?.id && (
                      <p className="text-xs font-medium text-blue-600 mb-1">{msg.sender_name}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <Button onClick={sendChatMessage} className="bg-blue-500 hover:bg-blue-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              Submit Complaint
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitComplaint} className="space-y-4">
            <div className="space-y-2">
              <Label>Complaint To</Label>
              <select
                value={complaintForm.complaint_to}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, complaint_to: e.target.value }))}
                className="w-full h-10 rounded-lg border px-3"
              >
                <option value="teacher">Class Teacher</option>
                <option value="admin">Admin/Principal</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={complaintForm.category}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 rounded-lg border px-3"
              >
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
              <Label>Subject *</Label>
              <Input
                value={complaintForm.subject}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief title of your complaint"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={complaintForm.description}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your complaint in detail..."
                rows={4}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={complaintForm.is_anonymous}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="anonymous" className="text-sm text-slate-600">Submit anonymously</label>
            </div>
            <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600">
              Submit Complaint
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activities Dialog */}
      <Dialog open={showActivitiesDialog} onOpenChange={setShowActivitiesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              My Activities & Sports
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {myActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>You are not enrolled in any activities yet.</p>
                <p className="text-sm mt-2">Ask your teacher to enroll you!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myActivities.map((activity, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-xs text-slate-500">{activity.category} • {activity.schedule}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              Pay School Fees
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-800 font-medium">Secure Payment via Razorpay</p>
              <p className="text-xs text-green-600 mt-1">UPI, Cards, Net Banking accepted</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount (₹)</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount to pay"
                className="text-lg font-semibold"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setPaymentAmount(String(amt))}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
            
            <Button 
              onClick={handlePayFees}
              disabled={paymentProcessing || !paymentAmount}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {paymentProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{paymentAmount ? Number(paymentAmount).toLocaleString() : '0'}
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-400">
              Powered by Razorpay • 100% Secure
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Assistant */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
}
