import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck,
  Wallet, Settings, LogOut, X, Bus,
  Clock, Brain, ChevronLeft, ChevronRight,
  BookOpen, Video, MessageSquare, Calendar,
  Shield, FileText, Building, Search, Package,
  Tv, Target, Clipboard, BarChart3
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleVisibility, setModuleVisibility] = useState({});

  const loadModuleVisibility = useCallback(() => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) setModuleVisibility(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadModuleVisibility();
    const handleStorage = (e) => {
      if (e.key === 'module_visibility_settings') loadModuleVisibility();
    };
    const handleCustomEvent = () => loadModuleVisibility();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('module_visibility_changed', handleCustomEvent);
    const interval = setInterval(loadModuleVisibility, 3000);
    return () => { window.removeEventListener('storage', handleStorage); window.removeEventListener('module_visibility_changed', handleCustomEvent); clearInterval(interval); };
  }, [loadModuleVisibility]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isDirector = user?.role === 'director';
  const permissions = user?.permissions || {};
  const hasPermission = (k) => isDirector || permissions[k] === true;

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
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', moduleKey: 'dashboard' },
    { path: '/app/students', icon: Users, label: 'Students', permKey: 'students', moduleKey: 'students' },
    { path: '/app/staff', icon: Users, label: 'Staff Management', permKey: 'staff', moduleKey: 'staff' },
    { path: '/app/classes', icon: GraduationCap, label: 'Classes', permKey: 'classes', moduleKey: 'classes' },
    { path: '/app/attendance', icon: CalendarCheck, label: 'Attendance', permKey: 'attendance', moduleKey: 'attendance' },
    { path: '/app/fees', icon: Wallet, label: 'Fee Management', permKey: 'fees', moduleKey: 'fee_management' },
    { path: '/app/admissions', icon: Target, label: 'Admissions', permKey: 'students', moduleKey: 'admissions' },
    { path: '/app/exams', icon: FileText, label: 'Exams & Reports', permKey: 'attendance', moduleKey: 'exams_reports' },
    { path: '/app/timetable', icon: Clock, label: 'Timetable', permKey: 'attendance', moduleKey: 'timetable' },
    { path: '/app/library', icon: BookOpen, label: 'Digital Library', moduleKey: 'digital_library' },
    { path: '/app/homework', icon: Clipboard, label: 'Homework', moduleKey: 'homework' },
    { path: '/app/live-classes', icon: Tv, label: 'Live Classes', moduleKey: 'live_classes' },
    { path: '/app/communication', icon: MessageSquare, label: 'Communication Hub', permKey: 'sms_center', moduleKey: 'communication_hub' },
    { path: '/app/front-office', icon: Shield, label: 'Front Office', permKey: 'attendance', moduleKey: 'front_office' },
    { path: '/app/transport', icon: Bus, label: 'Transport', permKey: 'attendance', moduleKey: 'transport' },
    { path: '/app/calendar', icon: Calendar, label: 'Calendar', moduleKey: 'calendar' },
    { path: '/app/analytics', icon: BarChart3, label: 'Analytics', permKey: 'school_analytics', moduleKey: 'analytics' },
    { path: '/app/ai-tools', icon: Brain, label: 'AI Tools', permKey: 'ai_content', moduleKey: 'ai_tools' },
    { path: '/app/cctv', icon: Video, label: 'CCTV Integration', permKey: 'cctv', moduleKey: 'cctv' },
    { path: '/app/inventory', icon: Package, label: 'Inventory', permKey: 'settings', moduleKey: 'inventory' },
    { path: '/app/multi-branch', icon: Building, label: 'Multi-Branch', directorOnly: true, moduleKey: 'multi_branch' },
    { path: '/app/settings', icon: Settings, label: 'Settings', directorOnly: true },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.directorOnly && !isDirector) return false;
    if (item.permKey && !hasPermission(item.permKey)) return false;
    if (!isModuleEnabled(item.moduleKey)) return false;
    if (searchQuery) return item.label.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  return (
    <aside className={`fixed lg:relative top-0 left-0 h-full ${isCollapsed ? 'w-[60px]' : 'w-[260px]'} z-50 lg:z-auto transform transition-all duration-200 shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-indigo-50 border-r border-blue-100`} style={{height: '100dvh'}}>
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 bg-blue-500 rounded-full items-center justify-center text-white shadow-md hover:bg-blue-600 z-10 border-2 border-white"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
      <button onClick={onClose} className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-blue-100 lg:hidden">
        <X className="w-4 h-4 text-blue-400" />
      </button>


      <NavLink to="/app/profile" onClick={handleNavClick} className="block px-4 py-3 mt-2 border-b border-blue-100 hover:bg-blue-50 transition-colors" style={{paddingTop: 'max(0.75rem, env(safe-area-inset-top))'}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{user?.name?.charAt(0) || 'U'}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-blue-400 capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</p>
            </div>
          )}
        </div>
      </NavLink>

      {!isCollapsed && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-300" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-slate-700 placeholder-blue-300 shadow-sm"
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
                  ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-200'
                  : 'text-slate-600 hover:bg-blue-100/60 hover:text-blue-700'
              }`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-blue-100" style={{paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))'}}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors`}
        >
          <LogOut className="w-3.5 h-3.5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
