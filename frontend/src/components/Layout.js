import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search, MapPin, Phone, Mail, Hash, GraduationCap, Brain, CreditCard, Send, X, AlertCircle } from 'lucide-react';
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
  '/app/integrated-comm': 'Communication Hub',
  '/app/meetings': 'Meetings',
  '/app/gallery': 'Gallery',
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
  '/app/admission-crm': 'Admission CRM',
  '/app/marketing': 'Marketing',
  '/app/digital-library': 'Digital Library',
  '/app/live-classes': 'Live Classes',
  '/app/course-management': 'Courses',
  '/app/homework': 'Homework',
  '/app/ai-staff-attendance': 'AI Staff Attendance',
  '/app/credit-system': 'Credit System',
  '/app/tally-integration': 'Tally Integration',
  '/app/inventory': 'Inventory',
  '/app/hostel': 'Hostel',
  '/app/multi-branch': 'Multi-Branch',
  '/app/integrations': 'Integrations',
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
  const [creditBalance, setCreditBalance] = useState(null);
  const [showCreditDropdown, setShowCreditDropdown] = useState(false);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const chatEndRef = useRef(null);
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

  const isAdminRole = ['director', 'principal', 'vice_principal', 'admin'].includes(user?.role);

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

      if (isAdminRole) {
        try {
          const token = localStorage.getItem('token');
          const complaintsRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL || ''}/api/complaints/school/${user.school_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const complaintsStats = complaintsRes.data?.stats || {};
          setPendingComplaintsCount(complaintsStats.pending || 0);
        } catch (err) {
          setPendingComplaintsCount(0);
        }
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.id, user?.school_id, user?.role, isAdminRole]);

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!user?.school_id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL || ''}/api/credits/balance`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { school_id: user.school_id }
        });
        setCreditBalance(res.data?.balance ?? res.data?.credits ?? 0);
      } catch (err) {
        console.error('Failed to fetch credit balance:', err);
        setCreditBalance(0);
      }
    };
    fetchCreditBalance();
  }, [user?.school_id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
      if (showCreditDropdown && !e.target.closest('.credit-dropdown')) {
        setShowCreditDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showCreditDropdown]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL || ''}/api/tino-ai/chat`, {
        message: userMsg,
        school_id: user?.school_id,
        user_id: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const aiText = res.data?.response || 'No response';
      const creditsUsed = res.data?.data?.credits_used;
      const creditInfo = creditsUsed ? `\n\n💳 ${creditsUsed} credits used` : '';
      setChatMessages(prev => [...prev, { role: 'assistant', text: aiText + creditInfo }]);
      if (creditsUsed && user?.school_id && user?.id) {
        try {
          const balRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL || ''}/api/dual-credits/balance/${user.school_id}/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCreditBalance(balRes.data?.total_available ?? creditBalance);
        } catch (_) {}
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process your request right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
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
                  <img src={schoolLogo} alt={schoolName} className="w-12 h-12 rounded-lg object-cover bg-white/10 p-0.5" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-base lg:text-xl font-bold leading-tight tracking-tight">{schoolName || 'Schooltino'}</h1>
                  {schoolData?.address && (
                    <p className="text-[10px] lg:text-xs text-blue-200 leading-tight truncate max-w-[200px] lg:max-w-none">
                      {schoolData.address}{schoolData.city ? `, ${schoolData.city}` : ''}{schoolData.state ? `, ${schoolData.state}` : ''}{schoolData.pincode ? ` - ${schoolData.pincode}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-0.5 text-[11px] text-blue-200">
                {schoolData?.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{schoolData.phone}</span>
                )}
                {schoolData?.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{schoolData.email}</span>
                )}
                <div className="flex items-center gap-2">
                  {schoolData?.registration_number && (
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" />Reg: {schoolData.registration_number}</span>
                  )}
                  {schoolData?.board_type && (
                    <span className="bg-white/10 px-2 py-0.5 rounded text-white text-[10px] font-semibold">{schoolData.board_type}</span>
                  )}
                </div>
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

              <div className="relative credit-dropdown">
                <button
                  onClick={() => setShowCreditDropdown(!showCreditDropdown)}
                  className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Credit Balance"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-semibold">{creditBalance !== null ? creditBalance : '—'}</span>
                </button>
                {showCreditDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-1">Credit Balance</p>
                      <p className="text-2xl font-bold text-gray-900">{creditBalance !== null ? creditBalance : 0}</p>
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button
                        onClick={() => { setShowCreditDropdown(false); navigate('/app/credit-system'); }}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Recharge
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowTinoChat(!showTinoChat)}
                className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                title="Tino AI Chat"
              >
                <Brain className="w-5 h-5" />
              </button>

              <div className="relative notification-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {(unreadCount + (isAdminRole ? pendingComplaintsCount : 0)) > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">{(unreadCount + (isAdminRole ? pendingComplaintsCount : 0)) > 9 ? '9+' : (unreadCount + (isAdminRole ? pendingComplaintsCount : 0))}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      <span className="text-xs text-gray-500">{unreadCount + (isAdminRole && pendingComplaintsCount > 0 ? 1 : 0)} unread</span>
                    </div>
                    <div className="overflow-y-auto max-h-72">
                      {isAdminRole && pendingComplaintsCount > 0 && (
                        <div
                          onClick={() => { setShowNotifications(false); navigate('/app/complaints'); }}
                          className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors bg-amber-50"
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-900">{pendingComplaintsCount} new complaint{pendingComplaintsCount !== 1 ? 's' : ''}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">Click to view and resolve pending complaints</p>
                        </div>
                      )}
                      {notifications.length === 0 && !(isAdminRole && pendingComplaintsCount > 0) ? (
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
                <p>Hi! I'm Tino AI. How can I help you today?</p>
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
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
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
                onKeyDown={handleChatKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
