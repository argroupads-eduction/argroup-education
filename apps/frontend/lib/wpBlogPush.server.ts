import { prisma, withPrismaRetry } from '@backend/lib/prisma';
import { notifyNewBlogPush } from '@backend/lib/webPush';
import { revalidateAfterContentSync } from '@/lib/revalidateSite';
import { fetchWpPublishedPost, fetchWpPublishedPosts } from '@/lib/wpApi';

const LOG_SLUG = 'wp-blog-push-sent';
const FRESH_MS = 36 * 60 * 60 * 1000;

type PushLog = { seeded: boolean; slugs: string[] };

function asLog(data: unknown): PushLog {
  const row = data && typeof data === 'object' ? (data as { seeded?: unknown; slugs?: unknown }) : {};
  const slugs = Array.isArray(row.slugs)
    ? row.slugs.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : [];
  return { seeded: row.seeded === true, slugs };
}

async function readLog(): Promise<PushLog> {
  const row = await withPrismaRetry(() =>
    prisma.siteGlobal.findUnique({ where: { slug: LOG_SLUG } })
  );
  return asLog(row?.data);
}

async function writeLog(log: PushLog) {
  const slugs = log.slugs.slice(-400);
  await withPrismaRetry(() =>
    prisma.siteGlobal.upsert({
      where: { slug: LOG_SLUG },
      create: { slug: LOG_SLUG, data: { seeded: log.seeded, slugs } },
      update: { data: { seeded: log.seeded, slugs } },
    })
  );
}

async function claimSlug(slug: string): Promise<boolean> {
  const log = await readLog();
  if (log.slugs.includes(slug)) return false;
  log.slugs.push(slug);
  log.seeded = true;
  await writeLog(log);
  return true;
}

async function pushOne(post: { title: string; slug: string; excerpt: string }) {
  const log = await readLog();
  if (log.slugs.includes(post.slug)) {
    return { slug: post.slug, skipped: true as const, reason: 'already_sent' };
  }

  const push = await notifyNewBlogPush({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
  });
  if (push.skipped && push.reason === 'vapid_not_configured') {
    console.error('[wp-push] not sent — VAPID keys missing', post.slug);
    return { slug: post.slug, skipped: true as const, reason: push.reason, push };
  }

  await claimSlug(post.slug);
  revalidateAfterContentSync({ slug: post.slug, type: 'post' });
  console.info('[wp-push] sent', post.slug, push);
  return { slug: post.slug, skipped: false as const, push };
}

/**
 * First run records current WordPress posts without alerting.
 * Later runs alert subscribers only for posts that were not in that list.
 */
export async function notifyNewWordpressPosts() {
  const posts = await fetchWpPublishedPosts(8);
  if (!posts?.length) return { ok: false as const, reason: 'wp_unavailable' };

  const log = await readLog();
  if (!log.seeded) {
    await writeLog({
      seeded: true,
      slugs: [...new Set([...log.slugs, ...posts.map((p) => p.slug)])],
    });
    console.info('[wp-push] seeded', posts.length);
    return { ok: true as const, seeded: true, notified: [] as string[] };
  }

  const cutoff = Date.now() - FRESH_MS;
  const notified: string[] = [];
  for (const post of posts) {
    if (log.slugs.includes(post.slug)) continue;
    const publishedAt = post.publishedAt instanceof Date ? post.publishedAt.getTime() : 0;
    if (publishedAt && publishedAt < cutoff) {
      await claimSlug(post.slug);
      continue;
    }
    const result = await pushOne(post);
    if (!result.skipped) notified.push(post.slug);
  }
  return { ok: true as const, seeded: false, notified };
}

export async function notifyWordpressPostByRef(ref: { slug?: string; id?: number }) {
  const post = await fetchWpPublishedPost(ref);
  if (!post?.slug) return { ok: false as const, reason: 'not_published' };
  const result = await pushOne(post);
  return { ok: true as const, ...result };
}
