import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, MapPin, Phone, Mail, Hash, GraduationCap } from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { GlobalWatermark } from './SchoolLogoWatermark';

const breadcrumbMap = {
  '/app/dashboard': 'Dashboard',
  '/app/students': 'Students',
  '/app/classes': 'Classes',
  '/app/attendance': 'Attendance',
  '/app/fee-management': 'Fee Management',
  '/app/fees': 'Fees',
  '/app/employee-management': 'Staff',
  '/app/leave': 'Leave',
  '/app/salary': 'Salary',
  '/app/notices': 'Notices',
  '/app/sms': 'SMS',
  '/app/meetings': 'Meetings',
  '/app/gallery': 'Gallery',
  '/app/tino-ai': 'Tino AI',
  '/app/tino-brain': 'Tino Brain',
  '/app/ai-paper': 'AI Paper',
  '/app/transport': 'Transport',
  '/app/health': 'Health',
  '/app/biometric': 'Biometric',
  '/app/cctv': 'CCTV',
  '/app/school-management': 'School Profile',
  '/app/school-analytics': 'Analytics',
  '/app/setup-wizard': 'Setup',
  '/app/logo-settings': 'Logo',
  '/app/timetable-management': 'Timetable',
  '/app/exam-report': 'Exams',
  '/app/certificates': 'Certificates',
  '/app/admit-cards': 'Admit Cards',
  '/app/accountant': 'Accountant',
  '/app/permission-manager': 'Permissions',
  '/app/event-designer': 'Event Designer',
  '/app/school-calendar': 'Calendar',
  '/app/family-portal': 'Family Portal',
  '/app/complaints': 'Complaints',
  '/app/board-notifications': 'Board Updates',
  '/app/prayer-system': 'Prayer System',
  '/app/website': 'Website',
  '/app/visitor-pass': 'Visitor Pass',
  '/app/school-feed': 'School Feed',
  '/app/student-wallet': 'Student Wallet',
  '/app/e-store': 'e-Store',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
};

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, schoolData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || user?.school_name;
  const currentPage = breadcrumbMap[location.pathname] || 'Page';

  useEffect(() => {
    if (schoolName) {
      document.title = schoolName;
    }
  }, [schoolName]);

  useEffect(() => {
    if (schoolLogo && (schoolLogo.startsWith('data:') || schoolLogo.startsWith('http') || schoolLogo.startsWith('/'))) {
      try {
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(icon => icon.remove());
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        faviconLink.href = schoolLogo;
        document.head.appendChild(faviconLink);
      } catch (error) {
        console.error('Failed to update icon:', error);
      }
    }
  }, [schoolLogo]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || !user?.school_id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL || ''}/api/notifications?user_id=${user.id}&school_id=${user.school_id}&user_type=${user.role || 'admin'}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notifs = res.data?.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read && !n.is_read).length);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id, user?.school_id, user?.role]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.relative')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  const markAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/notifications/${notifId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 transition-all duration-200`}>
        <Sidebar isOpen={true} onClose={() => {}} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={false} onToggleCollapse={() => {}} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="sticky top-0 z-30">
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 lg:px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {schoolLogo ? (
                  <img src={schoolLogo} alt={schoolName} className="w-10 h-10 rounded-lg object-cover bg-white/10 p-0.5" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-sm lg:text-base font-bold leading-tight">{schoolName || 'Schooltino'}</h1>
                  {schoolData?.address && (
                    <p className="text-[10px] lg:text-xs text-blue-200 leading-tight truncate max-w-[200px] lg:max-w-none">
                      {schoolData.address}{schoolData.city ? `, ${schoolData.city}` : ''}{schoolData.state ? `, ${schoolData.state}` : ''}{schoolData.pincode ? ` - ${schoolData.pincode}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs text-blue-200">
                {schoolData?.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{schoolData.phone}</span>
                )}
                {schoolData?.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{schoolData.email}</span>
                )}
                {schoolData?.registration_number && (
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Reg: {schoolData.registration_number}</span>
                )}
                {schoolData?.board_type && (
                  <span className="bg-white/10 px-2 py-0.5 rounded text-white text-[10px] font-semibold">{schoolData.board_type}</span>
                )}
              </div>
            </div>
          </div>

          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Home</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-semibold">{currentPage}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Search...</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      <span className="text-xs text-gray-500">{unreadCount} unread</span>
                    </div>
                    <div className="overflow-y-auto max-h-72">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.slice(0, 20).map(notif => (
                          <div 
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read && !notif.is_read ? 'bg-blue-50' : ''}`}
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">{notif.title || 'Notification'}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/app/profile')} className="w-9 h-9 gradient-card-blue rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold">{user?.name?.charAt(0) || 'U'}</span>
              </button>
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto relative">
          <GlobalWatermark />
          <div className="p-4 md:p-6 lg:p-8 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
