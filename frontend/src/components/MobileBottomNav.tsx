import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Boxes, FileText, MessageCircle, Download, CheckCircle2, X, Share2, Smartphone } from 'lucide-react';
import { APP_CONFIG } from '../config/index.js';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const isActive = (path: string) => {
    if (path === '/get-quote') {
      return location.pathname === '/get-quote' || location.pathname === '/order';
    }
    if (path === '/products') {
      return location.pathname.startsWith('/products');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden transition-all"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isActive('/') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. Materials */}
          <Link
            to="/products"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isActive('/products') ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Materials</span>
          </Link>

          {/* 3. Center Highlight: Get Quote */}
          <Link
            to="/get-quote"
            className="flex flex-col items-center justify-center -mt-4 relative group"
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              isActive('/get-quote')
                ? 'bg-amber-600 text-white ring-4 ring-amber-100'
                : 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white ring-4 ring-white shadow-amber-600/30'
            }`}>
              <FileText className="h-5 w-5" />
            </div>
            <span className={`text-[10px] mt-1 font-bold ${
              isActive('/get-quote') ? 'text-amber-600' : 'text-slate-700'
            }`}>
              Get Quote
            </span>
          </Link>

          {/* 4. WhatsApp Chat */}
          <a
            href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Nagpur%20Materials,%20I%20am%20browsing%20on%20mobile%20and%20need%20a%20quotation.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5 mb-0.5 text-emerald-600" />
            <span className="text-[10px] tracking-tight text-emerald-700 font-semibold">WhatsApp</span>
          </a>

          {/* 5. Install App / App Info */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-amber-600 transition-colors relative"
            aria-label="Install App"
          >
            {isStandalone ? (
              <>
                <CheckCircle2 className="h-5 w-5 mb-0.5 text-emerald-600" />
                <span className="text-[10px] tracking-tight text-emerald-700 font-medium">Installed</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Download className="h-5 w-5 mb-0.5 text-amber-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
                </div>
                <span className="text-[10px] tracking-tight font-semibold text-amber-700">App</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Install App Guidance Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Nagpur Materials App</h3>
                <p className="text-xs text-slate-500">Fast 1-tap ordering directly from your phone</p>
              </div>
            </div>

            {isStandalone ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center mb-4">
                <p className="text-xs font-semibold text-emerald-800">
                  🎉 App is already installed on your home screen!
                </p>
              </div>
            ) : isIOS ? (
              <div className="space-y-3 mb-4 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">How to install on iPhone / iPad:</p>
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="p-1.5 bg-white rounded shadow-xs text-amber-600">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Step 1: </span>
                    Tap the <strong>Share</strong> icon at the bottom of your Safari browser bar.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="p-1.5 bg-white rounded shadow-xs text-amber-600">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Step 2: </span>
                    Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mb-4 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">How to install on Android / Chrome:</p>
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="p-1.5 bg-white rounded shadow-xs text-amber-600">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Step 1: </span>
                    Tap the <strong>3 dots (⋮)</strong> menu in top-right of your browser.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="p-1.5 bg-white rounded shadow-xs text-amber-600">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Step 2: </span>
                    Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
