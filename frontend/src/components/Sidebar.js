import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck,
  Wallet, Bell, Sparkles, Settings, LogOut, X, Bus,
  Heart, Fingerprint, Clock, Brain, ChevronDown, ChevronRight,
  BookOpen, Video, Image, MessageSquare, Calendar,
  Shield, Calculator, Award, FileText, Building,
  Music, Globe, Wrench, Search
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, schoolData } = useAuth();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState(['main']);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => { logout(); navigate('/login'); };
  const isDirector = user?.role === 'director';
  const permissions = user?.permissions || {};
  const hasPermission = (k) => isDirector || permissions[k] === true;

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const navGroups = [
    {
      id: 'main', label: 'Main',
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/app/school-analytics', icon: LayoutDashboard, label: 'Analytics', permKey: 'school_analytics' },
      ]
    },
    {
      id: 'academic', label: 'Academic',
      items: [
        { path: '/app/students', icon: Users, label: 'Students', permKey: 'students' },
        { path: '/app/classes', icon: GraduationCap, label: 'Classes', permKey: 'classes' },
        { path: '/app/attendance', icon: CalendarCheck, label: 'Attendance', permKey: 'attendance' },
        { path: '/app/timetable-management', icon: Clock, label: 'Timetable', permKey: 'attendance' },
        { path: '/app/exam-report', icon: FileText, label: 'Exams & Reports', permKey: 'attendance' },
        { path: '/app/certificates', icon: Award, label: 'Certificates', permKey: 'students' },
        { path: '/app/admit-cards', icon: FileText, label: 'Admit Cards', permKey: 'attendance' },
      ]
    },
    {
      id: 'team', label: 'Team',
      items: [
        { path: '/app/employee-management', icon: Users, label: 'Staff', permKey: 'staff' },
        { path: '/app/leave', icon: Calendar, label: 'Leave', permKey: 'leave_management' },
        { path: '/app/salary', icon: Wallet, label: 'Salary', permKey: 'fees' },
        { path: '/app/permission-manager', icon: Shield, label: 'Permissions', permKey: 'user_management', directorOnly: true },
      ]
    },
    {
      id: 'finance', label: 'Finance',
      items: [
        { path: '/app/fee-management', icon: Wallet, label: 'Fee Management', permKey: 'fees' },
        { path: '/app/accountant', icon: Calculator, label: 'Accountant', permKey: 'fees' },
      ]
    },
    {
      id: 'communicate', label: 'Communication',
      items: [
        { path: '/app/notices', icon: Bell, label: 'Notices', permKey: 'notices' },
        { path: '/app/sms', icon: MessageSquare, label: 'SMS', permKey: 'sms_center' },
        { path: '/app/gallery', icon: Image, label: 'Gallery', permKey: 'gallery' },
        { path: '/app/complaints', icon: MessageSquare, label: 'Complaints', permKey: 'settings' },
      ]
    },
    {
      id: 'tools', label: 'Tools',
      items: [
        { path: '/app/tino-ai', icon: Brain, label: 'Tino AI', permKey: 'dashboard' },
        { path: '/app/ai-paper', icon: Sparkles, label: 'AI Paper', permKey: 'ai_paper' },
        { path: '/app/event-designer', icon: Image, label: 'Event Designer', permKey: 'ai_content' },
        { path: '/app/school-calendar', icon: Calendar, label: 'Calendar', permKey: 'settings' },
      ]
    },
    {
      id: 'infra', label: 'Infrastructure',
      items: [
        { path: '/app/transport', icon: Bus, label: 'Transport', permKey: 'attendance' },
        { path: '/app/health', icon: Heart, label: 'Health', permKey: 'attendance' },
        { path: '/app/biometric', icon: Fingerprint, label: 'Biometric', permKey: 'attendance' },
        { path: '/app/cctv', icon: Video, label: 'CCTV', permKey: 'cctv' },
      ]
    },
    {
      id: 'setup', label: 'Settings',
      items: [
        { path: '/app/school-management', icon: Building, label: 'School Profile', permKey: 'settings', directorOnly: true },
        { path: '/app/setup-wizard', icon: Wrench, label: 'Setup Wizard', permKey: 'settings', directorOnly: true },
        { path: '/app/logo-settings', icon: Image, label: 'Logo & Branding', permKey: 'settings', directorOnly: true },
        { path: '/app/prayer-system', icon: Music, label: 'Prayer System', permKey: 'settings' },
        { path: '/app/website', icon: Globe, label: 'Website', permKey: 'website_integration' },
      ]
    },
  ];

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.directorOnly && !isDirector) return false;
      if (item.permKey && !hasPermission(item.permKey)) return false;
      if (searchQuery) return item.label.toLowerCase().includes(searchQuery.toLowerCase());
      return true;
    })
  })).filter(group => group.items.length > 0);

  return (
    <aside className={`fixed lg:relative top-0 left-0 h-screen w-[240px] z-50 lg:z-auto transform transition-transform duration-200 shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col bg-white border-r border-gray-200`}>
      <button onClick={onClose} className="absolute top-4 right-3 p-1.5 rounded-md hover:bg-gray-100 lg:hidden">
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="p-4 border-b border-gray-200">
        <h1 className="font-semibold text-gray-900 text-sm truncate">{schoolData?.name || 'School'}</h1>
        <p className="text-xs text-gray-400 capitalize">{user?.role || 'Admin'}</p>
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-300 text-gray-700" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {filteredGroups.map((group) => (
          <div key={group.id} className="mb-0.5">
            <button onClick={() => toggleGroup(group.id)} className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-500">
              <span>{group.label}</span>
              {expandedGroups.includes(group.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedGroups.includes(group.id) && (
              <div className="space-y-px">
                {group.items.map((item) => (
                  <NavLink key={item.path} to={item.path} onClick={handleNavClick}
                    className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
                    <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <NavLink to="/app/profile" onClick={handleNavClick} className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-md hover:bg-gray-50 transition-colors">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 font-medium text-xs">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-2 py-2 text-xs text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
