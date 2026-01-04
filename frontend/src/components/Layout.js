import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import VoiceAssistantFAB from './VoiceAssistantFAB';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-30 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-white hover:bg-slate-800 rounded-lg"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="ml-3 text-white font-semibold">Schooltino</span>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 xl:p-10 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Voice Assistant Floating Button */}
      <VoiceAssistantFAB />
    </div>
  );
};

export default Layout;
