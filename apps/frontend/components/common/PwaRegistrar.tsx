'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Download, X } from 'lucide-react';
import { registerServiceWorker, subscribeUserToPush } from '@/lib/pwaClient';

const DISMISS_KEY = 'ar-pwa-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type BannerMode = 'android' | 'ios' | 'standalone-notify';

/** Professional copy options — benefit-led for MBBS/NEET students. */
const COPY = {
  headline: 'NEET & counselling alerts on your phone',
  support:
    'Get seat updates, counselling dates, and new admission guides the moment we publish.',
} as const;

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua);
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/** iOS Safari share icon (square with upward arrow). */
function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3v11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 7l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Bottom-sheet PWA install + notification prompt.
 * - Android/Chrome: real Install via beforeinstallprompt
 * - iOS Safari: Share → Add to Home Screen steps (no fake Install button)
 * - Already installed: optional notification opt-in only
 */
export function PwaRegistrar() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<BannerMode>('android');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const reg = await registerServiceWorker();
      if (cancelled || !reg) return;

      // Keep push fresh only where permission already granted (and push is usable).
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void subscribeUserToPush(reg);
      }
    })();

    if (wasDismissed()) return () => {
      cancelled = true;
    };

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!isStandalone() && !wasDismissed()) {
        setMode('android');
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBip);

    const standalone = isStandalone();
    const ios = isIosDevice();

    if (standalone) {
      // Installed PWA — only nudge notifications if not yet granted.
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default' &&
        !wasDismissed()
      ) {
        window.setTimeout(() => {
          if (!cancelled) {
            setMode('standalone-notify');
            setVisible(true);
          }
        }, 1800);
      }
    } else if (ios) {
      window.setTimeout(() => {
        if (!cancelled && !wasDismissed()) {
          setMode('ios');
          setVisible(true);
        }
      }, 2200);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onBip);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setStatusMsg(null);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === 'accepted') {
        const reg = await navigator.serviceWorker.ready;
        const result = await subscribeUserToPush(reg);
        if (result.ok) {
          dismiss();
        } else {
          setStatusMsg(result.message || 'Installed — enable notifications when prompted.');
          setMode('standalone-notify');
        }
      } else {
        setVisible(false);
      }
    } finally {
      setBusy(false);
    }
  }, [deferred, dismiss]);

  const enableNotifications = useCallback(async () => {
    // iOS Safari tab: PushManager often fails — require Home Screen install first.
    if (isIosDevice() && !isStandalone()) {
      setStatusMsg('On iPhone, add this site to your Home Screen first, then open the app and tap Allow alerts.');
      setMode('ios');
      return;
    }

    setBusy(true);
    setStatusMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const result = await subscribeUserToPush(reg);
      if (result.ok) {
        dismiss();
      } else {
        setStatusMsg(result.message || 'Could not enable alerts. Check browser permission settings.');
      }
    } finally {
      setBusy(false);
    }
  }, [dismiss]);

  if (!visible) return null;

  const showInstall = mode === 'android' && Boolean(deferred);
  const showNotify =
    mode === 'android' || mode === 'standalone-notify' || (mode === 'ios' && isStandalone());
  // On iOS Safari (not installed): never show fake Install or premature Allow.

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[140] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2"
      role="region"
      aria-label={COPY.headline}
    >
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-gold-400/35 bg-navy-950 text-white shadow-[0_20px_50px_rgba(5,18,25,0.55)]">
        <div className="flex items-start gap-3 p-3.5 pb-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 ring-1 ring-gold-400/35">
            {mode === 'ios' ? (
              <IosShareIcon className="h-5 w-5 text-gold-300" />
            ) : mode === 'standalone-notify' ? (
              <Bell className="h-5 w-5 text-gold-300" aria-hidden />
            ) : (
              <Download className="h-5 w-5 text-gold-300" aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug tracking-tight">{COPY.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{COPY.support}</p>

            {mode === 'ios' ? (
              <ol className="mt-3 space-y-2.5 rounded-xl bg-white/[0.06] p-3 text-xs leading-snug text-slate-100">
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    1
                  </span>
                  <span className="pt-0.5">
                    Tap{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-gold-300">
                      Share <IosShareIcon className="inline h-3.5 w-3.5" />
                    </span>{' '}
                    at the bottom of Safari
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    2
                  </span>
                  <span className="pt-0.5">
                    Scroll and tap <span className="font-semibold text-gold-300">Add to Home Screen</span>
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                    3
                  </span>
                  <span className="pt-0.5">
                    Tap <span className="font-semibold text-gold-300">Add</span>, open the app icon, then
                    enable alerts
                  </span>
                </li>
              </ol>
            ) : null}

            {statusMsg ? (
              <p className="mt-2 text-[11px] leading-snug text-amber-200/95" role="status">
                {statusMsg}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {showInstall ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void installAndroid()}
                  className="inline-flex items-center rounded-full bg-gold-500 px-3.5 py-1.5 text-xs font-bold text-navy-950 disabled:opacity-60"
                >
                  Install app
                </button>
              ) : null}
              {showNotify ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void enableNotifications()}
                  className="inline-flex items-center rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Allow alerts
                </button>
              ) : null}
              {mode === 'ios' && !isStandalone() ? (
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Maybe later
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
