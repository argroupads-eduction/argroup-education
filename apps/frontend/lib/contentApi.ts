import { cache } from 'react';
import {
  BLOG_SLUG_CANONICAL,
  dedupeBlogPosts,
  sortBlogPostsByNewest,
} from '@/lib/blogUtils';
import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';
import { applyMarketingPageSeo } from '@/lib/marketingPageSeo';
import { resolveBlogFeaturedImage, resolveBlogPublishedAt } from '@/lib/blogFeaturedImages';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';
import { extractFirstContentImage } from '@/lib/wpHtmlPrepare';
import { readPayloadCms } from '@/lib/payloadCmsRead';
import { getApiBaseUrl } from '@/lib/apiBase';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import { withServerTimeout } from '@/lib/serverTimeout';
import {
  getPayloadCmsBaseUrl,
  getPayloadCmsServerFetchUrl,
  isPayloadCmsConfigured,
  isBackendPrimaryContent,
} from '@/lib/payloadCmsUrl';

export type ContentType = 'post' | 'page';

export interface SiteContent {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  focusKeyword?: string | null;
  keywords?: string[];
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  schemaJson?: unknown | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  publishedAt: string;
}

function normalizeContent(doc: SiteContent): SiteContent {
  const wpResolved = resolveWpMediaUrl(doc.featuredImage);
  const fromContent =
    doc.type === 'post' && !wpResolved ? extractFirstContentImage(doc.content) : null;
  const featuredImage = resolveBlogFeaturedImage(
    doc.slug,
    wpResolved ?? (fromContent ? resolveWpMediaUrl(fromContent) : null)
  );

  return applyMarketingPageSeo({
    ...doc,
    title: plainTextFromHtml(doc.title),
    excerpt: plainTextFromHtml(doc.excerpt),
    featuredImage,
    publishedAt: resolveBlogPublishedAt(doc.slug, doc.publishedAt),
    metaTitle: doc.metaTitle ? plainTextFromHtml(doc.metaTitle) : null,
    metaDescription: doc.metaDescription ? plainTextFromHtml(doc.metaDescription) : null,
    ogTitle: doc.ogTitle ? plainTextFromHtml(doc.ogTitle) : null,
    ogDescription: doc.ogDescription ? plainTextFromHtml(doc.ogDescription) : null,
    ogImage: resolveWpMediaUrl(doc.ogImage) ?? featuredImage,
    twitterTitle: doc.twitterTitle ? plainTextFromHtml(doc.twitterTitle) : null,
    twitterDescription: doc.twitterDescription
      ? plainTextFromHtml(doc.twitterDescription)
      : null,
  });
}

function normalizeBlogItem(doc: BlogListItem): BlogListItem {
  return {
    ...doc,
    title: plainTextFromHtml(doc.title),
    excerpt: plainTextFromHtml(doc.excerpt),
    featuredImage: resolveBlogFeaturedImage(doc.slug, doc.featuredImage),
    publishedAt: resolveBlogPublishedAt(doc.slug, doc.publishedAt) ?? doc.publishedAt,
  };
}

function apiBase() {
  return getApiBaseUrl();
}

type PayloadMedia = { url?: string | null } | null | string;
type PayloadPostDoc = {
  id?: string | number;
  title?: string | null;
  slug?: string | null;
  content?: unknown;
  htmlContent?: string | null;
  featuredImageUrl?: string | null;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: PayloadMedia;
  } | null;
  heroImage?: PayloadMedia;
  publishedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  _status?: string;
  categories?: Array<{ title?: string | null } | string> | null;
};

type PayloadPageDoc = {
  id?: string | number;
  title?: string | null;
  slug?: string | null;
  htmlContent?: string | null;
  featuredImageUrl?: string | null;
  content?: unknown;
  hero?: { richText?: unknown; media?: PayloadMedia } | null;
  layout?: Array<Record<string, unknown>> | null;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: PayloadMedia;
  } | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  _status?: string;
};

