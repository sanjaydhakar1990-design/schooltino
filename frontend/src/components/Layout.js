import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Globe, Mic, Home, ChevronRight, Search, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import PWAInstaller from './PWAInstaller';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const breadcrumbMap = {
  '/app/dashboard': 'Dashboard',
  '/app/students': 'Students',
  '/app/classes': 'Classes',
  '/app/attendance': 'Attendance',
  '/app/fee-management': 'Fee Management',
  '/app/fees': 'Fees',
  '/app/employee-management': 'Team Members',
  '/app/leave': 'Leave Management',
  '/app/salary': 'Salary',
  '/app/notices': 'Notices',
  '/app/sms': 'SMS Center',
  '/app/meetings': 'Meetings',
  '/app/gallery': 'Gallery',
  '/app/tino-ai': 'Tino AI',
  '/app/tino-brain': 'Tino Brain',
  '/app/ai-paper': 'AI Paper Generator',
  '/app/transport': 'Transport',
  '/app/health': 'Health Module',
  '/app/biometric': 'Biometric',
  '/app/cctv': 'CCTV Dashboard',
  '/app/school-management': 'School Profile',
  '/app/school-analytics': 'School Analytics',
  '/app/setup-wizard': 'Setup Wizard',
  '/app/logo-settings': 'Logo Settings',
  '/app/timetable-management': 'Timetable',
  '/app/exam-report': 'Exam & Report Card',
  '/app/certificates': 'Certificates',
  '/app/admit-cards': 'Admit Cards',
  '/app/accountant': 'AI Accountant',
  '/app/permission-manager': 'Permissions',
  '/app/event-designer': 'Event Designer',
  '/app/school-calendar': 'School Calendar',
  '/app/family-portal': 'Family Portal',
  '/app/complaints': 'Complaints',
  '/app/board-notifications': 'Board Updates',
  '/app/prayer-system': 'Prayer System',
  '/app/website': 'Website',
  '/app/visitor-pass': 'Visitor Pass',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
};

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { language, changeLanguage } = useLanguage();
  const { user, schoolData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolLogo = schoolData?.logo_url;
  const schoolName = schoolData?.name || user?.school_name;

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧', shortLabel: 'EN' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳', shortLabel: 'हि' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const otherLang = languages.find(l => l.code !== language) || languages[1];

  const handleQuickToggle = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    changeLanguage(newLang);
  };

  const currentPage = breadcrumbMap[location.pathname] || 'Page';

  useEffect(() => {
    if (schoolLogo && schoolLogo.length > 100) {
      try {
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(icon => icon.remove());
        
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        faviconLink.href = schoolLogo;
        document.head.appendChild(faviconLink);
        
        const shortcutLink = document.createElement('link');
        shortcutLink.rel = 'shortcut icon';
        shortcutLink.type = 'image/png';
        shortcutLink.href = schoolLogo;
        document.head.appendChild(shortcutLink);
        
        const existingAppleIcons = document.querySelectorAll("link[rel='apple-touch-icon']");
        existingAppleIcons.forEach(icon => icon.remove());
        
        const appleSizes = ['180x180', '192x192', '152x152', '144x144', '120x120'];
        appleSizes.forEach(size => {
          const appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          appleLink.sizes = size;
          appleLink.href = schoolLogo;
          document.head.appendChild(appleLink);
        });
        
        const defaultApple = document.createElement('link');
        defaultApple.rel = 'apple-touch-icon';
        defaultApple.href = schoolLogo;
        document.head.appendChild(defaultApple);
        
        const manifestLink = document.querySelector("link[rel='manifest']");
        if (manifestLink) {
          const dynamicManifest = {
            name: schoolName || 'Schooltino',
            short_name: schoolName?.split(' ')[0] || 'School',
            icons: [
              { src: schoolLogo, sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '128x128', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '152x152', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '384x384', type: 'image/png', purpose: 'any maskable' },
              { src: schoolLogo, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ],
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#3B82F6'
          };
          const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
          const oldUrl = manifestLink.href;
          manifestLink.href = URL.createObjectURL(blob);
          if (oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }
        }
        
        if (schoolName) {
          document.title = `${schoolName} - Schooltino`;
        }
      } catch (error) {
        console.error('Failed to update app icon:', error);
      }
    }
  }, [schoolLogo, schoolName]);

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {schoolLogo && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center print:hidden"
          style={{ opacity: 0.03 }}
          data-testid="global-watermark"
        >
          <img 
            src={schoolLogo} 
            alt="" 
            className="w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] object-contain"
          />
        </div>
      )}
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="sticky top-0 h-16 bg-white border-b border-gray-200 shadow-sm z-30 flex items-center justify-between px-5" data-testid="app-header">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium border-0"
              data-testid="home-btn"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-gray-500">Home</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-blue-600 font-medium">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Module"
                className="pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:border-blue-300 focus:bg-white w-56 text-gray-700 placeholder-gray-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>

            <PWAInstaller />
            
            <button
              onClick={handleQuickToggle}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition-all border border-gray-200"
              data-testid="language-toggle"
              title={`Switch to ${otherLang.label}`}
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">{currentLang.shortLabel}</span>
            </button>
            
            <button
              onClick={() => navigate('/app/tino-ai')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
              data-testid="ask-tino-btn"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Tino</span>
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            </button>

            <button
              onClick={() => navigate('/app/profile')}
              className="flex items-center gap-2 p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden md:inline text-sm font-medium text-gray-700 truncate max-w-[100px]">
                {user?.name || 'User'}
              </span>
            </button>
          </div>
        </header>

        {searchOpen && (
          <div className="md:hidden px-4 py-2 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Module"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300 text-gray-600"
                autoFocus
              />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
