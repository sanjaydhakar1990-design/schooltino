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
  BookOpen, Wrench, UserPlus, AlertCircle,
  TrendingUp, CheckCircle2, AlertTriangle,
  Sparkles
} from 'lucide-react';

const API = `${(process.env.REACT_APP_BACKEND_URL || '')}/api`;

/* ============================================================
   STAT CARD
   ============================================================ */
function StatCard({ label, value, icon: Icon, color, trend, trendUp }) {
  const colorMap = {
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-100',    iconText: 'text-blue-600',    text: 'text-blue-700' },
    purple:  { bg: 'bg-purple-50',  icon: 'bg-purple-100',  iconText: 'text-purple-600',  text: 'text-purple-700' },
    green:   { bg: 'bg-emerald-50', icon: 'bg-emerald-100', iconText: 'text-emerald-600', text: 'text-emerald-700' },
    orange:  { bg: 'bg-orange-50',  icon: 'bg-orange-100',  iconText: 'text-orange-600',  text: 'text-orange-700' },
    red:     { bg: 'bg-red-50',     icon: 'bg-red-100',     iconText: 'text-red-500',     text: 'text-red-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.iconText}`} />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  );
}

/* ============================================================
   QUICK ACTION BUTTON
   ============================================================ */
function QuickAction({ icon: Icon, label, path, color }) {
  const navigate = useNavigate();
  const colorMap = {
    blue:   { bg: 'bg-blue-600',    hover: 'hover:bg-blue-700',    light: 'bg-blue-50 hover:bg-blue-100',    text: 'text-blue-700' },
    purple: { bg: 'bg-purple-600',  hover: 'hover:bg-purple-700',  light: 'bg-purple-50 hover:bg-purple-100', text: 'text-purple-700' },
    green:  { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', light: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700' },
    orange: { bg: 'bg-orange-500',  hover: 'hover:bg-orange-600',  light: 'bg-orange-50 hover:bg-orange-100',text: 'text-orange-700' },
    pink:   { bg: 'bg-pink-600',    hover: 'hover:bg-pink-700',    light: 'bg-pink-50 hover:bg-pink-100',    text: 'text-pink-700' },
    indigo: { bg: 'bg-indigo-600',  hover: 'hover:bg-indigo-700',  light: 'bg-indigo-50 hover:bg-indigo-100', text: 'text-indigo-700' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-2.5 p-4 ${c.light} rounded-xl transition-all duration-150 group`}
    >
      <div className={`w-10 h-10 ${c.bg} ${c.hover} rounded-xl flex items-center justify-center transition-colors shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className={`text-xs font-semibold ${c.text} text-center leading-tight`}>{label}</span>
    </button>
  );
}

/* ============================================================
   MODULE CARD
   ============================================================ */
function ModuleCard({ icon: Icon, label, desc, path, accent }) {
  const navigate = useNavigate();
  const accents = {
    blue:   'text-blue-600 bg-blue-50 group-hover:bg-blue-100',
    purple: 'text-purple-600 bg-purple-50 group-hover:bg-purple-100',
    cyan:   'text-cyan-600 bg-cyan-50 group-hover:bg-cyan-100',
    teal:   'text-teal-600 bg-teal-50 group-hover:bg-teal-100',
    green:  'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100',
    orange: 'text-orange-600 bg-orange-50 group-hover:bg-orange-100',
    pink:   'text-pink-600 bg-pink-50 group-hover:bg-pink-100',
    indigo: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100',
    red:    'text-red-500 bg-red-50 group-hover:bg-red-100',
    sky:    'text-sky-600 bg-sky-50 group-hover:bg-sky-100',
    amber:  'text-amber-600 bg-amber-50 group-hover:bg-amber-100',
    slate:  'text-slate-600 bg-slate-50 group-hover:bg-slate-100',
  };
  const cls = accents[accent] || accents.blue;
  return (
    <button
      onClick={() => navigate(path)}
      className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-150 group"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-center">
        <span className="text-xs font-semibold text-gray-800 block leading-tight">{label}</span>
        {desc && <span className="text-[10px] text-gray-400 mt-0.5 block leading-tight">{desc}</span>}
      </div>
    </button>
  );
}

/* ============================================================
   MAIN DASHBOARD PAGE
   ============================================================ */
export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [moduleVis, setModuleVis] = useState({});
  const visFetched = useRef(false);

  const loadVis = useCallback(async () => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) { setModuleVis(JSON.parse(saved)); return; }
    } catch (e) {}
    if (!visFetched.current) {
      visFetched.current = true;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${API}/settings/module-visibility`, { headers: { Authorization: `Bearer ${token}` } });
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
      try { const s = localStorage.getItem('module_visibility_settings'); if (s) setModuleVis(JSON.parse(s)); } catch (e) {}
    };
    window.addEventListener('module_visibility_changed', h);
    return () => window.removeEventListener('module_visibility_changed', h);
  }, [loadVis]);

  const fetchStats = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/dashboard/stats?school_id=${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
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
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (schoolId) {
      fetchStats();
      if (['director', 'principal', 'admin'].includes(user?.role)) fetchTeacherRequests();
    } else {
      setLoading(false);
    }
  }, [schoolId, user?.role, fetchStats, fetchTeacherRequests]);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/teacher-requests/${id}`, { action: 'approved', note: 'Approved by admin' }, { headers: { Authorization: `Bearer ${token}` } });
      setTeacherRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {}
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/teacher-requests/${id}`, { action: 'rejected', note: 'Rejected by admin' }, { headers: { Authorization: `Bearer ${token}` } });
      setTeacherRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {}
  };

  /* Loading */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  /* No school setup */
  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to SchoolTino!</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">Complete your school setup to start using the dashboard.</p>
        <button
          onClick={() => navigate('/app/settings')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Settings className="w-4 h-4" />Get Started
        </button>
      </div>
    );
  }

  const s = stats || { total_students: 0, total_staff: 0, fee_collection_month: 0, attendance_today: { present: 0 }, pending_fees: 0 };
  const isEnabled = (key) => !key || !moduleVis[key] || moduleVis[key].schooltino !== false;

  /* Time-based greeting */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ---- WELCOME HEADER ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'}</span>
            <p className="text-sm text-gray-500">{greeting},</p>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{firstName}!</h1>
          <p className="text-sm text-gray-400 mt-0.5">{schoolData?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/analytics')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button
            onClick={() => navigate('/app/settings')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* ---- STAT CARDS ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard label="Total Students"  value={s.total_students || 0}                                       icon={Users}         color="blue"   trend="+12%" trendUp={true} />
        <StatCard label="Total Staff"     value={s.total_staff || 0}                                          icon={UserCog}       color="purple" trend="+5%"  trendUp={true} />
        <StatCard label="Fee Collected"   value={`₹${((s.fee_collection_month || 0)/1000).toFixed(0)}K`}      icon={IndianRupee}   color="green"  trend="+18%" trendUp={true} />
        <StatCard label="Attendance"      value={`${s.attendance_today?.present || 0}%`}                      icon={CalendarCheck} color="orange" trend="+2%"  trendUp={true} />
        <StatCard label="Pending Fees"    value={`₹${((s.pending_fees || 0)/1000).toFixed(0)}K`}              icon={Wallet}        color="red"    trend="-8%"  trendUp={false} />
      </div>

      {/* ---- QUICK ACTIONS ---- */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <QuickAction icon={UserPlus}    label="New Student"   path="/app/students"      color="blue" />
          <QuickAction icon={CalendarCheck} label="Attendance" path="/app/attendance"    color="purple" />
          <QuickAction icon={IndianRupee} label="Collect Fee"  path="/app/fees"          color="green" />
          <QuickAction icon={Bell}        label="Send Notice"  path="/app/communication" color="orange" />
          <QuickAction icon={FileText}    label="Exams"        path="/app/exams"         color="pink" />
          <QuickAction icon={Brain}       label="Tino AI"      path="/app/ai-tools"      color="indigo" />
        </div>
      </div>

      {/* ---- PENDING TEACHER REQUESTS ---- */}
      {teacherRequests.length > 0 && ['director', 'principal', 'admin'].includes(user?.role) && (
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pending Requests</h2>
              <p className="text-xs text-gray-500">{teacherRequests.length} request{teacherRequests.length > 1 ? 's' : ''} waiting for your action</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {teacherRequests.slice(0, 4).map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-4 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-800">{req.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 capitalize">{req.request_type}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{req.teacher_name} — {req.description?.slice(0, 70)}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-3 py-1.5 bg-white text-red-500 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- ALL MODULES ---- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">All Modules</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {[
              { mk: 'students' }, { mk: 'staff' }, { mk: 'classes' }, { mk: 'attendance' },
              { mk: 'fee_management' }, { mk: 'admissions' }, { mk: 'exams_reports' },
              { mk: 'timetable' }, { mk: 'digital_library' }, { mk: 'live_classes' },
              { mk: 'communication_hub' }, { mk: 'front_office' }, { mk: 'transport' },
              { mk: 'calendar' }, { mk: 'analytics' }, { mk: 'ai_tools' },
              { mk: 'cctv' }, { mk: 'inventory' }, { mk: 'multi_branch' },
            ].filter(m => isEnabled(m.mk)).length} modules
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {isEnabled('students')        && <ModuleCard icon={Users}        label="Students"      desc="Student list"      path="/app/students"      accent="blue" />}
          {isEnabled('staff')           && <ModuleCard icon={UserCog}      label="Staff"         desc="Management"        path="/app/staff"         accent="purple" />}
          {isEnabled('classes')         && <ModuleCard icon={GraduationCap}label="Classes"       desc="Class list"        path="/app/classes"       accent="cyan" />}
          {isEnabled('attendance')      && <ModuleCard icon={CalendarCheck}label="Attendance"    desc="Track attendance"  path="/app/attendance"    accent="teal" />}
          {isEnabled('fee_management')  && <ModuleCard icon={IndianRupee}  label="Fees"          desc="Fee management"    path="/app/fees"          accent="green" />}
          {isEnabled('admissions')      && <ModuleCard icon={Target}       label="Admissions"    desc="CRM"               path="/app/admissions"    accent="sky" />}
          {isEnabled('exams_reports')   && <ModuleCard icon={FileText}     label="Exams"         desc="Reports"           path="/app/exams"         accent="pink" />}
          {isEnabled('timetable')       && <ModuleCard icon={Clock}        label="Timetable"     desc="Schedules"         path="/app/timetable"     accent="indigo" />}
          {isEnabled('digital_library') && <ModuleCard icon={BookOpen}     label="Library"       desc="Digital books"     path="/app/library"       accent="amber" />}
          {isEnabled('live_classes')    && <ModuleCard icon={Tv}           label="Live Classes"  desc="Online"            path="/app/live-classes"  accent="red" />}
          {isEnabled('communication_hub')&&<ModuleCard icon={MessageSquare}label="Communication" desc="Notices & SMS"     path="/app/communication" accent="sky" />}
          {isEnabled('front_office')    && <ModuleCard icon={Shield}       label="Front Office"  desc="Visitors"          path="/app/front-office"  accent="teal" />}
          {isEnabled('transport')       && <ModuleCard icon={Bus}          label="Transport"     desc="GPS tracking"      path="/app/transport"     accent="orange" />}
          {isEnabled('calendar')        && <ModuleCard icon={Calendar}     label="Calendar"      desc="Events"            path="/app/calendar"      accent="green" />}
          {isEnabled('analytics')       && <ModuleCard icon={BarChart3}    label="Analytics"     desc="Reports"           path="/app/analytics"     accent="blue" />}
          {isEnabled('ai_tools')        && <ModuleCard icon={Brain}        label="AI Tools"      desc="Smart features"    path="/app/ai-tools"      accent="indigo" />}
          {isEnabled('cctv')            && <ModuleCard icon={Video}        label="CCTV"          desc="Surveillance"      path="/app/cctv"          accent="red" />}
          {isEnabled('inventory')       && <ModuleCard icon={Package}      label="Inventory"     desc="Item tracking"     path="/app/inventory"     accent="slate" />}
          {isEnabled('multi_branch')    && <ModuleCard icon={Building}     label="Multi-Branch"  desc="Branches"          path="/app/multi-branch"  accent="blue" />}
        </div>
      </div>

      {/* ---- SETUP WIZARD BANNER ---- */}
      <div className="bg-indigo-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Setup Wizard</h3>
            <p className="text-indigo-200 text-xs mt-0.5">Complete your school setup step by step.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/setup-wizard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm flex-shrink-0"
        >
          <Wrench className="w-4 h-4" />
          Open Wizard
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
