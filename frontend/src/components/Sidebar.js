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
  Video
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

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/school-analytics', icon: ClipboardList, label: 'school_analytics', roles: ['director', 'principal', 'vice_principal'] },
    { path: '/voice-assistant', icon: Mic, label: 'voice_assistant', roles: ['director', 'principal', 'vice_principal'] },
    { path: '/users', icon: UserPlus, label: 'users', roles: ['director', 'principal', 'vice_principal'] },
    { path: '/students', icon: Users, label: 'students' },
    { path: '/staff', icon: UserCog, label: 'staff' },
    { path: '/classes', icon: GraduationCap, label: 'classes' },
    { path: '/attendance', icon: CalendarCheck, label: 'attendance' },
    { path: '/leave', icon: Calendar, label: 'leave_management' },
    { path: '/fees', icon: Wallet, label: 'fees' },
    { path: '/notices', icon: Bell, label: 'notices' },
    { path: '/sms', icon: MessageSquare, label: 'sms_center', roles: ['director', 'principal', 'vice_principal', 'accountant'] },
    { path: '/gallery', icon: Image, label: 'gallery' },
    { path: '/ai-paper', icon: Sparkles, label: 'ai_paper' },
    { path: '/ai-content', icon: Sparkles, label: 'ai_content', roles: ['director', 'principal', 'vice_principal'] },
    { path: '/cctv', icon: Video, label: 'cctv_dashboard', roles: ['director', 'principal', 'vice_principal', 'security'] },
    { path: '/website', icon: Globe, label: 'website_integration', roles: ['director', 'principal'] },
    { path: '/audit-logs', icon: ClipboardList, label: 'audit_logs', roles: ['director', 'principal', 'admin'] },
    { path: '/settings', icon: Settings, label: 'settings' },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
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
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
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
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
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