function pageBodyHtmlFromPayload(doc: PayloadPageDoc): string {
  if (typeof doc.htmlContent === 'string' && doc.htmlContent.trim()) {
    return doc.htmlContent;
  }

  const parts: string[] = [];
  const heroHtml = lexicalToHtml(doc.hero?.richText);
  if (heroHtml.trim()) parts.push(heroHtml);

  if (Array.isArray(doc.layout)) {
    for (const block of doc.layout) {
      if (!block || typeof block !== 'object') continue;
      const blockType = typeof block.blockType === 'string' ? block.blockType : '';
      if (blockType === 'content' && Array.isArray(block.columns)) {
        for (const col of block.columns) {
          if (!col || typeof col !== 'object') continue;
          const colHtml = lexicalToHtml((col as { richText?: unknown }).richText);
          if (colHtml.trim()) parts.push(colHtml);
        }
      }
      if (blockType === 'mediaBlock' && block.media) {
        const url = payloadMediaToUrl(block.media as PayloadMedia);
        if (url) parts.push(`<p><img src="${url}" alt="" /></p>`);
      }
    }
  }

  return parts.join('\n');
}

function payloadDocToSiteContent(
  doc: PayloadPostDoc | PayloadPageDoc,
  type: ContentType
): SiteContent | null {
  if (!doc.slug) return null;

  const htmlContent =
    type === 'page'
      ? pageBodyHtmlFromPayload(doc as PayloadPageDoc)
      : typeof doc.htmlContent === 'string' && doc.htmlContent.trim().length > 0
        ? doc.htmlContent
        : lexicalToHtml((doc as PayloadPostDoc).content);
  if (!htmlContent.trim()) return null;

  const excerpt =
    plainTextFromHtml(doc.meta?.description || '').trim() ||
    plainTextFromHtml(htmlContent).slice(0, 220);

  const featuredFromUrl =
    typeof doc.featuredImageUrl === 'string' && doc.featuredImageUrl.trim()
      ? doc.featuredImageUrl.trim()
      : null;
  const postDoc = doc as PayloadPostDoc;
  const pageDoc = doc as PayloadPageDoc;

  return normalizeContent({
    id: String(doc.id ?? doc.slug),
    type,
    title: doc.title || doc.slug,
    slug: doc.slug,
    content: htmlContent,
    excerpt,
    featuredImage:
      featuredFromUrl ||
      payloadMediaToUrl(postDoc.heroImage || null) ||
      payloadMediaToUrl(pageDoc.hero?.media || null) ||
      payloadMediaToUrl(doc.meta?.image || null),
    metaTitle: doc.meta?.title || null,
    metaDescription: doc.meta?.description || null,
    canonicalUrl: null,
    ogTitle: doc.meta?.title || null,
    ogDescription: doc.meta?.description || null,
    ogImage: featuredFromUrl || payloadMediaToUrl(doc.meta?.image || null),
    twitterTitle: doc.meta?.title || null,
    twitterDescription: doc.meta?.description || null,
    schemaJson: null,
    publishedAt: doc.publishedAt || null,
    updatedAt: doc.updatedAt || doc.createdAt || new Date().toISOString(),
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lexicalNodeToText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;
  if (typeof n.text === 'string') return n.text;
  if (Array.isArray(n.children)) {
    return n.children.map(lexicalNodeToText).join('');
  }
  return '';
}

function lexicalTableToHtml(node: Record<string, unknown>): string {
  const rows = Array.isArray(node.children) ? node.children : [];
  if (!rows.length) return '';

  const rowHtml = rows
    .map((row) => {
      if (!row || typeof row !== 'object') return '';
      const cells = Array.isArray((row as Record<string, unknown>).children)
        ? ((row as Record<string, unknown>).children as unknown[])
        : [];
      if (!cells.length) return '';

      const cellHtml = cells
        .map((cell) => {
          if (!cell || typeof cell !== 'object') return '';
          const c = cell as Record<string, unknown>;
          const text = escapeHtml(lexicalNodeToText(c).trim());
          if (!text) return '';
          const isHeader = c.headerState === 'row' || c.headerState === 'both';
          const tag = isHeader ? 'th' : 'td';
          return `<${tag}>${text}</${tag}>`;
        })
        .join('');

      return cellHtml ? `<tr>${cellHtml}</tr>` : '';
    })
    .filter(Boolean)
    .join('');

  return rowHtml ? `<table>${rowHtml}</table>` : '';
}

function lexicalToHtml(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const root = (value as Record<string, unknown>).root as Record<string, unknown> | undefined;
  const children = Array.isArray(root?.children) ? root.children : [];
  if (!children.length) return '';

  const blocks: string[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child || typeof child !== 'object') continue;

    const n = child as Record<string, unknown>;
    const type = typeof n.type === 'string' ? n.type : '';
    const rawText = lexicalNodeToText(child).trim();
    const text = escapeHtml(rawText);
    if (!text) continue;

    // Normalize Q/A and numbered FAQ paragraphs to WP export shape; prepareWpHtml builds accordion.
    const qMatch = rawText.match(/^Q\s*(\d+)\s*[:.]\s*(.+)$/i);
    const numMatch = rawText.match(/^(\d+)\.\s+(.+)$/);
    if (type === 'paragraph' && (qMatch || numMatch)) {
      const qaItems: Array<{ num: string; q: string; a: string }> = [];
      const numberedItems: Array<{ num: string; q: string; a: string }> = [];
      let j = i;

      if (qMatch) {
        while (j < children.length) {
          const qNode = children[j] as Record<string, unknown> | undefined;
          const qText = qNode ? lexicalNodeToText(qNode).trim() : '';
          const q = qText.match(/^Q\s*(\d+)\s*[:.]\s*(.+)$/i);
          if (!q) break;

          const aNode = children[j + 1] as Record<string, unknown> | undefined;
          const aText = aNode ? lexicalNodeToText(aNode).trim() : '';
          const a = aText.match(/^(?:A\s*\d*\s*[:.]|Ans(?:wer)?\s*[:.])\s*(.+)$/i);
          if (!a) break;

          qaItems.push({
            num: q[1] || String(qaItems.length + 1),
            q: escapeHtml(q[2].trim()),
            a: escapeHtml(a[1].trim()),
          });
          j += 2;
        }
      } else {
        while (j < children.length) {
          const qNode = children[j] as Record<string, unknown> | undefined;
          const qText = qNode ? lexicalNodeToText(qNode).trim() : '';
          const q = qText.match(/^(\d+)\.\s+(.+)$/);
          if (!q) break;

          const aNode = children[j + 1] as Record<string, unknown> | undefined;
          const aText = aNode ? lexicalNodeToText(aNode).trim() : '';
          if (!aText || /^\d+\.\s+/.test(aText) || /^Q\s*\d+\s*[:.]/i.test(aText)) break;

          numberedItems.push({
            num: q[1] || String(numberedItems.length + 1),
            q: escapeHtml(q[2].trim()),
            a: escapeHtml(aText),
          });
          j += 2;
        }
      }

      const faqItems = qaItems.length >= 2 ? qaItems : numberedItems.length >= 2 ? numberedItems : [];
      if (faqItems.length >= 2) {
        const last = blocks[blocks.length - 1] ?? '';
        if (!/\bFAQs?\b/i.test(last)) {
          blocks.push('<h2><b>FAQs</b></h2>');
        }

        if (qaItems.length >= 2) {
          for (const item of faqItems) {
            blocks.push(`<p><b>Q${item.num}. ${item.q}</b></p>`);
            blocks.push(`<p><b>A${item.num}.</b> ${item.a}</p>`);
          }
        } else {
          for (const item of faqItems) {
            blocks.push(`<p><b>${item.num}. ${item.q}</b></p>`);
            blocks.push(`<p>${item.a}</p>`);
          }
        }

        i = j - 1;
        continue;
      }
    }

    // Numbered FAQ as h3/h4 headings (common in Payload editor).
    const numHeading = rawText.match(/^(\d+)\.\s+(.+)$/);
    if (type === 'heading' && numHeading) {
      const numberedItems: Array<{ num: string; q: string; a: string }> = [];
      let j = i;
      while (j < children.length) {
        const qNode = children[j] as Record<string, unknown> | undefined;
        if (!qNode || qNode.type !== 'heading') break;
        const qText = lexicalNodeToText(qNode).trim();
        const nh = qText.match(/^(\d+)\.\s+(.+)$/);
        if (!nh) break;

        const aNode = children[j + 1] as Record<string, unknown> | undefined;
        if (!aNode || aNode.type !== 'paragraph') break;
        const aText = lexicalNodeToText(aNode).trim();
        if (!aText || /^\d+\.\s+/.test(aText) || /^Q\s*\d+\s*[:.]/i.test(aText)) break;

        numberedItems.push({
          num: nh[1] || String(numberedItems.length + 1),
          q: escapeHtml(nh[2].trim()),
          a: escapeHtml(aText),
        });
        j += 2;
      }

      if (numberedItems.length >= 2) {
        const last = blocks[blocks.length - 1] ?? '';
        if (!/\bFAQs?\b/i.test(last)) {
          blocks.push('<h2><b>FAQs</b></h2>');
        }
        for (const item of numberedItems) {
          blocks.push(`<p><b>${item.num}. ${item.q}</b></p>`);
          blocks.push(`<p>${item.a}</p>`);
        }
        i = j - 1;
        continue;
      }
    }

    if (type === 'heading') {
      const tag = typeof n.tag === 'string' ? n.tag : 'h2';
      blocks.push(`<${tag}>${text}</${tag}>`);
      continue;
    }

    if (type === 'list' && Array.isArray(n.children)) {
      const items = n.children
        .map((li) => `<li>${escapeHtml(lexicalNodeToText(li).trim())}</li>`)
        .join('');
      const listTag = n.listType === 'number' ? 'ol' : 'ul';
      blocks.push(`<${listTag}>${items}</${listTag}>`);
      continue;
    }

    if (type === 'table') {
      const tableHtml = lexicalTableToHtml(n);
      if (tableHtml) {
        blocks.push(tableHtml);
      }
      continue;
    }

    blocks.push(`<p>${text}</p>`);
  }

  return blocks.filter(Boolean).join('');
}

function payloadMediaToUrl(media: PayloadMedia): string | null {
  if (!media) return null;
  const raw =
    typeof media === 'string'
      ? media
      : typeof media === 'object' && media && typeof media.url === 'string'
        ? media.url
        : null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = getPayloadCmsBaseUrl();
  return base ? `${base}${raw.startsWith('/') ? raw : `/${raw}`}` : raw;
}

async function fetchPayloadPostBySlug(slug: string): Promise<SiteContent | null> {
  if (!isPayloadCmsConfigured()) return null;
  const base = getPayloadCmsServerFetchUrl();
  if (!base) return null;

  const qs = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '2',
    limit: '1',
    draft: 'true',
  });

  try {
    const r = await readPayloadCms(`${base}/api/posts?${qs.toString()}`);
    if (!r.responseOk || !r.json || typeof r.json !== 'object') return null;
    const docs = (r.json as { docs?: PayloadPostDoc[] }).docs ?? [];
    const doc = docs[0];
    if (!doc) return null;
    return payloadDocToSiteContent(doc, 'post');
  } catch {
    return null;
  }
}

