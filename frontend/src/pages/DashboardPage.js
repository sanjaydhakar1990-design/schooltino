import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Users, UserCog, CalendarCheck, Wallet,
  Loader2, Settings, GraduationCap, IndianRupee,
  Clock, FileText, Bell, Bus,
  Video, MessageSquare, Calendar, Brain, Shield,
  BarChart3, ChevronRight, ArrowUpRight, ArrowDownRight,
  Target, Package, Building, Tv,
  BookOpen, Wrench, UserPlus, AlertCircle
} from 'lucide-react';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [moduleVis, setModuleVis] = useState({});

  const visFetched = useRef(false);
  const loadVis = useCallback(async () => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) {
        setModuleVis(JSON.parse(saved));
        return;
      }
    } catch (e) {}
    if (!visFetched.current) {
      visFetched.current = true;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${API}/settings/module-visibility`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Object.keys(data).length > 0) {
              setModuleVis(data);
              localStorage.setItem('module_visibility_settings', JSON.stringify(data));
            }
          }
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    loadVis();
    const h = () => {
      try {
        const saved = localStorage.getItem('module_visibility_settings');
        if (saved) setModuleVis(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('module_visibility_changed', h);
    return () => window.removeEventListener('module_visibility_changed', h);
  }, [loadVis]);

  const fetchStats = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({ total_students: 0, total_staff: 0, fee_collection_month: 0, attendance_today: { present: 0 }, pending_fees: 0 });
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchTeacherRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/teacher-requests?status=pending`, { headers: { Authorization: `Bearer ${token}` } });
      setTeacherRequests(res.data || []);
    } catch (e) {
      console.error('Teacher requests fetch failed:', e);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/pending-count`, { headers: { Authorization: `Bearer ${token}` } });
      setPendingCount(res.data?.pending_requests || 0);
    } catch (e) {
      console.error('Pending count fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    if (schoolId) {
      fetchStats();
      if (user?.role === 'director' || user?.role === 'principal' || user?.role === 'admin') {
        fetchTeacherRequests();
        fetchPendingCount();
      }
    } else {
      setLoading(false);
    }
  }, [schoolId, user?.role, fetchStats, fetchTeacherRequests, fetchPendingCount]);

  const handleApproveRequest = async (reqId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/teacher-requests/${reqId}`, { action: 'approved', note: 'Approved by admin' }, { headers: { Authorization: `Bearer ${token}` } });
      setTeacherRequests(prev => prev.filter(r => r.id !== reqId));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const handleRejectRequest = async (reqId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/teacher-requests/${reqId}`, { action: 'rejected', note: 'Rejected by admin' }, { headers: { Authorization: `Bearer ${token}` } });
      setTeacherRequests(prev => prev.filter(r => r.id !== reqId));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">{t('loading')}</p>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('welcome_to_dashboard')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('setup_school_desc')}</p>
        <button onClick={() => navigate('/app/settings')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 inline-flex items-center gap-2">
          <Settings className="w-4 h-4" />{t('get_started')}
        </button>
      </div>
    );
  }

  const safeStats = stats || { total_students: 0, total_staff: 0, fee_collection_month: 0, attendance_today: { present: 0 }, pending_fees: 0 };

  const statCards = [
    { label: t('total_students'), value: safeStats.total_students || 0, icon: Users, gradient: 'from-blue-500 to-blue-600', trend: '+12%', trendUp: true },
    { label: t('total_staff'), value: safeStats.total_staff || 0, icon: UserCog, gradient: 'from-purple-500 to-purple-600', trend: '+5%', trendUp: true },
    { label: t('fee_collected'), value: `₹${((safeStats.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', trend: '+18%', trendUp: true },
    { label: t('attendance_today'), value: `${safeStats.attendance_today?.present || 0}%`, icon: CalendarCheck, gradient: 'from-orange-500 to-amber-600', trend: '+2%', trendUp: true },
    { label: t('pending_fees'), value: `₹${((safeStats.pending_fees || 0) / 1000).toFixed(0)}K`, icon: Wallet, gradient: 'from-red-500 to-rose-600', trend: '-8%', trendUp: false },
  ];

  const quickActions = [
    { icon: UserPlus, label: t('new_admissions'), path: '/app/students', color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
    { icon: CalendarCheck, label: t('mark_attendance'), path: '/app/attendance', color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600' },
    { icon: IndianRupee, label: t('collect_fee'), path: '/app/fees', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { icon: Bell, label: t('send_notice'), path: '/app/communication', color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600' },
    { icon: FileText, label: t('create_exam'), path: '/app/exams', color: 'bg-pink-500', lightBg: 'bg-pink-50', textColor: 'text-pink-600' },
    { icon: Brain, label: t('ai_tools'), path: '/app/ai-tools', color: 'bg-indigo-500', lightBg: 'bg-indigo-50', textColor: 'text-indigo-600' },
  ];

  const isEnabled = (key) => !key || !moduleVis[key] || moduleVis[key].schooltino !== false;

  const allModules = [
    { icon: Users, label: t('students'), desc: t('student_list'), path: '/app/students', gradient: 'from-blue-500 to-blue-600', mk: 'students' },
    { icon: UserCog, label: t('staff'), desc: t('staff_management'), path: '/app/staff', gradient: 'from-purple-500 to-violet-500', mk: 'staff' },
    { icon: GraduationCap, label: t('classes'), desc: t('class_list'), path: '/app/classes', gradient: 'from-cyan-500 to-blue-500', mk: 'classes' },
    { icon: CalendarCheck, label: t('attendance'), desc: t('view_attendance'), path: '/app/attendance', gradient: 'from-teal-500 to-emerald-500', mk: 'attendance' },
    { icon: IndianRupee, label: t('fees'), desc: t('fee_management'), path: '/app/fees', gradient: 'from-emerald-500 to-green-500', mk: 'fee_management' },
    { icon: Target, label: t('admissions'), desc: t('admissions_crm'), path: '/app/admissions', gradient: 'from-cyan-500 to-blue-500', mk: 'admissions' },
    { icon: FileText, label: t('exams'), desc: t('exams_reports'), path: '/app/exams', gradient: 'from-pink-500 to-rose-500', mk: 'exams_reports' },
    { icon: Clock, label: t('timetable'), desc: t('schedule_class'), path: '/app/timetable', gradient: 'from-indigo-500 to-blue-500', mk: 'timetable' },
    { icon: BookOpen, label: t('library'), desc: t('digital_library'), path: '/app/library', gradient: 'from-purple-500 to-fuchsia-500', mk: 'digital_library' },
    { icon: Tv, label: t('live_classes'), desc: t('online_class'), path: '/app/live-classes', gradient: 'from-red-500 to-rose-500', mk: 'live_classes' },
    { icon: MessageSquare, label: t('communication'), desc: t('communication_hub'), path: '/app/communication', gradient: 'from-sky-500 to-cyan-500', mk: 'communication_hub' },
    { icon: Shield, label: t('front_office'), desc: t('visitor_management'), path: '/app/front-office', gradient: 'from-teal-500 to-cyan-500', mk: 'front_office' },
    { icon: Bus, label: t('transport'), desc: t('gps_tracking'), path: '/app/transport', gradient: 'from-orange-500 to-red-500', mk: 'transport' },
    { icon: Calendar, label: t('calendar'), desc: t('events'), path: '/app/calendar', gradient: 'from-emerald-500 to-teal-500', mk: 'calendar' },
    { icon: BarChart3, label: t('analytics'), desc: t('reports'), path: '/app/analytics', gradient: 'from-blue-500 to-indigo-500', mk: 'analytics' },
    { icon: Brain, label: t('ai_tools'), desc: t('ai_paper'), path: '/app/ai-tools', gradient: 'from-purple-500 to-pink-500', mk: 'ai_tools' },
    { icon: Video, label: t('cctv'), desc: t('cctv_integration'), path: '/app/cctv', gradient: 'from-red-500 to-rose-500', mk: 'cctv' },
    { icon: Package, label: t('inventory'), desc: t('item_list'), path: '/app/inventory', gradient: 'from-slate-500 to-zinc-600', mk: 'inventory' },
    { icon: Building, label: t('multi_branch'), desc: t('branch_list'), path: '/app/multi-branch', gradient: 'from-blue-500 to-indigo-500', mk: 'multi_branch' },
  ];
  const modules = allModules.filter(m => isEnabled(m.mk));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('good_morning') : hour < 17 ? t('good_afternoon') : t('good_evening');

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{greeting}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user?.name?.split(' ')[0] || t('dashboard')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{schoolData?.name || t('dashboard')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/analytics')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">{t('analytics')}</span>
          </button>
          <button onClick={() => navigate('/app/settings')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-sm">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{card.value}</div>
            <div className="text-xs text-gray-500 font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('quick_actions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => navigate(action.path)} className={`flex flex-col items-center gap-2.5 p-4 ${action.lightBg} rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-gray-200`}>
              <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold ${action.textColor}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {teacherRequests.length > 0 && (user?.role === 'director' || user?.role === 'principal') && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('teacher_requests_pending')}</h2>
                <p className="text-xs text-gray-500">{teacherRequests.length} {t('requests_waiting_action')}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {teacherRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">{req.title}</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 capitalize">{req.request_type}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{req.teacher_name} - {req.description?.slice(0, 80)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleApproveRequest(req.id)} className="px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">{t('approve')}</button>
                  <button onClick={() => handleRejectRequest(req.id)} className="px-4 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">{t('reject')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('all_modules')}</h2>
          <span className="text-xs text-gray-400 font-medium">{modules.length}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {modules.map((mod, idx) => (
            <button key={idx} onClick={() => navigate(mod.path)} className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
              <div className={`w-12 h-12 bg-gradient-to-br ${mod.gradient} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <mod.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-gray-800 block">{mod.label}</span>
                <span className="text-[10px] text-gray-400">{mod.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-1">{t('need_help_setup')}</h3>
            <p className="text-white/70 text-sm">{t('setup_wizard_desc')}</p>
          </div>
          <button onClick={() => navigate('/app/setup-wizard')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg">
            <Wrench className="w-4 h-4" />
            {t('setup_wizard')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
