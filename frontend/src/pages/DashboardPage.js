import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Users, UserCog, CalendarCheck, Wallet,
  Loader2, Settings, GraduationCap, IndianRupee,
  Clock, FileText, Bell, Bus,
  Video, MessageSquare, Calendar, Brain, Shield,
  BarChart3, ChevronRight, ArrowUpRight, ArrowDownRight,
  Target, Package, Building, Tv,
  BookOpen, Clipboard, Wrench, UserPlus, Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) fetchStats();
    else setLoading(false);
  }, [schoolId]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats?school_id=${schoolId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to SchoolTino</h2>
        <p className="text-sm text-gray-500 mb-6">Set up your school to get started.</p>
        <button onClick={() => navigate('/app/settings')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 inline-flex items-center gap-2">
          <Settings className="w-4 h-4" />Get Started
        </button>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users, gradient: 'from-blue-500 to-blue-600', trend: '+12%', trendUp: true },
    { label: 'Total Staff', value: stats?.total_staff || 0, icon: UserCog, gradient: 'from-purple-500 to-purple-600', trend: '+5%', trendUp: true },
    { label: 'Fee Collected', value: `\u20B9${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', trend: '+18%', trendUp: true },
    { label: 'Attendance Today', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck, gradient: 'from-orange-500 to-amber-600', trend: '+2%', trendUp: true },
    { label: 'Pending Fees', value: `\u20B9${((stats?.pending_fees || 0) / 1000).toFixed(0)}K`, icon: Wallet, gradient: 'from-red-500 to-rose-600', trend: '-8%', trendUp: false },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'New Admission', path: '/app/students', color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
    { icon: CalendarCheck, label: 'Mark Attendance', path: '/app/attendance', color: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-600' },
    { icon: IndianRupee, label: 'Collect Fee', path: '/app/fees', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { icon: Bell, label: 'Send Notice', path: '/app/communication', color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600' },
    { icon: FileText, label: 'Create Exam', path: '/app/exams', color: 'bg-pink-500', lightBg: 'bg-pink-50', textColor: 'text-pink-600' },
    { icon: Brain, label: 'AI Tools', path: '/app/ai-tools', color: 'bg-indigo-500', lightBg: 'bg-indigo-50', textColor: 'text-indigo-600' },
  ];

  const [moduleVis, setModuleVis] = useState({});
  const loadVis = useCallback(() => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) setModuleVis(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    loadVis();
    const h = () => loadVis();
    window.addEventListener('module_visibility_changed', h);
    return () => window.removeEventListener('module_visibility_changed', h);
  }, [loadVis]);
  const isEnabled = (key) => !key || !moduleVis[key] || moduleVis[key].schooltino !== false;

  const allModules = [
    { icon: Users, label: 'Students', desc: 'Student records & profiles', path: '/app/students', gradient: 'from-blue-500 to-blue-600', mk: 'students' },
    { icon: UserCog, label: 'Staff', desc: 'Employee management', path: '/app/staff', gradient: 'from-purple-500 to-violet-500', mk: 'staff' },
    { icon: GraduationCap, label: 'Classes', desc: 'Class management', path: '/app/classes', gradient: 'from-cyan-500 to-blue-500', mk: 'classes' },
    { icon: CalendarCheck, label: 'Attendance', desc: 'Track attendance', path: '/app/attendance', gradient: 'from-teal-500 to-emerald-500', mk: 'attendance' },
    { icon: IndianRupee, label: 'Fees', desc: 'Fee management', path: '/app/fees', gradient: 'from-emerald-500 to-green-500', mk: 'fee_management' },
    { icon: Target, label: 'Admissions', desc: 'Admission & CRM', path: '/app/admissions', gradient: 'from-cyan-500 to-blue-500' },
    { icon: FileText, label: 'Exams', desc: 'Exam & reports', path: '/app/exams', gradient: 'from-pink-500 to-rose-500', mk: 'exams_reports' },
    { icon: Clock, label: 'Timetable', desc: 'Schedule classes', path: '/app/timetable', gradient: 'from-indigo-500 to-blue-500', mk: 'timetable' },
    { icon: BookOpen, label: 'Library', desc: 'Digital library', path: '/app/library', gradient: 'from-purple-500 to-fuchsia-500', mk: 'digital_library' },
    { icon: Clipboard, label: 'Homework', desc: 'Assignments', path: '/app/homework', gradient: 'from-amber-500 to-orange-500', mk: 'homework' },
    { icon: Tv, label: 'Live Classes', desc: 'Online teaching', path: '/app/live-classes', gradient: 'from-red-500 to-rose-500', mk: 'live_classes' },
    { icon: MessageSquare, label: 'Communication', desc: 'SMS & WhatsApp', path: '/app/communication', gradient: 'from-sky-500 to-cyan-500', mk: 'communication_hub' },
    { icon: Shield, label: 'Front Office', desc: 'Visitor management', path: '/app/front-office', gradient: 'from-teal-500 to-cyan-500' },
    { icon: Bus, label: 'Transport', desc: 'Routes & GPS', path: '/app/transport', gradient: 'from-orange-500 to-red-500', mk: 'transport' },
    { icon: Calendar, label: 'Calendar', desc: 'Events & schedule', path: '/app/calendar', gradient: 'from-emerald-500 to-teal-500', mk: 'calendar' },
    { icon: BarChart3, label: 'Analytics', desc: 'Reports & insights', path: '/app/analytics', gradient: 'from-blue-500 to-indigo-500', mk: 'analytics' },
    { icon: Brain, label: 'AI Tools', desc: 'Paper, Events, Calendar', path: '/app/ai-tools', gradient: 'from-purple-500 to-pink-500', mk: 'ai_tools' },
    { icon: Video, label: 'CCTV', desc: 'Camera monitoring', path: '/app/cctv', gradient: 'from-red-500 to-rose-500', mk: 'cctv' },
    { icon: Package, label: 'Inventory', desc: 'Stock management', path: '/app/inventory', gradient: 'from-slate-500 to-zinc-600', mk: 'inventory' },
    { icon: Building, label: 'Multi-Branch', desc: 'Branch management', path: '/app/multi-branch', gradient: 'from-blue-500 to-indigo-500' },
  ];
  const modules = allModules.filter(m => isEnabled(m.mk));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{greeting}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{schoolData?.name || 'Dashboard'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/analytics')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button onClick={() => navigate('/app/settings')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-sm">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">All Modules</h2>
          <span className="text-xs text-gray-400 font-medium">{modules.length} modules</span>
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
            <h3 className="text-lg font-bold mb-1">Need Help Setting Up?</h3>
            <p className="text-white/70 text-sm">Use Setup Wizard to configure your school quickly.</p>
          </div>
          <button onClick={() => navigate('/app/setup-wizard')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg">
            <Wrench className="w-4 h-4" />
            Setup Wizard
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
