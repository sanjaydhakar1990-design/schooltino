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
  LayoutGrid, Send
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ITEMS_PER_PAGE = 5;

const SortIcon = () => (
  <span className="inline-flex flex-col ml-1 -space-y-1 opacity-40">
    <span className="text-[8px] leading-none">&#9650;</span>
    <span className="text-[8px] leading-none">&#9660;</span>
  </span>
);

const moduleCards = [
  {
    id: 'admitpro',
    name: 'AdmitPro',
    desc: 'AI-powered student admission, enrollment & registration management.',
    icon: UserPlus,
    image: '/images/admitpro.png',
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    path: '/app/students',
  },
  {
    id: 'examtino',
    name: 'ExamTino',
    desc: 'Automates exam management, report cards & result processing.',
    icon: ClipboardList,
    image: '/images/examtino.png',
    gradient: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    path: '/app/exam-report',
  },
  {
    id: 'teachtino',
    name: 'TeachTino',
    desc: 'AI-based LMS that enhances teaching and learning experience.',
    icon: BookOpen,
    image: '/images/teachtino.png',
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    path: '/app/classes',
  },
  {
    id: 'smartroll',
    name: 'SmartRoll',
    desc: 'Automated attendance via RFID, biometrics, and AI face recognition.',
    icon: Fingerprint,
    image: '/images/smartroll.png',
    gradient: 'from-orange-500 to-orange-600',
    lightBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    path: '/app/attendance',
  },
  {
    id: 'feetino',
    name: 'FeeTino',
    desc: 'Complete fee collection, tracking & online payment with Razorpay.',
    icon: IndianRupee,
    image: '/images/feetino.png',
    gradient: 'from-green-500 to-green-600',
    lightBg: 'bg-green-50',
    iconColor: 'text-green-600',
    path: '/app/fee-management',
  },
  {
    id: 'papergenie',
    name: 'PaperGenie',
    desc: 'Generates syllabus-based question papers instantly using AI.',
    icon: Sparkles,
    image: '/images/papergenie.png',
    gradient: 'from-pink-500 to-pink-600',
    lightBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    path: '/app/ai-paper',
  },
  {
    id: 'tinoai',
    name: 'TinoAI',
    desc: 'AI Command Center - voice assistant, chat & smart automation.',
    icon: Brain,
    image: '/images/tinoai.png',
    gradient: 'from-violet-500 to-violet-600',
    lightBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    path: '/app/tino-ai',
  },
  {
    id: 'classtino',
    name: 'ClassTino',
    desc: 'Class management, timetable scheduling & section organization.',
    icon: LayoutGrid,
    image: '/images/classtino.png',
    gradient: 'from-cyan-500 to-cyan-600',
    lightBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    path: '/app/timetable-management',
  },
  {
    id: 'parenttino',
    name: 'ParentTino',
    desc: 'Family portal for parent-teacher communication & updates.',
    icon: Users,
    image: '/images/parenttino.png',
    gradient: 'from-teal-500 to-teal-600',
    lightBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    path: '/app/family-portal',
  },
  {
    id: 'transporttino',
    name: 'TransportTino',
    desc: 'Route planning, GPS tracking & transport fleet management.',
    icon: Bus,
    image: '/images/transporttino.png',
    gradient: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    path: '/app/transport',
  },
  {
    id: 'cctvtino',
    name: 'CCTVTino',
    desc: 'AI-powered CCTV monitoring, alerts & campus surveillance.',
    icon: Camera,
    image: '/images/cctvtino.png',
    gradient: 'from-red-500 to-red-600',
    lightBg: 'bg-red-50',
    iconColor: 'text-red-600',
    path: '/app/cctv',
  },
  {
    id: 'stafftino',
    name: 'StaffTino',
    desc: 'Staff management, payroll, HR & employee directory.',
    icon: UserCog,
    image: '/images/stafftino.png',
    gradient: 'from-indigo-500 to-indigo-600',
    lightBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    path: '/app/employee-management',
  },
  {
    id: 'smstino',
    name: 'SMSTino',
    desc: 'Bulk SMS, WhatsApp notifications & communication center.',
    icon: Send,
    image: '/images/smstino.png',
    gradient: 'from-sky-500 to-sky-600',
    lightBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    path: '/app/sms',
  },
  {
    id: 'analytix',
    name: 'Analytix',
    desc: 'Data-driven school analytics, reports & performance insights.',
    icon: BarChart3,
    image: '/images/analytix.png',
    gradient: 'from-slate-500 to-slate-600',
    lightBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    path: '/app/school-analytics',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { schoolId, user, schoolData } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    { label: 'Total Students', value: stats?.total_students || 0, icon: Users, subtext: 'Currently enrolled students' },
    { label: 'Total Staff', value: stats?.total_staff || 0, icon: UserCog, subtext: 'Active staff members' },
    { label: 'Fee Collected', value: `₹${((stats?.fee_collection_month || 0)).toLocaleString()}`, icon: IndianRupee, subtext: 'This month collection' },
    { label: 'Pending Fees', value: `₹${((stats?.pending_fees || 0)).toLocaleString()}`, icon: Wallet, subtext: 'Outstanding balance' },
    { label: 'Attendance Today', value: `${stats?.attendance_today?.present || 0}%`, icon: CalendarCheck, subtext: 'Present students today' },
    { label: 'Total Classes', value: stats?.total_classes || 0, icon: GraduationCap, subtext: 'Active class sections' },
    { label: 'Active Modules', value: 14, icon: Cpu, subtext: 'Running system modules' },
    { label: 'Notices', value: stats?.total_notices || 0, icon: Bell, subtext: 'Published announcements' },
  ];

  const allModules = [
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

  const filteredModules = allModules.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedModules = filteredModules.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-6 pb-10" data-testid="dashboard-page">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors shadow-sm">
          <Home className="w-3.5 h-3.5" />
          Home
        </button>
        <span className="text-gray-400">›</span>
        <span className="text-gray-500 text-xs">{schoolData?.name || 'Dashboard'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm text-slate-500 font-medium">{card.label}</span>
              <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center">
                <card.icon className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{card.value}</div>
            <div className="text-xs text-slate-400">{card.subtext}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
          <p className="text-sm text-gray-500 mt-1">Powerful modules crafted to streamline school workflows and elevate productivity.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {moduleCards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className="group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`relative bg-gradient-to-br ${card.gradient} p-4 flex items-center justify-center`} style={{minHeight: '140px'}}>
                {card.image ? (
                  <img src={card.image} alt={card.name} className="w-full h-28 object-contain group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <card.icon className="w-16 h-16 text-white/80" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{card.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 pt-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">All Modules</h2>
              <p className="text-sm text-gray-500 mt-1">Complete list of modules. Use the "Open" action to view details and continue the workflow.</p>
            </div>
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search keyword"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-full sm:w-56 text-gray-700 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  Module Name <SortIcon />
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">
                  Description <SortIcon />
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 hidden md:table-cell whitespace-nowrap">
                  Category <SortIcon />
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedModules.map((module, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <module.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{module.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{module.desc}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{module.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => navigate(module.path)}
                      className="px-5 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            Showing {startIdx + 1} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredModules.length)} of {filteredModules.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"><ChevronFirst className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"><ChevronLeft className="w-4 h-4" /></button>
            {getPageNumbers().map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs"><ChevronLast className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
