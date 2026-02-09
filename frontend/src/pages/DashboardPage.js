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
  Calculator, Music, Globe, Wrench, UserPlus
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
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-gray-700 mb-1">No School Selected</h2>
        <p className="text-sm text-gray-500 mb-4">Create or select a school from Settings.</p>
        <button onClick={() => navigate('/app/settings')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
          <Settings className="w-4 h-4 inline mr-1.5" />Go to Settings
        </button>
      </div>
    );
  }

  const statCards = [
    { label: 'Students', value: stats?.total_students || 0, icon: Users },
    { label: 'Staff', value: stats?.total_staff || 0, icon: UserCog },
    { label: 'Fee Collected', value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee },
    { label: 'Attendance', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck },
    { label: 'Pending Fees', value: `₹${((stats?.pending_fees || 0) / 1000).toFixed(0)}K`, icon: Wallet },
  ];

  const modules = [
    { icon: Users, label: 'Students', path: '/app/students' },
    { icon: UserCog, label: 'Staff', path: '/app/employee-management' },
    { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance' },
    { icon: IndianRupee, label: 'Fees', path: '/app/fee-management' },
    { icon: FileText, label: 'Exams', path: '/app/exam-report' },
    { icon: Clock, label: 'Timetable', path: '/app/timetable-management' },
    { icon: Bell, label: 'Notices', path: '/app/notices' },
    { icon: MessageSquare, label: 'SMS', path: '/app/sms' },
    { icon: Bus, label: 'Transport', path: '/app/transport' },
    { icon: Image, label: 'Gallery', path: '/app/gallery' },
    { icon: Sparkles, label: 'AI Paper', path: '/app/ai-paper' },
    { icon: Brain, label: 'Tino AI', path: '/app/tino-ai' },
    { icon: Award, label: 'Certificates', path: '/app/certificates' },
    { icon: Video, label: 'CCTV', path: '/app/cctv' },
    { icon: Calendar, label: 'Calendar', path: '/app/school-calendar' },
    { icon: Building, label: 'School Profile', path: '/app/school-management' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-sm text-gray-500">{greeting}, {user?.name?.split(' ')[0] || 'Admin'}</p>
        <h1 className="text-xl font-semibold text-gray-900">{schoolData?.name || 'Dashboard'}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{card.label}</span>
              <card.icon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Quick Actions</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/app/students')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gray-400" />New Admission
          </button>
          <button onClick={() => navigate('/app/attendance')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-gray-400" />Mark Attendance
          </button>
          <button onClick={() => navigate('/app/fee-management')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-gray-400" />Collect Fee
          </button>
          <button onClick={() => navigate('/app/notices')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />Send Notice
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">All Modules</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {modules.map((mod, idx) => (
            <button key={idx} onClick={() => navigate(mod.path)} className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group">
              <mod.icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              <span className="text-[11px] text-gray-600 text-center leading-tight">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
