/**
 * TeachTino Dashboard - Enhanced Version
 * Features: Attendance, Syllabus Tracking, Homework, Leave, Notices, Student Queries
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
  FileEdit, UserCheck, UserX, Check, X, RefreshCw,
  Play, Pause, ChevronDown, MessageCircle, Award,
  TrendingUp, Target, Book, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Attendance Status Options
const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Present (उपस्थित)', color: 'bg-green-500', icon: '✓' },
  { value: 'absent', label: 'Absent (अनुपस्थित)', color: 'bg-red-500', icon: '✗' },
  { value: 'late', label: 'Late (देर से)', color: 'bg-yellow-500', icon: '⏰' },
  { value: 'half_day', label: 'Half Day (आधा दिन)', color: 'bg-orange-500', icon: '½' },
  { value: 'leave', label: 'On Leave (छुट्टी)', color: 'bg-blue-500', icon: '📝' },
];

export default function TeachTinoDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Data states
  const [myClasses, setMyClasses] = useState([]);
  const [assignedClass, setAssignedClass] = useState(null);
  const [tempAssignedClasses, setTempAssignedClasses] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [todayStats, setTodayStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, total: 0 });
  const [studentQueries, setStudentQueries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [syllabusChapters, setSyllabusChapters] = useState([]);
  const [syllabusProgressMap, setSyllabusProgressMap] = useState({});
  const [syllabusAnalytics, setSyllabusAnalytics] = useState(null);
  const [syllabusRange, setSyllabusRange] = useState('month');
  const [showSyllabusUpdate, setShowSyllabusUpdate] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [syllabusUpdateForm, setSyllabusUpdateForm] = useState({
    status: 'in_progress',
    topics: '',
    notes: ''
  });
  const [lessonSummary, setLessonSummary] = useState('');
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [queryAnswerDrafts, setQueryAnswerDrafts] = useState({});
  
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
  const [showSyllabusTracker, setShowSyllabusTracker] = useState(false);
  const [showQueriesDialog, setShowQueriesDialog] = useState(false);
  const [selectedSubjectForSyllabus, setSelectedSubjectForSyllabus] = useState(null);
  
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
    chapter: '',
    topic: '',
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

  const extractClassNumber = (className) => {
    if (!className) return null;
    const match = className.match(/\d+/);
    return match ? match[0] : null;
  };

  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    if (showSyllabusTracker && mySubjects.length > 0 && !selectedSubjectForSyllabus) {
      handleSelectSyllabusSubject(mySubjects[0]);
    }
  }, [showSyllabusTracker, mySubjects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [classesRes, noticesRes, subjectsRes, notificationsRes, myClassesRes] = await Promise.allSettled([
        axios.get(`${API}/classes?school_id=${user?.school_id}`, { headers }),
        axios.get(`${API}/notices?school_id=${user?.school_id}&limit=5`, { headers }),
        axios.get(`${API}/teacher/subjects?teacher_id=${user?.id}`, { headers }).catch(() => ({ data: { subjects: [] } })),
        axios.get(`${API}/notifications?school_id=${user?.school_id}&user_id=${user?.id}&role=${user?.role}`, { headers }),
        axios.get(`${API}/teacher/my-classes`, { headers }).catch(() => ({ data: { classes: [] } }))
      ]);

      // Use the dedicated my-classes endpoint first
      if (myClassesRes.status === 'fulfilled' && myClassesRes.value.data?.classes?.length > 0) {
        const teacherClasses = myClassesRes.value.data.classes;
        setMyClasses(teacherClasses);
        setAssignedClass(teacherClasses[0]);
        fetchClassStudents(teacherClasses[0].id);
      } else if (classesRes.status === 'fulfilled') {
        // Fallback to manual filtering if needed
        const allClasses = classesRes.value.data || [];
        let teacherClasses = [];
        
        // Find class where this teacher is class teacher
        const myClass = allClasses.find(c => c.class_teacher_id === user?.id);
        if (myClass) {
          setAssignedClass(myClass);
          teacherClasses.push(myClass);
          fetchClassStudents(myClass.id);
        }
        
        // Check if teacher name matches (fallback for legacy data)
        const teacherNameMatch = allClasses.filter(c => 
          c.class_teacher_name && 
          user?.name && 
          c.class_teacher_name.toLowerCase().includes(user.name.toLowerCase())
        );
        teacherNameMatch.forEach(cls => {
          if (!teacherClasses.find(tc => tc.id === cls.id)) {
            teacherClasses.push(cls);
            if (!myClass) {
              setAssignedClass(cls);
              fetchClassStudents(cls.id);
            }
          }
        });
        
        setMyClasses(teacherClasses);
        
        // Find temporarily assigned classes
        const tempClasses = allClasses.filter(c => 
          c.temp_teacher_id === user?.id || 
          c.substitute_teacher_id === user?.id
        );
        setTempAssignedClasses(tempClasses);
      }
      
      if (noticesRes.status === 'fulfilled') {
        setRecentNotices(noticesRes.value.data?.slice(0, 5) || []);
      }

      if (subjectsRes.status === 'fulfilled') {
        setMySubjects(subjectsRes.value.data?.subjects || []);
      }

      if (notificationsRes.status === 'fulfilled') {
        const notes = notificationsRes.value.data?.notifications || [];
        setNotifications(notes);
        setUnreadNotifications(notes.filter(n => !n.is_read).length);
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

      // Fetch student queries
      try {
        const queriesRes = await axios.get(`${API}/teacher/queries?teacher_id=${user?.id}&school_id=${user?.school_id}`, { headers });
        setStudentQueries(queriesRes.data || []);
      } catch (e) {
        console.log('No queries');
      }

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/notifications/${notificationId}/read`,
        { user_id: user?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((note) => note.id === notificationId ? { ...note, is_read: true } : note));
      setUnreadNotifications((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      toast.error('Notification read mark करने में error');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/notifications/mark-all-read`,
        { user_id: user?.id, school_id: user?.school_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((note) => ({ ...note, is_read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      toast.error('Notifications update नहीं हो पाए');
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/students?class_id=${classId}&school_id=${user?.school_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data || []);
      
      // Initialize attendance data with 'present' as default
      const initialAttendance = {};
      (res.data || []).forEach(s => {
        initialAttendance[s.id] = 'present';
      });
      setAttendanceData(initialAttendance);
      
      // Calculate stats
      setTodayStats({
        present: res.data?.length || 0,
        absent: 0,
        late: 0,
        leave: 0,
        total: res.data?.length || 0
      });
    } catch (e) {
      console.error('Failed to fetch students:', e);
    }
  };

  // Get available classes for attendance (assigned + temp assigned)
  const getAvailableClasses = () => {
    const classes = [];
    if (assignedClass) {
      classes.push({ ...assignedClass, type: 'Class Teacher' });
    }
    tempAssignedClasses.forEach(c => {
      classes.push({ ...c, type: 'Temporary' });
    });
    return classes;
  };

  const openAttendanceForClass = async (cls) => {
    setSelectedClassForAttendance(cls);
    await fetchClassStudents(cls.id);
    setShowClassSelector(false);
    setShowAttendanceSheet(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/teachtino');
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
    const late = Object.values(newData).filter(s => s === 'late').length;
    const leave = Object.values(newData).filter(s => s === 'leave' || s === 'half_day').length;
    setTodayStats({ present, absent, late, leave, total: students.length });
  };

  const submitAttendance = async () => {
    const targetClass = selectedClassForAttendance || assignedClass;
    if (!targetClass) {
      toast.error('No class selected');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        status,
        date: today,
        class_id: targetClass.id,
        school_id: user?.school_id,
        marked_by: user?.id
      }));
      
      await axios.post(`${API}/attendance/bulk`, {
        school_id: user?.school_id,
        class_id: targetClass.id,
        date: today,
        records: attendanceRecords
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success(`✅ Attendance submitted! P:${todayStats.present} A:${todayStats.absent} L:${todayStats.late}`);
      setShowAttendanceSheet(false);
    } catch (error) {
      toast.error('Attendance submit करने में error');
    }
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
      setHomeworkForm({ subject: '', class_id: '', chapter: '', topic: '', description: '', due_date: '' });
    } catch (error) {
      toast.error('Homework assign करने में error');
    }
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

  // ============= SYLLABUS TRACKING =============
  const loadSyllabusForSubject = async (subjectItem, rangeOverride = syllabusRange) => {
    if (!subjectItem?.class_id || !subjectItem?.subject) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const classNum = subjectItem.class_number || extractClassNumber(subjectItem.class_name);
      const board = (subjectItem.board || 'NCERT').toUpperCase();

      if (!classNum) {
        toast.error('Class number missing in subject assignment');
        return;
      }

      const syllabusRes = await axios.get(
        `${API}/syllabus/${board}/syllabus/${classNum}?subject=${encodeURIComponent(subjectItem.subject)}`,
        { headers }
      );
      const chapters = syllabusRes.data?.data?.chapters || [];
      setSyllabusChapters(chapters);

      const progressRes = await axios.get(
        `${API}/syllabus-progress/class/${user?.school_id}/${subjectItem.class_id}?subject=${encodeURIComponent(subjectItem.subject)}`,
        { headers }
      );
      const progressRecords = progressRes.data?.subjects?.[0]?.chapters || [];
      const progressMap = {};
      progressRecords.forEach((record) => {
        progressMap[record.chapter_number] = record;
      });
      setSyllabusProgressMap(progressMap);

      const analyticsRes = await axios.get(
        `${API}/syllabus-progress/analytics/${user?.school_id}/${subjectItem.class_id}?subject=${encodeURIComponent(subjectItem.subject)}&range=${rangeOverride}`,
        { headers }
      );
      setSyllabusAnalytics(analyticsRes.data);
    } catch (error) {
      setSyllabusChapters([]);
      setSyllabusProgressMap({});
      setSyllabusAnalytics(null);
    }
  };

  const handleSelectSyllabusSubject = (subjectItem) => {
    setSelectedSubjectForSyllabus(subjectItem);
    loadSyllabusForSubject(subjectItem, syllabusRange);
  };

  const handleSyllabusRangeChange = (rangeValue) => {
    setSyllabusRange(rangeValue);
    if (selectedSubjectForSyllabus) {
      loadSyllabusForSubject(selectedSubjectForSyllabus, rangeValue);
    }
  };

  const openSyllabusUpdateDialog = (chapter) => {
    const existing = syllabusProgressMap[chapter.number];
    setSelectedChapter(chapter);
    setSyllabusUpdateForm({
      status: existing?.status || 'in_progress',
      topics: existing?.topics_covered?.join(', ') || '',
      notes: existing?.notes || ''
    });
    setShowSyllabusUpdate(true);
  };

  const handleSyllabusUpdate = async () => {
    if (!selectedSubjectForSyllabus || !selectedChapter) return;
    try {
      const token = localStorage.getItem('token');
      const classNum = selectedSubjectForSyllabus.class_number || extractClassNumber(selectedSubjectForSyllabus.class_name);
      const board = (selectedSubjectForSyllabus.board || 'NCERT').toUpperCase();
      const topicsArray = syllabusUpdateForm.topics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await axios.post(
        `${API}/syllabus-progress/update`,
        {
          school_id: user?.school_id,
          class_id: selectedSubjectForSyllabus.class_id,
          class_name: selectedSubjectForSyllabus.class_name,
          subject: selectedSubjectForSyllabus.subject,
          board,
          chapter_number: selectedChapter.number,
          chapter_name: selectedChapter.name,
          status: syllabusUpdateForm.status,
          topics_covered: topicsArray,
          notes: syllabusUpdateForm.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Syllabus progress updated ✅');
      setShowSyllabusUpdate(false);
      loadSyllabusForSubject(selectedSubjectForSyllabus, syllabusRange);
    } catch (error) {
      toast.error('Syllabus update में error');
    }
  };

  const openLessonSummary = async (chapter) => {
    if (!selectedSubjectForSyllabus) return;
    setSelectedChapter(chapter);
    setShowLessonDialog(true);
    setLessonLoading(true);
    setLessonSummary('');
    try {
      const token = localStorage.getItem('token');
      const classNum = selectedSubjectForSyllabus.class_number || extractClassNumber(selectedSubjectForSyllabus.class_name);
      const board = (selectedSubjectForSyllabus.board || 'NCERT').toUpperCase();
      const subjectEncoded = encodeURIComponent(selectedSubjectForSyllabus.subject);

      const cached = await axios.get(
        `${API}/syllabus-progress/ai/summary/${board}/${classNum}/${subjectEncoded}/${chapter.number}?language=hinglish`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (cached.data?.success) {
        setLessonSummary(cached.data.summary);
      } else {
        const generated = await axios.post(
          `${API}/syllabus-progress/ai/summarize-chapter`,
          {
            board,
            class_num: classNum,
            subject: selectedSubjectForSyllabus.subject,
            chapter_number: chapter.number,
            chapter_name: chapter.name,
            language: 'hinglish',
            include_formulas: true,
            include_key_points: true
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLessonSummary(generated.data?.summary || 'Summary not available');
      }
    } catch (error) {
      toast.error('Lesson summary load nahi ho paaya');
      setLessonSummary('Summary not available');
    } finally {
      setLessonLoading(false);
    }
  };

  // ============= STUDENT QUERIES =============
  const handleAnswerQuery = async (queryId, answer) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/teacher/queries/${queryId}/answer`, {
        answer,
        answered_by: user?.id
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      toast.success('Answer sent! ✅');
      setQueryAnswerDrafts((prev) => ({ ...prev, [queryId]: '' }));
      fetchData();
    } catch (error) {
      toast.error('Error sending answer');
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

  const availableClasses = getAvailableClasses();

  return (
    <div className="min-h-screen bg-gray-50" data-testid="teachtino-dashboard">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="text-slate-600 relative"
                data-testid="notifications-button"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full px-1"
                    data-testid="notifications-unread-count"
                  >
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTinoAI(true)}
                className="text-emerald-600"
                data-testid="tino-ai-open-button"
              >
                <Brain className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-rose-600"
                data-testid="logout-button"
              >
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
          <div className="flex gap-2 mt-2">
            {assignedClass && (
              <Badge className="bg-emerald-100 text-emerald-700">
                Class Teacher: {assignedClass.name}
              </Badge>
            )}
            {tempAssignedClasses.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                +{tempAssignedClasses.length} Temp Classes
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">My Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{availableClasses.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">My Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{mySubjects.length}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
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
                  <p className="text-xs text-gray-500">Student Queries</p>
                  <p className="text-2xl font-bold text-purple-600">{studentQueries.filter(q => q.status !== 'answered' && !q.answer).length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableClasses.length > 0 && (
              <Button 
                onClick={() => setShowClassSelector(true)}
                className="h-auto py-4 flex flex-col items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                data-testid="quick-action-mark-attendance"
              >
                <ClipboardCheck className="w-6 h-6" />
                <span>Mark Attendance</span>
              </Button>
            )}
            
            <Button 
              onClick={() => setShowLeaveDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              data-testid="quick-action-apply-leave"
            >
              <CalendarDays className="w-6 h-6" />
              <span>Apply Leave</span>
            </Button>
            
            <Button 
              onClick={() => setShowNoticeDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              data-testid="quick-action-send-notice"
            >
              <Bell className="w-6 h-6" />
              <span>Send Notice</span>
            </Button>
            
            <Button 
              onClick={() => setShowHomeworkDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              data-testid="quick-action-assign-homework"
            >
              <FileEdit className="w-6 h-6" />
              <span>Assign Homework</span>
            </Button>
            
            <Button 
              onClick={() => { fetchHomeworkSubmissions(); setShowHomeworkList(true); }}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
              data-testid="quick-action-check-homework"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Check Homework</span>
            </Button>
            
            <Button 
              onClick={() => setShowSyllabusTracker(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              data-testid="quick-action-syllabus-tracker"
            >
              <BookMarked className="w-6 h-6" />
              <span>Syllabus Tracker</span>
            </Button>
            
            <Button 
              onClick={() => setShowQueriesDialog(true)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-pink-300 text-pink-700 hover:bg-pink-50"
              data-testid="quick-action-student-queries"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Student Queries</span>
              {studentQueries.filter(q => !q.answered).length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                  {studentQueries.filter(q => q.status !== 'answered' && !q.answer).length}
                </Badge>
              )}
            </Button>
            
            {assignedClass && (
              <Button 
                onClick={() => setShowStudentLeaveDialog(true)}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                data-testid="quick-action-student-leave"
              >
                <UserX className="w-6 h-6" />
                <span>Student Leave</span>
              </Button>
            )}
          </div>
        </div>

        {/* No Classes Warning */}
        {availableClasses.length === 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">No Class Assigned</p>
                <p className="text-sm text-amber-600">आपको कोई class assign नहीं है। Principal से संपर्क करें।</p>
              </div>
            </CardContent>
          </Card>
        )}

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
            onClick={() => availableClasses.length > 0 && setShowClassSelector(true)}
            className={`flex flex-col items-center gap-1 p-2 ${availableClasses.length > 0 ? 'text-gray-500' : 'text-gray-300'}`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs">Attendance</span>
          </button>
          <button 
            onClick={() => setShowSyllabusTracker(true)}
            className="flex flex-col items-center gap-1 p-2 text-gray-500"
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-xs">Syllabus</span>
          </button>
          <button 
            onClick={() => { fetchHomeworkSubmissions(); setShowHomeworkList(true); }}
            className="flex flex-col items-center gap-1 p-2 text-gray-500"
          >
            <FileEdit className="w-5 h-5" />
            <span className="text-xs">Homework</span>
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
            {availableClasses.length > 0 ? (
              availableClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => openAttendanceForClass(cls)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-emerald-50 rounded-lg border hover:border-emerald-300 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{cls.name}</p>
                    <p className="text-sm text-gray-500">{cls.type}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
                <p className="text-gray-500">No classes assigned</p>
                <p className="text-sm text-gray-400">आपको कोई class assign नहीं है</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Syllabus Update Dialog */}
      <Dialog open={showSyllabusUpdate} onOpenChange={setShowSyllabusUpdate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-600" />
              Update Chapter Progress
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={syllabusUpdateForm.status}
                onChange={(e) => setSyllabusUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 mt-1"
                data-testid="syllabus-update-status"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Topics Covered</label>
              <Input
                placeholder="Comma separated topics"
                value={syllabusUpdateForm.topics}
                onChange={(e) => setSyllabusUpdateForm((prev) => ({ ...prev, topics: e.target.value }))}
                data-testid="syllabus-update-topics"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Teaching Notes</label>
              <Textarea
                placeholder="Class notes या teaching points लिखें"
                value={syllabusUpdateForm.notes}
                onChange={(e) => setSyllabusUpdateForm((prev) => ({ ...prev, notes: e.target.value }))}
                data-testid="syllabus-update-notes"
              />
            </div>
            <Button onClick={handleSyllabusUpdate} className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="syllabus-update-submit">
              Save Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Summary Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Lesson Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {lessonLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating summary...
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-line">{lessonSummary || 'Summary will appear here.'}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Sheet Dialog - Enhanced with more options */}
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
              <div className="flex gap-3 text-sm">
                <span className="text-emerald-600">P: {todayStats.present}</span>
                <span className="text-rose-600">A: {todayStats.absent}</span>
                <span className="text-yellow-600">L: {todayStats.late}</span>
                <span className="text-blue-600">Leave: {todayStats.leave}</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg">
              {ATTENDANCE_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-1 text-xs">
                  <span className={`w-3 h-3 rounded ${opt.color}`}></span>
                  <span>{opt.label}</span>
                </div>
              ))}
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
                  <div className="flex gap-1">
                    {ATTENDANCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => markAttendance(student.id, opt.value)}
                        className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm transition-all ${
                          attendanceData[student.id] === opt.value 
                            ? opt.color + ' ring-2 ring-offset-1 ring-gray-400' 
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                        title={opt.label}
                      >
                        {opt.icon}
                      </button>
                    ))}
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
                {availableClasses.map(cls => (
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

      {/* Homework Dialog - Enhanced with Chapter/Topic */}
      <Dialog open={showHomeworkDialog} onOpenChange={setShowHomeworkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Homework</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Class</label>
                <select
                  value={homeworkForm.class_id}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, class_id: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg"
                >
                  <option value="">Select Class</option>
                  {availableClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={homeworkForm.subject}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Chapter</label>
                <Input
                  value={homeworkForm.chapter}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, chapter: e.target.value })}
                  placeholder="e.g., Chapter 5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Topic</label>
                <Input
                  value={homeworkForm.topic}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, topic: e.target.value })}
                  placeholder="e.g., Quadratic Equations"
                />
              </div>
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
            
            <div className="flex gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Type your question..."
                onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                data-testid="tino-ai-input"
              />
              <Button onClick={handleAIChat} disabled={aiLoading || !aiInput.trim()} data-testid="tino-ai-send-button">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Homework Submissions/Check Dialog */}
      <Dialog open={showHomeworkList} onOpenChange={setShowHomeworkList}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Homework Submissions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {homeworkSubmissions.length > 0 ? (
              homeworkSubmissions.map((submission, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{submission.student_name}</p>
                      <p className="text-sm text-gray-500">{submission.subject} • {submission.class_name}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(submission.submitted_at).toLocaleString('hi-IN')}</p>
                    </div>
                    <Badge className={
                      submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      submission.status === 'revision' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {submission.status || 'Pending Review'}
                    </Badge>
                  </div>
                  
                  {submission.image_url && (
                    <div className="mt-3">
                      <img 
                        src={submission.image_url} 
                        alt="Homework" 
                        className="max-h-40 rounded border cursor-pointer hover:opacity-90"
                        onClick={() => window.open(submission.image_url, '_blank')}
                      />
                    </div>
                  )}
                  
                  {submission.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleHomeworkReview(submission.id, 'approved', 'अच्छा काम!')}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-yellow-700 border-yellow-300"
                        onClick={() => handleHomeworkReview(submission.id, 'revision', 'Please improve')}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" /> Needs Revision
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileEdit className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No homework submissions yet</p>
                <p className="text-sm text-gray-400">Students will appear here when they submit homework</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Total: {notifications.length}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllNotificationsRead}
                data-testid="notifications-mark-all"
              >
                Mark all read
              </Button>
            </div>
            {notifications.length > 0 ? (
              notifications.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleMarkNotificationRead(note.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${note.is_read ? 'bg-white' : 'bg-amber-50 border-amber-200'}`}
                  data-testid={`notification-item-${note.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{note.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{note.message}</p>
                    </div>
                    {!note.is_read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {note.created_at ? new Date(note.created_at).toLocaleString('hi-IN') : ''}
                  </p>
                </button>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No notifications yet</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Syllabus Tracker Dialog */}
      <Dialog open={showSyllabusTracker} onOpenChange={setShowSyllabusTracker}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              Syllabus Tracker
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Subject-wise syllabus tracking, chapter progress, aur week/month/year analytics yahan milेंगे।
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Assigned Subjects</h4>
                {mySubjects.length > 0 ? (
                  mySubjects.map((sub, idx) => (
                    <button
                      key={`${sub.class_id}-${sub.subject}-${idx}`}
                      onClick={() => handleSelectSyllabusSubject(sub)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSubjectForSyllabus?.subject === sub.subject && selectedSubjectForSyllabus?.class_id === sub.class_id
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                      data-testid={`syllabus-subject-${idx}`}
                    >
                      <p className="font-medium text-gray-800">{sub.subject}</p>
                      <p className="text-xs text-gray-500">{sub.class_name || 'Class'}</p>
                      <p className="text-[11px] text-gray-400 mt-1">Board: {sub.board || 'NCERT'}</p>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 border rounded-lg bg-slate-50">
                    <BookMarked className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No subjects assigned yet</p>
                    <p className="text-sm text-gray-400">Admin से subject assign करवाएं</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                {selectedSubjectForSyllabus ? (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">{selectedSubjectForSyllabus.class_name}</p>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedSubjectForSyllabus.subject}</h3>
                      </div>
                      <div className="flex gap-2">
                        {['week', 'month', 'year'].map((rangeValue) => (
                          <Button
                            key={rangeValue}
                            size="sm"
                            variant={syllabusRange === rangeValue ? 'default' : 'outline'}
                            onClick={() => handleSyllabusRangeChange(rangeValue)}
                            data-testid={`syllabus-range-${rangeValue}`}
                          >
                            {rangeValue === 'week' ? 'Week' : rangeValue === 'month' ? 'Month' : 'Year'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(() => {
                        const totalChapters = syllabusChapters.length || syllabusAnalytics?.summary?.total_chapters || 0;
                        const completed = syllabusAnalytics?.summary?.completed || 0;
                        const inProgress = syllabusAnalytics?.summary?.in_progress || 0;
                        const remaining = Math.max(totalChapters - completed - inProgress, 0);
                        return (
                          <>
                            <Card className="border bg-white">
                              <CardContent className="p-3">
                                <p className="text-xs text-gray-500">Total Chapters</p>
                                <p className="text-lg font-bold text-gray-900">{totalChapters}</p>
                              </CardContent>
                            </Card>
                            <Card className="border bg-white">
                              <CardContent className="p-3">
                                <p className="text-xs text-gray-500">Completed</p>
                                <p className="text-lg font-bold text-emerald-600">{completed}</p>
                              </CardContent>
                            </Card>
                            <Card className="border bg-white">
                              <CardContent className="p-3">
                                <p className="text-xs text-gray-500">In Progress</p>
                                <p className="text-lg font-bold text-amber-600">{inProgress}</p>
                              </CardContent>
                            </Card>
                            <Card className="border bg-white">
                              <CardContent className="p-3">
                                <p className="text-xs text-gray-500">Remaining</p>
                                <p className="text-lg font-bold text-slate-600">{remaining}</p>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>

                    {syllabusAnalytics && (
                      <div className="text-xs text-gray-500">
                        इस {syllabusRange} में {syllabusAnalytics.range_stats?.completed_in_range || 0} chapters complete हुए • {syllabusAnalytics.range_stats?.updated_in_range || 0} updates
                      </div>
                    )}

                    <div className="space-y-3">
                      {syllabusChapters.length > 0 ? (
                        syllabusChapters.map((chapter) => {
                          const progress = syllabusProgressMap[chapter.number] || {};
                          const status = progress.status || 'not_started';
                          const statusStyles = status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'in_progress'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600';
                          return (
                            <div key={chapter.number} className="p-4 rounded-lg border bg-white">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-gray-900">Chapter {chapter.number}: {chapter.name}</p>
                                  {chapter.topics?.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">Topics: {chapter.topics.slice(0, 5).join(', ')}</p>
                                  )}
                                </div>
                                <Badge className={statusStyles} data-testid={`syllabus-status-${chapter.number}`}>
                                  {status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </Badge>
                              </div>
                              {progress.topics_covered?.length > 0 && (
                                <p className="text-xs text-slate-500 mt-2">Covered: {progress.topics_covered.join(', ')}</p>
                              )}
                              {progress.notes && (
                                <p className="text-xs text-slate-500 mt-1">Notes: {progress.notes}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openSyllabusUpdateDialog(chapter)}
                                  data-testid={`syllabus-update-${chapter.number}`}
                                >
                                  Update Status
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openLessonSummary(chapter)}
                                  data-testid={`syllabus-lesson-${chapter.number}`}
                                >
                                  Open Lesson
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          No chapters found for this subject.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center border rounded-lg bg-slate-50 text-gray-500">
                    Subject select karke syllabus tracking start karein.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Queries Dialog */}
      <Dialog open={showQueriesDialog} onOpenChange={setShowQueriesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-600" />
              Student Queries
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {studentQueries.length > 0 ? (
              studentQueries.map((query, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${(query.status === 'answered' || query.answer) ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{query.student_name}</p>
                      <p className="text-sm text-gray-500">{query.subject} • {query.class_name}</p>
                    </div>
                    <Badge className={(query.status === 'answered' || query.answer) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {(query.status === 'answered' || query.answer) ? 'Answered' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-gray-700 p-2 bg-white rounded">{query.question}</p>
                  
                  {(query.status === 'answered' || query.answer) ? (
                    <div className="mt-2 p-2 bg-green-100 rounded">
                      <p className="text-sm text-green-800">{query.answer}</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Textarea 
                        placeholder="Answer this query..."
                        className="mb-2"
                        value={queryAnswerDrafts[query.id] || ''}
                        onChange={(e) => setQueryAnswerDrafts((prev) => ({ ...prev, [query.id]: e.target.value }))}
                        data-testid={`query-answer-input-${query.id}`}
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          const answer = queryAnswerDrafts[query.id];
                          if (answer) handleAnswerQuery(query.id, answer);
                        }}
                        data-testid={`query-answer-submit-${query.id}`}
                      >
                        <Send className="w-4 h-4 mr-1" /> Send Answer
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No student queries</p>
                <p className="text-sm text-gray-400">Students can ask questions via StudyTino</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
