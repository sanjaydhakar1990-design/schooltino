/**
 * PWA INSTALL PROMPT COMPONENT
 * - One-click install experience
 * - Shows compact install button in header/nav
 * - No popup - direct install trigger
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Check, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

// Global store for install prompt event
let deferredInstallPrompt = null;
let installPromptListeners = [];

// Initialize install prompt capture as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Notify all listeners
    installPromptListeners.forEach(listener => listener(e));
  });
}

const PWAInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(!!deferredInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      if (window.navigator.standalone === true) {
        return true;
      }
      return false;
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    };

    if (checkInstalled()) {
      setIsInstalled(true);
      return;
    }

    setIsIOS(checkIOS());

    // Subscribe to install prompt availability
    const handlePromptAvailable = (e) => {
      setCanInstall(true);
    };

    installPromptListeners.push(handlePromptAvailable);

    // If prompt already captured
    if (deferredInstallPrompt) {
      setCanInstall(true);
    }

    // Listen for app installed
    const handleInstalled = () => {
      setIsInstalled(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    };

    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      installPromptListeners = installPromptListeners.filter(l => l !== handlePromptAvailable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredInstallPrompt) {
      // For iOS, show guide
      if (isIOS) {
        setShowIOSGuide(true);
        return;
      }
      return;
    }

    setInstalling(true);
    try {
      // Trigger the install prompt
      await deferredInstallPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredInstallPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowSuccess(true);
        deferredInstallPrompt = null;
        setCanInstall(false);
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setInstalling(false);
    }
  }, [isIOS]);

  // Don't render if installed
  if (isInstalled && !showSuccess) return null;

  // Show success message briefly
  if (showSuccess) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">App Installed! 🎉</span>
        </div>
      </div>
    );
  }

  // iOS Guide Modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8" />
              <div>
                <h3 className="font-bold">iOS पर Install करें</h3>
                <p className="text-xs text-indigo-100">3 simple steps</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">1</div>
              <p className="text-sm text-gray-600">Safari में नीचे <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs">Share □↑</span> button tap करें</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">2</div>
              <p className="text-sm text-gray-600">Scroll करके <strong>"Add to Home Screen"</strong> select करें</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">3</div>
              <p className="text-sm text-gray-600"><strong>"Add"</strong> tap करें - Done! 🎉</p>
            </div>
            <Button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              समझ गया!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show install button only if can install (or iOS)
  if (!canInstall && !isIOS) return null;

  return (
    <Button
      onClick={handleInstall}
      disabled={installing}
      className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 animate-in slide-in-from-right duration-500"
      data-testid="pwa-install-btn"
    >
      {installing ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="w-5 h-5" />
      )}
      <span className="font-medium">
        {installing ? 'Installing...' : 'Install App'}
      </span>
    </Button>
  );
};

// Export both default and named for flexibility
export default PWAInstallPrompt;
export { PWAInstallPrompt };
