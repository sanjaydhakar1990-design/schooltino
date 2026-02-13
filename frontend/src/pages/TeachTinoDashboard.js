import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ChevronRight, AlertTriangle, Search,
  ChevronLeft, ChevronFirst, ChevronLast
} from 'lucide-react';
import { toast } from 'sonner';
import StaffPhotoUpload from '../components/StaffPhotoUpload';
import { GlobalWatermark } from '../components/SchoolLogoWatermark';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ITEMS_PER_PAGE = 5;

const SortIcon = () => (
  <span className="inline-flex flex-col ml-1 -space-y-1 opacity-40">
    <span className="text-[8px] leading-none">&#9650;</span>
    <span className="text-[8px] leading-none">&#9660;</span>
  </span>
);

export default function TeachTinoDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [myClasses, setMyClasses] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0, total: 0 });
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual', from_date: '', to_date: '', reason: ''
  });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });

  const [myRequests, setMyRequests] = useState([]);
  
  const isPrincipal = user?.role === 'principal' || user?.role === 'vice_principal';
  const canApproveLeave = isPrincipal || user?.role === 'director';

  useEffect(() => { fetchData(); fetchMyRequests(); }, []);

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/teacher/requests`, { headers: { Authorization: `Bearer ${token}` } });
      setMyRequests(res.data || []);
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, noticesRes, leavesRes] = await Promise.allSettled([
        axios.get(`${API}/classes?school_id=${user?.school_id}`),
        axios.get(`${API}/notices?limit=5`),
        axios.get(`${API}/leave/pending`)
      ]);
      if (classesRes.status === 'fulfilled') setMyClasses(classesRes.value.data?.slice(0, 6) || []);
      if (noticesRes.status === 'fulfilled') setRecentNotices(noticesRes.value.data?.slice(0, 5) || []);
      if (leavesRes.status === 'fulfilled') setPendingLeaves(leavesRes.value.data || []);
      setTodayAttendance({ present: 42, absent: 3, total: 45 });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/teachtino'); };

  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.reason) { toast.error('Please fill all fields'); return; }
    try {
      await axios.post(`${API}/leave/apply`, { ...leaveForm, school_id: user?.school_id });
      toast.success('Leave applied successfully!');
      setShowLeaveDialog(false);
      setLeaveForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
    } catch (error) { toast.error('Failed to apply leave'); }
  };

  const handleSendNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) { toast.error('Please fill all fields'); return; }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teacher/requests`, {
        request_type: 'notice',
        title: `Notice: ${noticeForm.title}`,
        description: noticeForm.content,
        data: { ...noticeForm, target_audience: ['students', 'parents'], priority: 'normal' }
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Notice submitted for admin approval! Admin will review and publish it.');
      setShowNoticeDialog(false);
      setNoticeForm({ title: '', content: '' });
      fetchMyRequests();
    } catch (error) { toast.error('Failed to submit notice request'); }
  };

  const handleApproveLeave = async (leaveId) => {
    try { await axios.post(`${API}/leave/${leaveId}/approve`); toast.success('Leave approved!'); fetchData(); } catch (error) { toast.error('Failed to approve'); }
  };

  const handleRejectLeave = async (leaveId) => {
    try { await axios.post(`${API}/leave/${leaveId}/reject`); toast.success('Leave rejected'); fetchData(); } catch (error) { toast.error('Failed to reject'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const statCards = [
    { label: t('classes'), value: myClasses.length, icon: BookOpen, subtext: 'Assigned class sections', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: t('present'), value: todayAttendance.present, icon: CheckCircle, subtext: 'Students present today', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { label: t('absent'), value: todayAttendance.absent, icon: XCircle, subtext: 'Students absent today', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
    { label: t('total_students'), value: todayAttendance.total, icon: Users, subtext: 'Across all your classes', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
    { label: t('leave'), value: pendingLeaves.length, icon: Calendar, subtext: 'Awaiting your approval', bgColor: 'bg-amber-50', iconColor: 'text-amber-500' },
    { label: t('notices'), value: recentNotices.length, icon: Bell, subtext: 'Published announcements', bgColor: 'bg-cyan-50', iconColor: 'text-cyan-500' },
    { label: t('exams'), value: 0, icon: FileText, subtext: 'Upcoming examinations', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
    { label: t('attendance'), value: todayAttendance.total > 0 ? `${Math.round((todayAttendance.present / todayAttendance.total) * 100)}%` : '0%', icon: BarChart3, subtext: 'Overall attendance percentage', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  ];

  const teacherModuleCards = [
    { id: 'smartroll', name: 'SmartRoll', desc: 'Automated attendance marking via biometric & AI face recognition.', icon: ClipboardCheck, image: '/images/smartroll.png', gradient: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50', iconColor: 'text-orange-600', action: () => navigate('/app/attendance') },
    { id: 'papergenie', name: 'PaperGenie', desc: 'Generates syllabus-based question papers instantly using AI.', icon: Sparkles, image: '/images/papergenie.png', gradient: 'from-pink-500 to-pink-600', lightBg: 'bg-pink-50', iconColor: 'text-pink-600', action: () => navigate('/app/ai-paper') },
    { id: 'classtino', name: 'ClassTino', desc: 'View & manage your assigned classes and schedules.', icon: BookOpen, image: '/images/classtino.png', gradient: 'from-emerald-500 to-emerald-600', lightBg: 'bg-emerald-50', iconColor: 'text-emerald-600', action: () => navigate('/app/classes') },
    { id: 'examtino', name: 'ExamTino', desc: 'Exam management, report cards & result processing.', icon: FileText, image: '/images/examtino.png', gradient: 'from-purple-500 to-purple-600', lightBg: 'bg-purple-50', iconColor: 'text-purple-600', action: () => navigate('/app/exam-report') },
    { id: 'tinoai', name: 'TinoAI', desc: 'AI Command Center - voice assistant & smart automation.', icon: Brain, image: '/images/tinoai.png', gradient: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50', iconColor: 'text-violet-600', action: () => navigate('/app/tino-ai') },
    { id: 'noticeboard', name: 'NoticeBoard', desc: 'Send announcements & notices to students and parents.', icon: Bell, image: '/images/noticeboard.png', gradient: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50', iconColor: 'text-blue-600', action: () => setShowNoticeDialog(true) },
  ];

  const quickModules = [
    { icon: ClipboardCheck, label: 'Mark Attendance', desc: 'Daily attendance tracking', action: () => navigate('/app/attendance') },
    { icon: Sparkles, label: 'AI Paper Generator', desc: 'Auto generate papers', action: () => navigate('/app/ai-paper') },
    { icon: Bell, label: 'Send Notice', desc: 'Send announcements', action: () => setShowNoticeDialog(true) },
    { icon: Calendar, label: 'Apply Leave', desc: 'Submit leave application', action: () => setShowLeaveDialog(true) },
    { icon: BookOpen, label: 'My Classes', desc: 'View assigned classes', action: () => navigate('/app/classes') },
    { icon: Brain, label: 'Tino AI', desc: 'AI Assistant', action: () => navigate('/app/tino-ai') },
    { icon: FileText, label: 'Exam Reports', desc: 'View exam results', action: () => navigate('/app/exam-report') },
    { icon: User, label: 'My Profile', desc: 'Profile & Settings', action: () => setShowProfileDialog(true) },
  ];

  const filteredModules = quickModules.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedModules = filteredModules.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 relative" data-testid="teachtino-dashboard">
      <GlobalWatermark />
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">TeachTino</h1>
                <p className="text-xs text-gray-400">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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

      <main className="max-w-7xl mx-auto px-4 py-5 pb-24 space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors shadow-sm">
            <Home className="w-3.5 h-3.5" />
            {t('home')}
          </button>
          <span className="text-gray-400">›</span>
          <span className="text-gray-500 text-xs">{t('dashboard')}</span>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-800">Welcome back, {user?.name || 'Teacher'}!</h2>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-slate-500 font-medium">{card.label}</span>
                <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{card.value}</div>
              <div className="text-xs text-slate-400">{card.subtext}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
            <p className="text-sm text-gray-500 mt-1">Powerful tools designed to enhance your teaching experience.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {teacherModuleCards.map((card) => (
              <div
                key={card.id}
                onClick={card.action}
                className="group cursor-pointer bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              >
                <div className={`w-12 h-12 ${card.lightBg} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{card.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 pt-5 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-500 mt-1">List of actions available. Use the "Open" button to navigate.</p>
              </div>
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search keyword" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-full sm:w-56 text-gray-700 bg-white" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Module Name <SortIcon /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Description <SortIcon /></th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedModules.map((module, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <module.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-800">{module.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell"><span className="text-sm text-gray-500">{module.desc}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={module.action} className="px-5 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors">Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-500">Showing {startIdx + 1} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredModules.length)} of {filteredModules.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronFirst className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              {getPageNumbers().map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLast className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {canApproveLeave && pendingLeaves.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Pending Leave Approvals</h2>
              <p className="text-sm text-gray-500 mt-1">Staff leave requests awaiting your approval.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Staff Name <SortIcon /></th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Type <SortIcon /></th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden md:table-cell whitespace-nowrap">Reason <SortIcon /></th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.slice(0, 5).map((leave) => (
                    <tr key={leave.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-800">{leave.user_name || 'Staff'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell capitalize">{leave.leave_type}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">{leave.reason}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleApproveLeave(leave.id)} className="px-4 py-1.5 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors">{t('approve')}</button>
                          <button onClick={() => handleRejectLeave(leave.id)} className="px-4 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors">{t('reject')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recentNotices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Notices</h2>
              <p className="text-sm text-gray-500 mt-1">Latest announcements and notices.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Title <SortIcon /></th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Content <SortIcon /></th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotices.map((notice) => (
                    <tr key={notice.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-800">{notice.title}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell line-clamp-1">{notice.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {myRequests.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-xl font-bold text-gray-900">My Requests (मेरे अनुरोध)</h2>
              <p className="text-sm text-gray-500 mt-1">Your requests sent to admin for approval.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Title</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden md:table-cell whitespace-nowrap">Admin Note</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.slice(0, 10).map((req) => (
                    <tr key={req.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-800">{req.title}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell capitalize">{req.request_type}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status === 'pending' ? t('pending') : req.status === 'approved' ? t('approved') : t('rejected')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">{req.review_note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          {[
            { icon: Home, label: t('home'), active: true, action: () => {} },
            { icon: BookOpen, label: t('classes'), action: () => navigate('/app/classes') },
            { icon: ClipboardCheck, label: t('attendance'), action: () => navigate('/app/attendance') },
            { icon: Bell, label: t('notices'), action: () => navigate('/app/notices') },
            { icon: Brain, label: 'Tino AI', action: () => navigate('/app/tino-ai') },
          ].map((item, idx) => (
            <button key={idx} onClick={item.action} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}>
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
              <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })} className="w-full mt-2 p-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-blue-500">
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
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg" onClick={handleApplyLeave}>Submit Application</Button>
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
              <Send className="w-4 h-4 mr-2" /> Send Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">{t('profile')}</DialogTitle>
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
                <div className="bg-blue-50 p-1 rounded"><Camera className="w-4 h-4 text-blue-500" /></div>
                Face Recognition Setup
              </h4>
              <StaffPhotoUpload userId={user?.id} schoolId={user?.school_id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
