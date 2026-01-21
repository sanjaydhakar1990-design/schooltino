/**
 * PWA INSTALL COMPONENT
 * - One-click install for Android/Desktop Chrome
 * - iOS Safari instructions
 * - Shows floating button that triggers native install
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, X, Check, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

// Global store for install prompt - capture ASAP
let globalDeferredPrompt = null;
const promptListeners = new Set();

// Capture the event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    console.log('[PWA] Install prompt captured!');
    promptListeners.forEach(fn => fn(e));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully!');
    globalDeferredPrompt = null;
  });
}

// Helper functions outside component
const checkInstalled = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

const checkIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
};

// Hook to access install prompt
export function usePWAInstall() {
  // Initialize state with computed values
  const initialInstalled = useMemo(() => checkInstalled(), []);
  const initialIsIOS = useMemo(() => checkIOS(), []);
  
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(initialInstalled);
  const [isIOS] = useState(initialIsIOS);

  useEffect(() => {
    if (globalDeferredPrompt) {
      setCanInstall(true);
    }

    // Listen for new prompts
    const handlePrompt = () => setCanInstall(true);
    promptListeners.add(handlePrompt);

    // Listen for install
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      promptListeners.delete(handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!globalDeferredPrompt) return { success: false, reason: 'no_prompt' };
    
    try {
      await globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        setCanInstall(false);
        return { success: true };
      }
      return { success: false, reason: 'dismissed' };
    } catch (err) {
      console.error('[PWA] Install error:', err);
      return { success: false, reason: 'error' };
    }
  }, []);

  return { canInstall, isInstalled, isIOS, install };
}

// Floating Install Button Component
export default function PWAInstallPrompt() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  
  // Initialize dismissed state from sessionStorage
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pwa_dismissed') === 'true';
    }
    return false;
  });

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!canInstall) return;

    setInstalling(true);
    const result = await install();
    setInstalling(false);

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  // Don't show if installed or dismissed
  if (isInstalled || dismissed) return null;

  // Success message
  if (showSuccess) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
        <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">App Installed! 🎉</span>
        </div>
      </div>
    );
  }

  // iOS Modal
  if (showIOSModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-7 h-7" />
                <h3 className="font-bold">iOS पर Install करें</h3>
              </div>
              <button onClick={() => setShowIOSModal(false)} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">1</div>
              <div>
                <p className="text-sm font-medium text-gray-800">Safari में Share button tap करें</p>
                <p className="text-xs text-gray-500">नीचे □↑ icon पर click करें</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">2</div>
              <div>
                <p className="text-sm font-medium text-gray-800">&ldquo;Add to Home Screen&rdquo; select करें</p>
                <p className="text-xs text-gray-500">Scroll करके find करें</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">3</div>
              <div>
                <p className="text-sm font-medium text-gray-800">&ldquo;Add&rdquo; tap करें</p>
                <p className="text-xs text-gray-500">App install हो जाएगी! 🎉</p>
              </div>
            </div>
            <Button onClick={() => setShowIOSModal(false)} className="w-full bg-indigo-600 hover:bg-indigo-700">
              समझ गया!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show button only if installation is available
  if (!canInstall && !isIOS) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right duration-500">
      <div className="relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center shadow-md"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
        <Button
          onClick={handleInstall}
          disabled={installing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl rounded-full pl-4 pr-5 py-6 flex items-center gap-2"
          data-testid="pwa-install-fab"
        >
          {installing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span className="font-semibold">Install App</span>
        </Button>
      </div>
    </div>
  );
}

// Simple button for header/nav
export function PWAInstallButton({ className = '', variant = 'default' }) {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (!canInstall) return;
    
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  if (isInstalled) return null;

  // Don't show if can't install and not iOS
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={installing}
        variant={variant}
        className={`gap-2 ${className}`}
        data-testid="pwa-install-btn"
      >
        {installing ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Install</span>
      </Button>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-6 h-6" />
                  <h3 className="font-bold text-sm">iOS Install Instructions</h3>
                </div>
                <button onClick={() => setShowIOSModal(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <p><strong>1.</strong> Tap Safari&apos;s Share button (□↑)</p>
              <p><strong>2.</strong> Select &ldquo;Add to Home Screen&rdquo;</p>
              <p><strong>3.</strong> Tap &ldquo;Add&rdquo; - Done!</p>
              <Button onClick={() => setShowIOSModal(false)} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700" size="sm">
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
