import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { isJunkCollegeImage } from '@/lib/collegeImageQuality';
import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';

const PROGRAM_HUB_SLUGS = new Set([
  'md-ms',
  'mbbs-in-india',
  'study-mbbs-in-abroad',
  'mbbs-abroad',
  'about',
]);

/** CTA / utility paths — never treat these as college page slugs. */
const NON_COLLEGE_SLUGS = new Set([
  'contact',
  'about',
  'about-us',
  'blog',
  'blogs',
  'privacy-policy',
  'terms',
  'terms-and-conditions',
  'enquiry',
  'apply',
  'apply-now',
  'md-ms',
  'mbbs-in-india',
  'mbbs-abroad',
  'study-mbbs-in-abroad',
]);

function slugFromHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || /^(?:#|tel:|mailto:|javascript:)/i.test(trimmed)) return null;
  const withoutHost = trimmed.replace(/^https?:\/\/(?:www\.)?argroupofeducation\.com/i, '');
  const pathOnly = withoutHost.replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '');
  if (!pathOnly) return null;
  if (!pathOnly.includes('/')) {
    return NON_COLLEGE_SLUGS.has(pathOnly.toLowerCase()) ? null : pathOnly;
  }
  const last = pathOnly.split('/').filter(Boolean).pop() ?? null;
  if (!last || NON_COLLEGE_SLUGS.has(last.toLowerCase())) return null;
  return last;
}

function collegeHrefFromBlock(block: string): string | null {
  const hrefs = [...block.matchAll(/\bhref=["']([^"']+)["']/gi)].map((m) => m[1] ?? '');
  for (const href of hrefs) {
    const slug = slugFromHref(href);
    if (slug) return href;
  }
  return null;
}

function cleanImgAttrs(imgRest: string): string {
  return String(imgRest)
    .replace(/\ssrcset=["'][^"']*["']/gi, '')
    .replace(/\ssrc=["'][^"']*["']/gi, '')
    .replace(/\sdata-src=["'][^"']*["']/gi, '');
}

function currentSrc(imgTag: string): string {
  return imgTag.match(/\ssrc=["']([^"']*)["']/i)?.[1]?.trim() ?? '';
}

/**
 * Fill empty / placeholder / unreliable Elementor thumbs.
 * Keep real full-size WP uploads unless they fail junk checks.
 */
function needsImageInject(src: string): boolean {
  if (!src) return true;
  if (/^data:/i.test(src)) return true;
  if (/placeholder|spacer|blank\.|1x1|pixel\.gif/i.test(src)) return true;
  if (/elementor\/thumbs/i.test(src)) return true;
  if (isJunkCollegeImage(src)) return true;
  return false;
}

function slugFromPlainTitle(title: string): string | null {
  const key = title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return key || null;
}

/** Derive a college slug from a WP upload filename when heading lookup fails. */
function slugFromImageSrc(src: string): string | null {
  if (!src?.trim()) return null;
  const file = src.split('/').pop()?.split('?')[0] ?? '';
  if (!file) return null;
  let base = file.replace(/\.[^.]+$/, '');
  base = base.replace(/-scaled$/i, '');
  base = base.replace(/-\d+x\d+$/i, '');
  base = base.replace(/-[a-z0-9]{16,}$/i, '');
  return slugFromPlainTitle(base.replace(/[-_]+/g, ' '));
}

function imageForCollegeCard(slug: string | null, title?: string | null): string | null {
  const fromSlug = getCollegeImageBySlug(slug);
  if (fromSlug) return fromSlug;
  if (!title?.trim()) return null;
  const titleSlug = slugFromPlainTitle(title) || slugFromHref(title);
  if (!titleSlug || titleSlug === slug) return null;
  return getCollegeImageBySlug(titleSlug);
}

/** College name often sits in a heading widget just above the profile section. */
function headingBeforeProfile(html: string, offset: number): string {
  const before = html.slice(Math.max(0, offset - 3500), offset);
  const matches = [
    ...before.matchAll(/elementor-heading-title[^>]*>([\s\S]*?)<\/(?:h\d|div|span|a)>/gi),
  ];
  const last = matches[matches.length - 1]?.[1] ?? '';
  return plainTextFromHtml(last);
}

