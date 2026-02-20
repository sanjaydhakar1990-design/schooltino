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
  Users, BookOpen, Calendar, Bell, ClipboardCheck, Clipboard,
  GraduationCap, Clock, FileText, Sparkles,
  LogOut, CheckCircle, XCircle,
  Send, User, CalendarDays, Loader2, Brain,
  BarChart3, Camera, Home,
  ChevronRight,
  Key, Eye, EyeOff, Phone, Mail, Shield, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import StaffPhotoUpload from '../components/StaffPhotoUpload';
import { GlobalWatermark } from '../components/SchoolLogoWatermark';
import TeachTinoAttendance from '../components/TeachTinoAttendance';
import TeachTinoSyllabus from '../components/TeachTinoSyllabus';
import TeachTinoHomework from '../components/TeachTinoHomework';
import TeachTinoTimetable from '../components/TeachTinoTimetable';
import TeachTinoStudents from '../components/TeachTinoStudents';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function TeachTinoDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, schoolData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  const [myClasses, setMyClasses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, absent: 0 });
  const [recentNotices, setRecentNotices] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [timetableToday, setTimetableToday] = useState([]);
  const [staffProfile, setStaffProfile] = useState(null);
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual', from_date: '', to_date: '', reason: ''
  });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });
  
  const isPrincipal = user?.role === 'principal' || user?.role === 'vice_principal';
  const canApproveLeave = isPrincipal || user?.role === 'director';

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [dashRes, reqRes, leaveBalRes, timetableRes] = await Promise.allSettled([
        axios.get(`${API}/teacher/dashboard`, { headers }),
        axios.get(`${API}/teacher/requests`, { headers }),
        axios.get(`${API}/leave/balance`, { headers }),
        axios.get(`${API}/timetable?school_id=${user?.school_id}`, { headers })
      ]);
      
      let dashClasses = [];
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data;
        dashClasses = Array.isArray(d.my_classes) ? d.my_classes : [];
        setMyClasses(dashClasses);
        setTotalStudents(d.total_students || 0);
        setTodayAttendance(d.attendance_today || { present: 0, absent: 0 });
        setRecentNotices(Array.isArray(d.recent_notices) ? d.recent_notices : []);
      }
      
      if (reqRes.status === 'fulfilled') setMyRequests(Array.isArray(reqRes.value.data) ? reqRes.value.data : []);
      if (leaveBalRes.status === 'fulfilled') setLeaveBalance(leaveBalRes.value.data);
      
      if (timetableRes.status === 'fulfilled') {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const allTimetables = Array.isArray(timetableRes.value.data) ? timetableRes.value.data : [];
        const todayPeriods = [];
        allTimetables.forEach(tt => {
          if (tt.schedule && tt.schedule[today]) {
            tt.schedule[today].forEach(period => {
              if (period.teacher_id === user?.id || period.teacher_name === user?.name) {
                todayPeriods.push({ ...period, class_name: tt.class_name || tt.class_id });
              }
            });
          }
        });
        setTimetableToday(todayPeriods.sort((a, b) => (a.period || 0) - (b.period || 0)));
      }

      try {
        const leavesRes = await axios.get(`${API}/leave/pending`, { headers });
        setPendingLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      } catch (e) {}

    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/teachtino'); };

  const handleChangePassword = async () => {
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
      const res = await fetch(`${API}/auth/change-password`, {
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

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.reason) { toast.error('Please fill all fields'); return; }
    try {
      await axios.post(`${API}/leave/apply`, { ...leaveForm, school_id: user?.school_id }, { headers: getHeaders() });
      toast.success('Leave applied successfully!');
      setShowLeaveDialog(false);
      setLeaveForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
      fetchDashboard();
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
      toast.success('Notice submitted for admin approval!');
      setShowNoticeDialog(false);
      setNoticeForm({ title: '', content: '' });
      fetchDashboard();
    } catch (error) { toast.error('Failed to submit notice request'); }
  };

  const handleApproveLeave = async (leaveId) => {
    try { await axios.post(`${API}/leave/${leaveId}/approve`, {}, { headers: getHeaders() }); toast.success('Leave approved!'); fetchDashboard(); } catch (error) { toast.error('Failed to approve'); }
  };

  const handleRejectLeave = async (leaveId) => {
    try { await axios.post(`${API}/leave/${leaveId}/reject`, {}, { headers: getHeaders() }); toast.success('Leave rejected'); fetchDashboard(); } catch (error) { toast.error('Failed to reject'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Loading TeachTino...</p>
        </div>
      </div>
    );
  }

  const attendancePercent = totalStudents > 0 ? Math.round((todayAttendance.present / totalStudents) * 100) : 0;

  const mp = user?.module_permissions || {};
  const hasModule = (key) => mp[key] !== false;

  const teacherModules = [
    hasModule('attendance') && { id: 'attendance', name: 'SmartRoll', desc: 'Mark & track attendance', icon: ClipboardCheck, color: 'bg-orange-50 text-orange-600', action: () => setActiveTab('attendance') },
    hasModule('syllabus_tracking') && { id: 'syllabus', name: 'Syllabus', desc: 'Track chapters & topics', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600', action: () => setActiveTab('syllabus') },
    hasModule('homework') && { id: 'homework', name: 'Homework', desc: 'Assign & manage', icon: Clipboard, color: 'bg-teal-50 text-teal-600', action: () => setActiveTab('homework') },
    hasModule('timetable') && { id: 'timetable', name: 'Timetable', desc: 'My schedule', icon: Clock, color: 'bg-cyan-50 text-cyan-600', action: () => setActiveTab('timetable') },
    hasModule('students') && { id: 'students', name: 'My Students', desc: 'Student profiles', icon: Users, color: 'bg-indigo-50 text-indigo-600', action: () => setActiveTab('students') },
    hasModule('exams_reports') && { id: 'exams', name: 'ExamTino', desc: 'Exams & results', icon: FileText, color: 'bg-purple-50 text-purple-600', action: () => navigate('/app/exams') },
    hasModule('live_classes') && { id: 'live', name: 'Live Class', desc: 'Online teaching', icon: Camera, color: 'bg-red-50 text-red-600', action: () => navigate('/app/live-classes') },
    hasModule('ai_tools') && { id: 'ai', name: 'PaperGenie', desc: 'AI question papers', icon: Sparkles, color: 'bg-pink-50 text-pink-600', action: () => navigate('/app/ai-tools') },
    hasModule('communication_hub') && { id: 'notice', name: 'NoticeBoard', desc: 'Send notices', icon: Bell, color: 'bg-blue-50 text-blue-600', action: () => setShowNoticeDialog(true) },
    { id: 'leave', name: 'Apply Leave', desc: 'Leave application', icon: CalendarDays, color: 'bg-rose-50 text-rose-600', action: () => setShowLeaveDialog(true) },
    { id: 'profile', name: 'My Profile', desc: 'Settings', icon: User, color: 'bg-gray-100 text-gray-600', action: () => setShowProfileDialog(true) },
  ].filter(Boolean);

  const userPhoto = user?.photo_url || user?.profile_photo;

  return (
    <div className="min-h-screen bg-gray-50 relative" data-testid="teachtino-dashboard">
      <GlobalWatermark />
      
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-sm">TeachTino</h1>
                <p className="text-xs text-gray-400">{schoolData?.name || 'School'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowProfileDialog(true)} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                {userPhoto ? (
                  <img src={userPhoto} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-green-200" />
                ) : (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
              </button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 pb-24 space-y-5">
        {activeTab === 'attendance' && (
          <TeachTinoAttendance onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'syllabus' && (
          <TeachTinoSyllabus onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'homework' && (
          <TeachTinoHomework onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'timetable' && (
          <TeachTinoTimetable onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'students' && (
          <TeachTinoStudents onBack={() => setActiveTab('home')} />
        )}
        {activeTab === 'home' && <>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},</p>
              <h2 className="text-xl font-bold mt-0.5">{user?.name || 'Teacher'}</h2>
              <p className="text-green-100 text-xs mt-1 capitalize">{user?.role?.replace('_', ' ')} {user?.designation ? `- ${user.designation}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-xs">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {myClasses.length > 0 && (
                <p className="text-sm font-medium mt-1">{myClasses.length} {myClasses.length === 1 ? 'Class' : 'Classes'} Assigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-gray-400">Students</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
            <p className="text-xs text-gray-400 mt-0.5">In your classes</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-400">Present</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{todayAttendance.present}</p>
            <p className="text-xs text-gray-400 mt-0.5">Today</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs text-gray-400">Absent</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{todayAttendance.absent}</p>
            <p className="text-xs text-gray-400 mt-0.5">Today</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-gray-400">Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{attendancePercent}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Attendance</p>
          </div>
        </div>

        {myClasses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">My Classes</h3>
              <button onClick={() => setActiveTab('students')} className="text-xs text-green-600 font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {myClasses.slice(0, 6).map((cls) => (
                <div key={cls.id} onClick={() => setActiveTab('students')} className="p-3 bg-green-50 rounded-lg border border-green-100 cursor-pointer hover:bg-green-100 transition-colors">
                  <p className="font-semibold text-gray-800 text-sm">{cls.name || cls.class_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{cls.section ? `Section ${cls.section}` : ''}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Users className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">{cls.student_count || 0} Students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {timetableToday.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Today's Schedule</h3>
              <button onClick={() => setActiveTab('timetable')} className="text-xs text-green-600 font-medium flex items-center gap-1 hover:underline">
                Full Timetable <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {timetableToday.map((period, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-700">P{period.period}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{period.subject || 'Period'}</p>
                    <p className="text-xs text-gray-400">{period.class_name} {period.start_time ? `| ${period.start_time} - ${period.end_time}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Modules</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {teacherModules.map((mod) => (
              <button
                key={mod.id}
                onClick={mod.action}
                className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-center"
              >
                <div className={`w-10 h-10 ${mod.color.split(' ')[0]} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <mod.icon className={`w-5 h-5 ${mod.color.split(' ')[1]}`} />
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">{mod.name}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{mod.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {canApproveLeave && pendingLeaves.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                Pending Leave Approvals
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{pendingLeaves.length}</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{leave.user_name || 'Staff'}</p>
                    <p className="text-xs text-gray-400 capitalize">{leave.leave_type} | {leave.from_date} to {leave.to_date}</p>
                    {leave.reason && <p className="text-xs text-gray-400 truncate mt-0.5">{leave.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button onClick={() => handleApproveLeave(leave.id)} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRejectLeave(leave.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentNotices.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Recent Notices</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{notice.title}</p>
                      {notice.created_at && <p className="text-xs text-gray-400 mt-0.5">{new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                    </div>
                    {notice.priority === 'urgent' && <Badge className="ml-auto bg-red-100 text-red-600 text-[10px]">Urgent</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myRequests.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">My Requests</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {myRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{req.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{req.request_type}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </>}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-200">
        <div className="grid grid-cols-5 gap-1 p-1.5 max-w-lg mx-auto">
          {[
            { icon: Home, label: 'Home', id: 'home', action: () => setActiveTab('home') },
            { icon: ClipboardCheck, label: 'Attendance', id: 'attendance', action: () => setActiveTab('attendance') },
            { icon: BookOpen, label: 'Syllabus', id: 'syllabus', action: () => setActiveTab('syllabus') },
            { icon: Calendar, label: 'Leave', id: 'leave', action: () => setShowLeaveDialog(true) },
            { icon: User, label: 'Profile', id: 'profile', action: () => setShowProfileDialog(true) },
          ].map((item) => (
            <button key={item.id} onClick={item.action} className={`flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors ${activeTab === item.id ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
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
            {leaveBalance && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{leaveBalance.casual?.remaining ?? '-'}</p>
                  <p className="text-[10px] text-gray-500">Casual</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{leaveBalance.sick?.remaining ?? '-'}</p>
                  <p className="text-[10px] text-gray-500">Sick</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{leaveBalance.earned?.remaining ?? '-'}</p>
                  <p className="text-[10px] text-gray-500">Earned</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Leave Type</label>
              <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })} className="w-full mt-2 p-2.5 border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:border-green-500">
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="earned">Earned Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">From</label>
                <Input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })} className="mt-1.5 border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To</label>
                <Input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })} className="mt-1.5 border-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Enter reason..." rows={3} className="mt-1.5 border-gray-200" />
            </div>
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg" onClick={handleApplyLeave}>
              <Send className="w-4 h-4 mr-2" /> Submit Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">Send Notice (Admin Approval Required)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} placeholder="Notice title..." className="mt-1.5 border-gray-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Content</label>
              <Textarea value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} placeholder="Notice content..." rows={4} className="mt-1.5 border-gray-200" />
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">Notice will be sent to admin for approval before publishing.</p>
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg" onClick={handleSendNotice}>
              <Send className="w-4 h-4 mr-2" /> Submit for Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={(v) => { setShowProfileDialog(v); if (!v) { setShowPasswordSection(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); } }}>
        <DialogContent className="max-w-md bg-white rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-semibold text-gray-800">My Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              {userPhoto ? (
                <img src={userPhoto} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-green-200" />
              ) : (
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-green-500" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-800">{user?.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
                <Badge className="mt-1.5 capitalize bg-green-50 text-green-600 border border-green-100">{user?.role?.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-xl text-sm border border-gray-100">
              {user?.employee_id && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Employee ID</span><span className="font-medium text-gray-700">{user.employee_id}</span></div>}
              {user?.mobile && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Mobile</span><span className="font-medium text-gray-700">{user.mobile}</span></div>}
              {user?.email && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span><span className="font-medium text-gray-700">{user.email}</span></div>}
              {user?.designation && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Designation</span><span className="font-medium text-gray-700">{user.designation}</span></div>}
              {user?.department && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Department</span><span className="font-medium text-gray-700">{user.department}</span></div>}
              {user?.joining_date && <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Joining Date</span><span className="font-medium text-gray-700">{new Date(user.joining_date).toLocaleDateString('en-IN')}</span></div>}
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
                <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  {changingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing...</> : 'Update Password'}
                </Button>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <div className="bg-green-50 p-1 rounded"><Camera className="w-4 h-4 text-green-500" /></div>
                Profile Photo
              </h4>
              <StaffPhotoUpload userId={user?.id} schoolId={user?.school_id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
