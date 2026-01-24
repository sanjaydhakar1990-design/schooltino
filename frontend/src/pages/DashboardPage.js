/**
 * Schooltino Admin Dashboard - Modern Design
 * Inspired by: DigitalEdu EduNova, BloomByte
 * Design: Gradient Cards, Glass-morphism, Bento Grid Layout
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Users, UserCog, GraduationCap, Wallet, TrendingUp, Clock,
  CalendarCheck, Bell, Calculator, Sparkles, Settings, Brain,
  BookOpen, Bus, Heart, Fingerprint, Video, Shield,
  FileText, MessageSquare, Image, Calendar, BarChart3,
  ChevronRight, AlertCircle, CheckCircle, Loader2, Plus,
  ArrowUpRight, IndianRupee, UserPlus, Receipt, Phone
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

  const isDirector = user?.role === 'director';

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
    { name: 'Present', value: stats.attendance_today?.present || 75, color: '#10B981' },
    { name: 'Absent', value: stats.attendance_today?.absent || 15, color: '#EF4444' },
    { name: 'Late', value: stats.attendance_today?.late || 10, color: '#F59E0B' }
  ] : [
    { name: 'Present', value: 75, color: '#10B981' },
    { name: 'Absent', value: 15, color: '#EF4444' },
    { name: 'Late', value: 10, color: '#F59E0B' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="loading-spinner">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20" data-testid="no-school-message">
        <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No School Selected</h2>
        <p className="text-slate-500">Please create or select a school from Settings.</p>
        <Button onClick={() => navigate('/app/settings')} className="mt-4">
          <Settings className="w-4 h-4 mr-2" />
          Go to Settings
        </Button>
      </div>
    );
  }

  // Quick Action Items
  const quickActions = [
    { icon: UserPlus, label: 'New Admission', path: '/app/students', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
    { icon: CalendarCheck, label: 'Mark Attendance', path: '/app/attendance', color: 'text-green-600', bg: 'bg-green-50 hover:bg-green-100' },
    { icon: Receipt, label: 'Collect Fee', path: '/app/fees', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100' },
    { icon: Brain, label: 'Ask Tino AI', path: '/app/tino-ai', color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
    { icon: Bell, label: 'Send Notice', path: '/app/notices', color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100' },
    { icon: Sparkles, label: 'AI Paper Gen', path: '/app/ai-paper', color: 'text-indigo-600', bg: 'bg-indigo-50 hover:bg-indigo-100' },
    { icon: MessageSquare, label: 'Send SMS', path: '/app/sms', color: 'text-cyan-600', bg: 'bg-cyan-50 hover:bg-cyan-100' },
    { icon: Settings, label: 'Settings', path: '/app/settings', color: 'text-slate-600', bg: 'bg-slate-50 hover:bg-slate-100' },
  ];

  // Module Navigation Grid
  const moduleGroups = [
    {
      title: 'Academic Management',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      items: [
        { label: 'Students', path: '/app/students', icon: Users },
        { label: 'Classes', path: '/app/classes', icon: BookOpen },
        { label: 'Attendance', path: '/app/attendance', icon: CalendarCheck },
        { label: 'Timetable', path: '/app/timetable', icon: Clock },
      ]
    },
    {
      title: 'Staff & HR',
      icon: UserCog,
      color: 'from-emerald-500 to-emerald-600',
      items: [
        { label: 'Employees', path: '/app/employee-management', icon: UserCog },
        { label: 'Leave Mgmt', path: '/app/leave', icon: Calendar },
        { label: 'Salary', path: '/app/salary', icon: IndianRupee },
      ]
    },
    {
      title: 'Finance & Fees',
      icon: Wallet,
      color: 'from-amber-500 to-orange-500',
      items: [
        { label: 'Fee Collection', path: '/app/fees', icon: Wallet },
        { label: 'Fee Structure', path: '/app/fee-structure', icon: FileText },
        { label: 'AI Accountant', path: '/app/accountant', icon: Calculator },
      ]
    },
    {
      title: 'AI-Powered Tools',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      items: [
        { label: 'Tino AI', path: '/app/tino-ai', icon: Brain },
        { label: 'Paper Generator', path: '/app/ai-paper', icon: Sparkles },
        { label: 'Event Designer', path: '/app/event-designer', icon: Image },
      ]
    },
  ];

  return (
    <div className="space-y-8 pb-10" data-testid="dashboard-page">
      {/* Hero Header - Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white/80 text-lg font-medium mb-1">{greeting} 👋</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {schoolData?.name || 'Schooltino Dashboard'}
              </h1>
              <p className="text-white/70 mt-2 text-lg">
                AI-Powered School Management System
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/app/tino-ai')}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-2"
                data-testid="ask-tino-btn"
              >
                <Brain className="w-5 h-5" />
                Ask Tino AI
              </Button>
              <Button 
                onClick={() => navigate('/app/students')}
                className="bg-white text-indigo-600 hover:bg-white/90 gap-2"
                data-testid="new-admission-btn"
              >
                <UserPlus className="w-5 h-5" />
                New Admission
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group"
          onClick={() => navigate('/app/students')}
          data-testid="students-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-white/80 text-sm font-medium">Total Students</p>
            <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {stats?.total_students || 0}
            </p>
            <p className="text-white/60 text-sm mt-2">छात्र</p>
          </div>
        </div>

        {/* Total Staff */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group"
          onClick={() => navigate('/app/employee-management')}
          data-testid="staff-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserCog className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-white/80 text-sm font-medium">Total Staff</p>
            <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {stats?.total_staff || 0}
            </p>
            <p className="text-white/60 text-sm mt-2">कर्मचारी</p>
          </div>
        </div>

        {/* Fee Collection */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group"
          onClick={() => navigate('/app/fees')}
          data-testid="fees-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <IndianRupee className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-white/80 text-sm font-medium">Fee Collection (This Month)</p>
            <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              ₹{((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K
            </p>
            <p className="text-white/60 text-sm mt-2">इस महीने</p>
          </div>
        </div>

        {/* Today's Attendance */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-300 group"
          onClick={() => navigate('/app/attendance')}
          data-testid="attendance-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-white/80 text-sm font-medium">Today's Attendance</p>
            <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {stats?.attendance_today?.present || 0}%
            </p>
            <p className="text-white/60 text-sm mt-2">आज की उपस्थिति</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Quick Actions
              </h2>
              <span className="text-sm text-slate-500">त्वरित कार्य</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl ${action.bg} transition-all duration-200 group`}
                  data-testid={`quick-action-${idx}`}
                >
                  <div className={`p-3 rounded-xl ${action.color} bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Module Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleGroups.map((group, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${group.color} text-white`}>
                    <group.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">{group.title}</h3>
                </div>
                
                <div className="space-y-2">
                  {group.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Today's Attendance</h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {new Date().toLocaleDateString('hi-IN')}
              </span>
            </div>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
            
            <div className="flex justify-center gap-4 mt-4">
              {attendanceData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assistant Card */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tino AI</h3>
                  <p className="text-white/70 text-xs">Your AI Assistant</p>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-4">
                Ask anything about your school. Get instant answers powered by AI.
              </p>
              <Button 
                onClick={() => navigate('/app/tino-ai')}
                className="w-full bg-white text-indigo-600 hover:bg-white/90"
              >
                Start Chat
              </Button>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Recent Notices</h3>
              <button 
                onClick={() => navigate('/app/notices')}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {stats?.recent_notices?.length > 0 ? (
                stats.recent_notices.slice(0, 3).map((notice, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">{notice.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{notice.date}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent notices</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* More Modules Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
          All Modules
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: BookOpen, label: 'Library', path: '/app/library', color: 'text-amber-600' },
            { icon: FileText, label: 'Certificates', path: '/app/certificates', color: 'text-blue-600' },
            { icon: Image, label: 'Gallery', path: '/app/gallery', color: 'text-pink-600' },
            { icon: Bus, label: 'Transport', path: '/app/transport', color: 'text-green-600' },
            { icon: Shield, label: 'Visitor Pass', path: '/app/visitor-pass', color: 'text-purple-600' },
            { icon: BarChart3, label: 'Reports', path: '/app/reports', color: 'text-indigo-600' },
            { icon: Heart, label: 'Health', path: '/app/health', color: 'text-red-600' },
            { icon: Video, label: 'CCTV', path: '/app/cctv', color: 'text-slate-600' },
            { icon: Fingerprint, label: 'Biometric', path: '/app/biometric', color: 'text-cyan-600' },
            { icon: Phone, label: 'Contact', path: '/app/contacts', color: 'text-emerald-600' },
            { icon: Calendar, label: 'Events', path: '/app/events', color: 'text-orange-600' },
            { icon: Settings, label: 'Settings', path: '/app/settings', color: 'text-gray-600' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
            >
              <div className={`p-3 rounded-xl bg-slate-100 ${item.color} mb-2 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
