/**
 * Schooltino Admin Dashboard - Light Blue & White Theme
 * Design: Simple, Clean, Professional (DigitalEdu Style)
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
  CreditCard, Award, Building, ClipboardList
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

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
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendanceData = stats ? [
    { name: 'Present', value: stats.attendance_today?.present || 75, color: '#22C55E' },
    { name: 'Absent', value: stats.attendance_today?.absent || 15, color: '#EF4444' },
    { name: 'Leave', value: stats.attendance_today?.late || 10, color: '#F59E0B' }
  ] : [
    { name: 'Present', value: 75, color: '#22C55E' },
    { name: 'Absent', value: 15, color: '#EF4444' },
    { name: 'Leave', value: 10, color: '#F59E0B' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20" data-testid="no-school-message">
        <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No School Selected</h2>
        <p className="text-slate-500">Please create or select a school from Settings.</p>
        <Button onClick={() => navigate('/app/settings')} className="mt-4 bg-sky-500 hover:bg-sky-600">
          <Settings className="w-4 h-4 mr-2" /> Go to Settings
        </Button>
      </div>
    );
  }

  // Stats Cards Data
  const statsCards = [
    { 
      title: 'Total Students', 
      titleHi: 'कुल छात्र',
      value: stats?.total_students || 0, 
      icon: Users, 
      color: 'bg-sky-500',
      bgLight: 'bg-sky-50',
      textColor: 'text-sky-600',
      path: '/app/students'
    },
    { 
      title: 'Total Staff', 
      titleHi: 'कुल स्टाफ',
      value: stats?.total_staff || 0, 
      icon: UserCog, 
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      path: '/app/employee-management'
    },
    { 
      title: 'Fee Collection', 
      titleHi: 'फीस संग्रह',
      value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, 
      icon: IndianRupee, 
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      path: '/app/fees'
    },
    { 
      title: 'Attendance', 
      titleHi: 'उपस्थिति',
      value: `${stats?.attendance_today?.present || 0}%`, 
      icon: CalendarCheck, 
      color: 'bg-violet-500',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
      path: '/app/attendance'
    },
  ];

  // Quick Actions
  const quickActions = [
    { icon: UserPlus, label: 'New Admission', labelHi: 'नया प्रवेश', path: '/app/students', color: 'text-sky-600 bg-sky-100 hover:bg-sky-200' },
    { icon: CalendarCheck, label: 'Attendance', labelHi: 'उपस्थिति', path: '/app/attendance', color: 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' },
    { icon: Receipt, label: 'Fee Collection', labelHi: 'फीस जमा', path: '/app/fees', color: 'text-amber-600 bg-amber-100 hover:bg-amber-200' },
    { icon: Brain, label: 'Tino AI', labelHi: 'टीनो AI', path: '/app/tino-ai', color: 'text-violet-600 bg-violet-100 hover:bg-violet-200' },
    { icon: Bell, label: 'Notices', labelHi: 'सूचना', path: '/app/notices', color: 'text-rose-600 bg-rose-100 hover:bg-rose-200' },
    { icon: Sparkles, label: 'AI Paper', labelHi: 'AI पेपर', path: '/app/ai-paper', color: 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200' },
    { icon: MessageSquare, label: 'SMS', labelHi: 'SMS', path: '/app/sms', color: 'text-cyan-600 bg-cyan-100 hover:bg-cyan-200' },
    { icon: CreditCard, label: 'ID Cards', labelHi: 'ID कार्ड', path: '/app/students', color: 'text-pink-600 bg-pink-100 hover:bg-pink-200' },
  ];

  // All Modules
  const allModules = [
    { icon: Users, label: 'Students', path: '/app/students', color: 'text-sky-600' },
    { icon: UserCog, label: 'Staff', path: '/app/employee-management', color: 'text-emerald-600' },
    { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance', color: 'text-green-600' },
    { icon: Wallet, label: 'Fees', path: '/app/fees', color: 'text-amber-600' },
    { icon: ClipboardList, label: 'Exams', path: '/app/exams', color: 'text-red-600' },
    { icon: BookOpen, label: 'Library', path: '/app/library', color: 'text-orange-600' },
    { icon: Clock, label: 'Timetable', path: '/app/timetable', color: 'text-purple-600' },
    { icon: Bus, label: 'Transport', path: '/app/transport', color: 'text-teal-600' },
    { icon: Shield, label: 'Visitor Pass', path: '/app/visitor-pass', color: 'text-slate-600' },
    { icon: Image, label: 'Gallery', path: '/app/gallery', color: 'text-pink-600' },
    { icon: Award, label: 'Certificates', path: '/app/certificates', color: 'text-yellow-600' },
    { icon: BarChart3, label: 'Reports', path: '/app/reports', color: 'text-indigo-600' },
  ];

  return (
    <div className="space-y-6 pb-10" data-testid="dashboard-page">
      {/* Welcome Header - Light Blue */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sky-100 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              {schoolData?.name || 'Schooltino Dashboard'}
            </h1>
            <p className="text-sky-100 text-sm mt-1">AI-Powered School Management</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/app/tino-ai')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              data-testid="ask-tino-btn"
            >
              <Brain className="w-4 h-4 mr-2" /> Ask Tino AI
            </Button>
            <Button 
              onClick={() => navigate('/app/students')}
              className="bg-white text-sky-600 hover:bg-sky-50"
              data-testid="new-admission-btn"
            >
              <UserPlus className="w-4 h-4 mr-2" /> New Admission
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg hover:border-sky-200 transition-all group"
            data-testid={`stat-card-${idx}`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${card.bgLight}`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.title}</p>
              <p className="text-xs text-slate-400">{card.titleHi}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Quick Actions</h2>
                <p className="text-xs text-slate-500">त्वरित कार्य</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl ${action.color} transition-all`}
                  data-testid={`quick-action-${idx}`}
                >
                  <action.icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All Modules */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">All Modules</h2>
                <p className="text-xs text-slate-500">सभी मॉड्यूल</p>
              </div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {allModules.map((module, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(module.path)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-all"
                >
                  <div className={`p-2 rounded-lg bg-slate-50 ${module.color} mb-2`}>
                    <module.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{module.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Today's Attendance</h3>
                <p className="text-xs text-slate-500">आज की उपस्थिति</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                {new Date().toLocaleDateString('hi-IN')}
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
                    outerRadius={60}
                    paddingAngle={5}
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
                  <span className="text-xs text-slate-500">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tino AI */}
          <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Tino AI</h3>
                <p className="text-xs text-sky-100">AI Assistant</p>
              </div>
            </div>
            <p className="text-sm text-sky-100 mb-4">
              Ask anything about your school. Get instant answers.
            </p>
            <Button 
              onClick={() => navigate('/app/tino-ai')}
              className="w-full bg-white text-sky-600 hover:bg-sky-50"
            >
              Start Chat
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Recent Activity</h3>
              <span className="text-xs text-sky-500 cursor-pointer hover:text-sky-600">View All</span>
            </div>
            
            <div className="space-y-3">
              {[
                { action: 'New admission', name: 'Rahul Kumar', time: '2 mins ago', type: 'student' },
                { action: 'Fee paid', name: 'Priya Sharma', time: '10 mins ago', type: 'fee' },
                { action: 'Attendance marked', name: 'Class 5-A', time: '30 mins ago', type: 'attendance' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === 'student' ? 'bg-sky-100 text-sky-600' :
                    item.type === 'fee' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {item.type === 'student' ? <UserPlus className="w-4 h-4" /> :
                     item.type === 'fee' ? <IndianRupee className="w-4 h-4" /> :
                     <CalendarCheck className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.action}</p>
                    <p className="text-xs text-slate-500">{item.name}</p>
                  </div>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
