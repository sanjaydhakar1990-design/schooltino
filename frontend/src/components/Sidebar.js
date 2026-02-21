import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, UserCog, GraduationCap, CalendarCheck,
  Wallet, Settings, LogOut, X, Bus,
  Clock, Brain, ChevronLeft, ChevronRight,
  BookOpen, Video, MessageSquare, Calendar,
  Shield, FileText, Building, Package,
  Tv, Target, BarChart3, ClipboardList, Newspaper, KeyRound
} from 'lucide-react';

const API = (process.env.REACT_APP_BACKEND_URL || '');

/* ============================================================
   NAV GROUPS - Clean, Systematic Grouping
   ============================================================ */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    ]
  },
  {
    label: 'Academic',
    items: [
      { path: '/app/students',   icon: Users,         labelKey: 'students',       moduleKey: 'students' },
      { path: '/app/classes',    icon: GraduationCap, labelKey: 'classes',        moduleKey: 'classes' },
      { path: '/app/timetable',  icon: Clock,         labelKey: 'timetable',      moduleKey: 'timetable' },
      { path: '/app/attendance', icon: CalendarCheck, labelKey: 'attendance',     moduleKey: 'attendance' },
      { path: '/app/exams',      icon: FileText,      labelKey: 'exams_reports',  moduleKey: 'exams_reports' },
      { path: '/app/library',    icon: BookOpen,      labelKey: 'digital_library',moduleKey: 'digital_library' },
      { path: '/app/homework',   icon: ClipboardList, labelKey: 'homework',        moduleKey: 'homework' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { path: '/app/fees', icon: Wallet, labelKey: 'fee_management', moduleKey: 'fee_management' },
    ]
  },
  {
    label: 'Communication',
    items: [
      { path: '/app/communication', icon: MessageSquare, labelKey: 'communication_hub', moduleKey: 'communication_hub' },
      { path: '/app/calendar',      icon: Calendar,      labelKey: 'calendar',          moduleKey: 'calendar' },
      { path: '/app/school-feed',   icon: Newspaper,     labelKey: 'school_feed',       moduleKey: 'school_feed' },
    ]
  },
  {
    label: 'Management',
    items: [
      { path: '/app/staff',        icon: UserCog,  labelKey: 'staff_management', moduleKey: 'staff' },
      { path: '/app/admissions',   icon: Target,   labelKey: 'admissions',       moduleKey: 'admissions' },
      { path: '/app/transport',    icon: Bus,      labelKey: 'transport',        moduleKey: 'transport' },
      { path: '/app/front-office', icon: Shield,   labelKey: 'front_office',     moduleKey: 'front_office' },
      { path: '/app/inventory',    icon: Package,  labelKey: 'inventory',        moduleKey: 'inventory' },
      { path: '/app/multi-branch', icon: Building, labelKey: 'multi_branch',     moduleKey: 'multi_branch', directorOnly: true },
    ]
  },
  {
    label: 'Tools',
    items: [
      { path: '/app/ai-tools',        icon: Brain,    labelKey: 'ai_tools',          moduleKey: 'ai_tools' },
      { path: '/app/analytics',       icon: BarChart3, labelKey: 'analytics',        moduleKey: 'analytics' },
      { path: '/app/live-classes',    icon: Tv,       labelKey: 'live_classes',     moduleKey: 'live_classes' },
      { path: '/app/cctv',            icon: Video,    labelKey: 'cctv_integration',  moduleKey: 'cctv' },
      { path: '/app/login-credentials', icon: KeyRound, labelKey: 'login_credentials', directorOnly: true },
      { path: '/app/module-settings',   icon: Package,  labelKey: 'module_settings',   directorOnly: true },
      { path: '/app/settings',          icon: Settings, labelKey: 'settings',           directorOnly: true },
    ]
  },
];

/* Portal switcher links */
const PORTALS = [
  { label: 'SchoolTino', short: 'ST', href: '#',                  active: true,  bg: 'bg-indigo-600' },
  { label: 'TeachTino',  short: 'TT', href: '/teach',             active: false, bg: 'bg-emerald-500' },
  { label: 'StudyTino',  short: 'St', href: '/study',             active: false, bg: 'bg-orange-500' },
  { label: 'ParentTino', short: 'PT', href: '/parent',            active: false, bg: 'bg-purple-500' },
];

/* ============================================================
   SIDEBAR COMPONENT
   ============================================================ */
