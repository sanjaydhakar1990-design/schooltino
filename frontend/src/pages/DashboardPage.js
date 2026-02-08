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
  ChevronLeft, ChevronLast, ChevronFirst,
  ArrowUpDown, Monitor, Mic, Smartphone,
  PenTool, BookMarked, UserCheck, ShieldCheck,
  Headphones, Camera, Layers, Database,
  LayoutGrid, Send, MessageCircle, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users, subtext: 'Active enrolled students', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: 'Total Staff', value: stats?.total_staff || 0, icon: UserCog, subtext: 'Teaching & non-teaching staff', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Fee Collection', value: `₹${((stats?.fee_collection_month || 0) / 1000).toFixed(0)}K`, icon: IndianRupee, subtext: 'This month collection', iconBg: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Attendance Today', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck, subtext: 'Present today', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-500' },
    { label: 'Pending Fees', value: `₹${((stats?.pending_fees || 0) / 1000).toFixed(0)}K`, icon: Wallet, subtext: 'Outstanding amount', iconBg: 'bg-red-50', iconColor: 'text-red-500' },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'New Admission', color: 'text-blue-500', bg: 'bg-blue-50', path: '/app/students' },
    { icon: CalendarCheck, label: 'Mark Attendance', color: 'text-green-500', bg: 'bg-green-50', path: '/app/attendance' },
    { icon: IndianRupee, label: 'Collect Fee', color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/app/fee-management' },
    { icon: Brain, label: 'Ask Tino AI', color: 'text-violet-500', bg: 'bg-violet-50', path: '/app/tino-ai' },
    { icon: Bell, label: 'Send Notice', color: 'text-amber-500', bg: 'bg-amber-50', path: '/app/notices' },
    { icon: Sparkles, label: 'AI Paper', color: 'text-pink-500', bg: 'bg-pink-50', path: '/app/ai-paper' },
  ];

  const allModulesGrid = [
    { icon: Users, label: 'Students', color: 'text-blue-500', bg: 'bg-blue-50', path: '/app/students' },
    { icon: UserCog, label: 'Staff', color: 'text-orange-500', bg: 'bg-orange-50', path: '/app/employee-management' },
    { icon: CalendarCheck, label: 'Attendance', color: 'text-green-500', bg: 'bg-green-50', path: '/app/attendance' },
    { icon: IndianRupee, label: 'Fees', color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/app/fee-management' },
    { icon: ClipboardList, label: 'Exams', color: 'text-purple-500', bg: 'bg-purple-50', path: '/app/exam-report' },
    { icon: BookOpen, label: 'Library', color: 'text-cyan-500', bg: 'bg-cyan-50', path: '/app/classes' },
    { icon: Clock, label: 'Timetable', color: 'text-slate-500', bg: 'bg-slate-100', path: '/app/timetable-management' },
    { icon: Bus, label: 'Transport', color: 'text-amber-500', bg: 'bg-amber-50', path: '/app/transport' },
    { icon: Shield, label: 'Visitor Pass', color: 'text-teal-500', bg: 'bg-teal-50', path: '/app/visitor-pass' },
    { icon: Image, label: 'Gallery', color: 'text-pink-500', bg: 'bg-pink-50', path: '/app/gallery' },
    { icon: Bell, label: 'Notices', color: 'text-red-500', bg: 'bg-red-50', path: '/app/notices' },
    { icon: Sparkles, label: 'AI Paper', color: 'text-violet-500', bg: 'bg-violet-50', path: '/app/ai-paper' },
  ];

  const upcomingEvents = [
    { title: 'Parent-Teacher Meeting', date: 'Jan 28', color: 'border-blue-400' },
    { title: 'Republic Day', date: 'Jan 26', color: 'border-green-400' },
    { title: 'Annual Sports Day', date: 'Feb 5', color: 'border-orange-400' },
  ];

  const feeMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const feeBarHeights = [35, 52, 28, 44, 60, 38, 48, 55, 30, 42, 50, 45];

  return (
    <div className="space-y-5 pb-10" data-testid="dashboard-page">
      <div>
        <p className="text-sm text-gray-500">{getGreeting()}</p>
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{schoolData?.name || 'School Dashboard'}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
              <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{card.value}</div>
            <div className="text-[11px] text-gray-400">{card.subtext}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Quick Actions</h2>
          </div>
          <span className="text-xs text-gray-400">त्वरित कार्य</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 ${action.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-200`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-xs text-gray-600 font-medium text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Fee Collection Overview</h2>
                <p className="text-xs text-gray-400">शुल्क संग्रह विवरण</p>
              </div>
              <button onClick={() => navigate('/app/fee-management')} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                More Details
              </button>
            </div>
            <div className="h-48 flex items-end gap-2 px-2">
              {feeMonths.map((month, idx) => {
                const height = idx <= currentMonth ? feeBarHeights[idx] : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-100 rounded-t-sm relative" style={{ height: `${idx <= currentMonth ? height : 4}px` }}>
                      {idx <= currentMonth && (
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-400 rounded-t-sm" style={{ height: `${Math.round(height * 0.6)}px` }} />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{month}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400">This Month</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">All Modules</h2>
                <p className="text-xs text-gray-400">सभी मॉड्यूल</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-5">
              {allModulesGrid.map((mod, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(mod.path)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-12 h-12 ${mod.bg} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-200`}>
                    <mod.icon className={`w-5 h-5 ${mod.color}`} />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium text-center leading-tight">{mod.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Today's Attendance</h2>
                <p className="text-xs text-gray-400">आज की उपस्थिति</p>
              </div>
              <span className="text-[11px] text-gray-400">{new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex justify-center mb-4">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3b82f6" strokeWidth="3"
                    strokeDasharray={`${(stats?.attendance_today?.present || 0) * 0.975} 97.5`}
                    strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ef4444" strokeWidth="3"
                    strokeDasharray={`${((stats?.attendance_today?.absent || 0)) * 0.975} 97.5`}
                    strokeDashoffset={`-${(stats?.attendance_today?.present || 0) * 0.975}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{stats?.attendance_today?.present || 0}%</span>
                  <span className="text-[10px] text-gray-400">Present</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-gray-500">Present: {stats?.attendance_today?.present || 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-gray-500">Absent: {stats?.attendance_today?.absent || 0}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-gray-500">Leave: 0%</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => navigate('/app/attendance')} className="px-4 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                More Details
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Tino AI</h3>
                <p className="text-[11px] text-gray-400">AI Assistant</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Ask anything about your school. Get instant AI-powered answers and insights.</p>
            <button
              onClick={() => navigate('/app/tino-ai')}
              className="w-full py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Start Chat
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
              <span className="text-[11px] text-gray-400">Latest updates</span>
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-gray-300">
              <Bell className="w-8 h-8 mb-2" />
              <span className="text-xs text-gray-400">No recent activity</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Upcoming Events</h2>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className={`border-l-3 ${event.color} pl-3 py-1`} style={{borderLeftWidth: '3px'}}>
                  <p className="text-sm font-medium text-gray-700">{event.title}</p>
                  <p className="text-[11px] text-gray-400">{event.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
