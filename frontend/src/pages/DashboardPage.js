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

  const statsCards = [
    { 
      title: 'Total Students', 
      value: stats?.total_students || 0, 
      icon: Users, 
      color: '#3B82F6',
      desc: 'Active enrolled students',
      path: '/app/students'
    },
    { 
      title: 'Total Staff', 
      value: stats?.total_staff || 0, 
      icon: UserCog,
      color: '#10B981',
      desc: 'Teaching & non-teaching staff',
      path: '/app/employee-management'
    },
    { 
      title: 'Fee Collection', 
      value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, 
      icon: IndianRupee,
      color: '#F59E0B',
      desc: 'This month collection',
      path: '/app/fee-management'
    },
    { 
      title: 'Attendance Today', 
      value: `${stats?.attendance_today?.present || 0}%`, 
      icon: CalendarCheck,
      color: '#8B5CF6',
      desc: 'Present today',
      path: '/app/attendance'
    },
    { 
      title: 'Pending Fees', 
      value: `₹${((stats?.pending_fees || 0) / 1000).toFixed(0)}K`, 
      icon: AlertCircle,
      color: '#EF4444',
      desc: 'Outstanding amount',
      path: '/app/fee-management'
    },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'New Admission', path: '/app/students', color: '#3B82F6' },
    { icon: CalendarCheck, label: 'Mark Attendance', path: '/app/attendance', color: '#10B981' },
    { icon: Receipt, label: 'Collect Fee', path: '/app/fee-management', color: '#F59E0B' },
    { icon: Brain, label: 'Ask Tino AI', path: '/app/tino-ai', color: '#8B5CF6' },
    { icon: Bell, label: 'Send Notice', path: '/app/notices', color: '#EF4444' },
    { icon: Sparkles, label: 'AI Paper', path: '/app/ai-paper', color: '#EC4899' },
  ];

  const modules = [
    { icon: Users, label: 'Students', path: '/app/students', color: '#3B82F6' },
    { icon: UserCog, label: 'Staff', path: '/app/employee-management', color: '#10B981' },
    { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance', color: '#F59E0B' },
    { icon: Wallet, label: 'Fees', path: '/app/fee-management', color: '#8B5CF6' },
    { icon: ClipboardList, label: 'Exams', path: '/app/exam-report', color: '#EF4444' },
    { icon: BookOpen, label: 'Library', path: '/app/library', color: '#F97316' },
    { icon: Clock, label: 'Timetable', path: '/app/timetable-management', color: '#06B6D4' },
    { icon: Bus, label: 'Transport', path: '/app/transport', color: '#14B8A6' },
    { icon: Shield, label: 'Visitor Pass', path: '/app/visitor-pass', color: '#64748B' },
    { icon: Image, label: 'Gallery', path: '/app/gallery', color: '#EC4899' },
    { icon: Bell, label: 'Notices', path: '/app/notices', color: '#6366F1' },
    { icon: Sparkles, label: 'AI Paper', path: '/app/ai-paper', color: '#0EA5E9' },
  ];

  return (
    <div className="space-y-5 pb-10" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-gray-400 text-sm">{greeting},</p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {schoolData?.name || 'Schooltino Dashboard'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/app/tino-ai')}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
            data-testid="ask-tino-btn"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5" /> Ask Tino AI
          </Button>
          <Button 
            onClick={() => navigate('/app/students')}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
            data-testid="new-admission-btn"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> New Admission
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((card, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-xl border border-blue-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
            data-testid={`stat-card-${idx}`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{card.title}</p>
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}12` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{card.value}</p>
            <p className="text-xs text-gray-400">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-blue-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Quick Actions</h2>
          <span className="text-xs text-gray-400">त्वरित कार्य</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all group"
              data-testid={`quick-action-${idx}`}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Fee Collection Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">फीस संग्रह विवरण</p>
              </div>
              <button 
                onClick={() => navigate('/app/fee-management')}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                More Details
              </button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #DBEAFE',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Bar dataKey="collected" fill="#3B82F6" name="Collected" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">All Modules</h3>
                <p className="text-xs text-gray-400 mt-0.5">सभी मॉड्यूल</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {modules.map((module, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(module.path)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all group"
                  data-testid={`module-${idx}`}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${module.color}12` }}
                  >
                    <module.icon className="w-5 h-5" style={{ color: module.color }} />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{module.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Today's Attendance</h3>
                <p className="text-xs text-gray-400">आज की उपस्थिति</p>
              </div>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                {new Date().toLocaleDateString('en-IN')}
              </span>
            </div>
            
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
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
            
            <div className="flex justify-center gap-4 mt-2">
              {attendanceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-gray-500">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/app/attendance')}
              className="w-full mt-3 text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center justify-center gap-1 py-2 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
            >
              More Details
            </button>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Tino AI</h3>
                <p className="text-xs text-gray-400">AI Assistant</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Ask anything about your school. Get instant AI-powered answers and insights.
            </p>
            <button
              onClick={() => navigate('/app/tino-ai')}
              className="w-full py-2 text-sm font-medium text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">Recent Activity</h3>
              <span className="text-[10px] text-gray-400">Latest updates</span>
            </div>
            
            <div className="space-y-2">
              {recentActivities.length > 0 ? recentActivities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
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
              )) : (
                <div className="text-center py-6 text-gray-400">
                  <Bell className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-blue-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">Upcoming Events</h3>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-2">
              {[
                { event: 'Parent-Teacher Meeting', date: 'Jan 28', color: '#3B82F6' },
                { event: 'Republic Day', date: 'Jan 26', color: '#F59E0B' },
                { event: 'Annual Sports Day', date: 'Feb 5', color: '#10B981' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-50 border-l-3 flex items-center gap-3" style={{ borderLeftWidth: '3px', borderLeftColor: item.color }}>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{item.event}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
