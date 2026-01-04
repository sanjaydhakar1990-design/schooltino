import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  ClipboardList,
  LogOut,
  School,
  Globe,
  UserPlus,
  Mic,
  Image,
  MessageSquare,
  Calendar,
  Video,
  BarChart3,
  Shield,
  Building2,
  Rocket,
  CreditCard
} from 'lucide-react';

export const Sidebar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user permissions
  const permissions = user?.permissions || {};
  const isDirector = user?.role === 'director';

  // Check if user has permission for a feature
  const hasPermission = (permKey) => {
    if (isDirector) return true; // Director has all permissions
    return permissions[permKey] === true;
  };

  // Nav items with permission keys
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'dashboard', permKey: 'dashboard' },
    { path: '/setup-wizard', icon: Rocket, label: 'setup_wizard', permKey: 'settings', directorOnly: true },
    { path: '/subscription', icon: CreditCard, label: 'subscription', permKey: 'settings', directorOnly: true },
    { path: '/school-analytics', icon: BarChart3, label: 'school_analytics', permKey: 'school_analytics' },
    { path: '/school-registration', icon: Building2, label: 'add_school', permKey: 'settings', directorOnly: true },
    { path: '/users', icon: UserPlus, label: 'users', permKey: 'user_management' },
    { path: '/permission-manager', icon: Shield, label: 'permissions', permKey: 'user_management', directorOnly: true },
    { path: '/students', icon: Users, label: 'students', permKey: 'students' },
    { path: '/staff', icon: UserCog, label: 'staff', permKey: 'staff' },
    { path: '/classes', icon: GraduationCap, label: 'classes', permKey: 'classes' },
    { path: '/attendance', icon: CalendarCheck, label: 'attendance', permKey: 'attendance' },
    { path: '/leave', icon: Calendar, label: 'leave_management', permKey: 'leave_management' },
    { path: '/fees', icon: Wallet, label: 'fees', permKey: 'fees' },
    { path: '/notices', icon: Bell, label: 'notices', permKey: 'notices' },
    { path: '/meetings', icon: Video, label: 'zoom_meetings', permKey: 'meetings' },
    { path: '/sms', icon: MessageSquare, label: 'sms_center', permKey: 'sms_center' },
    { path: '/gallery', icon: Image, label: 'gallery', permKey: 'gallery' },
    { path: '/ai-paper', icon: Sparkles, label: 'ai_paper', permKey: 'ai_paper' },
    { path: '/ai-content', icon: Sparkles, label: 'ai_content', permKey: 'ai_content' },
    { path: '/voice-assistant', icon: Mic, label: 'voice_assistant', permKey: 'meetings' },
    { path: '/cctv', icon: Video, label: 'cctv_dashboard', permKey: 'cctv' },
    { path: '/website', icon: Globe, label: 'website_integration', permKey: 'website_integration' },
    { path: '/audit-logs', icon: ClipboardList, label: 'audit_logs', permKey: 'audit_logs' },
    { path: '/settings', icon: Settings, label: 'settings', permKey: 'settings' },
  ];

  // Filter items based on permissions
  const filteredItems = navItems.filter(item => {
    // Director-only items
    if (item.directorOnly && !isDirector) return false;
    // Check permission
    return hasPermission(item.permKey);
  });

  return (
    <aside className="sidebar" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-heading">Schooltino</h1>
            <p className="text-xs text-slate-400">
              {isDirector ? 'Director Panel' : 
               user?.role === 'principal' ? 'Principal Panel' :
               user?.role === 'vice_principal' ? 'VP Panel' :
               user?.role === 'co_director' ? 'Co-Director Panel' :
               'Admin Panel'}
            </p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isDirector ? 'bg-purple-500/20 text-purple-300' :
          user?.role === 'principal' ? 'bg-blue-500/20 text-blue-300' :
          user?.role === 'vice_principal' ? 'bg-emerald-500/20 text-emerald-300' :
          'bg-slate-500/20 text-slate-300'
        }`}>
          <Shield className="w-3 h-3 mr-1" />
          {user?.role?.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                data-testid={`nav-${item.label}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{t(item.label)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
          data-testid="language-toggle"
        >
          <Globe className="w-5 h-5" />
          <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isDirector ? 'bg-purple-600' :
            user?.role === 'principal' ? 'bg-blue-600' :
            'bg-indigo-600'
          }`}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
