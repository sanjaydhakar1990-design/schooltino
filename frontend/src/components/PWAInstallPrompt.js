/**
 * PWA INSTALL PROMPT COMPONENT
 * - Shows install prompt after login
 * - Hides if already installed
 * - Works on both Mobile and Desktop
 */

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check PWA display mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      // Check iOS standalone
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return true;
      }
      // Check localStorage flag
      if (localStorage.getItem('pwa_installed') === 'true') {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    setIsIOS(checkIOS());

    // If already installed, don't show
    if (checkInstalled()) {
      setShowPrompt(false);
      return;
    }

    // Check if dismissed recently (within 24 hours)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return; // Don't show if dismissed within 24 hours
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay to show after dashboard loads
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show custom instructions after delay
    if (checkIOS() && !checkInstalled()) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
      setShowPrompt(false);
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  // Don't render if installed or shouldn't show
  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <img 
                src="/logo192.png" 
                alt="Schooltino" 
                className="w-12 h-12"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center text-white text-xl font-bold">
                S
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">Install Schooltino</h2>
              <p className="text-indigo-100 text-sm">
                App की तरह use करें - Fast & Offline Ready!
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Quick access from home screen</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Faster load time - App जैसा experience</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Works offline भी - कुछ features</span>
            </div>
          </div>

          {/* Device Icons */}
          <div className="flex justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                <Smartphone className="w-6 h-6 text-slate-600" />
              </div>
              <span className="text-xs text-slate-500">Mobile</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                <Monitor className="w-6 h-6 text-slate-600" />
              </div>
              <span className="text-xs text-slate-500">Desktop</span>
            </div>
          </div>

          {/* Actions */}
          {isIOS ? (
            // iOS Instructions
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">
                <strong>iOS पर Install करने के लिए:</strong>
              </p>
              <ol className="text-sm text-slate-500 text-left space-y-1">
                <li>1. Safari में Share button (□↑) tap करें</li>
                <li>2. "Add to Home Screen" select करें</li>
                <li>3. "Add" tap करें</li>
              </ol>
              <Button
                onClick={handleDismiss}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700"
              >
                समझ गया!
              </Button>
            </div>
          ) : (
            // Chrome/Android/Desktop Install
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                बाद में
              </Button>
              <Button
                onClick={handleInstall}
                disabled={installing || !deferredPrompt}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {installing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install Now
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 text-center">
          <p className="text-xs text-slate-400">
            Free • No App Store needed • 2 MB only
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
