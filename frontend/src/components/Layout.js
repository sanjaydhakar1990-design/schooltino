import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Globe, Mic } from 'lucide-react';
import Sidebar from './Sidebar';
import VoiceAssistantFAB from './VoiceAssistantFAB';
import PWAInstaller from './PWAInstaller';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const { user, schoolData } = useAuth();

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
        // Update favicon
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.head.appendChild(link);
        }
        link.type = schoolLogo.startsWith('data:') ? 'image/png' : 'image/x-icon';
        link.href = schoolLogo;
        
        // Update apple touch icon
        let appleLink = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleLink) {
          appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          document.head.appendChild(appleLink);
        }
        appleLink.href = schoolLogo;
        
        // Update PWA manifest icon dynamically
        const manifestLink = document.querySelector("link[rel='manifest']");
        if (manifestLink) {
          // Create dynamic manifest with school logo
          const dynamicManifest = {
            name: schoolName || 'Schooltino',
            short_name: schoolName?.split(' ')[0] || 'School',
            icons: [
              { src: schoolLogo, sizes: '192x192', type: 'image/png' },
              { src: schoolLogo, sizes: '512x512', type: 'image/png' }
            ],
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#6366f1'
          };
          const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
          manifestLink.href = URL.createObjectURL(blob);
        }
        
        // Update document title if school name exists
        if (schoolName) {
          document.title = `${schoolName} - Schooltino`;
        }
        
        console.log('App icon updated with school logo');
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
        {/* Top Header Bar - SCHOOL BRANDING */}
        <header className="sticky top-0 h-16 bg-gradient-to-r from-slate-900 to-indigo-900 z-30 flex items-center justify-between px-4" data-testid="app-header">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* School Logo + Name for mobile (Custom Branding - DEFAULT) */}
          <div className="lg:hidden flex items-center gap-2 flex-1 ml-2" data-testid="mobile-header-branding">
            {schoolLogo ? (
              <div className="w-10 h-10 bg-white rounded-full p-0.5 flex-shrink-0 shadow-lg">
                <img src={schoolLogo} alt="" className="w-full h-full object-contain rounded-full" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {(schoolName || 'S').charAt(0)}
              </div>
            )}
            <span className="text-white font-bold text-base truncate max-w-[150px]" data-testid="mobile-school-name">
              {schoolName || 'School'}
            </span>
          </div>
          
          {/* School Logo + Name for Desktop (Custom Branding - DEFAULT) */}
          <div className="hidden lg:flex items-center gap-4" data-testid="desktop-header-branding">
            {schoolLogo ? (
              <div className="w-12 h-12 bg-white rounded-full p-0.5 flex-shrink-0 shadow-lg border-2 border-white/20">
                <img src={schoolLogo} alt="" className="w-full h-full object-contain rounded-full" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {(schoolName || 'S').charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-tight tracking-wide" data-testid="desktop-school-name">
                {schoolName || 'School Management'}
              </span>
              {schoolData?.address && (
                <span className="text-white/70 text-xs leading-tight max-w-[300px] truncate">
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
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all border border-white/20"
              data-testid="language-toggle"
              title={`Switch to ${otherLang.label}`}
            >
              <Globe className="w-4 h-4" />
              <span className="font-medium">{currentLang.flag} {currentLang.shortLabel}</span>
              <span className="text-white/60">→</span>
              <span className="font-medium">{otherLang.flag} {otherLang.shortLabel}</span>
            </button>
            
            {/* Ask Tino Button */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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

      {/* Voice Assistant FAB */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
};

export default Layout;
