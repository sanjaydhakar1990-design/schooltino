import { NavLink, useNavigate } from 'react-router-dom';
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
  ClipboardList
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout, schoolData } = useAuth();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState(['dashboard', 'academic']);
  const [schoolLogo, setSchoolLogo] = useState(null);

  useEffect(() => {
    if (schoolData?.logo) {
      setSchoolLogo(schoolData.logo);
    }
  }, [schoolData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user permissions
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

  // Handle navigation and close sidebar on mobile
  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  // Grouped navigation structure - Clean & Organized (with translations)
  const navGroups = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: t('dashboard'), permKey: 'dashboard' },
        { path: '/app/tino-brain', icon: Brain, label: t('tino_brain'), permKey: 'dashboard' },
        { path: '/app/school-analytics', icon: BarChart3, label: t('school_analytics'), permKey: 'school_analytics' },
      ]
    },
    {
      id: 'academic',
      label: t('academic') || 'Academic',
      icon: BookOpen,
      items: [
        { path: '/app/students', icon: Users, label: t('students'), permKey: 'students' },
        { path: '/app/classes', icon: GraduationCap, label: t('classes'), permKey: 'classes' },
        { path: '/app/attendance', icon: CalendarCheck, label: t('attendance'), permKey: 'attendance' },
        { path: '/app/timetable-management', icon: Clock, label: 'Timetable', permKey: 'attendance' },
        { path: '/app/exam-report', icon: ClipboardList, label: 'Exam & Report Card', permKey: 'attendance' },
        { path: '/app/certificates', icon: Award, label: 'Certificates (TC/Character)', permKey: 'students' },
        { path: '/app/admit-cards', icon: FileText, label: 'Admit Cards', permKey: 'attendance' },
      ]
    },
    {
      id: 'staff',
      label: 'Team Management',
      icon: Briefcase,
      items: [
        { path: '/app/employee-management', icon: Users, label: 'All Team Members', permKey: 'staff' },
        { path: '/app/leave', icon: Calendar, label: t('leave_management'), permKey: 'leave_management' },
        { path: '/app/salary', icon: DollarSign, label: t('salary'), permKey: 'fees' },
        { path: '/app/permission-manager', icon: Shield, label: 'Permissions & Roles', permKey: 'user_management', directorOnly: true },
      ]
    },
    {
      id: 'finance',
      label: t('fees') || 'Finance',
      icon: Wallet,
      items: [
        { path: '/app/fee-management', icon: Wallet, label: 'Fee Management', permKey: 'fees' },
        { path: '/app/accountant', icon: Calculator, label: t('ai_accountant'), permKey: 'fees' },
      ]
    },
    {
      id: 'communication',
      label: t('notices') || 'Communication',
      icon: Megaphone,
      items: [
        { path: '/app/notices', icon: Bell, label: t('notices'), permKey: 'notices' },
        { path: '/app/sms', icon: MessageSquare, label: t('sms_center'), permKey: 'sms_center' },
        { path: '/app/meetings', icon: Video, label: t('zoom_meetings'), permKey: 'meetings' },
        { path: '/app/gallery', icon: Image, label: t('gallery'), permKey: 'gallery' },
        { path: '/app/family-portal', icon: Users, label: 'Family Portal (ParentTino)', permKey: 'settings' },
        { path: '/app/complaints', icon: MessageSquare, label: 'Complaints & Feedback', permKey: 'settings' },
      ]
    },
    {
      id: 'ai_tools',
      label: 'AI Tools',
      icon: Cpu,
      items: [
        { path: '/app/tino-ai', icon: Brain, label: 'Tino AI (Command Center)', permKey: 'dashboard' },
        { path: '/app/ai-paper', icon: Sparkles, label: t('ai_paper'), permKey: 'ai_paper' },
        { path: '/app/event-designer', icon: Image, label: 'AI Content & Event Designer', permKey: 'ai_content' },
        { path: '/app/school-calendar', icon: Calendar, label: 'School Calendar (Board-wise)', permKey: 'settings' },
      ]
    },
    {
      id: 'infrastructure',
      label: t('transport') || 'Infrastructure',
      icon: Building,
      items: [
        { path: '/app/transport', icon: Bus, label: t('transport'), permKey: 'attendance' },
        { path: '/app/health', icon: Heart, label: t('health_module'), permKey: 'attendance' },
        { path: '/app/biometric', icon: Fingerprint, label: t('biometric'), permKey: 'attendance' },
        { path: '/app/cctv', icon: Video, label: t('cctv_dashboard'), permKey: 'cctv' },
      ]
    },
    {
      id: 'school_setup',
      label: 'School Setup',
      icon: Building,
      items: [
        { path: '/app/setup-wizard', icon: Wrench, label: 'Setup Wizard (Step-by-Step)', permKey: 'settings', directorOnly: true },
        { path: '/app/school-management', icon: Building, label: 'School Profile & Branding', permKey: 'settings', directorOnly: true },
        { path: '/app/logo-settings', icon: Image, label: 'Logo & Watermark Settings', permKey: 'settings', directorOnly: true },
        { path: '/app/board-notifications', icon: Bell, label: 'Board Updates (CBSE/UP/ICSE)', permKey: 'settings', directorOnly: true },
        { path: '/app/prayer-system', icon: Music, label: 'Prayer & Bell System', permKey: 'settings' },
        { path: '/app/website', icon: Globe, label: t('website_integration'), permKey: 'website_integration' },
      ]
    }
  ];

  // Filter groups and items based on permissions
  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.directorOnly && !isDirector) return false;
      if (item.teacherOnly && isDirector) return false;
      return hasPermission(item.permKey);
    })
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen w-64 z-50 lg:z-auto transform transition-transform duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
        style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)' }}
        data-testid="sidebar"
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700 lg:hidden"
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>

        {/* Logo - School Logo with Name */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {schoolLogo ? (
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-white text-base leading-tight truncate">
                {schoolData?.name || 'Schooltino'}
              </h1>
              <p className="text-xs text-slate-400 capitalize truncate">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation - Dark Theme */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredGroups.map((group) => (
            <div key={group.id} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <group.icon className="w-4 h-4" />
                  <span>{group.label}</span>
                </div>
                {expandedGroups.includes(group.id) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Group Items */}
              {expandedGroups.includes(group.id) && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium shadow-md'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`
                      }
                      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Info & Logout - Dark Theme */}
        <div className="p-3 border-t border-slate-700/50">
          <NavLink
            to="/app/profile"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
            data-testid="user-profile-link"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
