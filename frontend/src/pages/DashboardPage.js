import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Users, UserCog, CalendarCheck, Wallet,
  Loader2, Settings, GraduationCap, IndianRupee,
  Clock, FileText, Bell, Sparkles, Bus,
  Heart, Fingerprint, Video, Image, MessageSquare,
  Calendar, Brain, Shield, Award, Building,
  Calculator, Music, Globe, Wrench, UserPlus,
  ArrowRight, TrendingUp, Rss, ShoppingBag
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
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users, color: 'gradient-card-blue', trend: '+12%' },
    { label: 'Total Staff', value: stats?.total_staff || 0, icon: UserCog, color: 'gradient-card-purple', trend: '+5%' },
    { label: 'Fee Collected', value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee, color: 'gradient-card-teal', trend: '+18%' },
    { label: 'Attendance', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck, color: 'gradient-card-orange', trend: '+2%' },
    { label: 'Pending Fees', value: `₹${((stats?.pending_fees || 0) / 1000).toFixed(0)}K`, icon: Wallet, color: 'gradient-card-pink', trend: '-8%' },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'New Admission', path: '/app/students', color: 'bg-blue-500' },
    { icon: CalendarCheck, label: 'Mark Attendance', path: '/app/attendance', color: 'bg-purple-500' },
    { icon: IndianRupee, label: 'Collect Fee', path: '/app/fee-management', color: 'bg-teal-500' },
    { icon: Bell, label: 'Send Notice', path: '/app/notices', color: 'bg-orange-500' },
    { icon: FileText, label: 'Create Exam', path: '/app/exam-report', color: 'bg-pink-500' },
    { icon: MessageSquare, label: 'Send SMS', path: '/app/sms', color: 'bg-indigo-500' },
  ];

  const modules = [
    { icon: Users, label: 'Students', path: '/app/students', color: 'gradient-card-blue' },
    { icon: UserCog, label: 'Staff', path: '/app/employee-management', color: 'gradient-card-purple' },
    { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance', color: 'gradient-card-teal' },
    { icon: IndianRupee, label: 'Fees', path: '/app/fee-management', color: 'gradient-card-orange' },
    { icon: FileText, label: 'Exams', path: '/app/exam-report', color: 'gradient-card-pink' },
    { icon: Clock, label: 'Timetable', path: '/app/timetable-management', color: 'gradient-card-indigo' },
    { icon: Bell, label: 'Notices', path: '/app/notices', color: 'gradient-card-blue' },
    { icon: MessageSquare, label: 'SMS', path: '/app/sms', color: 'gradient-card-purple' },
    { icon: Bus, label: 'Transport', path: '/app/transport', color: 'gradient-card-teal' },
    { icon: Image, label: 'Gallery', path: '/app/gallery', color: 'gradient-card-orange' },
    { icon: Sparkles, label: 'AI Paper', path: '/app/ai-paper', color: 'gradient-card-pink' },
    { icon: Brain, label: 'Tino AI', path: '/app/tino-ai', color: 'gradient-card-indigo' },
    { icon: Award, label: 'Certificates', path: '/app/certificates', color: 'gradient-card-blue' },
    { icon: Video, label: 'CCTV', path: '/app/cctv', color: 'gradient-card-purple' },
    { icon: Calendar, label: 'Calendar', path: '/app/school-calendar', color: 'gradient-card-teal' },
    { icon: Building, label: 'School Profile', path: '/app/school-management', color: 'gradient-card-orange' },
    { icon: Rss, label: 'School Feed', path: '/app/school-feed', color: 'gradient-card-pink' },
    { icon: Wallet, label: 'Student Wallet', path: '/app/student-wallet', color: 'gradient-card-indigo' },
    { icon: ShoppingBag, label: 'e-Store', path: '/app/e-store', color: 'gradient-card-blue' },
    { icon: Shield, label: 'Visitor Pass', path: '/app/visitor-pass', color: 'gradient-card-purple' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">{greeting}, {user?.name?.split(' ')[0] || 'Admin'}</p>
          <h1 className="text-2xl font-bold text-gray-900">{schoolData?.name || 'Dashboard'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/school-analytics')} className="btn-secondary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">View Analytics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full hidden sm:block">{card.trend}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{card.value}</div>
            <div className="text-xs text-gray-500 font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => navigate(action.path)} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className={`w-9 h-9 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-left">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">All Modules</h2>
          <span className="text-xs text-gray-400 font-medium">{modules.length} modules</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {modules.map((mod, idx) => (
            <button key={idx} onClick={() => navigate(mod.path)} className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
              <div className={`w-12 h-12 ${mod.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <mod.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center group-hover:text-gray-900">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
