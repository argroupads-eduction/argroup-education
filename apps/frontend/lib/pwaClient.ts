'use client';

export type PushSubscribeResult = {
  ok: boolean;
  message?: string;
};

/** Convert a base64url VAPID public key to Uint8Array for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('[pwa] SW register failed', err);
    return null;
  }
}

export async function subscribeUserToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscribeResult> {
  if (!('PushManager' in window)) {
    return { ok: false, message: 'Push messaging is not supported in this browser.' };
  }
  if (!('Notification' in window)) {
    return { ok: false, message: 'Notifications are not supported in this browser.' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return {
      ok: false,
      message:
        permission === 'denied'
          ? 'Notifications are blocked. Enable them in browser settings.'
          : 'Notification permission was not granted.',
    };
  }

  let keyRes: Response;
  try {
    keyRes = await fetch('/api/push/vapid-public-key');
  } catch {
    return { ok: false, message: 'Could not reach push configuration. Try again.' };
  }

  if (!keyRes.ok) {
    console.error('[pwa] vapid-public-key', keyRes.status);
    return {
      ok: false,
      message:
        keyRes.status === 503
          ? 'Push alerts are not configured on the server yet (missing VAPID keys).'
          : 'Push configuration unavailable.',
    };
  }

  const keyJson = (await keyRes.json()) as { publicKey?: string };
  if (!keyJson.publicKey) {
    return { ok: false, message: 'Push public key missing on server.' };
  }

  let subscription: PushSubscription;
  try {
    const existing = await registration.pushManager.getSubscription();
    subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey) as BufferSource,
      }));
  } catch (err) {
    console.error('[pwa] pushManager.subscribe failed', err);
    return {
      ok: false,
      message:
        'Could not create a push subscription. On iPhone, open the Home Screen app first.',
    };
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, message: 'Incomplete push subscription from the browser.' };
  }

  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      console.error('[pwa] subscribe save failed', res.status, body);
      return {
        ok: false,
        message: body?.message || 'Could not save subscription on the server.',
      };
    }
    console.info('[pwa] push subscription saved');
    return { ok: true };
  } catch (err) {
    console.error('[pwa] subscribe POST failed', err);
    return { ok: false, message: 'Network error while saving subscription.' };
  }
}
