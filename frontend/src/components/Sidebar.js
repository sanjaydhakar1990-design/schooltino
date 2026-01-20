import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
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
  Award
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState(['dashboard', 'academic']);

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
        { path: '/app/timetable', icon: Clock, label: t('timetable'), permKey: 'attendance' },
        { path: '/app/exams', icon: FileText, label: 'Online Exams', permKey: 'attendance' },
        { path: '/app/admit-cards', icon: Award, label: 'Admit Cards', permKey: 'attendance' },
      ]
    },
    {
      id: 'staff',
      label: t('staff'),
      icon: Briefcase,
      items: [
        { path: '/app/staff', icon: UserCog, label: t('staff'), permKey: 'staff' },
        { path: '/app/teacher-roles', icon: GraduationCap, label: 'Teacher Roles', permKey: 'staff' },
        { path: '/app/leave', icon: Calendar, label: t('leave_management'), permKey: 'leave_management' },
        { path: '/app/salary', icon: DollarSign, label: t('salary'), permKey: 'fees' },
      ]
    },
    {
      id: 'finance',
      label: t('fees') || 'Finance',
      icon: Wallet,
      items: [
        { path: '/app/fees', icon: Wallet, label: t('fees'), permKey: 'fees' },
        { path: '/app/fee-structure', icon: FileText, label: t('fee_structure'), permKey: 'fees' },
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
      ]
    },
    {
      id: 'ai_tools',
      label: 'AI Tools',
      icon: Cpu,
      items: [
        { path: '/app/ai-paper', icon: Sparkles, label: t('ai_paper'), permKey: 'ai_paper' },
        { path: '/app/ai-content', icon: Sparkles, label: t('ai_content'), permKey: 'ai_content' },
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
      id: 'settings',
      label: t('settings'),
      icon: Wrench,
      items: [
        { path: '/app/setup-guide', icon: Wrench, label: 'Setup Guide', permKey: 'settings', directorOnly: true },
        { path: '/app/school-settings', icon: Clock, label: 'School Settings', permKey: 'settings', directorOnly: true },
        { path: '/app/school-calendar', icon: Calendar, label: 'School Calendar', permKey: 'settings' },
        { path: '/app/prayer-system', icon: Music, label: 'Prayer System', permKey: 'settings' },
        { path: '/app/board-notifications', icon: Bell, label: 'Board Updates', permKey: 'settings', directorOnly: true },
        { path: '/app/complaints', icon: MessageSquare, label: 'Complaints', permKey: 'settings' },
        { path: '/app/users', icon: UserPlus, label: t('users'), permKey: 'user_management' },
        { path: '/app/permission-manager', icon: Shield, label: t('permissions'), permKey: 'user_management', directorOnly: true },
        { path: '/app/website', icon: Globe, label: t('website_integration'), permKey: 'website_integration' },
        { path: '/app/settings', icon: Settings, label: t('settings'), permKey: 'settings' },
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
        className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 lg:z-auto transform transition-transform duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
        data-testid="sidebar"
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Schooltino</h1>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredGroups.map((group) => (
            <div key={group.id} className="mb-2">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
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
                <div className="ml-4 mt-1 space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

        {/* User Info & Logout */}
        <div className="p-3 border-t border-slate-100">
          <NavLink
            to="/app/profile"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            data-testid="user-profile-link"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-medium text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