async function fetchPayloadPageBySlug(slug: string): Promise<SiteContent | null> {
  if (!isPayloadCmsConfigured()) return null;
  const base = getPayloadCmsServerFetchUrl();
  if (!base) return null;

  const qs = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '2',
    limit: '1',
    draft: 'true',
  });

  try {
    const r = await readPayloadCms(`${base}/api/pages?${qs.toString()}`);
    if (!r.responseOk || !r.json || typeof r.json !== 'object') return null;
    const docs = (r.json as { docs?: PayloadPageDoc[] }).docs ?? [];
    const doc = docs[0];
    if (!doc) return null;
    return payloadDocToSiteContent(doc, 'page');
  } catch {
    return null;
  }
}

/** Payload post or page with migrated WP HTML (preferred over static bundle when present). */
async function fetchPayloadContentBySlug(slug: string): Promise<SiteContent | null> {
  const post = await fetchPayloadPostBySlug(slug);
  if (post) return post;
  return fetchPayloadPageBySlug(slug);
}

async function fetchPayloadBlogPosts(limit = 30): Promise<BlogListItem[]> {
  if (!isPayloadCmsConfigured()) return [];
  const base = getPayloadCmsServerFetchUrl();
  if (!base) return [];

  const qs = new URLSearchParams({
    limit: String(limit),
    depth: '2',
    sort: '-publishedAt',
  });

  try {
    const r = await readPayloadCms(`${base}/api/posts?${qs.toString()}`);
    if (!r.responseOk || !r.json || typeof r.json !== 'object') return [];
    const docs = (r.json as { docs?: PayloadPostDoc[] }).docs ?? [];

    return docs
      .filter(
        (d) =>
          d &&
          typeof d.slug === 'string' &&
          d.slug.trim().length > 0 &&
          (d._status === 'published' || !d._status)
      )
      .map((doc) => {
        const htmlContent =
          typeof doc.htmlContent === 'string' && doc.htmlContent.trim()
            ? doc.htmlContent
            : lexicalToHtml(doc.content);
        const excerpt =
          plainTextFromHtml(doc.meta?.description || '').trim() ||
          plainTextFromHtml(htmlContent).slice(0, 180);
        const firstCategory = Array.isArray(doc.categories) ? doc.categories[0] : null;
        const category =
          typeof firstCategory === 'string'
            ? firstCategory
            : firstCategory?.title || 'Blog';

        const featuredFromUrl =
          typeof doc.featuredImageUrl === 'string' && doc.featuredImageUrl.trim()
            ? doc.featuredImageUrl.trim()
            : null;

        return normalizeBlogItem({
          id: String(doc.id ?? doc.slug),
          title: doc.title || doc.slug || 'Untitled',
          slug: doc.slug || '',
          excerpt,
          featuredImage:
            featuredFromUrl ||
            payloadMediaToUrl(doc.heroImage || null) ||
            payloadMediaToUrl(doc.meta?.image || null),
          category,
          publishedAt: doc.publishedAt || doc.updatedAt || doc.createdAt || new Date().toISOString(),
        });
      });
  } catch {
    return [];
  }
}

