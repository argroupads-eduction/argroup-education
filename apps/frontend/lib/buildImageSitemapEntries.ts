import collegeIndex from '@/data/college-image-index.json';
import { resolveBlogFeaturedImage } from '@/lib/blogFeaturedImages';
import { blogPostPath } from '@/lib/blogUtils';
import { buildSitemapEntries } from '@/lib/buildSitemapEntries';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import { extractHtmlImageUrls } from '@/lib/extractHtmlImageUrls';
import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { resolveMbbsAbroadFeaturedImage } from '@/lib/mbbsAbroadCountryImages';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';
import { resolveMbbsIndiaFeaturedImage } from '@/lib/mbbsIndiaStateImages';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import {
  getPayloadCmsServerFetchUrl,
  isPayloadCmsConfigured,
} from '@/lib/payloadCmsUrl';
import { readPayloadCms } from '@/lib/payloadCmsRead';
import { resolveInternalPath } from '@/lib/rewriteInternalLinks';
import { withServerTimeout } from '@/lib/serverTimeout';
import { toAbsoluteMediaUrl } from '@/lib/toAbsoluteMediaUrl';
import { getAllWpExportBlogPosts } from '@/lib/wpExportContent';

export type ImageSitemapImage = {
  loc: string;
  title?: string;
  caption?: string;
};

export type ImageSitemapPage = {
  pageLoc: string;
  lastmod?: string;
  images: ImageSitemapImage[];
};

const BY_SLUG = collegeIndex.bySlug as Record<string, string>;

/** Prefer human college names for Google image sitemap titles. */
const COLLEGE_TITLE_BY_SLUG: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const state of MBBS_INDIA_STATES) {
    for (const college of state.colleges) {
      if (college.slug) out[college.slug] = college.name;
    }
  }
  for (const country of MBBS_ABROAD_COUNTRIES) {
    for (const college of country.colleges ?? []) {
      if (college.slug) out[college.slug] = college.name;
    }
    for (const university of country.universities ?? []) {
      for (const college of university.colleges ?? []) {
        if (college.slug) out[college.slug] = college.name;
      }
    }
  }
  return out;
})();

function collegeImageTitle(slug: string | null | undefined, fallback?: string): string {
  if (slug && COLLEGE_TITLE_BY_SLUG[slug]) return COLLEGE_TITLE_BY_SLUG[slug];
  if (fallback?.trim()) return fallback.trim();
  if (slug) return slug.replace(/-/g, ' ');
  return 'College campus';
}

/** Marketing images keyed by page path (no UI change — crawl signals only). */
const STATIC_PAGE_IMAGES: Record<string, { src: string; title: string }[]> = {
  '/': [
    { src: '/ar-group-logo.webp', title: 'AR Group of Education logo' },
    { src: '/india-homepage.webp', title: 'MBBS in India counselling' },
    { src: '/abroad-homepage.webp', title: 'MBBS abroad counselling' },
  ],
  '/about': [{ src: '/about-counsellor.png', title: 'AR Group medical admission counsellor' }],
  '/contact': [{ src: '/lead-mbbs-doctor.png', title: 'MBBS admission counselling contact' }],
  '/services': [
    { src: '/medical-admission-counselling-hero.png', title: 'Medical admission counselling services' },
  ],
  '/neet-rank-predictor': [
    {
      src: '/wp-content/uploads/2026/04/NEET-College-Predictor-2026-768x768.png',
      title: 'NEET Rank Predictor tool',
    },
  ],
};

function pagePathFromLoc(baseUrl: string, pageLoc: string): string {
  const base = baseUrl.replace(/\/$/, '');
  if (pageLoc === base || pageLoc === `${base}/`) return '/';
  return pageLoc.startsWith(base) ? pageLoc.slice(base.length) : pageLoc;
}

