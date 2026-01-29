/**
 * TeachTino Dashboard - Clean & Simple
 * For Teachers, Principals, VPs, and Staff
 * Features: Attendance, Leave, Notices, Homework, Syllabus, Tino AI
 */
import { useState, useEffect, useRef } from 'react';
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
  BarChart3, Zap, Home, PlusCircle, Edit,
  ChevronRight, AlertTriangle, BookMarked, 
  FileEdit, UserCheck, UserX, Check, X, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeachTinoDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Data states
  const [myClasses, setMyClasses] = useState([]);
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, total: 0 });
  
  // Dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [showHomeworkDialog, setShowHomeworkDialog] = useState(false);
  const [showStudentLeaveDialog, setShowStudentLeaveDialog] = useState(false);
  const [showTinoAI, setShowTinoAI] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [showHomeworkList, setShowHomeworkList] = useState(false);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState([]);
  
  // Forms
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    target_class: ''
  });
  const [homeworkForm, setHomeworkForm] = useState({
    subject: '',
    class_id: '',
    description: '',
    due_date: ''
  });
  const [studentLeaveForm, setStudentLeaveForm] = useState({
    student_id: '',
    leave_type: 'sick',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Tino AI Chat
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const isPrincipal = user?.role === 'principal' || user?.role === 'vice_principal';
  const canApproveLeave = isPrincipal || user?.role === 'director';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [classesRes, noticesRes, staffRes] = await Promise.allSettled([
        axios.get(`${API}/classes?school_id=${user?.school_id}`, { headers }),
        axios.get(`${API}/notices?school_id=${user?.school_id}&limit=5`, { headers }),
        axios.get(`${API}/staff/${user?.id}`, { headers }).catch(() => ({ data: null }))
      ]);

      if (classesRes.status === 'fulfilled') {
        const allClasses = classesRes.value.data || [];
        setMyClasses(allClasses);
        
        // Find class where this teacher is class teacher
        const myClass = allClasses.find(c => c.class_teacher_id === user?.id);
        if (myClass) {
          setAssignedClass(myClass);
          // Fetch students of this class
          fetchClassStudents(myClass.id);
        }
      }
      
      if (noticesRes.status === 'fulfilled') {
        setRecentNotices(noticesRes.value.data?.slice(0, 5) || []);
      }

      // Fetch my leaves
      try {
        const leavesRes = await axios.get(`${API}/staff/leaves?staff_id=${user?.id}`, { headers });
        setMyLeaves(leavesRes.data || []);
      } catch (e) {
        console.log('No leaves found');
      }

      // Fetch pending leaves if can approve
      if (canApproveLeave) {
        try {
          const pendingRes = await axios.get(`${API}/staff/leaves/pending?school_id=${user?.school_id}`, { headers });
          setPendingLeaves(pendingRes.data || []);
        } catch (e) {
          console.log('No pending leaves');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/students?class_id=${classId}&school_id=${user?.school_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data || []);
      
      // Initialize attendance data
      const initialAttendance = {};
      (res.data || []).forEach(s => {
        initialAttendance[s.id] = 'present';
      });
      setAttendanceData(initialAttendance);
      
      // Calculate stats
      setTodayStats({
        present: res.data?.length || 0,
        absent: 0,
        total: res.data?.length || 0
      });
    } catch (e) {
      console.error('Failed to fetch students:', e);
    }
  };

  // Open attendance for a specific class
  const openAttendanceForClass = async (cls) => {
    setSelectedClassForAttendance(cls);
    await fetchClassStudents(cls.id);
    setShowClassSelector(false);
    setShowAttendanceSheet(true);
  };

  // Fetch homework submissions for teacher
  const fetchHomeworkSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/homework/submissions?school_id=${user?.school_id}&teacher_id=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHomeworkSubmissions(res.data || []);
    } catch (e) {
      console.log('No submissions found');
      setHomeworkSubmissions([]);
    }
  };

  // Approve/Reject homework
  const handleHomeworkReview = async (submissionId, status, feedback = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/homework/submissions/${submissionId}/review`, {
        status,
        feedback,
        reviewed_by: user?.id
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success(`Homework ${status === 'approved' ? 'approved ✅' : 'needs revision 📝'}`);
      fetchHomeworkSubmissions();
    } catch (error) {
      toast.error('Review submit करने में error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/teachtino');
  };

  // ============= LEAVE MANAGEMENT =============
  const handleApplyLeave = async () => {
    if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.reason) {
      toast.error('सभी fields भरें');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/staff/leaves/apply`, {
        staff_id: user?.id,
        school_id: user?.school_id,
        ...leaveForm
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success('Leave application submitted! ✅');
      setShowLeaveDialog(false);
      setLeaveForm({ leave_type: 'casual', from_date: today, to_date: today, reason: '' });
      fetchData();
    } catch (error) {
      toast.error('Leave apply करने में error');
    }
  };

  const handleApproveLeave = async (leaveId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/staff/leaves/${leaveId}/${action}`, {
        approved_by: user?.id
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'}!`);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  // ============= ATTENDANCE =============
  const markAttendance = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
    
    // Update stats
    const newData = { ...attendanceData, [studentId]: status };
    const present = Object.values(newData).filter(s => s === 'present').length;
    const absent = Object.values(newData).filter(s => s === 'absent').length;
    setTodayStats({ present, absent, total: students.length });
  };

  const submitAttendance = async () => {
    if (!assignedClass) {
      toast.error('No class assigned');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        status,
        date: today,
        class_id: assignedClass.id,
        school_id: user?.school_id,
        marked_by: user?.id
      }));
      
      await axios.post(`${API}/attendance/bulk`, {
        school_id: user?.school_id,
        class_id: assignedClass.id,
        date: today,
        records: attendanceRecords
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success(`✅ Attendance submitted! Present: ${todayStats.present}, Absent: ${todayStats.absent}`);
      setShowAttendanceSheet(false);
    } catch (error) {
      toast.error('Attendance submit करने में error');
    }
  };

  // ============= NOTICES =============
  const handleSendNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast.error('Title और Content भरें');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/notices`, {
        ...noticeForm,
        school_id: user?.school_id,
        created_by: user?.id,
        target_audience: ['students', 'parents'],
        priority: 'normal'
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success('Notice sent! ✅');
      setShowNoticeDialog(false);
      setNoticeForm({ title: '', content: '', target_class: '' });
      fetchData();
    } catch (error) {
      toast.error('Notice भेजने में error');
    }
  };

  // ============= HOMEWORK =============
  const handleAssignHomework = async () => {
    if (!homeworkForm.subject || !homeworkForm.description || !homeworkForm.class_id) {
      toast.error('सभी fields भरें');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/homework`, {
        ...homeworkForm,
        school_id: user?.school_id,
        assigned_by: user?.id,
        assigned_date: today
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success('Homework assigned! ✅');
      setShowHomeworkDialog(false);
      setHomeworkForm({ subject: '', class_id: '', description: '', due_date: '' });
    } catch (error) {
      toast.error('Homework assign करने में error');
    }
  };

  // ============= STUDENT LEAVE =============
  const handleStudentLeave = async () => {
    if (!studentLeaveForm.student_id || !studentLeaveForm.reason) {
      toast.error('Student select करें और reason दें');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/attendance/mark-leave`, {
        school_id: user?.school_id,
        ...studentLeaveForm
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success('Student leave marked! ✅');
      setShowStudentLeaveDialog(false);
      setStudentLeaveForm({ student_id: '', leave_type: 'sick', from_date: today, to_date: today, reason: '' });
    } catch (error) {
      toast.error('Leave mark करने में error');
    }
  };

  // ============= TINO AI =============
  const handleAIChat = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput('');
    setAiLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/tino/chat`, {
        message: userMessage,
        school_id: user?.school_id,
        user_id: user?.id,
        user_role: user?.role,
        context: 'teacher_portal'
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.data?.response || res.data?.message || 'मैं आपकी मदद के लिए हूं!'
      }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, कुछ error हुआ। Please try again.'
      }]);
    } finally {
      setAiLoading(false);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="teachtino-dashboard">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">TeachTino</h1>
                <p className="text-xs text-gray-500">{user?.name} • {user?.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowTinoAI(true)} className="text-emerald-600">
                <Brain className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-rose-600">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-500">
            {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {assignedClass && (
            <Badge className="mt-2 bg-emerald-100 text-emerald-700">
              Class Teacher: {assignedClass.name}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">My Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Present Today</p>
                  <p className="text-2xl font-bold text-emerald-600">{todayStats.present}</p>
                </div>
                <UserCheck className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Absent Today</p>
                  <p className="text-2xl font-bold text-rose-600">{todayStats.absent}</p>
                </div>
                <UserX className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={() => setShowClassSelector(true)}
              className="h-auto py-4 flex flex-col items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <ClipboardCheck className="w-6 h-6" />
              <span>Mark Attendance</span>
            </Button>
            
            <Button 
              onClick={() => setShowLeaveDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <CalendarDays className="w-6 h-6" />
              <span>Apply Leave</span>
            </Button>
            
            <Button 
              onClick={() => setShowNoticeDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Bell className="w-6 h-6" />
              <span>Send Notice</span>
            </Button>
            
            <Button 
              onClick={() => setShowHomeworkDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <FileEdit className="w-6 h-6" />
              <span>Assign Homework</span>
            </Button>
            
            <Button 
              onClick={() => { fetchHomeworkSubmissions(); setShowHomeworkList(true); }}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Check Homework</span>
            </Button>
            
            <Button 
              onClick={() => setShowStudentLeaveDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <UserX className="w-6 h-6" />
              <span>Student Leave</span>
            </Button>
          </div>
        </div>

        {/* Recent Notices */}
        <Card className="mb-6 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Recent Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotices.length > 0 ? (
              <div className="space-y-3">
                {recentNotices.map((notice, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium text-gray-800">{notice.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notice.created_at).toLocaleDateString('hi-IN')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent notices</p>
            )}
          </CardContent>
        </Card>

        {/* My Leaves */}
        <Card className="mb-6 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-600" />
              My Leave Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myLeaves.length > 0 ? (
              <div className="space-y-2">
                {myLeaves.slice(0, 5).map((leave, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{leave.leave_type} Leave</p>
                      <p className="text-sm text-gray-500">{leave.from_date} to {leave.to_date}</p>
                    </div>
                    <Badge className={
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {leave.status || 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No leave applications</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Leaves for Approval (Principal/VP only) */}
        {canApproveLeave && pendingLeaves.length > 0 && (
          <Card className="mb-6 border shadow-sm border-orange-200">
            <CardHeader className="pb-2 bg-orange-50">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                <AlertTriangle className="w-5 h-5" />
                Pending Leave Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pendingLeaves.map((leave, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{leave.staff_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{leave.leave_type} • {leave.from_date} to {leave.to_date}</p>
                      <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveLeave(leave.id, 'approve')}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleApproveLeave(leave.id, 'reject')}>
                        <X className="w-4 h-4" />
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${activeTab === 'home' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => assignedClass && setShowAttendanceSheet(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-500"
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs">Attendance</span>
          </button>
          <button 
            onClick={() => setShowLeaveDialog(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-500"
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-xs">Leave</span>
          </button>
          <button 
            onClick={() => setShowNoticeDialog(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-500"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Notice</span>
          </button>
          <button 
            onClick={() => setShowTinoAI(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-500"
          >
            <Brain className="w-5 h-5" />
            <span className="text-xs">Tino AI</span>
          </button>
        </div>
      </nav>

      {/* ============= DIALOGS ============= */}

      {/* Class Selector for Attendance */}
      <Dialog open={showClassSelector} onOpenChange={setShowClassSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              Select Class for Attendance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {myClasses.length > 0 ? (
              myClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => openAttendanceForClass(cls)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-emerald-50 rounded-lg border hover:border-emerald-300 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{cls.name}</p>
                    <p className="text-sm text-gray-500">{cls.section && `Section ${cls.section}`}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No classes found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Sheet Dialog */}
      <Dialog open={showAttendanceSheet} onOpenChange={setShowAttendanceSheet}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              Mark Attendance - {selectedClassForAttendance?.name || assignedClass?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Date: {today}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600">Present: {todayStats.present}</span>
                <span className="text-rose-600">Absent: {todayStats.absent}</span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-6">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">Roll: {student.roll_no || idx + 1}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={attendanceData[student.id] === 'present' ? 'default' : 'outline'}
                      className={attendanceData[student.id] === 'present' ? 'bg-emerald-600' : ''}
                      onClick={() => markAttendance(student.id, 'present')}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceData[student.id] === 'absent' ? 'destructive' : 'outline'}
                      onClick={() => markAttendance(student.id, 'absent')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={submitAttendance}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Attendance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <option value="casual">Casual Leave (आकस्मिक)</option>
                <option value="sick">Sick Leave (बीमारी)</option>
                <option value="earned">Earned Leave (अर्जित)</option>
                <option value="half_day">Half Day (आधा दिन)</option>
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
              <label className="text-sm font-medium">Reason (कारण)</label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Leave का कारण लिखें..."
                rows={3}
              />
            </div>
            <Button className="w-full" onClick={handleApplyLeave}>
              <Send className="w-4 h-4 mr-2" />
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
              <label className="text-sm font-medium">Target Class (Optional)</label>
              <select
                value={noticeForm.target_class}
                onChange={(e) => setNoticeForm({ ...noticeForm, target_class: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg"
              >
                <option value="">All Classes</option>
                {myClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
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

      {/* Homework Dialog */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <select
                value={homeworkForm.class_id}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, class_id: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg"
              >
                <option value="">Select Class</option>
                {myClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={homeworkForm.subject}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })}
                placeholder="Subject name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={homeworkForm.due_date}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={homeworkForm.description}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                placeholder="Homework details..."
                rows={4}
              />
            </div>
            <Button className="w-full" onClick={handleAssignHomework}>
              <FileEdit className="w-4 h-4 mr-2" />
              Assign Homework
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Leave Dialog */}
      <Dialog open={showStudentLeaveDialog} onOpenChange={setShowStudentLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Student Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Student</label>
              <select
                value={studentLeaveForm.student_id}
                onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, student_id: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg"
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Leave Type</label>
              <select
                value={studentLeaveForm.leave_type}
                onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, leave_type: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg"
              >
                <option value="sick">Sick (बीमारी)</option>
                <option value="personal">Personal (व्यक्तिगत)</option>
                <option value="family">Family Emergency</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={studentLeaveForm.from_date}
                  onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, from_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={studentLeaveForm.to_date}
                  onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, to_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={studentLeaveForm.reason}
                onChange={(e) => setStudentLeaveForm({ ...studentLeaveForm, reason: e.target.value })}
                placeholder="Leave का कारण..."
                rows={2}
              />
            </div>
            <Button className="w-full" onClick={handleStudentLeave}>
              <UserX className="w-4 h-4 mr-2" />
              Mark Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tino AI Dialog - Text Only */}
      <Dialog open={showTinoAI} onOpenChange={setShowTinoAI}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              Tino AI Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-96">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
              {aiMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                  <p>नमस्ते! मैं Tino AI हूं।</p>
                  <p className="text-sm">कुछ भी पूछें - attendance, syllabus, homework...</p>
                </div>
              )}
              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Type your question..."
                onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
              />
              <Button onClick={handleAIChat} disabled={aiLoading || !aiInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
