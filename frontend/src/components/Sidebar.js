import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck,
  Wallet, Settings, LogOut, X, Bus,
  Clock, Brain, ChevronLeft, ChevronRight,
  BookOpen, Video, MessageSquare, Calendar,
  Shield, FileText, Building, Search, Package,
  Tv, Target, BarChart3
} from 'lucide-react';

const API = (process.env.REACT_APP_BACKEND_URL || '');

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode, getSidebarStyle, getSidebarActiveColor } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleVisibility, setModuleVisibility] = useState({});
  const apiFetched = useRef(false);

  const loadModuleVisibility = useCallback(async () => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) {
        setModuleVisibility(JSON.parse(saved));
        return;
      }
    } catch (e) {}
    if (!apiFetched.current) {
      apiFetched.current = true;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${API}/api/settings/module-visibility`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Object.keys(data).length > 0) {
              setModuleVisibility(data);
              localStorage.setItem('module_visibility_settings', JSON.stringify(data));
            }
          }
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    loadModuleVisibility();
    const handleStorage = (e) => {
      if (e.key === 'module_visibility_settings') {
        try {
          const saved = localStorage.getItem('module_visibility_settings');
          if (saved) setModuleVisibility(JSON.parse(saved));
        } catch (e) {}
      }
    };
    const handleCustomEvent = () => {
      try {
        const saved = localStorage.getItem('module_visibility_settings');
        if (saved) setModuleVisibility(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('module_visibility_changed', handleCustomEvent);
    return () => { window.removeEventListener('storage', handleStorage); window.removeEventListener('module_visibility_changed', handleCustomEvent); };
  }, [loadModuleVisibility]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isDirector = user?.role === 'director';
  const modulePermissions = user?.module_permissions || user?.permissions || {};
  const hasModulePermission = (moduleKey) => {
    if (isDirector) return true;
    if (!moduleKey) return true;
    if (Object.keys(modulePermissions).length > 0) {
      return modulePermissions[moduleKey] !== false;
    }
    return true;
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const isModuleEnabled = (moduleKey) => {
    if (!moduleKey) return true;
    const vis = moduleVisibility[moduleKey];
    if (!vis) return true;
    return vis.schooltino !== false;
  };

  const navItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'dashboard', moduleKey: 'dashboard' },
    { path: '/app/students', icon: Users, labelKey: 'students', moduleKey: 'students' },
    { path: '/app/staff', icon: Users, labelKey: 'staff_management', moduleKey: 'staff' },
    { path: '/app/classes', icon: GraduationCap, labelKey: 'classes', moduleKey: 'classes' },
    { path: '/app/attendance', icon: CalendarCheck, labelKey: 'attendance', moduleKey: 'attendance' },
    { path: '/app/fees', icon: Wallet, labelKey: 'fee_management', moduleKey: 'fee_management' },
    { path: '/app/admissions', icon: Target, labelKey: 'admissions', moduleKey: 'admissions' },
    { path: '/app/exams', icon: FileText, labelKey: 'exams_reports', moduleKey: 'exams_reports' },
    { path: '/app/timetable', icon: Clock, labelKey: 'timetable', moduleKey: 'timetable' },
    { path: '/app/library', icon: BookOpen, labelKey: 'digital_library', moduleKey: 'digital_library' },
    { path: '/app/live-classes', icon: Tv, labelKey: 'live_classes', moduleKey: 'live_classes' },
    { path: '/app/communication', icon: MessageSquare, labelKey: 'communication_hub', moduleKey: 'communication_hub' },
    { path: '/app/front-office', icon: Shield, labelKey: 'front_office', moduleKey: 'front_office' },
    { path: '/app/transport', icon: Bus, labelKey: 'transport', moduleKey: 'transport' },
    { path: '/app/calendar', icon: Calendar, labelKey: 'calendar', moduleKey: 'calendar' },
    { path: '/app/analytics', icon: BarChart3, labelKey: 'analytics', moduleKey: 'analytics' },
    { path: '/app/ai-tools', icon: Brain, labelKey: 'ai_tools', moduleKey: 'ai_tools' },
    { path: '/app/cctv', icon: Video, labelKey: 'cctv_integration', moduleKey: 'cctv' },
    { path: '/app/inventory', icon: Package, labelKey: 'inventory', moduleKey: 'inventory' },
    { path: '/app/multi-branch', icon: Building, labelKey: 'multi_branch', directorOnly: true, moduleKey: 'multi_branch' },
    { path: '/app/settings', icon: Settings, labelKey: 'settings', directorOnly: true },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.directorOnly && !isDirector) return false;
    if (!isModuleEnabled(item.moduleKey)) return false;
    if (!hasModulePermission(item.moduleKey)) return false;
    if (searchQuery) return t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  return (
    <aside className={`fixed lg:relative top-0 left-0 h-full ${isCollapsed ? 'w-[60px]' : 'w-[260px]'} z-50 lg:z-auto transform transition-all duration-200 shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col border-r ${isDarkMode ? 'border-slate-700' : 'border-blue-100'}`} style={{height: '100dvh', ...getSidebarStyle()}}>
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-full items-center justify-center text-white shadow-md z-10 border-2 border-white"
        style={{ backgroundColor: getSidebarActiveColor() }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
      <button onClick={onClose} className={`absolute top-4 right-3 p-1.5 rounded-lg lg:hidden ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-blue-100'}`}>
        <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-blue-400'}`} />
      </button>


      <NavLink to="/app/profile" onClick={handleNavClick} className={`block px-4 py-3 mt-2 border-b transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-blue-100 hover:bg-blue-50'}`} style={{paddingTop: 'max(0.75rem, env(safe-area-inset-top))'}}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 ${isDarkMode ? 'border-slate-600' : 'border-blue-200'}`}>
            {user?.photo_url ? (
              <img src={user.photo_url.startsWith('http') ? user.photo_url : `${(process.env.REACT_APP_BACKEND_URL || '')}${user.photo_url}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${getSidebarActiveColor()}, ${getSidebarActiveColor()}dd)` }}>
                <span className="text-white font-bold text-xs">{user?.name?.charAt(0) || 'U'}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.name || 'User'}</p>
              <p className={`text-[10px] capitalize ${isDarkMode ? 'text-slate-400' : 'text-blue-400'}`}>{user?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          )}
        </div>
      </NavLink>

      {!isCollapsed && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-500' : 'text-blue-300'}`} />
            <input
              type="text"
              placeholder={t('search_modules')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-slate-500' : 'bg-white border border-blue-200 text-slate-700 placeholder-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'}`}
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                isActive
                  ? 'text-white font-medium shadow-md'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-blue-100/60 hover:text-blue-700'
              }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: getSidebarActiveColor() } : {}}
            title={isCollapsed ? t(item.labelKey) : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`p-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-blue-100'}`} style={{paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))'}}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors`}
        >
          <LogOut className="w-3.5 h-3.5" />
          {!isCollapsed && <span>{t('sign_out')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
