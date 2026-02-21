import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Bell, Brain, Send, X,
  GraduationCap, ChevronRight, Home,
  User, Settings, LogOut
} from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { GlobalWatermark } from './SchoolLogoWatermark';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

/* ============================================================
   BREADCRUMB MAP
   ============================================================ */
const BREADCRUMB_MAP = {
  '/app/dashboard':    'Dashboard',
  '/app/students':     'Students',
  '/app/staff':        'Staff',
  '/app/classes':      'Classes',
  '/app/attendance':   'Attendance',
  '/app/fees':         'Fee Management',
  '/app/admissions':   'Admissions',
  '/app/exams':        'Exams & Reports',
  '/app/timetable':    'Timetable',
  '/app/library':      'Digital Library',
  '/app/live-classes': 'Live Classes',
  '/app/communication':'Communication',
  '/app/front-office': 'Front Office',
  '/app/transport':    'Transport',
  '/app/calendar':     'Calendar',
  '/app/analytics':    'Analytics',
  '/app/ai-tools':     'AI Tools',
  '/app/cctv':         'CCTV',
  '/app/inventory':    'Inventory',
  '/app/multi-branch': 'Multi-Branch',
  '/app/settings':     'Settings',
  '/app/subscription': 'Subscription',
  '/app/profile':      'Profile',
  '/app/school-feed':  'School Feed',
  '/app/leave':        'Leave Management',
  '/app/setup-wizard': 'Setup Wizard',
};

/* ============================================================
   LAYOUT
   ============================================================ */
