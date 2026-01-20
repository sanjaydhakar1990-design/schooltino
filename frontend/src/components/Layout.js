import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Mic, Globe, Download, X, Smartphone } from 'lucide-react';
import Sidebar from './Sidebar';
import VoiceAssistantFAB from './VoiceAssistantFAB';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Detect browser/platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA install prompt ready');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
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
      // Chrome/Edge - direct install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show modal with instructions
      setShowInstallModal(true);
    }
  };

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

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* School Logo Watermark - Light Background */}
      {user?.school_logo && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center print:hidden"
          style={{ opacity: 0.03 }}
        >
          <img 
            src={user.school_logo} 
            alt="" 
            className="w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] object-contain"
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
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">📲 App Install करें</h3>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Chrome/Desktop Instructions */}
              {isChrome && !isIOS && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="font-medium text-blue-800 mb-2">Chrome में Install:</p>
                  <ol className="text-sm text-blue-700 space-y-2">
                    <li>1. Address bar में <span className="font-bold">⊕</span> icon देखें</li>
                    <li>2. "Install" पर click करें</li>
                    <li>3. Done! App desktop पर install हो जाएगी</li>
                  </ol>
                </div>
              )}

              {/* iOS Safari Instructions */}
              {isIOS && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-800 mb-2">iPhone/iPad में Install:</p>
                  <ol className="text-sm text-gray-700 space-y-2">
                    <li>1. Safari में <span className="font-bold">Share ⬆️</span> button दबाएं</li>
                    <li>2. Scroll करके <span className="font-bold">"Add to Home Screen"</span> select करें</li>
                    <li>3. <span className="font-bold">"Add"</span> पर tap करें</li>
                    <li>4. Done! App Home Screen पर दिखेगी 🎉</li>
                  </ol>
                </div>
              )}

              {/* Android Instructions */}
              {!isIOS && !isChrome && (
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="font-medium text-green-800 mb-2">Android में Install:</p>
                  <ol className="text-sm text-green-700 space-y-2">
                    <li>1. Browser menu (⋮) खोलें</li>
                    <li>2. <span className="font-bold">"Install app"</span> या <span className="font-bold">"Add to Home Screen"</span> select करें</li>
                    <li>3. "Install" पर tap करें</li>
                    <li>4. Done! 🎉</li>
                  </ol>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <Smartphone className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="font-medium text-indigo-900">PWA Benefits:</p>
                  <p className="text-xs text-indigo-700">• Offline access • Fast loading • No app store needed</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
            >
              समझ गया
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
