import { cmsLexicalToHtml } from './cmsLexicalToHtml';

export type PulledCmsPost = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
};

type CmsMedia = { url?: string | null } | string | number | null | undefined;

type CmsPostDoc = {
  id?: string | number;
  title?: string | null;
  slug?: string | null;
  content?: unknown;
  heroImage?: CmsMedia;
  featuredImageUrl?: string | null;
  meta?: { title?: string | null; description?: string | null } | null;
  publishedAt?: string | null;
  _status?: string | null;
};

function cmsBaseUrl(): string {
  return (
    process.env.PAYLOAD_CMS_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim().replace(/\/$/, '') ||
    'https://argroup-education-cms-livid.vercel.app'
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mediaUrl(ref: CmsMedia, base: string): string | null {
  if (!ref) return null;
  if (typeof ref === 'string') {
    if (/^https?:\/\//i.test(ref)) return ref;
    return null;
  }
  if (typeof ref === 'object' && typeof ref.url === 'string' && ref.url.trim()) {
    const url = ref.url.trim();
    if (/^https?:\/\//i.test(url)) return url;
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  }
  return null;
}

async function fetchCmsPostBySlug(slug: string): Promise<CmsPostDoc | null> {
  const base = cmsBaseUrl();
  const url = `${base}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(2_500),
  });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as { docs?: CmsPostDoc[] };
  return json.docs?.[0] ?? null;
}

function docLooksRich(doc: CmsPostDoc | null): boolean {
  if (!doc) return false;
  const root = (doc.content as { root?: { children?: unknown[] } } | undefined)?.root;
  const children = root?.children;
  return Array.isArray(children) && children.length > 1;
}

/**
 * Fetch a published post from Payload CMS REST and convert Lexical → HTML.
 * Retries once after a short delay (drafts/versions may not be fully readable yet).
 */
export async function pullPostFromPayloadCms(slug: string): Promise<PulledCmsPost | null> {
  const base = cmsBaseUrl();
  let doc = await fetchCmsPostBySlug(slug);
  if (!docLooksRich(doc)) {
    await sleep(2000);
    doc = await fetchCmsPostBySlug(slug);
  }
  if (!doc?.slug || !doc.title) return null;

  const content = cmsLexicalToHtml(doc.content, base).trim();
  const featuredImage =
    mediaUrl(doc.heroImage, base) ||
    (typeof doc.featuredImageUrl === 'string' ? doc.featuredImageUrl.trim() : null) ||
    null;

  if (content.length < 200 && !featuredImage) {
    console.warn('[payload-pull] still thin after retry', slug, content.length);
    return null;
  }

  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt =
    (typeof doc.meta?.description === 'string' && doc.meta.description.trim()) ||
    plain.slice(0, 500);

  return {
    title: doc.title,
    slug: doc.slug,
    content: content || doc.title,
    excerpt,
    featuredImage,
    metaTitle: doc.meta?.title ?? null,
    metaDescription: doc.meta?.description ?? null,
    publishedAt: doc.publishedAt ?? null,
  };
}
