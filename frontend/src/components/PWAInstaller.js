/**
 * SCHOOLTINO PWA INSTALLER - GUARANTEED INSTALL
 * 
 * Features:
 * 1. Auto-detect if app is installable
 * 2. One-click install for Chrome/Edge/Samsung
 * 3. iOS Safari instructions
 * 4. Desktop shortcut creation
 * 5. Update notification if already installed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Smartphone, Monitor, RefreshCw, Check, X, Chrome, Apple } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Global variable to store the install prompt
let globalDeferredPrompt = null;

const PWAInstaller = ({ className = '' }) => {
  const [installState, setInstallState] = useState('checking'); // checking, available, installing, installed, not-supported
  const [showModal, setShowModal] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop'); // desktop, android, ios
  const [browser, setBrowser] = useState('other'); // chrome, edge, firefox, safari, samsung, other

  // Detect device and browser
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    // Device detection
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Browser detection
    if (/edg/.test(ua)) {
      setBrowser('edge');
    } else if (/chrome/.test(ua) && !/edg/.test(ua)) {
      setBrowser('chrome');
    } else if (/firefox/.test(ua)) {
      setBrowser('firefox');
    } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
      setBrowser('safari');
    } else if (/samsungbrowser/.test(ua)) {
      setBrowser('samsung');
    }

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setInstallState('installed');
      return;
    }

    // Check if install prompt is available
    if (globalDeferredPrompt) {
      setInstallState('available');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setInstallState('available');
      console.log('🚀 PWA Install prompt captured!');
    };

    const handleAppInstalled = () => {
      setInstallState('installed');
      globalDeferredPrompt = null;
      toast.success('🎉 Schooltino App installed successfully!');
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check - if no prompt after 2 seconds and not iOS/Safari
    const timeout = setTimeout(() => {
      if (!globalDeferredPrompt && deviceType !== 'ios' && browser !== 'safari') {
        // Still show install button - will show instructions
        setInstallState('available');
      } else if (deviceType === 'ios' || browser === 'safari') {
        setInstallState('available'); // iOS can still install via Safari
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timeout);
    };
  }, [deviceType, browser]);

  // Handle install click
  const handleInstall = useCallback(async () => {
    if (installState === 'installed') {
      // App is already installed - check for updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.update();
        toast.success('App update check initiated! 🔄');
      }
      return;
    }

    if (globalDeferredPrompt) {
      // Chrome/Edge/Samsung - Direct install
      setInstallState('installing');
      try {
        globalDeferredPrompt.prompt();
        const { outcome } = await globalDeferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setInstallState('installed');
          toast.success('🎉 Installing Schooltino App...');
        } else {
          setInstallState('available');
          toast.info('Install cancelled. Click again to install.');
        }
        globalDeferredPrompt = null;
      } catch (err) {
        console.error('Install error:', err);
        setShowModal(true);
      }
    } else {
      // Show instructions modal
      setShowModal(true);
    }
  }, [installState]);

  // Force trigger install prompt (for some browsers)
  const forceInstallPrompt = async () => {
    // Try to register a new service worker to trigger prompt
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('SW re-registered for install prompt');
        
        // Wait a bit and check if prompt appeared
        setTimeout(() => {
          if (globalDeferredPrompt) {
            handleInstall();
          } else {
            setShowModal(true);
          }
        }, 1000);
      } catch (err) {
        console.error('SW registration failed:', err);
        setShowModal(true);
      }
    }
  };

  // Get button text based on state
  const getButtonContent = () => {
    switch (installState) {
      case 'checking':
        return { icon: RefreshCw, text: 'Checking...', className: 'animate-spin' };
      case 'installing':
        return { icon: RefreshCw, text: 'Installing...', className: 'animate-spin' };
      case 'installed':
        return { icon: Check, text: 'Installed ✓', className: '' };
      case 'available':
      default:
        return { icon: Download, text: 'Install App', className: '' };
    }
  };

  const buttonContent = getButtonContent();
  const Icon = buttonContent.icon;

  // Render install instructions modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Install Schooltino App</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Device-specific instructions */}
          {deviceType === 'ios' || browser === 'safari' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Apple className="w-8 h-8 text-gray-800" />
                <span className="font-medium">iOS / Safari</span>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Tap the <strong>Share</strong> button <span className="text-blue-600">⬆️</span> at the bottom of Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Tap <strong>"Add"</strong> in the top right corner</span>
                </li>
              </ol>
              <p className="text-xs text-gray-500 mt-4">
                📱 App will appear on your home screen with Schooltino icon
              </p>
            </div>
          ) : deviceType === 'android' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Smartphone className="w-8 h-8 text-green-600" />
                <span className="font-medium">Android</span>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Tap the <strong>Menu</strong> button <span className="text-gray-600">⋮</span> in your browser</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Tap <strong>"Install"</strong> to confirm</span>
                </li>
              </ol>
              <Button onClick={forceInstallPrompt} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Try Direct Install
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Monitor className="w-8 h-8 text-blue-600" />
                <span className="font-medium">Desktop (Chrome/Edge)</span>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Look for the <strong>Install icon</strong> ⊕ in the address bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Or click <strong>Menu ⋮</strong> → <strong>"Install Schooltino"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Click <strong>"Install"</strong> in the popup</span>
                </li>
              </ol>
              <Button onClick={forceInstallPrompt} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Try Direct Install
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                💻 A desktop shortcut will be created for quick access
              </p>
            </div>
          )}

          {/* Already installed section */}
          {installState === 'installed' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <Check className="w-5 h-5" />
                App is already installed! Open it from your home screen/desktop.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Button
        onClick={handleInstall}
        variant={installState === 'installed' ? 'outline' : 'default'}
        size="sm"
        className={`${className} ${installState === 'installed' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}
        disabled={installState === 'checking' || installState === 'installing'}
      >
        <Icon className={`w-4 h-4 mr-1 ${buttonContent.className}`} />
        <span className="hidden sm:inline">{buttonContent.text}</span>
        <span className="sm:hidden">
          {installState === 'installed' ? '✓' : <Download className="w-4 h-4" />}
        </span>
      </Button>
      
      {renderModal()}
    </>
  );
};

export default PWAInstaller;
