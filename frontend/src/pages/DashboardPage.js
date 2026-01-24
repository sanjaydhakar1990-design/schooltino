/**
 * Schooltino Admin Dashboard - DigitalEdu Theme
 * Design: Corporate Clean, Professional ERP Look
 * Colors: White background, Blue (#2563EB) accents, Dark sidebar
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import {
  Users, UserCog, GraduationCap, Wallet, TrendingUp, Clock,
  CalendarCheck, Bell, Calculator, Sparkles, Settings, Brain,
  BookOpen, Bus, Heart, Fingerprint, Video, Shield,
  FileText, MessageSquare, Image, Calendar, BarChart3,
  ChevronRight, AlertCircle, CheckCircle, Loader2, Plus,
  ArrowUpRight, IndianRupee, UserPlus, Receipt, Phone,
  CreditCard, Award, Building, ClipboardList, TrendingDown,
  Activity, DollarSign, PieChart as PieChartIcon
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
      // Set recent activities from real data
      if (response.data.recent_activities) {
        setRecentActivities(response.data.recent_activities.slice(0, 4).map(activity => ({
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

  // Helper to format time ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
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

  // Use real fee data from stats if available
  const feeData = stats ? [
    { month: 'This Month', collected: stats.fee_collection_month || 0, pending: stats.pending_fees || 0 },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20" data-testid="no-school-message">
        <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No School Selected</h2>
        <p className="text-slate-500">Please create or select a school from Settings.</p>
        <Button onClick={() => navigate('/app/settings')} className="mt-4 bg-blue-600 hover:bg-blue-700">
          <Settings className="w-4 h-4 mr-2" /> Go to Settings
        </Button>
      </div>
    );
  }

  // Stats Cards Data - DigitalEdu Style
  const statsCards = [
    { 
      title: 'Total Students', 
      titleHi: 'कुल छात्र',
      value: stats?.total_students || 0, 
      icon: Users, 
      trend: '+12%',
      trendUp: true,
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
      path: '/app/students'
    },
    { 
      title: 'Total Staff', 
      titleHi: 'कुल स्टाफ',
      value: stats?.total_staff || 0, 
      icon: UserCog,
      trend: '+3%',
      trendUp: true,
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      path: '/app/employee-management'
    },
    { 
      title: 'Fee Collection', 
      titleHi: 'फीस संग्रह',
      value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, 
      icon: IndianRupee,
      trend: '+8%',
      trendUp: true,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
      path: '/app/fees'
    },
    { 
      title: 'Attendance', 
      titleHi: 'उपस्थिति',
      value: `${stats?.attendance_today?.present || 0}%`, 
      icon: CalendarCheck,
      trend: '-2%',
      trendUp: false,
      color: 'bg-purple-600',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
      path: '/app/attendance'
    },
  ];

  // Quick Actions - DigitalEdu Style
  const quickActions = [
    { icon: UserPlus, label: 'New Admission', labelHi: 'नया प्रवेश', path: '/app/students', color: 'bg-blue-600 hover:bg-blue-700' },
    { icon: CalendarCheck, label: 'Mark Attendance', labelHi: 'उपस्थिति दर्ज करें', path: '/app/attendance', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { icon: Receipt, label: 'Collect Fee', labelHi: 'फीस जमा करें', path: '/app/fees', color: 'bg-amber-500 hover:bg-amber-600' },
    { icon: Brain, label: 'Ask Tino AI', labelHi: 'Tino AI से पूछें', path: '/app/tino-ai', color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  // Module Grid - DigitalEdu Style
  const modules = [
    { icon: Users, label: 'Students', labelHi: 'छात्र', path: '/app/students', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: UserCog, label: 'Staff', labelHi: 'स्टाफ', path: '/app/employee-management', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: CalendarCheck, label: 'Attendance', labelHi: 'उपस्थिति', path: '/app/attendance', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Wallet, label: 'Fees', labelHi: 'फीस', path: '/app/fees', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: ClipboardList, label: 'Exams', labelHi: 'परीक्षा', path: '/app/exams', color: 'text-red-600', bg: 'bg-red-50' },
    { icon: BookOpen, label: 'Library', labelHi: 'पुस्तकालय', path: '/app/library', color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Clock, label: 'Timetable', labelHi: 'समय सारणी', path: '/app/timetable', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Bus, label: 'Transport', labelHi: 'परिवहन', path: '/app/transport', color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: Shield, label: 'Visitor Pass', labelHi: 'विजिटर पास', path: '/app/visitor-pass', color: 'text-slate-600', bg: 'bg-slate-100' },
    { icon: Image, label: 'Gallery', labelHi: 'गैलरी', path: '/app/gallery', color: 'text-pink-600', bg: 'bg-pink-50' },
    { icon: Bell, label: 'Notices', labelHi: 'सूचनाएं', path: '/app/notices', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: Sparkles, label: 'AI Paper', labelHi: 'AI पेपर', path: '/app/ai-paper', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="space-y-6 pb-10" data-testid="dashboard-page">
      {/* Welcome Header - Clean White Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-slate-500 text-sm font-medium">{greeting},</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
              {schoolData?.name || 'Schooltino Dashboard'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">AI-Powered School Management System</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/app/tino-ai')}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
              data-testid="ask-tino-btn"
            >
              <Brain className="w-4 h-4 mr-2" /> Ask Tino AI
            </Button>
            <Button 
              onClick={() => navigate('/app/students')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="new-admission-btn"
            >
              <UserPlus className="w-4 h-4 mr-2" /> New Admission
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - DigitalEdu Professional Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-lg border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
            data-testid={`stat-card-${idx}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.lightBg}`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.title}</p>
              <p className="text-xs text-slate-400">{card.titleHi}</p>
            </div>
            {/* Progress Bar - DigitalEdu Style */}
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${card.color} rounded-full transition-all`}
                style={{ width: `${Math.min(100, (typeof card.value === 'number' ? card.value : 75))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - DigitalEdu Style */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Quick Actions</h2>
            <p className="text-xs text-slate-500">त्वरित कार्य</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white ${action.color} transition-all shadow-sm hover:shadow-md`}
              data-testid={`quick-action-${idx}`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fee Collection Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-800">Fee Collection Overview</h3>
                <p className="text-xs text-slate-500">फीस संग्रह विवरण</p>
              </div>
              <button 
                onClick={() => navigate('/app/fees')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="collected" fill="#2563EB" name="Collected" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All Modules Grid */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-800">All Modules</h3>
                <p className="text-xs text-slate-500">सभी मॉड्यूल</p>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {modules.map((module, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(module.path)}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                  data-testid={`module-${idx}`}
                >
                  <div className={`p-2.5 rounded-lg ${module.bg} mb-2 group-hover:scale-110 transition-transform`}>
                    <module.icon className={`w-5 h-5 ${module.color}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{module.label}</span>
                  <span className="text-[10px] text-slate-400">{module.labelHi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-6">
          {/* Attendance Donut Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Today's Attendance</h3>
                <p className="text-xs text-slate-500">आज की उपस्थिति</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                {new Date().toLocaleDateString('hi-IN')}
              </span>
            </div>
            
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-4 mt-3">
              {attendanceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tino AI Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-5 text-white shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Tino AI</h3>
                <p className="text-xs text-blue-100">AI Assistant</p>
              </div>
            </div>
            <p className="text-sm text-blue-100 mb-4">
              Ask anything about your school. Get instant AI-powered answers.
            </p>
            <Button 
              onClick={() => navigate('/app/tino-ai')}
              className="w-full bg-white text-blue-600 hover:bg-blue-50"
            >
              Start Chat
            </Button>
          </div>

          {/* Recent Activity - Real Data */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Recent Activity</h3>
              <span className="text-xs text-slate-400">वास्तविक डेटा</span>
            </div>
            
            <div className="space-y-3">
              {recentActivities.length > 0 ? recentActivities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === 'student' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'fee' ? 'bg-amber-100 text-amber-600' :
                    item.type === 'attendance' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {item.type === 'student' ? <UserPlus className="w-4 h-4" /> :
                     item.type === 'fee' ? <IndianRupee className="w-4 h-4" /> :
                     item.type === 'attendance' ? <CalendarCheck className="w-4 h-4" /> :
                     <Bell className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{item.action}</p>
                    <p className="text-xs text-slate-500 truncate">{item.name}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Upcoming Events</h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="space-y-3">
              {[
                { event: 'Parent-Teacher Meeting', date: 'Jan 28', color: 'border-l-blue-500' },
                { event: 'Republic Day', date: 'Jan 26', color: 'border-l-amber-500' },
                { event: 'Annual Sports Day', date: 'Feb 5', color: 'border-l-emerald-500' },
              ].map((item, idx) => (
                <div key={idx} className={`p-3 rounded-lg bg-slate-50 border-l-4 ${item.color}`}>
                  <p className="text-sm font-medium text-slate-700">{item.event}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
