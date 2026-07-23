'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { registerServiceWorker, subscribeUserToPush } from '@/lib/pwaClient';

const DISMISS_KEY = 'ar-pwa-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/**
 * Registers the service worker, shows an Install app banner when available,
 * and opts the user into Web Push after install / allow.
 */
export function PwaRegistrar() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const reg = await registerServiceWorker();
      if (cancelled || !reg) return;

      // Already installed / permission granted → keep push subscription fresh.
      if (Notification.permission === 'granted') {
        void subscribeUserToPush(reg);
      }
    })();

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
      } catch {
        /* ignore */
      }
      if (!isStandalone()) setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);

    // iOS has no beforeinstallprompt — show Share → Add to Home Screen tip once.
    if (isIos() && !isStandalone()) {
      try {
        if (sessionStorage.getItem(DISMISS_KEY) !== '1') {
          window.setTimeout(() => {
            if (!cancelled) {
              setIosHint(true);
              setVisible(true);
            }
          }, 2500);
        }
      } catch {
        /* ignore */
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onBip);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setIosHint(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      if (choice.outcome === 'accepted') {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) void subscribeUserToPush(reg);
      }
      return;
    }
    if (iosHint) {
      // Keep tip visible until user dismisses — they must use Share sheet.
      return;
    }
  }, [deferred, iosHint]);

  const enableNotifications = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const ok = await subscribeUserToPush(reg);
    if (ok) dismiss();
  }, [dismiss]);

  if (!visible || isStandalone()) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[130] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label="Install AR Group app"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-gold-400/30 bg-navy-900 p-3.5 text-white shadow-[0_16px_48px_rgba(5,18,25,0.45)]">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 ring-1 ring-gold-400/30">
          <Download className="h-5 w-5 text-gold-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">Install AR Group app</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-300">
            {iosHint
              ? 'Tap Share, then “Add to Home Screen” for a full-screen app and updates.'
              : 'Install on your phone, tablet or desktop — get alerts for new blogs and site updates.'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {deferred ? (
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex items-center rounded-full bg-gold-500 px-3.5 py-1.5 text-xs font-bold text-navy-950"
              >
                Install
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void enableNotifications()}
              className="inline-flex items-center rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              Allow notifications
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
