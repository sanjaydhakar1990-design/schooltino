import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Send, CreditCard, Wallet, Phone, Lock, Home,
  Eye, EyeOff, Paperclip, Star, ClipboardList, MessageCircle, Users,
  Trophy, Activity, AlertOctagon, Award, Zap, Key, Edit, Mail, Shield,
  ChevronLeft,
  ShoppingBag, Video, Rss, Heart, Share2, Play, Plus, ArrowUpRight, ArrowDownLeft, IndianRupee, Store
} from 'lucide-react';
import { toast } from 'sonner';
import AdmitCardSection from '../components/AdmitCardSection';
import { GlobalWatermark } from '../components/SchoolLogoWatermark';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

const SortIcon = () => (
  <span className="inline-flex flex-col ml-1 -space-y-1 opacity-40">
    <span className="text-[8px] leading-none">&#9650;</span>
    <span className="text-[8px] leading-none">&#9660;</span>
  </span>
);

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StudyTinoDashboard() {
  const { t } = useTranslation();
  const { user, logout, schoolData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [homework, setHomework] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [showActivitiesDialog, setShowActivitiesDialog] = useState(false);
  const [showAdmitCardDialog, setShowAdmitCardDialog] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatGroup, setChatGroup] = useState(null);
  
  const [complaintForm, setComplaintForm] = useState({
    complaint_to: 'teacher', category: 'academic', subject: '', description: '', is_anonymous: false
  });
  const [myActivities, setMyActivities] = useState([]);
  
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('free');
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [upiPaymentMode, setUpiPaymentMode] = useState('upi');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [myPayments, setMyPayments] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'sick', from_date: '', to_date: '', reason: '' });
  const [isBlocked, setIsBlocked] = useState(false);

  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletAddAmount, setWalletAddAmount] = useState('');
  const [pendingFees, setPendingFees] = useState(0);

  const [showLiveClassDialog, setShowLiveClassDialog] = useState(false);
  const [liveClasses, setLiveClasses] = useState([]);

  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedComment, setFeedComment] = useState('');

  const [showEStoreDialog, setShowEStoreDialog] = useState(false);
  const [storeItems, setStoreItems] = useState([]);

  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleStudentChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all fields'); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setChangingPassword(true);
    try {
      const formData = new FormData();
      formData.append('old_password', passwordForm.oldPassword);
      formData.append('new_password', passwordForm.newPassword);
      const res = await fetch(`${API}/student/change-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password changed successfully!');
        setShowPasswordSection(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.detail || 'Failed to change password');
      }
    } catch (error) { toast.error('Error changing password'); }
    finally { setChangingPassword(false); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

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
        if (data.attendance_summary) {
          setAttendance({ present: data.attendance_summary.percentage || 0, total: data.attendance_summary.total || 0 });
        }
        if (data.fee_status) {
          setPendingFees(data.fee_status.pending || 0);
        }
        if (data.recent_notices) {
          setNotices(data.recent_notices);
        }
      }
      setNotices(prev => prev.length > 0 ? prev : (noticesRes.status === 'fulfilled' ? (noticesRes.value.data || []) : []));
      setHomework(homeworkRes.status === 'fulfilled' ? (homeworkRes.value.data || []) : []);
      setSyllabus([]);
    } catch (error) { console.error('Dashboard fetch error:', error); } finally { setLoading(false); }
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.reason) { toast.error('Please fill required fields'); return; }
    try { await axios.post(`${API}/student/leaves`, leaveForm); toast.success('Leave application submitted!'); setShowLeaveDialog(false); } catch (error) { toast.error('Failed to apply leave'); }
  };

  const openClassChat = async () => {
    try {
      const res = await axios.get(`${API}/chat/groups/class/${profile?.class_id}?school_id=${profile?.school_id}`);
      setChatGroup(res.data);
      const msgRes = await axios.get(`${API}/chat/messages/${res.data.id}?limit=50`);
      setChatMessages(msgRes.data.messages || []);
      setShowChatDialog(true);
    } catch (error) { toast.error('Failed to load chat'); }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !chatGroup) return;
    try {
      const res = await axios.post(`${API}/chat/messages/send`, { group_id: chatGroup.id, content: newMessage, sender_id: user?.id, sender_name: profile?.name || user?.name, sender_role: 'student' });
      setChatMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
    } catch (error) { toast.error('Failed to send message'); }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.subject || !complaintForm.description) { toast.error('Please fill all fields'); return; }
    try {
      await axios.post(`${API}/complaints/create`, { student_id: user?.id, student_name: profile?.name || user?.name, class_id: profile?.class_id, class_name: profile?.class_name, school_id: profile?.school_id, ...complaintForm });
      toast.success('Complaint submitted successfully');
      setShowComplaintDialog(false);
      setComplaintForm({ complaint_to: 'teacher', category: 'academic', subject: '', description: '', is_anonymous: false });
    } catch (error) { toast.error('Failed to submit complaint'); }
  };

  const openActivities = async () => {
    try { const res = await axios.get(`${API}/activities/student/${user?.id}`); setMyActivities(res.data.activities || []); setShowActivitiesDialog(true); } catch (error) { setMyActivities([]); setShowActivitiesDialog(true); }
  };

  const handlePayFees = useCallback(async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) { toast.error('Please enter a valid amount'); return; }
    setPaymentProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) { toast.error('Payment gateway loading failed'); setPaymentProcessing(false); return; }
      const orderRes = await axios.post(`${API}/razorpay/create-order`, { amount: Math.round(Number(paymentAmount) * 100), student_id: user?.id, student_name: profile?.name || user?.name, school_id: profile?.school_id || 'default', fee_type: 'tuition', description: `Fee Payment - ${profile?.name}` });
      const { order_id, key_id, amount } = orderRes.data;
      const options = {
        key: key_id, amount, currency: 'INR', name: 'Schooltino', description: `Fee Payment - ${profile?.class_name}`, order_id,
        handler: async (response) => {
          try { await axios.post(`${API}/razorpay/verify-payment`, { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, student_id: user?.id, school_id: profile?.school_id || 'default' }); toast.success('Payment successful!'); setShowPaymentDialog(false); setPaymentAmount(''); } catch (verifyError) { toast.error('Payment verification failed. Please contact school.'); }
        },
        prefill: { name: profile?.name || user?.name, email: user?.email || '', contact: profile?.mobile || '' },
        theme: { color: '#3B82F6' },
        modal: { ondismiss: () => { setPaymentProcessing(false); } }
      };
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) { toast.error('Failed to initiate payment'); } finally { setPaymentProcessing(false); }
  }, [paymentAmount, user, profile]);

  const fetchPaymentSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [settingsRes, paymentsRes] = await Promise.allSettled([
        axios.get(`${API}/school/payment-settings?school_id=${profile?.school_id || user?.school_id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/parent/fee-details/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (settingsRes.status === 'fulfilled') setPaymentSettings(settingsRes.value.data);
      if (paymentsRes.status === 'fulfilled') setMyPayments(paymentsRes.value.data?.payment_history || []);
    } catch (e) {}
  }, [profile, user]);

  const openPaymentDialog = useCallback(() => {
    fetchPaymentSettings();
    setShowPaymentDialog(true);
    setPaymentMode('free');
    setScreenshotFile(null);
    setScreenshotPreview('');
    setTransactionId('');
    setPaymentAmount('');
  }, [fetchPaymentSettings]);

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFreePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) { toast.error('Please enter amount'); return; }
    if (!transactionId.trim()) { toast.error('Please enter UPI Transaction ID / Reference Number'); return; }
    setPaymentProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let screenshotUrl = null;
      if (screenshotFile) {
        const formData = new FormData();
        formData.append('file', screenshotFile);
        formData.append('school_id', profile?.school_id || '');
        const uploadRes = await axios.post(`${API}/upload/photo`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
        screenshotUrl = uploadRes.data.url || uploadRes.data.photo_url;
      }
      await axios.post(`${API}/parent/record-payment`, {
        student_id: user?.id,
        amount: Number(paymentAmount),
        payment_mode: upiPaymentMode,
        transaction_id: transactionId.trim(),
        payer_name: profile?.father_name || profile?.name || user?.name,
        remarks: paymentRemarks.trim() || `Fee payment via ${upiPaymentMode.toUpperCase()}`,
        screenshot_url: screenshotUrl
      }, { headers });
      toast.success('Payment submitted! Admin will verify and update your fees.');
      setShowPaymentDialog(false);
      setPaymentAmount(''); setTransactionId(''); setScreenshotFile(null); setScreenshotPreview(''); setPaymentRemarks('');
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to submit payment'); }
    finally { setPaymentProcessing(false); }
  };

  const openWallet = async () => {
    try {
      const res = await axios.get(`${API}/student/wallet?student_id=${user?.id}`);
      setWalletBalance(res.data.balance || 0);
      setWalletTransactions(res.data.transactions || []);
    } catch (error) {
      setWalletBalance(0);
      setWalletTransactions([]);
    }
    setShowWalletDialog(true);
  };

  const addWalletMoney = async () => {
    if (!walletAddAmount || isNaN(walletAddAmount) || Number(walletAddAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await axios.post(`${API}/student/wallet/add`, { student_id: user?.id, amount: Number(walletAddAmount) });
      toast.success(`₹${walletAddAmount} added to wallet!`);
      openWallet();
      setWalletAddAmount('');
    } catch (error) {
      toast.error('Wallet feature coming soon');
    }
  };

  const openLiveClasses = async () => {
    try {
      const res = await axios.get(`${API}/student/live-classes`);
      const classes = res.data.classes || res.data || [];
      setLiveClasses(Array.isArray(classes) ? classes : []);
    } catch (error) {
      setLiveClasses([]);
    }
    setShowLiveClassDialog(true);
  };

  const openSchoolFeed = async () => {
    try {
      const res = await axios.get(`${API}/school-feed`);
      setFeedPosts(res.data.posts || res.data || []);
    } catch (error) {
      setFeedPosts([]);
    }
    setShowFeedDialog(true);
  };

  const handleLikeFeedPost = (postId) => {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    axios.post(`${API}/school-feed/${postId}/like`).catch(() => {});
  };

  const handleCommentOnPost = (postId) => {
    if (!feedComment.trim()) return;
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { id: Date.now().toString(), author: profile?.name || 'Student', text: feedComment }] } : p));
    axios.post(`${API}/school-feed/${postId}/comment`, { text: feedComment }).catch(() => {});
    setFeedComment('');
  };

  const handleSharePost = (post) => {
    if (navigator.share) {
      navigator.share({ title: `${post.author} - School Feed`, text: post.content }).catch(() => {});
    } else {
      navigator.clipboard.writeText(post.content);
      toast.success('Post copied to clipboard!');
    }
  };

  const openEStore = async () => {
    try {
      const res = await axios.get(`${API}/e-store/items`);
      setStoreItems(res.data.items || res.data || []);
    } catch (error) {
      setStoreItems([]);
    }
    setShowEStoreDialog(true);
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/tino-ai/chat`, { message: aiInput, user_id: user?.id, school_id: profile?.school_id || user?.school_id, language: 'hi' });
      setAiMessages(prev => [...prev, { role: 'assistant', content: res.data.response || res.data.message || 'I can help you with your studies! Try asking me about any subject.' }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Could not connect. Please try again.' }]);
    } finally { setAiLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const pendingHomework = homework.filter(h => h.status === 'pending').length;

  if (loading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>);
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 bg-white rounded-xl border border-gray-200">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Account Blocked</h1>
          <p className="text-gray-600 mb-6">Please contact school office.</p>
          <Button onClick={handleLogout} variant="outline" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"><LogOut className="w-4 h-4 mr-2" /> {t('logout')}</Button>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: t('attendance'), value: `${attendance.present}%`, icon: CheckCircle, subtext: 'Your attendance percentage', bgColor: 'bg-green-50', textColor: 'text-green-500' },
    { label: t('homework'), value: pendingHomework, icon: BookOpen, subtext: 'Assignments due', bgColor: 'bg-amber-50', textColor: 'text-amber-500' },
    { label: t('notices'), value: notices.length, icon: Bell, subtext: 'School announcements', bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
    { label: t('subjects'), value: syllabus.length, icon: ClipboardList, subtext: 'Enrolled subjects', bgColor: 'bg-indigo-50', textColor: 'text-indigo-500' },
    { label: 'Syllabus Completed', value: `${Math.round(syllabus.reduce((a, b) => a + b.completed, 0) / (syllabus.length || 1))}%`, icon: Award, subtext: 'Overall syllabus progress', bgColor: 'bg-purple-50', textColor: 'text-purple-500' },
    { label: t('fees'), value: pendingFees > 0 ? '₹' + pendingFees.toLocaleString('en-IN') : '₹0', icon: Wallet, subtext: 'Pending fee balance', bgColor: 'bg-red-50', textColor: 'text-red-500' },
    { label: 'Activities', value: 0, icon: Trophy, subtext: 'Extra-curricular activities', bgColor: 'bg-orange-50', textColor: 'text-orange-500' },
    { label: t('exams'), value: 0, icon: FileText, subtext: 'Upcoming examinations', bgColor: 'bg-cyan-50', textColor: 'text-cyan-500' },
  ];

  const studentModuleCards = [
    { id: 'studyai', name: 'StudyAI', desc: 'AI-powered study assistant for homework help & learning.', icon: Brain, lightBg: 'bg-violet-50', iconColor: 'text-violet-600', action: () => setShowAIHelper(true) },
    { id: 'feetino', name: 'FeeTino', desc: 'Pay school fees online via UPI or Razorpay.', icon: Wallet, lightBg: 'bg-green-50', iconColor: 'text-green-600', action: () => openPaymentDialog() },
    { id: 'classchat', name: 'ClassChat', desc: 'Real-time chat with classmates & group discussions.', icon: MessageCircle, lightBg: 'bg-blue-50', iconColor: 'text-blue-600', action: () => openClassChat() },
    { id: 'admitcard', name: 'AdmitCard', desc: 'View & download exam admit cards instantly.', icon: Award, lightBg: 'bg-amber-50', iconColor: 'text-amber-600', action: () => setShowAdmitCardDialog(true) },
    { id: 'activities', name: 'Activities', desc: 'Track your extra-curricular activities & achievements.', icon: Trophy, lightBg: 'bg-red-50', iconColor: 'text-red-600', action: () => openActivities() },
    { id: 'wallet', name: 'My Wallet', desc: 'View balance, add money & track spending.', icon: IndianRupee, lightBg: 'bg-emerald-50', iconColor: 'text-emerald-600', action: () => openWallet() },
    { id: 'liveclass', name: 'Live Class', desc: 'Join live classes, view schedule & recordings.', icon: Video, lightBg: 'bg-pink-50', iconColor: 'text-pink-600', action: () => openLiveClasses() },
    { id: 'complaint', name: 'Complaint', desc: 'Submit a complaint to school administration.', icon: AlertOctagon, lightBg: 'bg-orange-50', iconColor: 'text-orange-600', action: () => setShowComplaintDialog(true) },
    { id: 'applyleave', name: 'Apply Leave', desc: 'Submit leave application for approval.', icon: CalendarDays, lightBg: 'bg-teal-50', iconColor: 'text-teal-600', action: () => setShowLeaveDialog(true) },
    { id: 'myprofile', name: 'My Profile', desc: 'View & manage your profile details.', icon: User, lightBg: 'bg-slate-50', iconColor: 'text-slate-600', action: () => setShowProfileDialog(true) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative" data-testid="studytino-dashboard">
      <GlobalWatermark />
      <header className="sticky top-0 z-50 relative" style={{zIndex: 50}}>
        {schoolData && (
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 py-1.5">
            <div className="max-w-5xl mx-auto flex items-center justify-between text-[10px]">
              <span className="font-medium truncate">{schoolData.name}</span>
              <div className="hidden sm:flex items-center gap-3 text-blue-200">
                {schoolData.phone && <span>{schoolData.phone}</span>}
                {schoolData.email && <span>{schoolData.email}</span>}
                {schoolData.board_type && <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-semibold">{schoolData.board_type}</span>}
              </div>
            </div>
          </div>
        )}
        <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-blue-100" />
              ) : (
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  {(profile?.name || 'S').charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-semibold text-gray-800 text-sm">{profile?.name || user?.name || 'Student'}</h1>
                <p className="text-xs text-gray-400">{profile?.class_name || 'Class'}{profile?.section ? ' - ' + profile.section : ''} | {profile?.student_id || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEStore()} className="hover:bg-gray-50 rounded-xl" title="E-Store"><ShoppingBag className="w-5 h-5 text-gray-400" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setShowProfileDialog(true)} className="hover:bg-gray-50 rounded-xl"><Settings className="w-5 h-5 text-gray-400" /></Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400 hover:bg-gray-50 rounded-xl"><LogOut className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-6 pb-24">
        <div className="flex items-center gap-2 text-sm">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
            <Home className="w-3.5 h-3.5" /> {t('home')}
          </button>
          <span className="text-gray-300">›</span>
          <span className="text-gray-500 text-xs">{t('dashboard')}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xl font-bold text-gray-900">Welcome, {profile?.name || 'Student'}!</h2>
          <p className="text-sm text-gray-500 mt-1">{profile?.class_name || 'Class'} • {profile?.school_name || 'School'}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-500 font-medium">{card.label}</span>
                <div className={`w-9 h-9 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-0.5">{card.value}</div>
              <div className="text-xs text-gray-400">{card.subtext}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
            <p className="text-sm text-gray-500 mt-1">Powerful tools crafted to enhance your learning experience.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {studentModuleCards.map((card) => (
              <div
                key={card.id}
                onClick={card.action}
                className="group cursor-pointer bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              >
                <div className={`w-12 h-12 ${card.lightBg} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{card.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>


        {homework.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('homework')}</h2>
              <p className="text-sm text-gray-500 mt-1">Pending and completed homework assignments.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Subject <SortIcon /></th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Topic <SortIcon /></th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Due Date <SortIcon /></th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {homework.map((hw) => (
                    <tr key={hw.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-800">{hw.subject}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{hw.topic}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(hw.due_date).toLocaleDateString('hi-IN')}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${hw.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                          {hw.status === 'pending' ? t('pending') : t('completed')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {syllabus.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Syllabus Progress</h2>
            <p className="text-sm text-gray-500 mt-1">Subject-wise syllabus completion status.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Subject <SortIcon /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Current Topic <SortIcon /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Progress <SortIcon /></th>
                </tr>
              </thead>
              <tbody>
                {syllabus.map((subject, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-800">{subject.subject}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{subject.current}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                          <div className={`h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'}`} style={{ width: `${subject.completed}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{subject.completed}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {notices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('notices')}</h2>
              <p className="text-sm text-gray-500 mt-1">Latest school announcements.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Title <SortIcon /></th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Content <SortIcon /></th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((notice) => (
                    <tr key={notice.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors cursor-pointer" onClick={() => { setSelectedNotice(notice); setShowNoticeDialog(true); }}>
                      <td className="px-5 py-3.5 text-sm text-gray-800">{notice.title}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell line-clamp-1">{notice.content}</td>
                      <td className="px-5 py-3.5 text-right">
                        {notice.priority === 'high' ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">Important</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-200">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50" style={{boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'}}>
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          {[
            { icon: Home, label: t('home'), active: true },
            { icon: BookOpen, label: 'Study', action: () => navigate('/app/exams') },
            { icon: Bell, label: t('notices') },
            { icon: Wallet, label: t('fees'), action: () => openPaymentDialog() },
            { icon: Brain, label: 'AI', action: () => setShowAIHelper(true) },
          ].map((item, idx) => (
            <button key={idx} onClick={item.action || undefined} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${item.active ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-base font-semibold text-gray-800">Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium">Leave Type</label>
              <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 px-3 mt-1 text-gray-700">
                <option value="sick">Sick Leave</option><option value="personal">Personal</option><option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-600 font-medium">From</label><Input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm(f => ({ ...f, from_date: e.target.value }))} className="border-gray-200" /></div>
              <div><label className="text-sm text-gray-600 font-medium">To</label><Input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm(f => ({ ...f, to_date: e.target.value }))} className="border-gray-200" /></div>
            </div>
            <div><label className="text-sm text-gray-600 font-medium">Reason</label><Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Enter reason..." className="border-gray-200" /></div>
            <Button onClick={handleApplyLeave} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg"><Send className="w-4 h-4 mr-2" /> Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Notice Details</DialogTitle></DialogHeader>
          {selectedNotice && (<div className="space-y-4"><h3 className="font-bold text-lg">{selectedNotice.title}</h3><p className="text-gray-600">{selectedNotice.content}</p><p className="text-sm text-gray-400">Posted: {new Date(selectedNotice.created_at).toLocaleDateString('hi-IN')}</p></div>)}
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={(v) => { setShowProfileDialog(v); if (!v) { setShowPasswordSection(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base font-semibold text-gray-800">{t('profile')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center"><User className="w-8 h-8 text-purple-500" /></div>
              <div>
                <p className="font-bold text-lg text-gray-800">{profile?.name}</p>
                <p className="text-sm text-gray-400">{profile?.class_name}{profile?.section ? ` - ${profile.section}` : ''}</p>
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-xl text-sm border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Student ID</span><span className="font-medium text-gray-700">{profile?.student_id}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Admission No</span><span className="font-medium text-gray-700">{profile?.admission_no}</span></div>
              {profile?.mobile && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</span><span className="font-medium text-gray-700">{profile.mobile}</span></div>}
              {profile?.email && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span><span className="font-medium text-gray-700">{profile.email}</span></div>}
              {profile?.father_name && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Father</span><span className="font-medium text-gray-700">{profile.father_name}</span></div>}
              {profile?.mother_name && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Mother</span><span className="font-medium text-gray-700">{profile.mother_name}</span></div>}
              {profile?.dob && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</span><span className="font-medium text-gray-700">{new Date(profile.dob).toLocaleDateString('en-IN')}</span></div>}
              {profile?.gender && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Gender</span><span className="font-medium text-gray-700 capitalize">{profile.gender}</span></div>}
              {profile?.blood_group && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Blood Group</span><span className="font-medium text-gray-700">{profile.blood_group}</span></div>}
              {profile?.address && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Address</span><span className="font-medium text-gray-700 text-right max-w-[60%]">{profile.address}</span></div>}
              {profile?.admission_date && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Admission Date</span><span className="font-medium text-gray-700">{new Date(profile.admission_date).toLocaleDateString('en-IN')}</span></div>}
              {profile?.aadhar_number && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Aadhar</span><span className="font-medium text-gray-700">{profile.aadhar_number}</span></div>}
              {profile?.category && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Category</span><span className="font-medium text-gray-700">{profile.category}</span></div>}
              {profile?.religion && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Religion</span><span className="font-medium text-gray-700">{profile.religion}</span></div>}
            </div>

            <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Change Password</span>
              </div>
              <Edit className="w-4 h-4 text-amber-400" />
            </button>

            {showPasswordSection && (
              <div className="space-y-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="relative">
                  <Input type={showOldPw ? 'text' : 'password'} placeholder="Current Password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})} className="pr-10" />
                  <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <div className="relative">
                  <Input type={showNewPw ? 'text' : 'password'} placeholder="New Password (min 6 chars)" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="pr-10" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <Input type="password" placeholder="Confirm New Password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                <Button onClick={handleStudentChangePassword} disabled={changingPassword} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  {changingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing...</> : 'Update Password'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIHelper} onOpenChange={setShowAIHelper}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-violet-50 rounded flex items-center justify-center"><Brain className="w-4 h-4 text-violet-500" /></div>
              Tino AI Study Helper
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
            {aiMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything about your studies!</p>
                <p className="text-xs mt-1 text-gray-300">Math, Science, English, Hindi & more</p>
              </div>
            ) : (
              aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask a study question..." onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()} className="border-gray-200" />
            <Button onClick={sendAiMessage} disabled={aiLoading} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"><Send className="w-4 h-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100"><DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800"><div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><MessageCircle className="w-4 h-4 text-blue-500" /></div>{chatGroup?.name || 'Class Chat'}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
            {chatMessages.length === 0 ? (<div className="text-center py-8 text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No messages yet. Start the conversation!</p></div>) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 ${msg.sender_id === user?.id ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'}`}>
                    {msg.sender_id !== user?.id && <p className="text-xs font-medium text-blue-600 mb-1">{msg.sender_name}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} className="border-gray-200" />
            <Button onClick={sendChatMessage} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"><Send className="w-4 h-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800"><div className="w-6 h-6 bg-red-50 rounded flex items-center justify-center"><AlertOctagon className="w-4 h-4 text-red-500" /></div>Submit Complaint</DialogTitle></DialogHeader>
          <form onSubmit={submitComplaint} className="space-y-4">
            <div className="space-y-2"><Label className="text-sm text-gray-600">Complaint To</Label><select value={complaintForm.complaint_to} onChange={(e) => setComplaintForm(prev => ({ ...prev, complaint_to: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-700"><option value="teacher">Class Teacher</option><option value="admin">Admin/Principal</option><option value="both">Both</option></select></div>
            <div className="space-y-2"><Label className="text-sm text-gray-600">Category</Label><select value={complaintForm.category} onChange={(e) => setComplaintForm(prev => ({ ...prev, category: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-200 px-3 text-gray-700"><option value="academic">Academic Issues</option><option value="bullying">Bullying/Harassment</option><option value="facilities">Facilities</option><option value="teacher">Teacher Related</option><option value="fees">Fees Related</option><option value="transport">Transport</option><option value="food">Food/Canteen</option><option value="other">Other</option></select></div>
            <div className="space-y-2"><Label className="text-sm text-gray-600">Subject</Label><Input value={complaintForm.subject} onChange={(e) => setComplaintForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Brief subject..." className="border-gray-200" /></div>
            <div className="space-y-2"><Label className="text-sm text-gray-600">Description</Label><Textarea value={complaintForm.description} onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe in detail..." rows={3} className="border-gray-200" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="anonymous" checked={complaintForm.is_anonymous} onChange={(e) => setComplaintForm(prev => ({ ...prev, is_anonymous: e.target.checked }))} className="rounded border-gray-200" /><label htmlFor="anonymous" className="text-sm text-gray-600">Submit Anonymously</label></div>
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">Submit Complaint</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivitiesDialog} onOpenChange={setShowActivitiesDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800"><div className="w-6 h-6 bg-amber-50 rounded flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-500" /></div>My Activities</DialogTitle></DialogHeader>
          <div className="space-y-3">{myActivities.length === 0 ? (<p className="text-center text-gray-400 py-6 text-sm">No activities found</p>) : (myActivities.map((act, idx) => (<div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200"><p className="font-medium text-gray-800">{act.title || act.name}</p><p className="text-sm text-gray-500 mt-1">{act.description || act.type}</p></div>)))}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center"><Wallet className="w-4 h-4 text-green-500" /></div>
              FeeTino - Pay Fees
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {pendingFees > 0 && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                <div><p className="text-xs text-red-500">Pending Fee</p><p className="text-xl font-bold text-red-600">₹{pendingFees.toLocaleString('en-IN')}</p></div>
                <button onClick={() => setShowPaymentHistory(!showPaymentHistory)} className="text-xs text-blue-500 hover:text-blue-700 underline">
                  {showPaymentHistory ? 'Hide' : 'View'} History
                </button>
              </div>
            )}

            {showPaymentHistory && myPayments.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {myPayments.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                    <div>
                      <p className="font-medium text-gray-700">₹{p.amount?.toLocaleString('en-IN')}</p>
                      <p className="text-gray-400">{p.payment_mode?.toUpperCase()} • {new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <Badge className={`text-[10px] ${p.status === 'verified' || p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status === 'verified' || p.status === 'paid' ? 'Paid' : p.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setPaymentMode('free')} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${paymentMode === 'free' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                UPI / QR (Free)
              </button>
              <button onClick={() => setPaymentMode('razorpay')} className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${paymentMode === 'razorpay' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                Razorpay (Online)
              </button>
            </div>

            {paymentMode === 'free' ? (
              <div className="space-y-3">
                {(paymentSettings?.upi_id || paymentSettings?.gpay_number || paymentSettings?.phonepe_number || paymentSettings?.paytm_number || paymentSettings?.qr_code_url) ? (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    {paymentSettings?.qr_code_url && (
                      <div className="flex justify-center mb-3">
                        <div className="bg-white p-2 rounded-xl border-2 border-blue-200 shadow-sm">
                          <img src={paymentSettings.qr_code_url} alt="School QR Code" className="w-44 h-44 rounded-lg object-contain" />
                        </div>
                      </div>
                    )}
                    {paymentSettings?.qr_code_url && <p className="text-[10px] text-center text-blue-500 mb-2">Scan QR code to pay, then fill details below</p>}
                    <p className="text-xs font-semibold text-blue-700 mb-2">School Payment Details:</p>
                    <div className="space-y-1.5 text-xs text-blue-800">
                      {paymentSettings?.upi_id && <p><span className="font-medium">UPI ID:</span> {paymentSettings.upi_id}</p>}
                      {paymentSettings?.gpay_number && <p><span className="font-medium">GPay:</span> {paymentSettings.gpay_number}</p>}
                      {paymentSettings?.phonepe_number && <p><span className="font-medium">PhonePe:</span> {paymentSettings.phonepe_number}</p>}
                      {paymentSettings?.paytm_number && <p><span className="font-medium">Paytm:</span> {paymentSettings.paytm_number}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <p className="text-xs text-yellow-700">School payment details not configured yet. Please pay directly to school and enter details below.</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium text-gray-600">Payment Mode</Label>
                  <select value={upiPaymentMode} onChange={(e) => setUpiPaymentMode(e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-500">
                    <option value="upi">UPI</option>
                    <option value="gpay">Google Pay</option>
                    <option value="phonepe">PhonePe</option>
                    <option value="paytm">Paytm</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600">Amount (₹)</Label>
                  <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount..." className="mt-1 border-gray-200" min="1" />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600">Transaction ID / Reference No.</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter UPI ref number..." className="mt-1 border-gray-200" />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600">Remarks / Note (Optional)</Label>
                  <textarea 
                    value={paymentRemarks} 
                    onChange={(e) => setPaymentRemarks(e.target.value)} 
                    placeholder="E.g., Paid for April month fees, Tuition fee for Term 2..." 
                    className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-500 resize-none" 
                    rows={2} 
                    maxLength={200}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5 text-right">{paymentRemarks.length}/200</p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600">Payment Screenshot (Optional)</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-green-400 transition-colors cursor-pointer" onClick={() => document.getElementById('screenshot-input').click()}>
                    {screenshotPreview ? (
                      <div className="relative">
                        <img src={screenshotPreview} alt="Screenshot" className="max-h-40 mx-auto rounded-lg" />
                        <button onClick={(e) => { e.stopPropagation(); setScreenshotFile(null); setScreenshotPreview(''); }} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Paperclip className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400">Tap to upload payment screenshot</p>
                        <p className="text-[10px] text-gray-300 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input id="screenshot-input" type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
                </div>

                <Button onClick={handleFreePayment} disabled={paymentProcessing} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg">
                  {paymentProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {paymentProcessing ? 'Submitting...' : 'Submit Payment'}
                </Button>
                <p className="text-[10px] text-center text-gray-400">Admin will verify your payment and update your fees</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600">Pay securely via Razorpay gateway. Supports Credit/Debit Card, Net Banking, UPI & Wallets.</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Amount (₹)</Label>
                  <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount..." className="mt-1 border-gray-200" min="1" />
                </div>
                <Button onClick={handlePayFees} disabled={paymentProcessing} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                  {paymentProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  {paymentProcessing ? 'Processing...' : 'Pay via Razorpay'}
                </Button>
                <p className="text-[10px] text-center text-gray-400">Secured by Razorpay • 2% transaction fee applies</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdmitCardDialog} onOpenChange={setShowAdmitCardDialog}>
        <DialogContent className="max-w-2xl bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3"><DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800"><div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center"><Award className="w-4 h-4 text-blue-500" /></div>Admit Card</DialogTitle></DialogHeader>
          <AdmitCardSection studentId={user?.id} profile={profile} />
        </DialogContent>
      </Dialog>

      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="max-w-md bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-emerald-50 rounded flex items-center justify-center"><IndianRupee className="w-4 h-4 text-emerald-500" /></div>
              My Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-3xl font-bold mt-1">₹{walletBalance.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-2">
              <Input type="number" value={walletAddAmount} onChange={(e) => setWalletAddAmount(e.target.value)} placeholder="Enter amount..." className="border-gray-200" min="1" />
              <Button onClick={addWalletMoney} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg whitespace-nowrap"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Transaction History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {walletTransactions.length === 0 ? (
                  <p className="text-center text-gray-400 py-4 text-sm">No transactions yet</p>
                ) : (
                  walletTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {txn.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-green-500" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">{txn.description}</p>
                          <p className="text-xs text-gray-400">{new Date(txn.date).toLocaleDateString('hi-IN')}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLiveClassDialog} onOpenChange={setShowLiveClassDialog}>
        <DialogContent className="max-w-lg bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-pink-50 rounded flex items-center justify-center"><Video className="w-4 h-4 text-pink-500" /></div>
              Live Classes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {liveClasses.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No live classes scheduled</p>
            ) : (
              liveClasses.map((cls) => (
                <div key={cls.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{cls.subject}</h4>
                      <p className="text-xs text-gray-500">{cls.topic}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls.status === 'live' ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : cls.status === 'upcoming' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {cls.status === 'live' ? '● LIVE' : cls.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Teacher: {cls.teacher} • {new Date(cls.scheduled_at).toLocaleString('hi-IN')}</p>
                  <div className="flex gap-2">
                    {cls.status === 'live' && cls.join_url && (
                      <Button size="sm" onClick={() => window.open(cls.join_url, '_blank')} className="bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg"><Play className="w-3 h-3 mr-1" /> Join Now</Button>
                    )}
                    {cls.status === 'completed' && cls.recording_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(cls.recording_url, '_blank')} className="text-xs border-gray-200 text-gray-600 rounded-lg"><Eye className="w-3 h-3 mr-1" /> View Recording</Button>
                    )}
                    {cls.status === 'upcoming' && (
                      <span className="text-xs text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1" /> Starts soon</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent className="max-w-lg h-[85vh] flex flex-col bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-cyan-50 rounded flex items-center justify-center"><Rss className="w-4 h-4 text-cyan-500" /></div>
              School Feed
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {feedPosts.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No posts yet</p>
            ) : (
              feedPosts.map((post) => (
                <div key={post.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{post.author}</p>
                        <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString('hi-IN')}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                    {post.image && <img src={post.image} alt="" className="w-full rounded-lg mb-3 max-h-48 object-cover" />}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                      <button onClick={() => handleLikeFeedPost(post.id)} className={`flex items-center gap-1.5 text-xs ${post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'} transition-colors`}>
                        <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} /> {post.likes}
                      </button>
                      <button onClick={() => handleSharePost(post)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors">
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MessageCircle className="w-4 h-4" /> {(post.comments || []).length}
                      </span>
                    </div>
                  </div>
                  {(post.comments || []).length > 0 && (
                    <div className="px-4 pb-3 space-y-2">
                      {post.comments.slice(-2).map((c) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><User className="w-3 h-3 text-gray-500" /></div>
                          <div className="bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 flex-1">
                            <span className="text-xs font-medium text-gray-700">{c.author}</span>
                            <p className="text-xs text-gray-500">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-4 pb-3 flex gap-2">
                    <Input value={feedComment} onChange={(e) => setFeedComment(e.target.value)} placeholder="Write a comment..." className="text-xs h-8 border-gray-200" onKeyPress={(e) => e.key === 'Enter' && handleCommentOnPost(post.id)} />
                    <Button size="sm" onClick={() => handleCommentOnPost(post.id)} className="bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs rounded-lg"><Send className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEStoreDialog} onOpenChange={setShowEStoreDialog}>
        <DialogContent className="max-w-lg bg-white rounded-xl border border-gray-200">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <div className="w-6 h-6 bg-orange-50 rounded flex items-center justify-center"><Store className="w-4 h-4 text-orange-500" /></div>
              School E-Store
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto py-2">
            {storeItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm col-span-2">No items available</p>
            ) : (
              storeItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-all">
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : <ShoppingBag className="w-8 h-8 text-gray-300" />}
                  </div>
                  <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{item.name}</h4>
                  <p className="text-xs text-gray-400 mb-2">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">₹{item.price}</span>
                    {item.in_stock ? (
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] h-7 px-2 rounded-lg" onClick={() => toast.success(`${item.name} added to cart!`)}>Buy</Button>
                    ) : (
                      <span className="text-[10px] text-red-500 font-medium">Out of Stock</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
