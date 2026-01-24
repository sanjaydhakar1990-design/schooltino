/**
 * Schooltino Admin Dashboard - Ultra Simple & Clean
 * Inspired by: Vidyalaya, MyLeadingCampus, NextOS, Entrar
 * Design: Light Theme, Card-Based, Color-Coded Categories
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Users, UserCog, GraduationCap, Wallet, TrendingUp, Clock,
  CalendarCheck, Bell, Calculator, Sparkles, Settings, Brain,
  BookOpen, Bus, Heart, Fingerprint, Video, Shield,
  FileText, MessageSquare, Image, Calendar, BarChart3,
  ChevronRight, AlertCircle, CheckCircle, XCircle, Loader2,
  Mic, DollarSign, Building, Phone, Mail, Globe
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import StaffPhotoUpload from '../components/StaffPhotoUpload';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  const isDirector = user?.role === 'director';

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('good_morning') || 'Good Morning');
    else if (hour < 17) setGreeting(t('good_afternoon') || 'Good Afternoon');
    else setGreeting(t('good_evening') || 'Good Evening');

    if (schoolId) {
      fetchStats();
      fetchStaffWithPhotos();
      fetchRecentStudents();
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

  const fetchStaffWithPhotos = async () => {
    try {
      const response = await axios.get(`${API}/staff?school_id=${schoolId}&limit=8`);
      setStaffMembers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchRecentStudents = async () => {
    try {
      const response = await axios.get(`${API}/students?school_id=${schoolId}&limit=8`);
      setRecentStudents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const attendanceData = stats ? [
    { name: 'Present', value: stats.attendance_today?.present || 0, color: '#10B981' },
    { name: 'Absent', value: stats.attendance_today?.absent || 0, color: '#EF4444' },
    { name: 'Late', value: stats.attendance_today?.late || 0, color: '#F59E0B' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
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

  // Module categories - Competitor-inspired grouping (with translations)
  const moduleCategories = [
    {
      title: t('academic'),
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      modules: [
        { icon: Users, label: t('students'), path: '/app/students', count: stats?.total_students || 0 },
        { icon: GraduationCap, label: t('classes'), path: '/app/classes', count: stats?.total_classes || 0 },
        { icon: CalendarCheck, label: t('attendance'), path: '/app/attendance', badge: 'Live' },
        { icon: Clock, label: t('timetable'), path: '/app/timetable' },
      ]
    },
    {
      title: t('staff'),
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      modules: [
        { icon: UserCog, label: t('staff'), path: '/app/staff', count: stats?.total_staff || 0 },
        { icon: Calendar, label: t('leave_management'), path: '/app/leave' },
        { icon: DollarSign, label: t('salary'), path: '/app/salary' },
      ]
    },
    {
      title: t('fees'),
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      modules: [
        { icon: Wallet, label: t('fees'), path: '/app/fees', count: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K` },
        { icon: FileText, label: t('fee_structure'), path: '/app/fee-structure' },
        { icon: Calculator, label: t('ai_accountant'), path: '/app/accountant', badge: 'AI' },
      ]
    },
    {
      title: t('notices'),
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      modules: [
        { icon: Bell, label: t('notices'), path: '/app/notices', count: stats?.recent_notices?.length || 0 },
        { icon: MessageSquare, label: t('sms_center'), path: '/app/sms' },
        { icon: Video, label: t('zoom_meetings'), path: '/app/meetings' },
        { icon: Image, label: t('gallery'), path: '/app/gallery' },
      ]
    },
    {
      title: t('ai_tools') || 'AI Tools',
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      modules: [
        { icon: Brain, label: 'Tino AI', path: '/app/tino-ai', badge: 'AI' },
        { icon: Sparkles, label: t('ai_paper'), path: '/app/ai-paper', badge: 'AI' },
        { icon: Sparkles, label: 'Event Designer', path: '/app/event-designer', badge: 'AI' },
      ]
    },
    {
      title: t('infrastructure') || 'Infrastructure',
      color: 'bg-slate-500',
      lightColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      modules: [
        { icon: Bus, label: t('transport'), path: '/app/transport' },
        { icon: Heart, label: t('health_module'), path: '/app/health' },
        { icon: Fingerprint, label: t('biometric'), path: '/app/biometric' },
        { icon: Video, label: t('cctv_dashboard'), path: '/app/cctv' },
      ]
    },
  ];

  return (
    <div className="space-y-6 pb-8" data-testid="dashboard-page">
      {/* Welcome Header - Clean Blue Theme */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full" />
        </div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl font-bold mt-1">{user?.name || 'Director'}</h1>
            <p className="text-blue-200 text-sm mt-1">
              {schoolData?.name || 'Your School'} • {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/app/tino-ai')}
              className="bg-white text-blue-700 hover:bg-blue-50 gap-2 font-semibold shadow-lg"
              data-testid="tino-ai-btn"
            >
              <Brain className="w-4 h-4" />
              Ask Tino AI
            </Button>
            <Button 
              onClick={() => setShowProfileDialog(true)}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/20"
              data-testid="settings-btn"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Row - Modern Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quick-stats">
        <StatCard
          icon={Users}
          label={t('total_students')}
          value={stats?.total_students || 0}
          trend="+12%"
          color="blue"
        />
        <StatCard
          icon={UserCog}
          label={t('total_staff')}
          value={stats?.total_staff || 0}
          trend="+3%"
          color="emerald"
        />
        <StatCard
          icon={CalendarCheck}
          label={t('present')}
          value={stats?.attendance_today?.present || 0}
          subtext={`${stats?.attendance_today?.total || 0} ${t('total_students')}`}
          color="green"
        />
        <StatCard
          icon={Wallet}
          label={t('fee_collected')}
          value={`₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`}
          subtext={t('this_month') || 'This Month'}
          color="amber"
        />
      </div>

      {/* Module Categories - Clean Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {moduleCategories.map((category, idx) => (
          <Card key={idx} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${category.color} px-5 py-3`}>
              <h3 className="font-semibold text-white text-sm tracking-wide">{category.title}</h3>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {category.modules.map((module, mIdx) => (
                  <button
                    key={mIdx}
                    onClick={() => navigate(module.path)}
                    className={`${category.lightColor} hover:shadow-md transition-all rounded-xl p-4 text-left group relative border border-transparent hover:border-slate-200`}
                    data-testid={`module-${module.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center shadow-sm`}>
                        <module.icon className="w-5 h-5 text-white" />
                      </div>
                      {module.badge && (
                        <Badge className={`text-[10px] ${module.badge === 'AI' ? 'bg-blue-500' : module.badge === 'NEW' ? 'bg-green-500' : 'bg-cyan-500'}`}>
                          {module.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={`font-medium mt-3 ${category.textColor} text-sm`}>{module.label}</p>
                    {module.count !== undefined && (
                      <p className="text-xs text-slate-500 mt-1">{module.count}</p>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Pie Chart */}
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">{t('attendance_today')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
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
            <div className="flex justify-center gap-4 mt-2">
              {attendanceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{t(item.name.toLowerCase())}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notices */}
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{t('recent_notices')}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/notices')} className="text-indigo-600">
                {t('view')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {stats?.recent_notices?.length > 0 ? (
                stats.recent_notices.slice(0, 4).map((notice, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                    <p className="font-medium text-slate-800 text-sm line-clamp-1">{notice.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">{t('no_data')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-4 border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">{t('quick_actions') || 'Quick Actions'}</h3>
            <div className="space-y-2">
              <Button 
                className="w-full justify-start bg-indigo-50 text-indigo-700 hover:bg-indigo-100" 
                variant="ghost"
                onClick={() => navigate('/app/students')}
              >
                <Users className="w-4 h-4 mr-3" />
                {t('add_student')}
              </Button>
              <Button 
                className="w-full justify-start bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                variant="ghost"
                onClick={() => navigate('/app/attendance')}
              >
                <CalendarCheck className="w-4 h-4 mr-3" />
                {t('mark_attendance')}
              </Button>
              <Button 
                className="w-full justify-start bg-amber-50 text-amber-700 hover:bg-amber-100" 
                variant="ghost"
                onClick={() => navigate('/app/fees')}
              >
                <Wallet className="w-4 h-4 mr-3" />
                {t('record_payment')}
              </Button>
              <Button 
                className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100" 
                variant="ghost"
                onClick={() => navigate('/app/notices')}
              >
                <Bell className="w-4 h-4 mr-3" />
                {t('create_notice')}
              </Button>
              <Button 
                className="w-full justify-start bg-rose-50 text-rose-700 hover:bg-rose-100" 
                variant="ghost"
                onClick={() => navigate('/app/ai-paper')}
              >
                <Sparkles className="w-4 h-4 mr-3" />
                {t('generate_paper')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {stats?.pending_fees > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800">{t('pending_fees')} Alert</p>
                <p className="text-sm text-amber-600">
                  ₹{(stats?.pending_fees || 0).toLocaleString()} {t('pending')}
                </p>
              </div>
              <Button onClick={() => navigate('/app/fees')} className="bg-amber-500 hover:bg-amber-600">
                {t('record_payment')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Members with Photos */}
      {staffMembers.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-emerald-500" />
                {t('staff')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/staff')} className="text-indigo-600">
                {t('view')}
              </Button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {staffMembers.slice(0, 8).map((staff) => (
                <div 
                  key={staff.id} 
                  className="text-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/app/staff/${staff.id}`)}
                >
                  <div className="relative mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-slate-200 hover:border-indigo-400 transition-colors">
                    {staff.photo_url ? (
                      <img 
                        src={staff.photo_url.startsWith('http') ? staff.photo_url : `${process.env.REACT_APP_BACKEND_URL}${staff.photo_url}`}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{staff.name?.charAt(0)}</span>
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-2 truncate">{staff.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate">{staff.designation || staff.role}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Students with Photos */}
      {recentStudents.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {t('students')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/students')} className="text-indigo-600">
                {t('view')}
              </Button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {recentStudents.slice(0, 8).map((student) => (
                <div 
                  key={student.id} 
                  className="text-center cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/app/students/${student.id}`)}
                >
                  <div className="relative mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-colors">
                    {student.photo_url ? (
                      <img 
                        src={student.photo_url.startsWith('http') ? student.photo_url : `${process.env.REACT_APP_BACKEND_URL}${student.photo_url}`}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{student.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-2 truncate">{student.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate">{student.class_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              My Profile & Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{user?.name?.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{user?.name}</h3>
                <p className="text-sm text-indigo-600 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            {/* Face Recognition Setup */}
            <StaffPhotoUpload 
              staffId={user?.id}
              staffName={user?.name}
              schoolId={schoolId}
              onComplete={() => {
                toast.success('Face enrollment complete!');
              }}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProfileDialog(false);
                  navigate('/app/settings');
                }}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                School Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowProfileDialog(false);
                  navigate('/app/director-ai');
                }}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Director AI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component - Clean & Simple
function StatCard({ icon: Icon, label, value, trend, subtext, color }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-700' },
    green: { bg: 'bg-green-50', icon: 'bg-green-500', text: 'text-green-700' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-700' },
  };
  
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card className={`${colors.bg} border-0`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </Badge>
          )}
        </div>
        <p className={`text-2xl font-bold mt-3 ${colors.text}`}>{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
