import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show banner after 3 seconds if prompt is available
    const timer = setTimeout(() => {
      if (deferredPrompt) {
        setShowInstallBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for iOS
      alert('📱 Install कैसे करें:\n\n1. Safari में Share button (⬆️) दबाएं\n2. "Add to Home Screen" select करें\n3. "Add" पर tap करें\n\nDone! App आपके phone में install हो जाएगी।');
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
  };

  if (isInstalled) return null;

  // Floating Install Banner
  if (showInstallBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 z-50 animate-slide-up">
        <button 
          onClick={dismissBanner}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">📲 App Install करें!</h3>
            <p className="text-xs text-white/80 mt-1">
              Home screen पर add करें - Offline access, fast loading
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleInstallClick}
          className="w-full mt-3 bg-white text-indigo-600 hover:bg-white/90 font-semibold"
          data-testid="pwa-install-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          Install Now
        </Button>
      </div>
    );
  }

  return null;
}

// Also export a simple button version for header/footer
export function PWAInstallSimpleButton({ className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('📱 Install कैसे करें:\n\n1. Safari में Share button (⬆️) दबाएं\n2. "Add to Home Screen" select करें\n3. "Add" पर tap करें');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <Button 
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
      data-testid="pwa-install-header-btn"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
}