function slugFromPagePath(pagePath: string): string | null {
  if (!pagePath || pagePath === '/') return null;
  const trimmed = pagePath.replace(/^\/+|\/+$/g, '');
  if (trimmed.startsWith('blog/')) return trimmed.replace(/^blog\//, '');
  return trimmed;
}

function addImage(
  bucket: Map<string, Map<string, ImageSitemapImage>>,
  pageLoc: string,
  src: string | null | undefined,
  title?: string,
  baseUrl?: string
) {
  const absolute = toAbsoluteMediaUrl(src, baseUrl);
  if (!absolute) return;

  let page = bucket.get(pageLoc);
  if (!page) {
    page = new Map();
    bucket.set(pageLoc, page);
  }

  if (!page.has(absolute)) {
    page.set(absolute, {
      loc: absolute,
      ...(title ? { title, caption: title } : {}),
    });
  }
}

async function loadWpBundlePages(): Promise<
  { slug: string; title?: string; featuredImage?: string | null; content?: string }[]
> {
  try {
    const { readFile } = await import('node:fs/promises');
    const pathMod = await import('node:path');
    const dirs = [
      pathMod.resolve(process.cwd(), 'data/wp-export-bundle'),
      pathMod.resolve(process.cwd(), '../../data/wp-export'),
    ];

    for (const dir of dirs) {
      try {
        const raw = await readFile(pathMod.join(dir, 'pages.json'), 'utf8');
        return JSON.parse(raw) as {
          slug: string;
          title?: string;
          featuredImage?: string | null;
          content?: string;
        }[];
      } catch {
        /* try next */
      }
    }
  } catch {
    /* optional */
  }
  return [];
}

async function loadWpBundlePosts(): Promise<
  { slug: string; title?: string; featuredImage?: string | null; content?: string }[]
> {
  try {
    const { readFile } = await import('node:fs/promises');
    const pathMod = await import('node:path');
    const dirs = [
      pathMod.resolve(process.cwd(), 'data/wp-export-bundle'),
      pathMod.resolve(process.cwd(), '../../data/wp-export'),
    ];

    for (const dir of dirs) {
      try {
        const raw = await readFile(pathMod.join(dir, 'posts.json'), 'utf8');
        return JSON.parse(raw) as {
          slug: string;
          title?: string;
          featuredImage?: string | null;
          content?: string;
        }[];
      } catch {
        /* try next */
      }
    }
  } catch {
    /* optional */
  }
  return [];
}

type ContentDoc = {
  slug: string;
  title?: string;
  featuredImage?: string | null;
  content?: string;
};

/** Live CMS/DB posts and pages — keeps image sitemap in sync after Payload push. */
async function loadDatabaseContentDocs(): Promise<{ posts: ContentDoc[]; pages: ContentDoc[] }> {
  if (!hasUsableDatabase()) return { posts: [], pages: [] };

  try {
    const { prisma, withPrismaRetry } = await import('@backend/lib/prisma');
    const [posts, pages] = await withPrismaRetry(() =>
      Promise.all([
        prisma.blogPost.findMany({
          where: { published: true },
          select: { slug: true, title: true, featuredImage: true, content: true },
        }),
        prisma.sitePage.findMany({
          where: { published: true },
          select: { slug: true, title: true, featuredImage: true, content: true },
        }),
      ])
    );
    return { posts, pages };
  } catch (error) {
    console.warn('[image-sitemap] Database entries skipped:', error);
    return { posts: [], pages: [] };
  }
}

type PayloadMediaDoc = {
  slug?: string | null;
  title?: string | null;
  featuredImageUrl?: string | null;
  htmlContent?: string | null;
  meta?: { image?: { url?: string | null } | string | null } | null;
  heroImage?: { url?: string | null } | string | null;
  _status?: string | null;
};

function payloadFeaturedUrl(doc: PayloadMediaDoc): string | null {
  if (typeof doc.featuredImageUrl === 'string' && doc.featuredImageUrl.trim()) {
    return doc.featuredImageUrl.trim();
  }
  const hero = doc.heroImage;
  if (typeof hero === 'string' && hero.trim()) return hero.trim();
  if (hero && typeof hero === 'object' && typeof hero.url === 'string') return hero.url;
  const metaImage = doc.meta?.image;
  if (typeof metaImage === 'string' && metaImage.trim()) return metaImage.trim();
  if (metaImage && typeof metaImage === 'object' && typeof metaImage.url === 'string') {
    return metaImage.url;
  }
  return null;
}

async function fetchPayloadCollectionForImages(
  collection: 'pages' | 'posts'
): Promise<ContentDoc[]> {
  if (!isPayloadCmsConfigured()) return [];
  const base = getPayloadCmsServerFetchUrl();
  if (!base) return [];

  const docs: ContentDoc[] = [];
  let page = 1;
  const limit = 100;

  while (page <= 50) {
    const qs = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      depth: '1',
      sort: '-updatedAt',
    });
    const result = await withServerTimeout(
      readPayloadCms(`${base}/api/${collection}?${qs.toString()}`),
      8000,
      null
    );
    if (!result?.responseOk || !result.json || typeof result.json !== 'object') break;

    const body = result.json as {
      docs?: PayloadMediaDoc[];
      hasNextPage?: boolean;
      totalPages?: number;
    };

    for (const doc of body.docs ?? []) {
      const slug = doc.slug?.trim();
      if (!slug) continue;
      if (doc._status && doc._status !== 'published') continue;
      docs.push({
        slug,
        title: doc.title ?? undefined,
        featuredImage: payloadFeaturedUrl(doc),
        content: typeof doc.htmlContent === 'string' ? doc.htmlContent : undefined,
      });
    }

    if (!body.hasNextPage && page >= (body.totalPages ?? page)) break;
    if (!(body.docs?.length)) break;
    page += 1;
  }

  return docs;
}

