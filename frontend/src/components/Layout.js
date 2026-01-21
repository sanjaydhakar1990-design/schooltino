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
  const { user } = useAuth();

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
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />

      {/* Voice Assistant FAB */}
      <VoiceAssistantFAB isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </div>
  );
};

export default Layout;
