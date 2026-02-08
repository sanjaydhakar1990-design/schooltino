import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  CalendarCheck,
  Wallet,
  Bell,
  Sparkles,
  Settings,
  LogOut,
  Globe,
  UserPlus,
  Image,
  MessageSquare,
  Calendar,
  Video,
  BarChart3,
  Shield,
  FileText,
  Calculator,
  X,
  Bus,
  Heart,
  Fingerprint,
  Clock,
  Music,
  Brain,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Briefcase,
  Radio,
  Wrench,
  DollarSign,
  Megaphone,
  Cpu,
  Building,
  Award,
  CreditCard,
  ClipboardList,
  Search
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout, schoolData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState(['dashboard', 'academic']);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (schoolData?.logo_url || schoolData?.logo) {
      setSchoolLogo(schoolData.logo_url || schoolData.logo);
    }
  }, [schoolData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const permissions = user?.permissions || {};
  const isDirector = user?.role === 'director';

  const hasPermission = (permKey) => {
    if (isDirector) return true;
    return permissions[permKey] === true;
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(g => g !== groupId)
        : [...prev, groupId]
    );
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const navGroups = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      color: '#3B82F6',
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: t('dashboard'), desc: 'Overview & Analytics', permKey: 'dashboard', color: '#3B82F6' },
        { path: '/app/tino-brain', icon: Brain, label: t('tino_brain'), desc: 'AI Voice Assistant', permKey: 'dashboard', color: '#8B5CF6' },
        { path: '/app/school-analytics', icon: BarChart3, label: t('school_analytics'), desc: 'Reports & Insights', permKey: 'school_analytics', color: '#10B981' },
      ]
    },
    {
      id: 'academic',
      label: t('academic') || 'Academic',
      icon: BookOpen,
      color: '#F59E0B',
      items: [
        { path: '/app/students', icon: Users, label: t('students'), desc: 'Student Records', permKey: 'students', color: '#3B82F6' },
        { path: '/app/classes', icon: GraduationCap, label: t('classes'), desc: 'Class Management', permKey: 'classes', color: '#10B981' },
        { path: '/app/attendance', icon: CalendarCheck, label: t('attendance'), desc: 'Daily Attendance', permKey: 'attendance', color: '#F59E0B' },
        { path: '/app/timetable-management', icon: Clock, label: 'Timetable', desc: 'Schedule Management', permKey: 'attendance', color: '#8B5CF6' },
        { path: '/app/exam-report', icon: ClipboardList, label: 'Exam & Report Card', desc: 'Results & Reports', permKey: 'attendance', color: '#EF4444' },
        { path: '/app/certificates', icon: Award, label: 'Certificates (TC/Character)', desc: 'Certificate Generation', permKey: 'students', color: '#F97316' },
        { path: '/app/admit-cards', icon: FileText, label: 'Admit Cards', desc: 'Exam Admit Cards', permKey: 'attendance', color: '#06B6D4' },
      ]
    },
    {
      id: 'staff',
      label: 'Team Management',
      icon: Briefcase,
      color: '#10B981',
      items: [
        { path: '/app/employee-management', icon: Users, label: 'All Team Members', desc: 'Staff Directory', permKey: 'staff', color: '#3B82F6' },
        { path: '/app/leave', icon: Calendar, label: t('leave_management'), desc: 'Leave Requests', permKey: 'leave_management', color: '#F59E0B' },
        { path: '/app/salary', icon: DollarSign, label: t('salary'), desc: 'Payroll Management', permKey: 'fees', color: '#10B981' },
        { path: '/app/permission-manager', icon: Shield, label: 'Permissions & Roles', desc: 'Access Control', permKey: 'user_management', directorOnly: true, color: '#EF4444' },
      ]
    },
    {
      id: 'finance',
      label: t('fees') || 'Finance',
      icon: Wallet,
      color: '#F59E0B',
      items: [
        { path: '/app/fee-management', icon: Wallet, label: 'Fee Management', desc: 'Fee Collection & Tracking', permKey: 'fees', color: '#F59E0B' },
        { path: '/app/accountant', icon: Calculator, label: t('ai_accountant'), desc: 'AI-Powered Accounts', permKey: 'fees', color: '#8B5CF6' },
      ]
    },
    {
      id: 'communication',
      label: t('notices') || 'Communication',
      icon: Megaphone,
      color: '#8B5CF6',
      items: [
        { path: '/app/notices', icon: Bell, label: t('notices'), desc: 'Announcements', permKey: 'notices', color: '#3B82F6' },
        { path: '/app/sms', icon: MessageSquare, label: t('sms_center'), desc: 'SMS & Notifications', permKey: 'sms_center', color: '#10B981' },
        { path: '/app/meetings', icon: Video, label: t('zoom_meetings'), desc: 'Video Meetings', permKey: 'meetings', color: '#8B5CF6' },
        { path: '/app/gallery', icon: Image, label: t('gallery'), desc: 'Photo Gallery', permKey: 'gallery', color: '#F97316' },
        { path: '/app/family-portal', icon: Users, label: 'Family Portal (ParentTino)', desc: 'Parent Communication', permKey: 'settings', color: '#06B6D4' },
        { path: '/app/complaints', icon: MessageSquare, label: 'Complaints & Feedback', desc: 'Issue Tracking', permKey: 'settings', color: '#EF4444' },
      ]
    },
    {
      id: 'ai_tools',
      label: 'AI Tools',
      icon: Cpu,
      color: '#EC4899',
      items: [
        { path: '/app/tino-ai', icon: Brain, label: 'Tino AI (Command Center)', desc: 'AI Assistant', permKey: 'dashboard', color: '#8B5CF6' },
        { path: '/app/ai-paper', icon: Sparkles, label: t('ai_paper'), desc: 'Auto Paper Generation', permKey: 'ai_paper', color: '#EC4899' },
        { path: '/app/event-designer', icon: Image, label: 'AI Content & Event Designer', desc: 'Creative Design', permKey: 'ai_content', color: '#F97316' },
        { path: '/app/school-calendar', icon: Calendar, label: 'School Calendar (Board-wise)', desc: 'Academic Calendar', permKey: 'settings', color: '#3B82F6' },
      ]
    },
    {
      id: 'infrastructure',
      label: t('transport') || 'Infrastructure',
      icon: Building,
      color: '#06B6D4',
      items: [
        { path: '/app/transport', icon: Bus, label: t('transport'), desc: 'Route & GPS Tracking', permKey: 'attendance', color: '#06B6D4' },
        { path: '/app/health', icon: Heart, label: t('health_module'), desc: 'Medical Records', permKey: 'attendance', color: '#EF4444' },
        { path: '/app/biometric', icon: Fingerprint, label: t('biometric'), desc: 'Biometric Devices', permKey: 'attendance', color: '#8B5CF6' },
        { path: '/app/cctv', icon: Video, label: t('cctv_dashboard'), desc: 'CCTV Monitoring', permKey: 'cctv', color: '#64748B' },
      ]
    },
    {
      id: 'school_setup',
      label: 'School Setup',
      icon: Building,
      color: '#64748B',
      items: [
        { path: '/app/setup-wizard', icon: Wrench, label: 'Setup Wizard (Step-by-Step)', desc: 'Initial Configuration', permKey: 'settings', directorOnly: true, color: '#F59E0B' },
        { path: '/app/school-management', icon: Building, label: 'School Profile & Branding', desc: 'School Details', permKey: 'settings', directorOnly: true, color: '#3B82F6' },
        { path: '/app/logo-settings', icon: Image, label: 'Logo & Watermark Settings', desc: 'Visual Identity', permKey: 'settings', directorOnly: true, color: '#10B981' },
        { path: '/app/board-notifications', icon: Bell, label: 'Board Updates (CBSE/UP/ICSE)', desc: 'Board Notifications', permKey: 'settings', directorOnly: true, color: '#F97316' },
        { path: '/app/prayer-system', icon: Music, label: 'Prayer & Bell System', desc: 'Bell Scheduler', permKey: 'settings', color: '#8B5CF6' },
        { path: '/app/website', icon: Globe, label: t('website_integration'), desc: 'Website Builder', permKey: 'website_integration', color: '#06B6D4' },
      ]
    }
  ];

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.directorOnly && !isDirector) return false;
      if (item.teacherOnly && isDirector) return false;
      if (!hasPermission(item.permKey)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || (item.desc && item.desc.toLowerCase().includes(q));
      }
      return true;
    })
  })).filter(group => group.items.length > 0);

  return (
    <>
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen w-[260px] z-50 lg:z-auto transform transition-transform duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col bg-white border-r border-gray-200`}
        data-testid="sidebar"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {schoolLogo ? (
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 border border-gray-200">
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-800 text-sm leading-tight truncate">
                {schoolData?.name || 'School'}
              </h1>
              <p className="text-xs text-blue-500 capitalize truncate">{user?.role || 'Admin'} Panel</p>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300 focus:bg-white text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {filteredGroups.map((group) => (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                <span>{group.label}</span>
                {expandedGroups.includes(group.id) ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {expandedGroups.includes(group.id) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`
                      }
                      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: location.pathname === item.path ? `${item.color}15` : `${item.color}10`,
                        }}
                      >
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate leading-tight">{item.label}</span>
                        {item.desc && (
                          <span className="block text-[10px] text-gray-400 truncate leading-tight mt-0.5">{item.desc}</span>
                        )}
                      </div>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <NavLink
            to="/app/profile"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2 mb-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            data-testid="user-profile-link"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
