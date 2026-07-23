import webpush from 'web-push';
import { prisma, withPrismaRetry } from './prisma';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function getVapidConfig():
  | { publicKey: string; privateKey: string; subject: string }
  | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || 'mailto:argroupads@gmail.com';
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured(): boolean {
  return getVapidConfig() != null;
}

export function getVapidPublicKey(): string | null {
  return getVapidConfig()?.publicKey ?? null;
}

function ensureWebPushConfigured(): ReturnType<typeof getVapidConfig> {
  const cfg = getVapidConfig();
  if (!cfg) return null;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  return cfg;
}

export async function upsertPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  const endpoint = input.endpoint.trim();
  const p256dh = input.p256dh.trim();
  const auth = input.auth.trim();
  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription');
  }

  return withPrismaRetry(() =>
    prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth,
        userAgent: input.userAgent?.slice(0, 500) || null,
      },
      update: {
        p256dh,
        auth,
        userAgent: input.userAgent?.slice(0, 500) || null,
      },
    })
  );
}

export async function deletePushSubscription(endpoint: string) {
  const ep = endpoint.trim();
  if (!ep) return { count: 0 };
  return withPrismaRetry(() =>
    prisma.pushSubscription.deleteMany({ where: { endpoint: ep } })
  );
}

/** Send a Web Push to all stored subscribers. Removes dead endpoints. */
export async function sendPushToAllSubscribers(
  payload: PushPayload
): Promise<{ sent: number; removed: number; skipped: boolean; reason?: string }> {
  if (!ensureWebPushConfigured()) {
    console.error(
      '[web-push] skipped — set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (and matching Amplify env)'
    );
    return { sent: 0, removed: 0, skipped: true, reason: 'vapid_not_configured' };
  }

  const rows = await withPrismaRetry(() => prisma.pushSubscription.findMany());
  if (rows.length === 0) {
    console.warn('[web-push] no subscriptions stored — users must Allow alerts after install');
    return { sent: 0, removed: 0, skipped: false, reason: 'no_subscribers' };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    tag: payload.tag || 'ar-group',
  });

  let sent = 0;
  let removed = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
          { TTL: 60 * 60 * 12, urgency: 'high' }
        );
        sent += 1;
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'statusCode' in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        // Gone / expired subscription
        if (status === 404 || status === 410) {
          await withPrismaRetry(() =>
            prisma.pushSubscription.deleteMany({ where: { id: row.id } })
          );
          removed += 1;
        } else {
          console.error('[web-push] send failed', status || err);
        }
      }
    })
  );

  console.info('[web-push] done', { sent, removed, total: rows.length });
  return { sent, removed, skipped: false };
}

export async function notifyNewBlogPush(opts: {
  title: string;
  slug: string;
  excerpt?: string;
}) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com').replace(
    /\/$/,
    ''
  );
  const url = `${site}/blog/${encodeURIComponent(opts.slug)}`;
  const body =
    (opts.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 140) ||
    'New blog from AR Group of Education — tap to read.';

  return sendPushToAllSubscribers({
    title: opts.title.slice(0, 80) || 'New blog published',
    body,
    url,
    tag: `blog-${opts.slug}`,
  });
}

export async function notifySiteUpdatePush(opts: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  return sendPushToAllSubscribers({
    title: opts.title.slice(0, 80),
    body: opts.body.slice(0, 180),
    url: opts.url || '/',
    tag: opts.tag || 'site-update',
  });
}
