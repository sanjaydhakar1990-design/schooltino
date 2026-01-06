import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Mic } from 'lucide-react';
import Sidebar from './Sidebar';
import VoiceAssistantFAB from './VoiceAssistantFAB';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

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

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
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
          
          {/* Ask Tino Button - Top Right */}
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            data-testid="ask-tino-btn"
          >
            <Mic className="w-4 h-4" />
            <span className="font-medium text-sm">Ask Tino</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </button>
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