export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* Notifications */
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* User dropdown */
  const [showUserMenu, setShowUserMenu] = useState(false);

  /* Tino AI chat */
  const [showTinoChat, setShowTinoChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const { user, schoolData, logout } = useAuth();
  const { isHindi, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const { getHeaderBg, getHeaderText, getAccentColor, isDarkMode, currentPreset } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const headerBg = getHeaderBg();
  const headerText = getHeaderText();
  const accent = getAccentColor();
  const isWhiteHeader = headerBg === '#ffffff' || headerBg === 'white';

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || user?.school_name || 'SchoolTino';
  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Page';

  /* Tino AI enabled check */
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

  /* Set document title */
  useEffect(() => {
    if (schoolName) document.title = schoolName;
  }, [schoolName]);

  /* Set favicon */
  useEffect(() => {
    const setFavicon = (href) => {
      try {
        document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
        const link = document.createElement('link');
        link.rel = 'icon'; link.type = 'image/png'; link.href = href;
        document.head.appendChild(link);
      } catch (e) {}
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

  /* Fetch notifications */
  useEffect(() => {
    const fetch = async () => {
      if (!user?.id || !user?.school_id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${BACKEND}/api/notifications?user_id=${user.id}&school_id=${user.school_id}&user_type=${user.role || 'admin'}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const notifs = res.data?.notifications || [];
        setNotifications(notifs);
        let unread = notifs.filter(n => !n.read && !n.is_read).length;
        if (['director', 'principal', 'admin'].includes(user?.role)) {
          try {
            const pr = await axios.get(`${BACKEND}/api/admin/pending-count`, { headers: { Authorization: `Bearer ${token}` } });
            unread += (pr.data?.pending_requests || 0);
          } catch (e) {}
        }
        setUnreadCount(unread);
      } catch (e) {}
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [user?.id, user?.school_id, user?.role]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (showNotifications && !e.target.closest('.notif-dropdown')) setShowNotifications(false);
      if (showUserMenu && !e.target.closest('.user-dropdown')) setShowUserMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showNotifications, showUserMenu]);

  /* Auto-scroll chat */
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND}/api/notifications/${id}/mark-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${BACKEND}/api/tino-ai/chat`,
        { message: msg, school_id: user?.school_id, user_id: user?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.data?.response || 'No response' }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process your request right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50" style={{ height: '100dvh' }}>
      <GlobalWatermark />

      {/* ---- SIDEBAR ---- */}
      <div className="hidden lg:block flex-shrink-0 h-full z-40">
        <Sidebar
          isOpen={true}
          onClose={() => {}}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      <div className="lg:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      </div>

      {/* ---- MAIN CONTENT ---- */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* ============ TOP HEADER ============ */}
        <header
          className="flex-shrink-0 shadow-sm z-30 border-b"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            backgroundColor: headerBg,
            borderColor: isWhiteHeader ? (isDarkMode ? currentPreset.sidebarBorder : '#f3f4f6') : 'transparent',
          }}
        >
          <div className="flex items-center justify-between h-14 px-4 lg:px-5">

            {/* LEFT: menu + school info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ color: isWhiteHeader ? '#6b7280' : `${headerText}99` }}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* School Logo */}
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  style={{ boxShadow: isWhiteHeader ? '0 0 0 1px #e5e7eb' : '0 0 0 1px rgba(255,255,255,0.2)' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isWhiteHeader ? `${accent}15` : 'rgba(255,255,255,0.15)' }}
                >
                  <GraduationCap className="w-4 h-4" style={{ color: isWhiteHeader ? accent : headerText }} />
                </div>
              )}

              {/* School Name + Current Page */}
              <div className="min-w-0 hidden sm:block">
                <h1
                  className="text-sm font-bold truncate leading-tight"
                  style={{ color: isWhiteHeader ? (isDarkMode ? '#f1f5f9' : '#111827') : headerText }}
                >{schoolName}</h1>
                {/* Breadcrumb inline on desktop */}
                <div className="hidden lg:flex items-center gap-1 mt-0.5">
                  <Home className="w-3 h-3" style={{ color: isWhiteHeader ? '#d1d5db' : `${headerText}60` }} />
                  <ChevronRight className="w-3 h-3" style={{ color: isWhiteHeader ? '#d1d5db' : `${headerText}60` }} />
                  <span className="text-xs font-medium" style={{ color: isWhiteHeader ? '#6b7280' : `${headerText}aa` }}>{currentPage}</span>
                </div>
              </div>

              {/* Current page title on mobile */}
              <span className="sm:hidden text-sm font-semibold truncate" style={{ color: isWhiteHeader ? (isDarkMode ? '#f1f5f9' : '#374151') : headerText }}>{currentPage}</span>
            </div>

            {/* RIGHT: actions */}
            <div className="flex items-center gap-1 flex-shrink-0">

              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors"
                style={{
                  color: isWhiteHeader ? (isDarkMode ? '#9ca3af' : '#6b7280') : `${headerText}cc`,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = isWhiteHeader ? '#f3f4f6' : 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
              >
                {isHindi ? 'EN' : 'हि'}
              </button>

              {/* Tino AI */}
              {isTinoChatEnabled() && (
                <button
                  onClick={() => setShowTinoChat(!showTinoChat)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    color: showTinoChat ? accent : (isWhiteHeader ? (isDarkMode ? '#9ca3af' : '#6b7280') : `${headerText}cc`),
                    backgroundColor: showTinoChat ? (isWhiteHeader ? `${accent}15` : 'rgba(255,255,255,0.15)') : 'transparent',
                  }}
                  title="Tino AI Assistant"
                >
                  <Brain className="w-[18px] h-[18px]" />
                </button>
              )}

              {/* Notifications */}
              <div className="relative notif-dropdown">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: isWhiteHeader ? (isDarkMode ? '#9ca3af' : '#6b7280') : `${headerText}cc` }}
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs font-semibold rounded-full">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-72">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read && !n.is_read ? 'bg-indigo-50/50' : ''}`}
                          >
                            {!n.read && !n.is_read && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 align-middle" />
                            )}
                            <p className="text-sm font-medium text-gray-900 truncate inline">{n.title || 'Notification'}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar + dropdown */}
              <div className="relative user-dropdown ml-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                  className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-indigo-300 transition-all flex-shrink-0"
                >
                  {user?.photo_url ? (
                    <img
                      src={user.photo_url.startsWith('http') ? user.photo_url : `${BACKEND}${user.photo_url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-600">
                      <span className="text-white font-bold text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ') || 'Admin'}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { navigate('/app/profile'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />My Profile
                      </button>
                      <button
                        onClick={() => { navigate('/app/settings'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />Settings
                      </button>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile breadcrumb bar */}
          {!isWhiteHeader && (
            <div className="lg:hidden px-4 pb-2.5 -mt-1">
              {/* spacer - breadcrumb shows in school name area for colored headers */}
            </div>
          )}
          {isWhiteHeader && (
            <div className="lg:hidden flex items-center gap-1.5 px-4 pb-2 -mt-1">
              <Home className="w-3 h-3 text-gray-300" />
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-xs text-gray-500 font-medium">{currentPage}</span>
            </div>
          )}
        </header>

        {/* ============ PAGE CONTENT ============ */}
        <main
          className={`flex-1 overflow-y-auto overscroll-contain ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="p-4 md:p-6 lg:p-8"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* ============ TINO AI CHAT PANEL ============ */}
      {showTinoChat && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full sm:w-96 h-full sm:h-[500px] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[60] overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white leading-tight">Tino AI</p>
                <p className="text-[10px] text-white/70">Powered by Groq + Gemini</p>
              </div>
            </div>
            <button onClick={() => setShowTinoChat(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Hi, I'm Tino AI!</p>
                  <p className="text-xs text-gray-400 mt-1">Ask me anything about your school.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full mt-2">
                  {['Show today\'s attendance', 'Pending fees this month', 'How many students enrolled?'].map(q => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-xs bg-white border border-gray-200 text-gray-600 rounded-lg px-3 py-2 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                placeholder="Ask Tino AI..."
                className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-gray-50 transition-all"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
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
