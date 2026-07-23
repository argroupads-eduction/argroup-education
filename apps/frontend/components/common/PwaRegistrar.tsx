'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Download, X } from 'lucide-react';
import { registerServiceWorker, subscribeUserToPush } from '@/lib/pwaClient';
import '@/styles/pwa-install.css';

const DISMISS_KEY = 'ar-pwa-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type BannerMode = 'android' | 'ios' | 'standalone-notify';

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

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function previewModeFromQuery(): BannerMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search).get('pwa');
    if (q === '0' || q === 'hide') return null;
    if (q === 'ios') return 'ios';
    if (q === 'notify') return 'standalone-notify';
    if (q === '1' || q === 'android' || isLocalhost()) return 'android';
  } catch {
    /* ignore */
  }
  return isLocalhost() ? 'android' : null;
}

function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
 * Desktop: high-contrast floating chip (bottom-right).
 * Mobile: slim top alert. Colors are CSS-locked so page themes cannot wash out text.
 */
export function PwaRegistrar() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<BannerMode>('android');
  const [busy, setBusy] = useState(false);
  const [iosExpanded, setIosExpanded] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const reg = await registerServiceWorker();
      if (cancelled || !reg) return;
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        void subscribeUserToPush(reg);
      }
    })();

    const preview = previewModeFromQuery();
    if (preview) {
      try {
        sessionStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
      setMode(preview);
      setVisible(true);
    }

    if (wasDismissed() && !isLocalhost()) {
      return () => {
        cancelled = true;
      };
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!isStandalone() && (!wasDismissed() || isLocalhost())) {
        setMode('android');
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBip);

    const standalone = isStandalone();
    const ios = isIosDevice();

    if (standalone) {
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default' &&
        (!wasDismissed() || isLocalhost())
      ) {
        window.setTimeout(() => {
          if (!cancelled) {
            setMode('standalone-notify');
            setVisible(true);
          }
        }, 1600);
      }
    } else if (ios && !preview) {
      window.setTimeout(() => {
        if (!cancelled && (!wasDismissed() || isLocalhost())) {
          setMode('ios');
          setVisible(true);
        }
      }, 1800);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onBip);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setStatusMsg(null);
    setIosExpanded(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) {
      setStatusMsg('Use Chrome on this device for the Install prompt.');
      return;
    }
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === 'accepted') {
        const reg = await navigator.serviceWorker.ready;
        const result = await subscribeUserToPush(reg);
        if (result.ok) dismiss();
        else {
          console.warn('[pwa]', result.message);
          setMode('standalone-notify');
          setStatusMsg('Installed — allow alerts when prompted.');
        }
      } else {
        setVisible(false);
      }
    } finally {
      setBusy(false);
    }
  }, [deferred, dismiss]);

  const enableNotifications = useCallback(async () => {
    if (isIosDevice() && !isStandalone()) {
      setIosExpanded(true);
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const result = await subscribeUserToPush(reg);
      if (result.ok) dismiss();
      else {
        console.warn('[pwa]', result.message);
        setStatusMsg('Alerts unavailable right now. Try again later.');
      }
    } finally {
      setBusy(false);
    }
  }, [dismiss]);

  if (!visible) return null;

  const showInstall = mode === 'android' && (Boolean(deferred) || isLocalhost());
  const showNotify = mode === 'standalone-notify' || (mode === 'ios' && isStandalone());
  const title =
    mode === 'standalone-notify'
      ? 'Turn on NEET alerts'
      : 'Install our app for NEET updates first';
  const body = 'Counselling dates, seat alerts & guides — straight to your phone.';
  const primaryLabel =
    mode === 'standalone-notify' ? 'Allow alerts' : mode === 'ios' ? (iosExpanded ? 'Hide steps' : 'How to add') : 'Install app';
  const onPrimary = () => {
    if (mode === 'standalone-notify') void enableNotifications();
    else if (mode === 'ios') setIosExpanded((v) => !v);
    else void installAndroid();
  };

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[120] hidden sm:block"
        role="region"
        aria-label="Install AR Group app"
      >
        <div className="pointer-events-auto pwa-install-chip">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div className="pwa-install-chip__icon" aria-hidden>
              {mode === 'standalone-notify' ? <Bell /> : <Download />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="pwa-install-chip__title">{title}</p>
              <p className="pwa-install-chip__body">{body}</p>
              {statusMsg ? <p className="pwa-install-chip__status">{statusMsg}</p> : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {(showInstall || mode === 'ios' || showNotify) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onPrimary}
                    className="pwa-install-chip__btn"
                  >
                    {primaryLabel}
                  </button>
                )}
              </div>
            </div>
            <button type="button" onClick={dismiss} className="pwa-install-chip__close" aria-label="Dismiss">
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          {mode === 'ios' && iosExpanded ? (
            <ol className="pwa-install-chip__steps">
              <li>
                1. Tap Share <IosShareIcon className="inline h-3 w-3" /> in Safari
              </li>
              <li>
                2. Tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                3. Tap <strong>Add</strong>, then open the app
              </li>
            </ol>
          ) : null}
        </div>
      </div>

      <div className="pwa-top-alert sm:hidden" role="region" aria-label="Install AR Group app">
        <div className="pwa-top-alert__row">
          <Download style={{ width: 14, height: 14, flexShrink: 0, color: '#ffca80' }} aria-hidden />
          <p className="pwa-top-alert__text">
            {mode === 'standalone-notify'
              ? 'Enable NEET counselling alerts'
              : 'Install our app for NEET updates first'}
          </p>
          <button type="button" disabled={busy} onClick={onPrimary} className="pwa-top-alert__btn">
            {mode === 'ios' ? (iosExpanded ? 'Hide' : 'Steps') : mode === 'standalone-notify' ? 'Allow' : 'Install'}
          </button>
          <button type="button" onClick={dismiss} className="pwa-top-alert__close" aria-label="Dismiss">
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {mode === 'ios' && iosExpanded ? (
          <ol className="pwa-top-alert__steps">
            <li>
              1. Tap Share <IosShareIcon className="inline h-3 w-3" /> in Safari
            </li>
            <li>
              2. Tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              3. Tap <strong>Add</strong>, then open the app
            </li>
          </ol>
        ) : null}
      </div>
    </>
  );
}
