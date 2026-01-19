import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Mic, Globe, Download } from 'lucide-react';
import Sidebar from './Sidebar';
import VoiceAssistantFAB from './VoiceAssistantFAB';
import { useLanguage } from '../context/LanguageContext';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { language, changeLanguage } = useLanguage();
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual instructions for iOS/Safari
      alert('📱 App Install करें:\n\n1. Safari में Share (⬆️) button दबाएं\n2. "Add to Home Screen" select करें\n3. "Add" पर tap करें\n\nDone! 🎉');
    }
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'hinglish', label: 'Hinglish', flag: '🔄' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="min-h-screen bg-background flex">
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
        {/* Top Header Bar */}
        <header className="sticky top-0 h-14 bg-gradient-to-r from-slate-900 to-indigo-900 z-30 flex items-center justify-between px-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Logo for mobile */}
          <span className="lg:hidden text-white font-semibold">Schooltino</span>
          
          {/* Spacer for desktop */}
          <div className="hidden lg:block" />
          
          {/* Right side buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button - Only show if not installed */}
            {!isInstalled && (
              <button
                onClick={handlePWAInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                data-testid="pwa-install-btn"
                title="Install App"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}
            
            {/* Language Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                data-testid="language-toggle"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang.label}</span>
                <span className="sm:hidden">{currentLang.flag}</span>
              </button>
              
              {/* Language Dropdown */}
              {showLangMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                          language === lang.code ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
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
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
};

export default Layout;