export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { getAccentColor, getAccentBg, isDarkMode, currentPreset } = useTheme();
  const navigate = useNavigate();

  const accent = getAccentColor();
  const accentBg = getAccentBg();
  const [moduleVisibility, setModuleVisibility] = useState({});
  const apiFetched = useRef(false);

  /* Load module visibility */
  const loadModuleVisibility = useCallback(async () => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) { setModuleVisibility(JSON.parse(saved)); return; }
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
    const onStorage = (e) => {
      if (e.key === 'module_visibility_settings') {
        try { const s = localStorage.getItem('module_visibility_settings'); if (s) setModuleVisibility(JSON.parse(s)); } catch (e) {}
      }
    };
    const onCustom = () => {
      try { const s = localStorage.getItem('module_visibility_settings'); if (s) setModuleVisibility(JSON.parse(s)); } catch (e) {}
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('module_visibility_changed', onCustom);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('module_visibility_changed', onCustom); };
  }, [loadModuleVisibility]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNavClick = () => { if (window.innerWidth < 1024 && onClose) onClose(); };

  const isDirector = user?.role === 'director' || user?.role === 'co_director';
  const modulePerms = user?.module_permissions || user?.permissions || {};

  const isItemVisible = (item) => {
    if (item.directorOnly && !isDirector) return false;
    if (item.moduleKey) {
      const vis = moduleVisibility[item.moduleKey];
      if (vis && vis.schooltino === false) return false;
      if (Object.keys(modulePerms).length > 0 && modulePerms[item.moduleKey] === false) return false;
    }
    return true;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto
          flex flex-col border-r
          transition-all duration-200 ease-in-out
          ${isCollapsed ? 'w-[64px]' : 'w-[240px]'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          height: '100dvh',
          backgroundColor: currentPreset.sidebarBg || '#ffffff',
          borderColor: currentPreset.sidebarBorder || '#f3f4f6',
        }}
      >
        {/* ---- TOGGLE BUTTON (desktop) ---- */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-[68px] w-6 h-6 rounded-full items-center justify-center text-white shadow-md border-2 border-white z-10"
          style={{ backgroundColor: accent }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* ---- CLOSE (mobile) ---- */}
        <button onClick={onClose} className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-gray-100 lg:hidden">
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* ---- BRAND HEADER ---- */}
        <div
          className={`flex items-center gap-3 px-4 border-b border-gray-100 flex-shrink-0 ${isCollapsed ? 'justify-center py-4' : 'py-3.5'}`}
          style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent }}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>SchoolTino</p>
              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: accent, opacity: 0.7 }}>Admin Portal</p>
            </div>
          )}
        </div>

        {/* ---- USER PROFILE ---- */}
        <NavLink
          to="/app/profile"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 border-b transition-colors flex-shrink-0 ${isCollapsed ? 'justify-center' : ''} ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'}`}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-indigo-100">
            {user?.photo_url ? (
              <img
                src={user.photo_url.startsWith('http') ? user.photo_url : `${API}${user.photo_url}`}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                <span className="text-white font-bold text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-xs truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user?.name || 'User'}</p>
              <p className="text-[10px] capitalize font-medium" style={{ color: accent }}>{user?.role?.replace(/_/g, ' ') || 'Admin'}</p>
            </div>
          )}
        </NavLink>

        {/* ---- NAVIGATION ---- */}
        <nav
          className="flex-1 overflow-y-auto py-2 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-1">
                {/* Group Label */}
                {!isCollapsed && (
                  <div className="px-4 pt-3 pb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {group.label}
                    </span>
                  </div>
                )}
                {isCollapsed && (
                  <div className={`mx-3 my-1 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`} />
                )}

                {/* Items */}
                <div className="px-2 space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      title={isCollapsed ? t(item.labelKey) : undefined}
                      className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3'} py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative ${
                          isActive
                            ? ''
                            : isDarkMode
                              ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`
                      }
                      style={({ isActive }) => isActive ? {
                        backgroundColor: accentBg,
                        color: accent,
                      } : {}}
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active left bar */}
                          {isActive && !isCollapsed && (
                            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full" style={{ backgroundColor: accent }} />
                          )}
                          <item.icon
                            className={`w-[17px] h-[17px] flex-shrink-0 transition-colors ${isDarkMode && !isActive ? 'text-gray-500 group-hover:text-gray-300' : !isActive ? 'text-gray-400 group-hover:text-gray-600' : ''}`}
                            style={isActive ? { color: accent } : {}}
                          />
                          {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ---- PORTAL SWITCHER ---- */}
        {!isCollapsed && (
          <div className={`px-3 py-2 border-t flex-shrink-0 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 px-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Switch Portal</p>
            <div className="grid grid-cols-4 gap-1">
              {PORTALS.map((p) => (
                <a
                  key={p.label}
                  href={p.href}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all ${
                    p.active
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  title={p.label}
                >
                  <div className={`w-5 h-5 ${p.bg} rounded flex items-center justify-center`}>
                    <span className="text-white text-[8px] font-bold">{p.short}</span>
                  </div>
                  <span className={`text-[8px] font-medium leading-tight text-center ${p.active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {p.label.replace('Tino', '')}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className={`px-2 py-2 border-t flex-shrink-0 space-y-1 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
            {PORTALS.filter(p => !p.active).map((p) => (
              <a
                key={p.label}
                href={p.href}
                title={p.label}
                className="flex justify-center py-1"
              >
                <div className={`w-7 h-7 ${p.bg} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-bold">{p.short}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* ---- LOGOUT ---- */}
        <div
          className={`px-2 py-2 border-t flex-shrink-0 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center w-10 h-9 mx-auto' : 'gap-3 px-3'} py-2 text-xs rounded-lg transition-colors ${isDarkMode ? 'text-gray-600 hover:bg-red-900/30 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>{t('sign_out')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
