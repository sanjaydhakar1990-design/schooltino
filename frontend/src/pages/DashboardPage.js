import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Users, UserCog, CalendarCheck, Wallet,
  Loader2, Settings, GraduationCap, IndianRupee,
  Clock, FileText, Bell, Sparkles, Bus,
  Fingerprint, Video, Image, MessageSquare,
  Calendar, Brain, Shield, Award,
  Calculator, Wrench, UserPlus,
  Rss, ShoppingBag, Building, Globe,
  BarChart3, ChevronRight, ArrowUpRight, ArrowDownRight,
  CreditCard, Target, BookMarked, Package, Home, Tv,
  Layers, Megaphone, Smartphone, Link2, BookOpen, Heart
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
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-card-blue flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No School Selected</h2>
        <p className="text-sm text-gray-500 mb-6">Create or select a school from Settings to get started.</p>
        <button onClick={() => navigate('/app/settings')} className="btn-primary inline-flex items-center gap-2">
          <Settings className="w-4 h-4" />Go to Settings
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
    { icon: IndianRupee, label: 'Collect Fee', path: '/app/fee-management', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { icon: Bell, label: 'Send Notice', path: '/app/notices', color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600' },
    { icon: FileText, label: 'Create Exam', path: '/app/exam-report', color: 'bg-pink-500', lightBg: 'bg-pink-50', textColor: 'text-pink-600' },
    { icon: MessageSquare, label: 'Send SMS', path: '/app/sms', color: 'bg-indigo-500', lightBg: 'bg-indigo-50', textColor: 'text-indigo-600' },
  ];

  const moduleGroups = [
    {
      title: 'Admission & Enrollment',
      modules: [
        { icon: Users, label: 'Students', desc: 'Student records', path: '/app/students', gradient: 'from-blue-500 to-blue-600' },
        { icon: Target, label: 'Admission CRM', desc: 'Lead tracking', path: '/app/admission-crm', gradient: 'from-cyan-500 to-blue-500' },
        { icon: Megaphone, label: 'Marketing', desc: 'SEO & campaigns', path: '/app/marketing', gradient: 'from-green-500 to-emerald-500' },
      ],
    },
    {
      title: 'Academic Management',
      modules: [
        { icon: GraduationCap, label: 'Classes', desc: 'Class management', path: '/app/classes', gradient: 'from-cyan-500 to-blue-500' },
        { icon: CalendarCheck, label: 'Attendance', desc: 'Track attendance', path: '/app/attendance', gradient: 'from-teal-500 to-emerald-500' },
        { icon: Clock, label: 'Timetable', desc: 'Schedule classes', path: '/app/timetable-management', gradient: 'from-indigo-500 to-blue-500' },
        { icon: FileText, label: 'Exams & Reports', desc: 'Exam & grading', path: '/app/exam-report', gradient: 'from-pink-500 to-rose-500' },
        { icon: BookMarked, label: 'Homework', desc: 'Assign & grade', path: '/app/homework', gradient: 'from-teal-500 to-green-500' },
        { icon: Award, label: 'Certificates', desc: 'Generate certs', path: '/app/certificates', gradient: 'from-amber-500 to-orange-500' },
      ],
    },
    {
      title: 'Learning & Content',
      modules: [
        { icon: BookOpen, label: 'Digital Library', desc: 'Books & e-books', path: '/app/digital-library', gradient: 'from-purple-500 to-fuchsia-500' },
        { icon: Tv, label: 'Live Classes', desc: 'Online teaching', path: '/app/live-classes', gradient: 'from-red-500 to-rose-500' },
        { icon: Layers, label: 'Courses', desc: 'Course builder', path: '/app/course-management', gradient: 'from-indigo-500 to-violet-500' },
      ],
    },
    {
      title: 'HR & Staff Management',
      modules: [
        { icon: UserCog, label: 'Staff & Permissions', desc: 'Employee mgmt', path: '/app/employee-management', gradient: 'from-purple-500 to-violet-500' },
        { icon: Calendar, label: 'Leave', desc: 'Leave tracking', path: '/app/leave', gradient: 'from-teal-500 to-cyan-500' },
        { icon: Wallet, label: 'Salary', desc: 'Payroll mgmt', path: '/app/salary', gradient: 'from-green-500 to-emerald-500' },
        { icon: Fingerprint, label: 'AI Staff Attendance', desc: 'Geo-facial scan', path: '/app/ai-staff-attendance', gradient: 'from-green-500 to-emerald-500' },
      ],
    },
    {
      title: 'Finance & Payments',
      modules: [
        { icon: IndianRupee, label: 'Fees', desc: 'Fee management', path: '/app/fee-management', gradient: 'from-emerald-500 to-green-500' },
        { icon: Calculator, label: 'Accountant', desc: 'Finance tools', path: '/app/accountant', gradient: 'from-sky-500 to-blue-500' },
        { icon: CreditCard, label: 'Credit System', desc: 'Credits & plans', path: '/app/credit-system', gradient: 'from-amber-500 to-orange-500' },
        { icon: Wallet, label: 'Student Wallet', desc: 'Digital wallet', path: '/app/student-wallet', gradient: 'from-violet-500 to-purple-500' },
        { icon: ShoppingBag, label: 'e-Store', desc: 'School store', path: '/app/e-store', gradient: 'from-fuchsia-500 to-pink-500' },
        { icon: Globe, label: 'Tally Integration', desc: 'Accounting sync', path: '/app/tally-integration', gradient: 'from-orange-500 to-red-500' },
      ],
    },
    {
      title: 'Communication',
      modules: [
        { icon: Bell, label: 'Notices', desc: 'Announcements', path: '/app/notices', gradient: 'from-orange-500 to-amber-500' },
        { icon: MessageSquare, label: 'SMS & WhatsApp', desc: 'Send messages', path: '/app/sms', gradient: 'from-sky-500 to-cyan-500' },
        { icon: MessageSquare, label: 'Integrated Comms', desc: 'All-in-one comms', path: '/app/integrated-comm', gradient: 'from-blue-500 to-indigo-500' },
        { icon: Rss, label: 'School Feed', desc: 'Social feed', path: '/app/school-feed', gradient: 'from-blue-500 to-indigo-500' },
        { icon: Image, label: 'Gallery', desc: 'Photo albums', path: '/app/gallery', gradient: 'from-pink-500 to-rose-500' },
        { icon: Calendar, label: 'Calendar', desc: 'School events', path: '/app/school-calendar', gradient: 'from-emerald-500 to-teal-500' },
      ],
    },
    {
      title: 'AI & Tools',
      modules: [
        { icon: Brain, label: 'Tino AI', desc: 'AI assistant', path: '/app/tino-ai', gradient: 'from-indigo-500 to-violet-500' },
        { icon: Sparkles, label: 'AI Paper', desc: 'Auto papers', path: '/app/ai-paper', gradient: 'from-purple-500 to-pink-500' },
        { icon: Image, label: 'Event Designer', desc: 'Design assets', path: '/app/event-designer', gradient: 'from-rose-500 to-pink-500' },
      ],
    },
    {
      title: 'Infrastructure & Operations',
      modules: [
        { icon: Bus, label: 'Transport', desc: 'NFC & GPS', path: '/app/transport', gradient: 'from-orange-500 to-red-500' },
        { icon: Shield, label: 'Visit Mgmt', desc: 'OTP approval', path: '/app/visitor-pass', gradient: 'from-teal-500 to-cyan-500' },
        { icon: Package, label: 'Inventory', desc: 'Stock control', path: '/app/inventory', gradient: 'from-slate-500 to-zinc-600' },
        { icon: Home, label: 'Hostel', desc: 'Hostel & mess', path: '/app/hostel', gradient: 'from-rose-500 to-pink-500' },
        { icon: Heart, label: 'Health', desc: 'Student health', path: '/app/health', gradient: 'from-red-500 to-rose-500' },
        { icon: Building, label: 'Multi-Branch', desc: 'Branch mgmt', path: '/app/multi-branch', gradient: 'from-blue-500 to-indigo-500' },
        { icon: Fingerprint, label: 'Biometric', desc: 'Bio attendance', path: '/app/biometric', gradient: 'from-slate-500 to-gray-600' },
        { icon: Video, label: 'CCTV', desc: 'Surveillance', path: '/app/cctv', gradient: 'from-red-500 to-rose-500' },
      ],
    },
    {
      title: 'Platform & Integrations',
      modules: [
        { icon: Smartphone, label: 'Mobile App', desc: '6-role app', path: '/app/mobile-app', gradient: 'from-sky-500 to-blue-500' },
        { icon: Link2, label: 'Integrations', desc: '20+ integrations', path: '/app/integrations', gradient: 'from-violet-500 to-purple-500' },
        { icon: Globe, label: 'Website', desc: 'No-code website', path: '/app/website', gradient: 'from-emerald-500 to-green-500' },
      ],
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{greeting}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{schoolData?.name || 'Dashboard'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/school-analytics')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button onClick={() => navigate('/app/settings')} className="inline-flex items-center gap-2 px-4 py-2.5 btn-primary">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => navigate(action.path)} className={`flex flex-col items-center gap-2.5 p-4 ${action.lightBg} rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group border border-transparent hover:border-gray-200`}>
              <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold ${action.textColor}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {moduleGroups.map((group, gIdx) => (
        <div key={gIdx}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{group.title}</h2>
            <span className="text-xs text-gray-400 font-medium">{group.modules.length} modules</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {group.modules.map((mod, idx) => (
              <button key={idx} onClick={() => navigate(mod.path)} className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
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
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Need Help Setting Up?</h3>
            <p className="text-white/70 text-sm">Use our Setup Wizard to configure your school quickly and efficiently.</p>
          </div>
          <button onClick={() => navigate('/app/setup-wizard')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg">
            <Wrench className="w-4 h-4" />
            Open Setup Wizard
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
