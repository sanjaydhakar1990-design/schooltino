import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Globe, Mic } from 'lucide-react';
import Sidebar from './Sidebar';
import PWAInstaller from './PWAInstaller';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const { user, schoolData } = useAuth();
  const navigate = useNavigate();

  // Get school branding from context (fetched at login)
  const schoolLogo = schoolData?.logo_url;
  const schoolName = schoolData?.name || user?.school_name;

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧', shortLabel: 'EN' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳', shortLabel: 'हि' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const otherLang = languages.find(l => l.code !== language) || languages[1];

  // Quick toggle between Hindi and English
  const handleQuickToggle = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    changeLanguage(newLang);
  };

  // Dynamically update favicon and app icon with school logo
  useEffect(() => {
    if (schoolLogo && schoolLogo.length > 100) {  // Valid logo (not placeholder)
      try {
        // Remove ALL existing favicon links first
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(icon => icon.remove());
        
        // Create new favicon link
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/png';
        faviconLink.href = schoolLogo;
        document.head.appendChild(faviconLink);
        
        // Create shortcut icon for older browsers
        const shortcutLink = document.createElement('link');
        shortcutLink.rel = 'shortcut icon';
        shortcutLink.type = 'image/png';
        shortcutLink.href = schoolLogo;
        document.head.appendChild(shortcutLink);
        
        // Remove and recreate apple touch icons
        const existingAppleIcons = document.querySelectorAll("link[rel='apple-touch-icon']");
        existingAppleIcons.forEach(icon => icon.remove());
        
        // Create apple touch icons in multiple sizes
        const appleSizes = ['180x180', '192x192', '152x152', '144x144', '120x120'];
        appleSizes.forEach(size => {
          const appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          appleLink.sizes = size;
          appleLink.href = schoolLogo;
          document.head.appendChild(appleLink);
        });
        
        // Default apple touch icon
        const defaultApple = document.createElement('link');
        defaultApple.rel = 'apple-touch-icon';
        defaultApple.href = schoolLogo;
        document.head.appendChild(defaultApple);
        
        // Update PWA manifest icon dynamically
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
            theme_color: '#6366f1'
          };
          const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
          const oldUrl = manifestLink.href;
          manifestLink.href = URL.createObjectURL(blob);
          // Cleanup old blob URL
          if (oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }
        }
        
        // Update document title if school name exists
        if (schoolName) {
          document.title = `${schoolName} - Schooltino`;
        }
        
        console.log('✅ App icon updated with school logo:', schoolLogo.substring(0, 50) + '...');
      } catch (error) {
        console.error('Failed to update app icon:', error);
      }
    }
  }, [schoolLogo, schoolName]);

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* School Logo Watermark - Light Background on ALL Pages */}
      {schoolLogo && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center print:hidden"
          style={{ opacity: 0.04 }}
          data-testid="global-watermark"
        >
          <img 
            src={schoolLogo} 
            alt="" 
            className="w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] object-contain"
          />
        </div>
      )}
      
      {/* Sidebar Overlay - Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar - Sticky on desktop */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header Bar - DigitalEdu Clean White Style */}
        <header className="sticky top-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4 shadow-sm" data-testid="app-header">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* School Logo + Name for mobile (Custom Branding - DEFAULT) */}
          <div className="lg:hidden flex items-center gap-2 flex-1 ml-2" data-testid="mobile-header-branding">
            {schoolLogo ? (
              <div className="w-10 h-10 bg-white rounded-full p-0.5 flex-shrink-0 shadow-md border border-slate-200">
                <img src={schoolLogo} alt="" className="w-full h-full object-contain rounded-full" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {(schoolName || 'S').charAt(0)}
              </div>
            )}
            <span className="text-slate-800 font-bold text-base truncate max-w-[150px]" data-testid="mobile-school-name">
              {schoolName || 'School'}
            </span>
          </div>
          
          {/* School Logo + Name for Desktop (Custom Branding - DEFAULT) */}
          <div className="hidden lg:flex items-center gap-4" data-testid="desktop-header-branding">
            {schoolLogo ? (
              <div className="w-12 h-12 bg-white rounded-full p-0.5 flex-shrink-0 shadow-md border-2 border-slate-200">
                <img src={schoolLogo} alt="" className="w-full h-full object-contain rounded-full" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {(schoolName || 'S').charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-slate-800 font-bold text-lg leading-tight tracking-tight" data-testid="desktop-school-name">
                {schoolName || 'School Management'}
              </span>
              {schoolData?.address && (
                <span className="text-slate-500 text-xs leading-tight max-w-[300px] truncate">
                  {schoolData.address}
                </span>
              )}
            </div>
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button - New Component */}
            <PWAInstaller />
            
            {/* Language Toggle - One Click Switch */}
            <button
              onClick={handleQuickToggle}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-all border border-slate-200"
              data-testid="language-toggle"
              title={`Switch to ${otherLang.label}`}
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">{currentLang.flag} {currentLang.shortLabel}</span>
              <span className="text-slate-400">→</span>
              <span className="font-medium">{otherLang.flag} {otherLang.shortLabel}</span>
            </button>
            
            {/* Ask Tino Button - Opens Tino AI Page */}
            <button
              onClick={() => navigate('/app/tino-ai')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              data-testid="ask-tino-btn"
            >
              <Mic className="w-4 h-4" />
              <span className="font-medium text-sm hidden sm:inline">Ask Tino</span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
