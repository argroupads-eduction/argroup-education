import collegeIndex from '@/data/college-image-index.json';
import { BLOG_FEATURED_IMAGES } from '@/lib/blogFeaturedImages';
import { blogPostPath } from '@/lib/blogUtils';
import { buildSitemapEntries } from '@/lib/buildSitemapEntries';
import { extractHtmlImageUrls } from '@/lib/extractHtmlImageUrls';
import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
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

/** Marketing images keyed by page path (no UI change — crawl signals only). */
const STATIC_PAGE_IMAGES: Record<string, { src: string; title: string }[]> = {
  '/': [
    { src: '/ar-group-logo.png', title: 'AR Group of Education logo' },
    { src: '/india-homepage.jpg', title: 'MBBS in India counselling' },
    { src: '/abroad-homepage.jpg', title: 'MBBS abroad counselling' },
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

/**
 * Build Google image sitemap entries grouped by page URL.
 * Sources: URL sitemap pages, college image index, WP bundle, blogs, MD/MS covers.
 */
export async function buildImageSitemapEntries(baseUrl: string): Promise<ImageSitemapPage[]> {
  const [urlEntries, wpPages, wpPosts, blogPosts] = await Promise.all([
    buildSitemapEntries(baseUrl),
    loadWpBundlePages(),
    loadWpBundlePosts(),
    getAllWpExportBlogPosts(),
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
        addImage(bucket, entry.loc, fromIndex, slug.replace(/-/g, ' '), baseUrl);
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

  for (const doc of wpPages) {
    const slug = doc.slug?.trim();
    if (!slug) continue;
    const pageLoc = `${baseUrl.replace(/\/$/, '')}/${slug}`;
    if (doc.featuredImage) {
      addImage(bucket, pageLoc, doc.featuredImage, doc.title, baseUrl);
    }
    for (const src of extractHtmlImageUrls(doc.content)) {
      addImage(bucket, pageLoc, src, doc.title, baseUrl);
    }
  }

  for (const post of wpPosts) {
    const slug = post.slug?.trim();
    if (!slug) continue;
    const pageLoc = `${baseUrl.replace(/\/$/, '')}${blogPostPath(slug)}`;
    const featured = BLOG_FEATURED_IMAGES[slug] ?? post.featuredImage ?? null;
    if (featured) {
      addImage(bucket, pageLoc, featured, post.title, baseUrl);
    }
    for (const src of extractHtmlImageUrls(post.content)) {
      addImage(bucket, pageLoc, src, post.title, baseUrl);
    }
  }

  for (const post of blogPosts) {
    const pageLoc = `${baseUrl.replace(/\/$/, '')}${blogPostPath(post.slug)}`;
    const featured = BLOG_FEATURED_IMAGES[post.slug] ?? post.featuredImage ?? null;
    if (featured) {
      addImage(bucket, pageLoc, featured, post.title, baseUrl);
    }
  }

  for (const [slug, src] of Object.entries(BY_SLUG)) {
    const pageLoc = `${baseUrl.replace(/\/$/, '')}/${slug}`;
    if (!pageLastmod.has(pageLoc)) continue;
    addImage(bucket, pageLoc, src, slug.replace(/-/g, ' '), baseUrl);
  }

  const pages: ImageSitemapPage[] = [];
  for (const [pageLoc, imagesMap] of bucket) {
    const images = [...imagesMap.values()];
    if (!images.length) continue;
    pages.push({
      pageLoc,
      lastmod: pageLastmod.get(pageLoc),
      images,
    });
  }

  pages.sort((a, b) => a.pageLoc.localeCompare(b.pageLoc));
  return pages;
}
