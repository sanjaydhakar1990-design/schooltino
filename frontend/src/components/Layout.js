import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Phone, Mail, Hash, GraduationCap, Brain, Send, X } from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { GlobalWatermark } from './SchoolLogoWatermark';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const breadcrumbKeyMap = {
  '/app/dashboard': 'dashboard',
  '/app/students': 'students',
  '/app/staff': 'staff_management',
  '/app/classes': 'classes',
  '/app/attendance': 'attendance',
  '/app/fees': 'fee_management',
  '/app/admissions': 'admissions',
  '/app/exams': 'exams_reports',
  '/app/timetable': 'timetable',
  '/app/library': 'digital_library',
  '/app/live-classes': 'live_classes',
  '/app/communication': 'communication_hub',
  '/app/front-office': 'front_office',
  '/app/transport': 'transport',
  '/app/calendar': 'calendar',
  '/app/analytics': 'analytics',
  '/app/ai-tools': 'ai_tools',
  '/app/cctv': 'cctv_integration',
  '/app/inventory': 'inventory',
  '/app/multi-branch': 'multi_branch',
  '/app/settings': 'settings',
  '/app/subscription': 'subscription',
  '/app/profile': 'profile',
  '/app/school-feed': 'school_feed',
  '/app/leave': 'leave_management',
  '/app/setup-wizard': 'setup_wizard',
};

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTinoChat, setShowTinoChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const { user, schoolData } = useAuth();
  const { isHindi, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const { isDarkMode, getHeaderBg, getHeaderText, headerLogoSize, darkTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || user?.school_name;
  const breadcrumbKey = breadcrumbKeyMap[location.pathname];
  const currentPage = breadcrumbKey ? t(breadcrumbKey) : 'Page';

  const isTinoChatEnabled = () => {
    try {
      const saved = localStorage.getItem('module_visibility_settings');
      if (saved) {
        const vis = JSON.parse(saved);
        if (vis.tino_ai_chat?.schooltino === false) return false;
      }
    } catch (e) {}
    return true;
  };

  useEffect(() => {
    if (schoolName) document.title = schoolName;
  }, [schoolName]);

  useEffect(() => {
    const setFavicon = (href) => {
      try {
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(icon => icon.remove());
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        faviconLink.href = href;
        document.head.appendChild(faviconLink);
      } catch (error) {}
    };

    if (schoolLogo && (schoolLogo.startsWith('data:') || schoolLogo.startsWith('http') || schoolLogo.startsWith('/'))) {
      setFavicon(schoolLogo);
    } else {
      const role = user?.role;
      if (role === 'teacher') setFavicon('/icon-teachtino-192.png');
      else if (role === 'student') setFavicon('/icon-studytino-192.png');
      else setFavicon('/icon-schooltino-192.png');
    }
  }, [schoolLogo, user?.role]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || !user?.school_id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${(process.env.REACT_APP_BACKEND_URL || '') || ''}/api/notifications?user_id=${user.id}&school_id=${user.school_id}&user_type=${user.role || 'admin'}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notifs = res.data?.notifications || [];
        setNotifications(notifs);
        let totalUnread = notifs.filter(n => !n.read && !n.is_read).length;
        if (user?.role === 'director' || user?.role === 'principal' || user?.role === 'admin') {
          try {
            const pendingRes = await axios.get(`${(process.env.REACT_APP_BACKEND_URL || '') || ''}/api/admin/pending-count`, { headers: { Authorization: `Bearer ${token}` } });
            totalUnread += (pendingRes.data?.pending_requests || 0);
          } catch (e) {}
        }
        setUnreadCount(totalUnread);
      } catch (err) {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id, user?.school_id, user?.role]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notification-dropdown')) setShowNotifications(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const markAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${(process.env.REACT_APP_BACKEND_URL || '') || ''}/api/notifications/${notifId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${(process.env.REACT_APP_BACKEND_URL || '') || ''}/api/tino-ai/chat`, {
        message: userMsg, school_id: user?.school_id, user_id: user?.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.data?.response || 'No response' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process your request right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`} style={{height: '100dvh'}}>
      <GlobalWatermark />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="hidden lg:block flex-shrink-0 h-full z-40">
        <Sidebar isOpen={true} onClose={() => {}} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={false} onToggleCollapse={() => {}} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="flex-shrink-0 z-30">
          <div className="text-white px-4 lg:px-6 py-2.5" style={{paddingTop: 'max(0.625rem, env(safe-area-inset-top))', backgroundColor: getHeaderBg(), color: getHeaderText()}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-white/80 hover:bg-white/10 rounded-lg flex-shrink-0">
                  <Menu className="w-5 h-5" />
                </button>
                {schoolLogo ? (
                  <img src={schoolLogo} alt={schoolName} className="rounded-lg object-cover bg-white/10 p-0.5 flex-shrink-0" style={{ width: `${headerLogoSize}px`, height: `${headerLogoSize}px`, opacity: (schoolData?.logo_opacity || 100) / 100 }} />
                ) : (
                  <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-sm lg:text-lg font-bold leading-tight tracking-tight truncate">{schoolName || 'Schooltino'}</h1>
                  {schoolData?.address && (
                    <p className="text-[10px] lg:text-xs opacity-70 leading-tight truncate">
                      {schoolData.city || ''}{schoolData.state ? `, ${schoolData.state}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1 text-xs font-bold rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
                  title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
                >
                  {isHindi ? 'EN' : 'हि'}
                </button>
                {isTinoChatEnabled() && (
                  <button
                    onClick={() => setShowTinoChat(!showTinoChat)}
                    className="p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
                    title="Tino AI"
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                )}
                <div className="relative notification-dropdown">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 top-auto sm:top-full mt-2 sm:w-80 max-h-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                        <span className="text-xs text-gray-500">{unreadCount} unread</span>
                      </div>
                      <div className="overflow-y-auto max-h-72">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                        ) : (
                          notifications.slice(0, 15).map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read && !notif.is_read ? 'bg-blue-50' : ''}`}
                            >
                              <p className="text-sm font-medium text-gray-900 truncate">{notif.title || 'Notification'}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-0.5 text-[11px] text-blue-200/70 ml-4">
                {schoolData?.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{schoolData.phone}</span>
                )}
                {schoolData?.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{schoolData.email}</span>
                )}
                {schoolData?.registration_number && (
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Reg: {schoolData.registration_number}</span>
                )}
              </div>
            </div>
          </div>

          <header className={`h-10 lg:h-12 flex items-center justify-between px-4 lg:px-6 shadow-sm ${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white border-b border-gray-200'}`}>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('home')}</span>
              <span className={`text-xs ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}>/</span>
              <span className={`font-medium text-xs lg:text-sm truncate ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{currentPage}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors border ${isDarkMode ? 'text-slate-400 bg-slate-700 hover:bg-slate-600 border-slate-600' : 'text-gray-400 bg-gray-50 hover:bg-gray-100 border-gray-200'}`}>
                <Search className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">{t('search_placeholder')}</span>
              </button>
            </div>
          </header>
        </div>

        <main className={`flex-1 overflow-y-auto overscroll-contain ${isDarkMode ? 'bg-slate-900' : ''}`} style={{WebkitOverflowScrolling: 'touch'}}>
          <div className="p-3 md:p-6 lg:p-8 pb-6" style={{paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'}}>
            <Outlet />
          </div>
        </main>
      </div>

      {showTinoChat && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full sm:w-96 h-full sm:h-[480px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white" style={{paddingTop: 'max(0.75rem, env(safe-area-inset-top))'}}>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span className="font-semibold text-sm">Tino AI</span>
            </div>
            <button onClick={() => setShowTinoChat(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <Brain className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>Hi! I'm Tino AI. How can I help?</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm animate-pulse">Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-gray-200 safe-bottom">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