/** Fill jkit / Elementor college card images from slug → image index. */
export function injectCollegeCardImagesInHtml(html: string, pageSlug?: string | null): string {
  if (!html) return html;

  let out = html;

  if (/\bjkit-image-box\b/i.test(out)) {
    out = out.replace(/<div class="jkit-image-box\b[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, (card) => {
      const href = collegeHrefFromBlock(card) ?? '';
      const title = plainTextFromHtml(card.match(/body-title[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? '');
      const slug = slugFromHref(href) || slugFromPlainTitle(title);
      const image = imageForCollegeCard(slug, title);
      if (!image) return card;

      return card.replace(/<img\b([^>]*?)>/i, (match, imgRest) => {
        if (!needsImageInject(currentSrc(match))) return match;
        if (!/\ssrc=/i.test(match)) return `<img src="${image}"${cleanImgAttrs(imgRest)}>`;
        return match.replace(/\ssrc=["'][^"']*["']/i, ` src="${image}"`).replace(/\ssrcset=["'][^"']*["']/gi, '');
      });
    });

    out = out.replace(
      /(<a href=["']([^"']+)["'][^>]*>\s*<div class="image-box-header[^"]*">\s*)<img([^>]*?)>/gi,
      (match, prefix, href, imgRest) => {
        const fullImg = `<img${imgRest}>`;
        if (!needsImageInject(currentSrc(fullImg))) return match;
        const slug = slugFromHref(href);
        const image = imageForCollegeCard(slug);
        if (!image) return match;
        return `${prefix}<img src="${image}"${cleanImgAttrs(imgRest)}>`;
      }
    );
  }

  // University profiles on hub pages: always prefer deploy-stable college index images.
  if (/\bwp-university-profile\b/i.test(out)) {
    out = out.replace(
      /<section[^>]*\bwp-university-profile\b[\s\S]*?<\/section>/gi,
      (block, offset: number) => {
        const href = collegeHrefFromBlock(block) ?? '';
        const headingInside = plainTextFromHtml(
          block.match(/elementor-heading-title[^>]*>([\s\S]*?)<\/(?:h\d|div|span|a)>/i)?.[1] ?? ''
        );
        const heading = headingInside || headingBeforeProfile(out, offset);
        const alt = block.match(/<img[^>]*\salt=["']([^"']*)["']/i)?.[1] ?? '';
        const imgSrc = block.match(/<img[^>]*\ssrc=["']([^"']+)["']/i)?.[1] ?? '';
        const slug =
          slugFromHref(href) ||
          slugFromPlainTitle(heading) ||
          slugFromPlainTitle(alt) ||
          slugFromImageSrc(imgSrc);
        const image =
          imageForCollegeCard(slug, heading || alt) || getCollegeImageBySlug(slugFromImageSrc(imgSrc));
        if (!image) return block;

        // Always overwrite with indexed college art so deploy keeps the same images.
        return block.replace(/<img\b([^>]*?)>/i, (_match, imgRest) => {
          return `<img src="${image}"${cleanImgAttrs(imgRest)}>`;
        });
      }
    );
  }

  // Only on dedicated college pages — never overwrite hub first-image with hub featured art.
  if (pageSlug && !PROGRAM_HUB_SLUGS.has(pageSlug) && /\bwp-university-profile\b/i.test(out)) {
    const image = getCollegeImageBySlug(pageSlug);
    if (image) {
      out = out.replace(
        /(<section[^>]*\bwp-university-profile\b[\s\S]*?<img\b[^>]*?\ssrc=)["'][^"']*["']/i,
        (match, prefix) => {
          const src = match.slice(prefix.length).match(/^["']([^"']*)["']/)?.[1] ?? '';
          if (!needsImageInject(src)) return match;
          return `${prefix}"${image}"`;
        }
      );
    }
  }

  return out;
}
