import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Phone, Mail, Hash, GraduationCap, Brain, Send, X } from 'lucide-react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const breadcrumbMap = {
  '/app/dashboard': 'Dashboard',
  '/app/students': 'Students',
  '/app/staff': 'Staff Management',
  '/app/classes': 'Classes',
  '/app/attendance': 'Attendance',
  '/app/fees': 'Fee Management',
  '/app/admissions': 'Admissions',
  '/app/exams': 'Exams & Reports',
  '/app/timetable': 'Timetable',
  '/app/library': 'Digital Library',
  '/app/homework': 'Homework',
  '/app/live-classes': 'Live Classes',
  '/app/communication': 'Communication Hub',
  '/app/front-office': 'Front Office',
  '/app/transport': 'Transport',
  '/app/calendar': 'Calendar',
  '/app/analytics': 'Analytics',
  '/app/ai-tools': 'AI Tools',
  '/app/cctv': 'CCTV Integration',
  '/app/inventory': 'Inventory',
  '/app/multi-branch': 'Multi-Branch',
  '/app/settings': 'Settings',
  '/app/subscription': 'Subscription',
  '/app/profile': 'Profile',
  '/app/school-feed': 'School Feed',
  '/app/leave': 'Leave Management',
  '/app/setup-wizard': 'Setup Wizard',
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
  const navigate = useNavigate();
  const location = useLocation();

  const schoolLogo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || user?.school_name;
  const currentPage = breadcrumbMap[location.pathname] || 'Page';

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
      if (role === 'teacher') setFavicon('/icon-teachtino.png');
      else if (role === 'student') setFavicon('/icon-studytino.png');
      else setFavicon('/icon-schooltino.png');
    }
  }, [schoolLogo, user?.role]);

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
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/notifications/${notifId}/mark-read`, {}, {
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
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/tino-ai/chat`, {
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
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 transition-all duration-200">
        <Sidebar isOpen={true} onClose={() => {}} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={false} onToggleCollapse={() => {}} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="sticky top-0 z-30">
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 lg:px-6 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {schoolLogo ? (
                  <img src={schoolLogo} alt={schoolName} className="w-11 h-11 rounded-lg object-cover bg-white/10 p-0.5" />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-base lg:text-lg font-bold leading-tight tracking-tight">{schoolName || 'Schooltino'}</h1>
                  {schoolData?.address && (
                    <p className="text-[10px] lg:text-xs text-blue-200/70 leading-tight truncate max-w-[200px] lg:max-w-none">
                      {schoolData.address}{schoolData.city ? `, ${schoolData.city}` : ''}{schoolData.state ? `, ${schoolData.state}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-0.5 text-[11px] text-blue-200/70">
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

          <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Home</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-medium">{currentPage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                <Search className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">Search...</span>
              </button>
              <button
                onClick={() => setShowTinoChat(!showTinoChat)}
                className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                title="Tino AI"
              >
                <Brain className="w-4.5 h-4.5" />
              </button>
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
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
          </header>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {showTinoChat && (
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span className="font-semibold text-sm">Tino AI</span>
            </div>
            <button onClick={() => setShowTinoChat(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
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
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