async function isContentSuppressedInBackend(slug: string): Promise<boolean> {
  if (typeof window !== 'undefined' || !hasUsableDatabase()) return false;
  try {
    const { isContentSuppressedBySlug } = await import('@backend/handlers/content');
    for (const candidate of slugLookupVariants(slug)) {
      if (await isContentSuppressedBySlug(candidate)) return true;
    }
  } catch {
    /* DB offline */
  }
  return false;
}

async function getSuppressedBlogSlugsFromBackend(): Promise<Set<string>> {
  if (typeof window !== 'undefined' || !hasUsableDatabase()) return new Set();
  try {
    const { getSuppressedBlogSlugs } = await import('@backend/handlers/content');
    return await getSuppressedBlogSlugs();
  } catch {
    return new Set();
  }
}

async function fetchBackendContentBySlug(slug: string): Promise<SiteContent | null> {
  const load = async (): Promise<SiteContent | null> => {
    if (typeof window === 'undefined' && hasUsableDatabase()) {
      try {
        const { getContentBySlug: getBackendContentBySlug } = await import(
          '@backend/handlers/content'
        );
        const result = await getBackendContentBySlug(slug);
        if ('data' in result && result.data) {
          const doc = result.data;
          return normalizeContent({
            ...doc,
            publishedAt: doc.publishedAt ? String(doc.publishedAt) : null,
            updatedAt: String(doc.updatedAt),
          });
        }
      } catch {
        /* DB offline */
      }
      return null;
    }

    try {
      const res = await fetch(`${apiBase()}/api/content/${encodeURIComponent(slug)}`, {
        ...(isBackendPrimaryContent()
          ? { cache: 'no-store' as const }
          : { next: { revalidate: 3600 } }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return normalizeContent(json.data as SiteContent);
      }
    } catch {
      /* API offline */
    }
    return null;
  };

  return withServerTimeout(load(), 6000, null);
}

async function loadBundledContent(slug: string): Promise<SiteContent | null> {
  const { getWpExportContentBySlug } = await import('@/lib/wpExportContent');
  const local = await getWpExportContentBySlug(slug);
  if (local) return normalizeContent(local);

  const { buildCollegeFallbackContent } = await import('@/lib/collegeFallbackContent');
  const fallback = buildCollegeFallbackContent(slug);
  if (fallback) return normalizeContent(fallback);

  return null;
}

function contentUpdatedAtMs(doc: SiteContent): number {
  const raw = doc.updatedAt || doc.publishedAt;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Prefer CMS/DB copy when newer; keep bundle images when synced doc has none. */
function mergeSiteContent(
  bundled: SiteContent | null,
  synced: SiteContent | null
): SiteContent | null {
  if (!bundled) return synced;
  if (!synced) return bundled;

  const winner =
    contentUpdatedAtMs(synced) >= contentUpdatedAtMs(bundled) ? synced : bundled;
  const loser = winner === synced ? bundled : synced;

  return normalizeContent({
    ...winner,
    featuredImage: winner.featuredImage ?? loser.featuredImage,
    ogImage: winner.ogImage ?? loser.ogImage,
  });
}

function slugLookupVariants(slug: string): string[] {
  const variants = new Set<string>([slug]);
  const canonical = BLOG_SLUG_CANONICAL[slug];
  if (canonical) variants.add(canonical);
  for (const [alias, target] of Object.entries(BLOG_SLUG_CANONICAL)) {
    if (target === slug) variants.add(alias);
  }
  return [...variants];
}

async function fetchSyncedContentBySlug(slug: string): Promise<SiteContent | null> {
  for (const candidate of slugLookupVariants(slug)) {
    const fromApi = await fetchBackendContentBySlug(candidate);
    if (fromApi) return fromApi;
  }

  for (const candidate of slugLookupVariants(slug)) {
    const fromPayload = await withServerTimeout(
      fetchPayloadContentBySlug(candidate),
      5000,
      null
    );
    if (fromPayload) return fromPayload;
  }

  return null;
}

export const getContentBySlug = cache(async function getContentBySlug(
  slug: string
): Promise<SiteContent | null> {
  if (await isContentSuppressedInBackend(slug)) {
    return null;
  }

  const bundled = await loadBundledContent(slug);
  const synced = await fetchSyncedContentBySlug(slug);

  if (synced || bundled) {
    return mergeSiteContent(bundled, synced);
  }

  return null;
});

function mergeBlogListItem(
  existing: BlogListItem | undefined,
  incoming: BlogListItem
): BlogListItem {
  const next = normalizeBlogItem(incoming);
  if (!existing) return next;
  const prev = normalizeBlogItem(existing);
  const nextTime = new Date(next.publishedAt).getTime();
  const prevTime = new Date(prev.publishedAt).getTime();
  const winner = nextTime >= prevTime ? next : prev;
  const loser = nextTime >= prevTime ? prev : next;
  return {
    ...winner,
    featuredImage: winner.featuredImage ?? loser.featuredImage,
  };
}


async function fetchAllBlogPostsFromApi(): Promise<BlogListItem[]> {
  // Prefer Prisma handler in-process so Next uses the same DATABASE_URL as /api/blogs
  // (avoids Express :3001 pointing at a different Neon DB during local dev).
  if (typeof window === 'undefined') {
    try {
      const { listBlogPosts } = await import('@backend/handlers/blogs');
      const items: BlogListItem[] = [];
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages && page <= 40) {
        const result = await listBlogPosts(page, 50);
        totalPages = Math.max(1, Number(result.pages) || 1);
        for (const item of result.data ?? []) {
          items.push({
            id: String(item.id),
            title: item.title,
            slug: item.slug,
            excerpt: item.excerpt,
            featuredImage: item.featuredImage,
            category: item.category,
            publishedAt:
              typeof item.publishedAt === 'string'
                ? item.publishedAt
                : new Date(item.publishedAt as string | number | Date).toISOString(),
          });
        }
        if (!(result.data?.length)) break;
        page += 1;
      }
      if (items.length) return items;
    } catch {
      /* fall through to HTTP */
    }
  }

  const items: BlogListItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 20) {
    try {
      const res = await fetch(`${apiBase()}/api/blogs?page=${page}&limit=50`, {
        ...(isBackendPrimaryContent()
          ? { cache: 'no-store' as const }
          : { next: { revalidate: 600 } }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) break;
      const json = await res.json();
      totalPages = Math.max(1, Number(json.pages) || 1);
      for (const item of json.data ?? []) {
        items.push(item as BlogListItem);
      }
      page += 1;
    } catch {
      break;
    }
  }

  return items;
}

export async function getBlogPosts(page = 1, limit = 12): Promise<{
  data: BlogListItem[];
  total: number;
  pages: number;
}> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(500, Math.max(1, limit));
  const mergedBySlug = new Map<string, BlogListItem>();
  const suppressedSlugs = await getSuppressedBlogSlugsFromBackend();

  try {
    const { getAllWpExportBlogPosts } = await import('@/lib/wpExportContent');
    for (const item of await getAllWpExportBlogPosts()) {
      if (suppressedSlugs.has(item.slug)) continue;
      mergedBySlug.set(item.slug, normalizeBlogItem(item));
    }
  } catch {
    /* bundle optional */
  }

  try {
    for (const item of await fetchAllBlogPostsFromApi()) {
      if (suppressedSlugs.has(item.slug)) continue;
      mergedBySlug.set(
        item.slug,
        mergeBlogListItem(mergedBySlug.get(item.slug), item)
      );
    }
  } catch {
    /* API optional */
  }

  // Always merge Payload when configured — CMS may be ahead of Express/Neon.
  if (isPayloadCmsConfigured()) {
    const payloadPosts = await fetchPayloadBlogPosts(200);
    for (const item of payloadPosts) {
      if (suppressedSlugs.has(item.slug)) continue;
      mergedBySlug.set(
        item.slug,
        mergeBlogListItem(mergedBySlug.get(item.slug), item)
      );
    }
  }

  const merged = sortBlogPostsByNewest(dedupeBlogPosts(Array.from(mergedBySlug.values())));
  const total = merged.length;
  const pages = Math.max(1, Math.ceil(total / safeLimit));
  const offset = (safePage - 1) * safeLimit;

  return {
    data: merged.slice(offset, offset + safeLimit),
    total,
    pages,
  };
}
