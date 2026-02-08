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
  ClipboardList, Wallet, Search, ChevronRight,
  BarChart3, Fingerprint, Video, MessageSquare,
  Globe, Heart, Music, Calculator, Wrench,
  Building, Award, FileText, CreditCard, Cpu,
  Megaphone, Briefcase, DollarSign, Home,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchStats();
    } else {
      setLoading(false);
    }
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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="text-center py-20">
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No School Selected</h2>
        <p className="text-gray-500">Please create or select a school from Settings.</p>
        <Button onClick={() => navigate('/app/settings')} className="mt-4 bg-blue-500 hover:bg-blue-600">
          <Settings className="w-4 h-4 mr-2" /> Go to Settings
        </Button>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users },
    { label: 'Total Staff', value: stats?.total_staff || 0, icon: UserCog },
    { label: 'Fee Collected (Month)', value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee },
    { label: 'Pending Fees', value: `₹${((stats?.pending_fees || 0) / 1000).toFixed(0)}K`, icon: Wallet },
    { label: 'Attendance Today', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck },
    { label: 'Total Classes', value: stats?.total_classes || 0, icon: GraduationCap },
  ];

  const modules = [
    { icon: Users, label: 'Students', desc: 'Student Records & Admission', path: '/app/students', category: 'Academic' },
    { icon: GraduationCap, label: 'Classes', desc: 'Class Management', path: '/app/classes', category: 'Academic' },
    { icon: CalendarCheck, label: 'Attendance', desc: 'Daily Attendance Tracking', path: '/app/attendance', category: 'Academic' },
    { icon: Clock, label: 'Timetable', desc: 'Schedule Management', path: '/app/timetable-management', category: 'Academic' },
    { icon: ClipboardList, label: 'Exam & Report Card', desc: 'Results & Reports', path: '/app/exam-report', category: 'Academic' },
    { icon: Award, label: 'Certificates (TC/Character)', desc: 'Certificate Generation', path: '/app/certificates', category: 'Academic' },
    { icon: FileText, label: 'Admit Cards', desc: 'Exam Admit Cards', path: '/app/admit-cards', category: 'Academic' },
    { icon: Users, label: 'All Team Members', desc: 'Staff Directory', path: '/app/employee-management', category: 'Team' },
    { icon: Calendar, label: 'Leave Management', desc: 'Leave Requests', path: '/app/leave', category: 'Team' },
    { icon: DollarSign, label: 'Salary / Payroll', desc: 'Payroll Management', path: '/app/salary', category: 'Team' },
    { icon: Shield, label: 'Permissions & Roles', desc: 'Access Control', path: '/app/permission-manager', category: 'Team' },
    { icon: Wallet, label: 'Fee Management', desc: 'Fee Collection & Tracking', path: '/app/fee-management', category: 'Finance' },
    { icon: Calculator, label: 'AI Accountant', desc: 'AI-Powered Accounts', path: '/app/accountant', category: 'Finance' },
    { icon: Bell, label: 'Notices', desc: 'Announcements', path: '/app/notices', category: 'Communication' },
    { icon: MessageSquare, label: 'SMS Center', desc: 'SMS & Notifications', path: '/app/sms', category: 'Communication' },
    { icon: Video, label: 'Meetings', desc: 'Video Meetings', path: '/app/meetings', category: 'Communication' },
    { icon: Image, label: 'Gallery', desc: 'Photo Gallery', path: '/app/gallery', category: 'Communication' },
    { icon: Users, label: 'Family Portal (ParentTino)', desc: 'Parent Communication', path: '/app/family-portal', category: 'Communication' },
    { icon: MessageSquare, label: 'Complaints & Feedback', desc: 'Issue Tracking', path: '/app/complaints', category: 'Communication' },
    { icon: Brain, label: 'Tino AI (Command Center)', desc: 'AI Assistant', path: '/app/tino-ai', category: 'AI Tools' },
    { icon: Sparkles, label: 'AI Paper Generator', desc: 'Auto Paper Generation', path: '/app/ai-paper', category: 'AI Tools' },
    { icon: Image, label: 'AI Content & Event Designer', desc: 'Creative Design', path: '/app/event-designer', category: 'AI Tools' },
    { icon: Calendar, label: 'School Calendar', desc: 'Academic Calendar', path: '/app/school-calendar', category: 'AI Tools' },
    { icon: Bus, label: 'Transport', desc: 'Route & GPS Tracking', path: '/app/transport', category: 'Infrastructure' },
    { icon: Heart, label: 'Health Module', desc: 'Medical Records', path: '/app/health', category: 'Infrastructure' },
    { icon: Fingerprint, label: 'Biometric', desc: 'Biometric Devices', path: '/app/biometric', category: 'Infrastructure' },
    { icon: Video, label: 'CCTV Dashboard', desc: 'CCTV Monitoring', path: '/app/cctv', category: 'Infrastructure' },
    { icon: Wrench, label: 'Setup Wizard', desc: 'Initial Configuration', path: '/app/setup-wizard', category: 'School Setup' },
    { icon: Building, label: 'School Profile & Branding', desc: 'School Details', path: '/app/school-management', category: 'School Setup' },
    { icon: Image, label: 'Logo & Watermark Settings', desc: 'Visual Identity', path: '/app/logo-settings', category: 'School Setup' },
    { icon: Bell, label: 'Board Updates', desc: 'Board Notifications', path: '/app/board-notifications', category: 'School Setup' },
    { icon: Music, label: 'Prayer & Bell System', desc: 'Bell Scheduler', path: '/app/prayer-system', category: 'School Setup' },
    { icon: Globe, label: 'Website Builder', desc: 'Website Integration', path: '/app/website', category: 'School Setup' },
    { icon: BarChart3, label: 'School Analytics', desc: 'Reports & Insights', path: '/app/school-analytics', category: 'Dashboard' },
  ];

  const filteredModules = modules.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 pb-10" data-testid="dashboard-page">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors">
          <Home className="w-3.5 h-3.5" />
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-500 text-xs">{schoolData?.name || 'Dashboard'}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">All Modules</h2>
              <p className="text-xs text-gray-500 mt-0.5">List of all available modules. Use the "Open" action to navigate.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-full sm:w-64 text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((module, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <module.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{module.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{module.desc}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{module.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(module.path)}
                      className="px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filteredModules.length} of {modules.length} modules</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-500 text-white text-xs font-medium">1</button>
          </div>
        </div>
      </div>
    </div>
  );
}
