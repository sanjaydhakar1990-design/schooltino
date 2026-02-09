import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck,
  Wallet, Bell, Sparkles, Settings, LogOut, X, Bus,
  Heart, Fingerprint, Clock, Brain, ChevronDown, ChevronRight, ChevronLeft,
  BookOpen, Video, Image, MessageSquare, Calendar,
  Shield, Calculator, Award, FileText, Building,
  Music, Globe, Wrench, Search, ShoppingBag, Rss,
  CreditCard, Target, BookMarked, Package, Home, Tv,
  Layers, Megaphone, Smartphone, Link2, UserPlus
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
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
        { path: '/app/school-feed', icon: Rss, label: 'School Feed', permKey: 'dashboard' },
      ]
    },
    {
      id: 'admission', label: 'Admission & CRM',
      items: [
        { path: '/app/students', icon: Users, label: 'Students', permKey: 'students' },
        { path: '/app/admission-crm', icon: Target, label: 'Admission CRM', permKey: 'students' },
        { path: '/app/marketing', icon: Megaphone, label: 'Marketing', permKey: 'students' },
      ]
    },
    {
      id: 'academic', label: 'Academic',
      items: [
        { path: '/app/classes', icon: GraduationCap, label: 'Classes', permKey: 'classes' },
        { path: '/app/attendance', icon: CalendarCheck, label: 'Attendance', permKey: 'attendance' },
        { path: '/app/timetable-management', icon: Clock, label: 'Timetable', permKey: 'attendance' },
        { path: '/app/exam-report', icon: FileText, label: 'Exams & Reports', permKey: 'attendance' },
        { path: '/app/homework', icon: BookMarked, label: 'Homework', permKey: 'attendance' },
        { path: '/app/certificates', icon: Award, label: 'Certificates', permKey: 'students' },
        { path: '/app/admit-cards', icon: FileText, label: 'Admit Cards', permKey: 'attendance' },
      ]
    },
    {
      id: 'learning', label: 'Learning & Content',
      items: [
        { path: '/app/digital-library', icon: BookOpen, label: 'Digital Library', permKey: 'dashboard' },
        { path: '/app/live-classes', icon: Tv, label: 'Live Classes', permKey: 'dashboard' },
        { path: '/app/course-management', icon: Layers, label: 'Courses', permKey: 'dashboard' },
      ]
    },
    {
      id: 'team', label: 'HR & Staff',
      items: [
        { path: '/app/employee-management', icon: Users, label: 'Staff & Permissions', permKey: 'staff' },
        { path: '/app/leave', icon: Calendar, label: 'Leave', permKey: 'leave_management' },
        { path: '/app/salary', icon: Wallet, label: 'Salary', permKey: 'fees' },
        { path: '/app/ai-staff-attendance', icon: Fingerprint, label: 'AI Staff Attendance', permKey: 'attendance' },
      ]
    },
    {
      id: 'finance', label: 'Finance',
      items: [
        { path: '/app/fee-management', icon: Wallet, label: 'Fee Management', permKey: 'fees' },
        { path: '/app/accountant', icon: Calculator, label: 'Accountant', permKey: 'fees' },
        { path: '/app/credit-system', icon: CreditCard, label: 'Credit System', permKey: 'fees' },
        { path: '/app/student-wallet', icon: Wallet, label: 'Student Wallet', permKey: 'fees' },
        { path: '/app/e-store', icon: ShoppingBag, label: 'e-Store', permKey: 'fees' },
        { path: '/app/tally-integration', icon: Globe, label: 'Tally Integration', permKey: 'fees', directorOnly: true },
      ]
    },
    {
      id: 'communicate', label: 'Communication',
      items: [
        { path: '/app/notices', icon: Bell, label: 'Notices', permKey: 'notices' },
        { path: '/app/sms', icon: MessageSquare, label: 'SMS & WhatsApp', permKey: 'sms_center' },
        { path: '/app/integrated-comm', icon: MessageSquare, label: 'Integrated Comms', permKey: 'sms_center' },
        { path: '/app/gallery', icon: Image, label: 'Gallery', permKey: 'gallery' },
        { path: '/app/complaints', icon: MessageSquare, label: 'Complaints', permKey: 'settings' },
      ]
    },
    {
      id: 'tools', label: 'AI & Tools',
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
        { path: '/app/visitor-pass', icon: Shield, label: 'Visit Management', permKey: 'attendance' },
        { path: '/app/inventory', icon: Package, label: 'Inventory', permKey: 'settings' },
        { path: '/app/hostel', icon: Home, label: 'Hostel', permKey: 'settings' },
        { path: '/app/health', icon: Heart, label: 'Health', permKey: 'attendance' },
        { path: '/app/biometric', icon: Fingerprint, label: 'Biometric', permKey: 'attendance' },
        { path: '/app/multi-branch', icon: Building, label: 'Multi-Branch', permKey: 'settings', directorOnly: true },
        { path: '/app/cctv', icon: Video, label: 'CCTV', permKey: 'cctv' },
      ]
    },
    {
      id: 'showcase', label: 'Platform',
      items: [
        { path: '/app/mobile-app', icon: Smartphone, label: 'Mobile App', permKey: 'dashboard' },
        { path: '/app/integrations', icon: Link2, label: 'Integrations', permKey: 'dashboard' },
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
    <aside className={`fixed lg:relative top-0 left-0 h-screen ${isCollapsed ? 'w-[60px]' : 'w-[260px]'} z-50 lg:z-auto transform transition-all duration-200 shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col gradient-sidebar`}>
      <button 
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-blue-600 rounded-full items-center justify-center text-white shadow-lg hover:bg-blue-500 z-10 border-2 border-white/20"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
      <button onClick={onClose} className="absolute top-4 right-3 p-1.5 rounded-lg hover:bg-white/10 lg:hidden">
        <X className="w-4 h-4 text-white/70" />
      </button>

      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-card-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'U'}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-blue-300/70 capitalize">{user?.role || 'Admin'}</p>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input type="text" placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-white placeholder-white/40" />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {filteredGroups.map((group) => (
          <div key={group.id} className="mb-1">
            {!isCollapsed && (
              <button onClick={() => toggleGroup(group.id)} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white/60">
                <span>{group.label}</span>
                {expandedGroups.includes(group.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
            {(isCollapsed || expandedGroups.includes(group.id)) && (
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.path} to={item.path} onClick={handleNavClick}
                    className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-[13px] transition-all ${isActive ? 'bg-white/15 text-white font-semibold shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                    title={isCollapsed ? item.label : undefined}>
                    <item.icon className={`w-4 h-4 flex-shrink-0`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <NavLink to="/app/profile" onClick={handleNavClick} className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-xs text-white/50`}>
          <Settings className="w-3.5 h-3.5" />
          {!isCollapsed && <span>Edit Profile</span>}
        </NavLink>
        <button onClick={handleLogout} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-xs text-white/50 hover:bg-white/5 rounded-xl transition-colors`}>
          <LogOut className="w-3.5 h-3.5" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