/** Live Payload CMS docs — images appear in sitemap as soon as editors publish. */
async function loadPayloadContentDocs(): Promise<{ posts: ContentDoc[]; pages: ContentDoc[] }> {
  if (!isPayloadCmsConfigured()) return { posts: [], pages: [] };
  try {
    const [pages, posts] = await Promise.all([
      fetchPayloadCollectionForImages('pages'),
      fetchPayloadCollectionForImages('posts'),
    ]);
    return { pages, posts };
  } catch (error) {
    console.warn('[image-sitemap] Payload CMS entries skipped:', error);
    return { posts: [], pages: [] };
  }
}

function pageLocForContentSlug(baseUrl: string, slug: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const path = resolveInternalPath(slug);
  if (path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function addContentDocImages(
  bucket: Map<string, Map<string, ImageSitemapImage>>,
  baseUrl: string,
  docs: ContentDoc[],
  pageLocForSlug: (slug: string) => string,
  resolveFeatured?: (slug: string, featured: string | null | undefined) => string | null
) {
  for (const doc of docs) {
    const slug = doc.slug?.trim();
    if (!slug) continue;
    const pageLoc = pageLocForSlug(slug);
    const featured = resolveFeatured
      ? resolveFeatured(slug, doc.featuredImage)
      : doc.featuredImage ?? null;
    if (featured) {
      addImage(bucket, pageLoc, featured, doc.title, baseUrl);
    }
    for (const src of extractHtmlImageUrls(doc.content)) {
      addImage(bucket, pageLoc, src, doc.title, baseUrl);
    }
  }
}

/** Attach hub + college images so Google can index every campus photo under its page. */
function addProgramHubImages(
  bucket: Map<string, Map<string, ImageSitemapImage>>,
  baseUrl: string
) {
  const base = baseUrl.replace(/\/$/, '');

  for (const state of MBBS_INDIA_STATES) {
    const pageLoc = `${base}${state.href}`;
    const hero = resolveMbbsIndiaFeaturedImage(state.wpSlug, null, state.colleges[0]?.image);
    if (hero) addImage(bucket, pageLoc, hero, `MBBS colleges in ${state.name}`, baseUrl);
    for (const college of state.colleges) {
      const src = college.image || (college.slug ? getCollegeImageBySlug(college.slug) : null);
      if (src) addImage(bucket, pageLoc, src, college.name, baseUrl);
      if (college.slug) {
        const collegeLoc = `${base}/${college.slug}`;
        addImage(bucket, collegeLoc, src ?? getCollegeImageBySlug(college.slug), college.name, baseUrl);
      }
    }
  }

  for (const country of MBBS_ABROAD_COUNTRIES) {
    const pageLoc = `${base}${country.href}`;
    const collegeHero =
      country.colleges?.find((c) => c.image)?.image ??
      country.universities?.flatMap((u) => u.colleges ?? []).find((c) => c.image)?.image ??
      null;
    const hero = resolveMbbsAbroadFeaturedImage(country.wpSlug, null, collegeHero);
    if (hero) addImage(bucket, pageLoc, hero, `MBBS in ${country.name}`, baseUrl);

    const colleges = [
      ...(country.colleges ?? []),
      ...(country.universities?.flatMap((u) => u.colleges ?? []) ?? []),
    ];
    for (const college of colleges) {
      const src = college.image || (college.slug ? getCollegeImageBySlug(college.slug) : null);
      if (src) addImage(bucket, pageLoc, src, college.name, baseUrl);
      if (college.slug) {
        addImage(bucket, `${base}/${college.slug}`, src ?? getCollegeImageBySlug(college.slug), college.name, baseUrl);
      }
    }

    for (const university of country.universities ?? []) {
      const uniLoc = `${base}${university.href}`;
      for (const college of university.colleges ?? []) {
        const src = college.image || (college.slug ? getCollegeImageBySlug(college.slug) : null);
        if (src) addImage(bucket, uniLoc, src, college.name, baseUrl);
      }
    }
  }
}

/**
 * Build Google image sitemap entries grouped by page URL.
 * Sources: URL sitemap pages, college image index, WP bundle, blogs, MD/MS covers.
 */
export async function buildImageSitemapEntries(baseUrl: string): Promise<ImageSitemapPage[]> {
  const base = baseUrl.replace(/\/$/, '');
  const [urlEntries, wpPages, wpPosts, blogPosts, databaseDocs, payloadDocs] = await Promise.all([
    buildSitemapEntries(baseUrl),
    loadWpBundlePages(),
    loadWpBundlePosts(),
    getAllWpExportBlogPosts(),
    loadDatabaseContentDocs(),
    loadPayloadContentDocs(),
  ]);

  const pageLastmod = new Map(urlEntries.map((e) => [e.loc, e.lastmod]));
  const bucket = new Map<string, Map<string, ImageSitemapImage>>();

  for (const entry of urlEntries) {
    const pagePath = pagePathFromLoc(baseUrl, entry.loc);
    const slug = slugFromPagePath(pagePath);

    for (const item of STATIC_PAGE_IMAGES[pagePath] ?? []) {
      addImage(bucket, entry.loc, item.src, item.title, baseUrl);
    }

    if (slug) {
      const fromIndex = getCollegeImageBySlug(slug) ?? BY_SLUG[slug];
      if (fromIndex) {
        addImage(bucket, entry.loc, fromIndex, collegeImageTitle(slug), baseUrl);
      }
    }

    if (pagePath === '/md-ms') {
      for (const item of MD_MS_NAV_ITEMS) {
        addImage(bucket, entry.loc, item.coverImage, item.label, baseUrl);
      }
    }

    const mdMsItem = MD_MS_NAV_ITEMS.find((item) => item.href === pagePath);
    if (mdMsItem) {
      addImage(bucket, entry.loc, mdMsItem.coverImage, mdMsItem.label, baseUrl);
    }
  }

  addProgramHubImages(bucket, baseUrl);

  for (const doc of wpPages) {
    const slug = doc.slug?.trim();
    if (!slug) continue;
    const pageLoc = pageLocForContentSlug(baseUrl, slug);
    if (doc.featuredImage) {
      addImage(bucket, pageLoc, doc.featuredImage, collegeImageTitle(slug, doc.title), baseUrl);
    }
    for (const src of extractHtmlImageUrls(doc.content)) {
      addImage(bucket, pageLoc, src, collegeImageTitle(slug, doc.title), baseUrl);
    }
  }

  for (const post of wpPosts) {
    const slug = post.slug?.trim();
    if (!slug) continue;
    const pageLoc = `${base}${blogPostPath(slug)}`;
    const featured = resolveBlogFeaturedImage(slug, post.featuredImage ?? null);
    if (featured) {
      addImage(bucket, pageLoc, featured, post.title, baseUrl);
    }
    for (const src of extractHtmlImageUrls(post.content)) {
      addImage(bucket, pageLoc, src, post.title, baseUrl);
    }
  }

  for (const post of blogPosts) {
    const pageLoc = `${base}${blogPostPath(post.slug)}`;
    const featured = resolveBlogFeaturedImage(post.slug, post.featuredImage ?? null);
    if (featured) {
      addImage(bucket, pageLoc, featured, post.title, baseUrl);
    }
  }

  addContentDocImages(
    bucket,
    baseUrl,
    databaseDocs.pages,
    (slug) => pageLocForContentSlug(baseUrl, slug),
  );
  addContentDocImages(
    bucket,
    baseUrl,
    databaseDocs.posts,
    (slug) => `${base}${blogPostPath(slug)}`,
    (slug, featured) => resolveBlogFeaturedImage(slug, featured),
  );
  addContentDocImages(
    bucket,
    baseUrl,
    payloadDocs.pages,
    (slug) => pageLocForContentSlug(baseUrl, slug),
  );
  addContentDocImages(
    bucket,
    baseUrl,
    payloadDocs.posts,
    (slug) => `${base}${blogPostPath(slug)}`,
    (slug, featured) => resolveBlogFeaturedImage(slug, featured),
  );

  for (const [slug, src] of Object.entries(BY_SLUG)) {
    const pageLoc = `${base}/${slug}`;
    addImage(bucket, pageLoc, src, collegeImageTitle(slug), baseUrl);
  }

  const pages: ImageSitemapPage[] = [];
  for (const [pageLoc, imagesMap] of bucket) {
    const images = [...imagesMap.values()];
    if (!images.length) continue;
    pages.push({
      pageLoc,
      lastmod: pageLastmod.get(pageLoc) ?? new Date().toISOString(),
      images,
    });
  }

  pages.sort((a, b) => a.pageLoc.localeCompare(b.pageLoc));
  return pages;
}
