import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import {
  Users, UserCog, GraduationCap, Clock,
  CalendarCheck, Bell, Sparkles, Settings, Brain,
  BookOpen, Bus, Shield, Image, Calendar,
  Loader2, IndianRupee, UserPlus, Receipt,
  ClipboardList, ChevronDown, ChevronRight, Wallet,
  BarChart3, Fingerprint, Video, MessageSquare,
  Globe, Heart, Music, Calculator, Wrench,
  Building, Award, FileText, CreditCard, Cpu,
  Megaphone, Briefcase, DollarSign, Radio
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [recentActivities, setRecentActivities] = useState([]);
  const [expandedTabs, setExpandedTabs] = useState(['quick_actions']);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('good_morning') || 'Good Morning');
    else if (hour < 17) setGreeting(t('good_afternoon') || 'Good Afternoon');
    else setGreeting(t('good_evening') || 'Good Evening');

    if (schoolId) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [schoolId, t]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats?school_id=${schoolId}`);
      setStats(response.data);
      if (response.data.recent_activities) {
        setRecentActivities(response.data.recent_activities.slice(0, 5).map(activity => ({
          action: activity.action || 'Activity',
          name: activity.user_name || 'User',
          time: formatTimeAgo(activity.created_at),
          type: activity.module === 'student' ? 'student' : 
                activity.module === 'fee' ? 'fee' : 
                activity.module === 'attendance' ? 'attendance' : 'notice'
        })));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const toggleTab = (tabId) => {
    setExpandedTabs(prev =>
      prev.includes(tabId)
        ? prev.filter(t => t !== tabId)
        : [...prev, tabId]
    );
  };

  const attendanceData = stats ? [
    { name: 'Present', value: stats.attendance_today?.present || 0, color: '#10B981' },
    { name: 'Absent', value: stats.attendance_today?.absent || 0, color: '#EF4444' },
    { name: 'Leave', value: stats.attendance_today?.late || 0, color: '#F59E0B' }
  ] : [
    { name: 'Present', value: 0, color: '#10B981' },
    { name: 'Absent', value: 0, color: '#EF4444' },
    { name: 'Leave', value: 0, color: '#F59E0B' }
  ];

  const feeData = stats ? [
    { month: 'This Month', collected: stats.fee_collection_month || 0, pending: stats.pending_fees || 0 },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20" data-testid="no-school-message">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No School Selected</h2>
        <p className="text-gray-500">Please create or select a school from Settings.</p>
        <Button onClick={() => navigate('/app/settings')} className="mt-4 bg-blue-500 hover:bg-blue-600">
          <Settings className="w-4 h-4 mr-2" /> Go to Settings
        </Button>
      </div>
    );
  }

  const formatDateBadge = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const tabSections = [
    {
      id: 'quick_actions',
      label: 'Quick Actions',
      icon: Sparkles,
      color: '#3B82F6',
      badge: null,
      content: (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-4">
          {[
            { icon: UserPlus, label: 'New Admission', path: '/app/students', color: '#3B82F6' },
            { icon: CalendarCheck, label: 'Mark Attendance', path: '/app/attendance', color: '#10B981' },
            { icon: Receipt, label: 'Collect Fee', path: '/app/fee-management', color: '#F59E0B' },
            { icon: Brain, label: 'Ask Tino AI', path: '/app/tino-ai', color: '#8B5CF6' },
            { icon: Bell, label: 'Send Notice', path: '/app/notices', color: '#EF4444' },
            { icon: Sparkles, label: 'AI Paper', path: '/app/ai-paper', color: '#EC4899' },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${action.color}12` }}
              >
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'overview',
      label: 'Overview Stats',
      icon: BarChart3,
      color: '#10B981',
      badge: null,
      content: (
        <div className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Total Students', value: stats?.total_students || 0, icon: Users, color: '#3B82F6', desc: 'Active enrolled', path: '/app/students' },
              { title: 'Total Staff', value: stats?.total_staff || 0, icon: UserCog, color: '#10B981', desc: 'Teaching & non-teaching', path: '/app/employee-management' },
              { title: 'Fee Collection', value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee, color: '#F59E0B', desc: 'This month', path: '/app/fee-management' },
              { title: 'Attendance', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck, color: '#8B5CF6', desc: 'Present today', path: '/app/attendance' },
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all" onClick={() => navigate(card.path)}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}12` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-800">{card.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'academic',
      label: 'Academic',
      icon: BookOpen,
      color: '#F59E0B',
      badge: null,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { icon: Users, label: 'Students', path: '/app/students', color: '#3B82F6' },
            { icon: GraduationCap, label: 'Classes', path: '/app/classes', color: '#10B981' },
            { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance', color: '#F59E0B' },
            { icon: Clock, label: 'Timetable', path: '/app/timetable-management', color: '#8B5CF6' },
            { icon: ClipboardList, label: 'Exam & Report Card', path: '/app/exam-report', color: '#EF4444' },
            { icon: Award, label: 'Certificates', path: '/app/certificates', color: '#F97316' },
            { icon: FileText, label: 'Admit Cards', path: '/app/admit-cards', color: '#06B6D4' },
          ].map((module, idx) => (
            <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                <module.icon className="w-4 h-4" style={{ color: module.color }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'team',
      label: 'Team Management',
      icon: Briefcase,
      color: '#10B981',
      badge: null,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { icon: Users, label: 'All Team Members', path: '/app/employee-management', color: '#3B82F6' },
            { icon: Calendar, label: 'Leave Management', path: '/app/leave', color: '#F59E0B' },
            { icon: DollarSign, label: 'Salary / Payroll', path: '/app/salary', color: '#10B981' },
            { icon: Shield, label: 'Permissions & Roles', path: '/app/permission-manager', color: '#EF4444' },
          ].map((module, idx) => (
            <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                <module.icon className="w-4 h-4" style={{ color: module.color }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: Wallet,
      color: '#F59E0B',
      badge: stats?.pending_fees ? `₹${((stats.pending_fees || 0) / 1000).toFixed(0)}K pending` : null,
      content: (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { icon: Wallet, label: 'Fee Management', path: '/app/fee-management', color: '#F59E0B' },
              { icon: Calculator, label: 'AI Accountant', path: '/app/accountant', color: '#8B5CF6' },
            ].map((module, idx) => (
              <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                  <module.icon className="w-4 h-4" style={{ color: module.color }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{module.label}</span>
              </button>
            ))}
          </div>
          {feeData.length > 0 && (
            <div className="h-44 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #DBEAFE', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                  <Bar dataKey="collected" fill="#3B82F6" name="Collected" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: Megaphone,
      color: '#8B5CF6',
      badge: null,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { icon: Bell, label: 'Notices', path: '/app/notices', color: '#3B82F6' },
            { icon: MessageSquare, label: 'SMS Center', path: '/app/sms', color: '#10B981' },
            { icon: Video, label: 'Meetings', path: '/app/meetings', color: '#8B5CF6' },
            { icon: Image, label: 'Gallery', path: '/app/gallery', color: '#F97316' },
            { icon: Users, label: 'Family Portal', path: '/app/family-portal', color: '#06B6D4' },
            { icon: MessageSquare, label: 'Complaints', path: '/app/complaints', color: '#EF4444' },
          ].map((module, idx) => (
            <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                <module.icon className="w-4 h-4" style={{ color: module.color }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'ai_tools',
      label: 'AI Tools',
      icon: Cpu,
      color: '#EC4899',
      badge: null,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { icon: Brain, label: 'Tino AI (Command Center)', path: '/app/tino-ai', color: '#8B5CF6' },
            { icon: Sparkles, label: 'AI Paper Generator', path: '/app/ai-paper', color: '#EC4899' },
            { icon: Image, label: 'AI Content & Event Designer', path: '/app/event-designer', color: '#F97316' },
            { icon: Calendar, label: 'School Calendar', path: '/app/school-calendar', color: '#3B82F6' },
          ].map((module, idx) => (
            <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                <module.icon className="w-4 h-4" style={{ color: module.color }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      icon: Building,
      color: '#06B6D4',
      badge: null,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { icon: Bus, label: 'Transport', path: '/app/transport', color: '#06B6D4' },
            { icon: Heart, label: 'Health Module', path: '/app/health', color: '#EF4444' },
            { icon: Fingerprint, label: 'Biometric', path: '/app/biometric', color: '#8B5CF6' },
            { icon: Video, label: 'CCTV Dashboard', path: '/app/cctv', color: '#64748B' },
          ].map((module, idx) => (
            <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                <module.icon className="w-4 h-4" style={{ color: module.color }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'school_setup',
      label: 'School Setup',
      icon: Wrench,
      color: '#64748B',
      badge: null,
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { icon: Wrench, label: 'Setup Wizard', path: '/app/setup-wizard', color: '#F59E0B' },
            { icon: Building, label: 'School Profile', path: '/app/school-management', color: '#3B82F6' },
            { icon: Image, label: 'Logo & Watermark', path: '/app/logo-settings', color: '#10B981' },
            { icon: Bell, label: 'Board Updates', path: '/app/board-notifications', color: '#F97316' },
            { icon: Music, label: 'Prayer & Bell', path: '/app/prayer-system', color: '#8B5CF6' },
            { icon: Globe, label: 'Website Builder', path: '/app/website', color: '#06B6D4' },
          ].map((module, idx) => (
            <button key={idx} onClick={() => navigate(module.path)} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}12` }}>
                <module.icon className="w-4 h-4" style={{ color: module.color }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'attendance_chart',
      label: "Today's Attendance",
      icon: CalendarCheck,
      color: '#10B981',
      badge: `${stats?.attendance_today?.present || 0}% Present`,
      content: (
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {attendanceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: <span className="font-semibold text-gray-800">{item.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/app/attendance')} className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            View Full Report <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )
    },
    {
      id: 'recent_activity',
      label: 'Recent Activity',
      icon: Clock,
      color: '#6366F1',
      badge: recentActivities.length > 0 ? `${recentActivities.length} updates` : null,
      content: (
        <div className="p-4">
          {recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'student' ? 'bg-blue-50 text-blue-500' :
                    item.type === 'fee' ? 'bg-amber-50 text-amber-500' :
                    item.type === 'attendance' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-purple-50 text-purple-500'
                  }`}>
                    {item.type === 'student' ? <UserPlus className="w-3.5 h-3.5" /> :
                     item.type === 'fee' ? <IndianRupee className="w-3.5 h-3.5" /> :
                     item.type === 'attendance' ? <CalendarCheck className="w-3.5 h-3.5" /> :
                     <Bell className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.action}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.name}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Bell className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No recent activity</p>
            </div>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4 pb-10" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-gray-400 text-sm">{greeting},</p>
          <h1 className="text-2xl font-bold text-gray-800">
            {schoolData?.name || 'Schooltino Dashboard'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 px-3 py-1.5 rounded-full">
            <p className="text-xs font-medium text-gray-600">{formatDateBadge()}</p>
          </div>
          <Button
            onClick={() => navigate('/app/tino-ai')}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5" /> Ask Tino AI
          </Button>
          <Button
            onClick={() => navigate('/app/students')}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> New Admission
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {tabSections.map((tab) => (
          <div key={tab.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleTab(tab.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tab.color}12` }}
                >
                  <tab.icon className="w-4 h-4" style={{ color: tab.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                    {tab.badge}
                  </span>
                )}
              </div>
              {expandedTabs.includes(tab.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {expandedTabs.includes(tab.id) && (
              <div className="border-t border-gray-100">
                {tab.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
