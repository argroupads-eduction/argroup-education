import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';
import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';

function slugFromHref(href: string): string | null {
  const trimmed = href.trim();
  const withoutHost = trimmed.replace(/^https?:\/\/(?:www\.)?argroupofeducation\.com/i, '');
  const pathOnly = withoutHost.replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '');
  if (!pathOnly) return null;
  if (!pathOnly.includes('/')) return pathOnly;
  const last = pathOnly.split('/').filter(Boolean).pop();
  return last ?? null;
}

function cleanImgAttrs(imgRest: string): string {
  return String(imgRest)
    .replace(/\ssrcset=["'][^"']*["']/gi, '')
    .replace(/\ssrc=["'][^"']*["']/gi, '')
    .replace(/\sdata-src=["'][^"']*["']/gi, '');
}

function imageForCollegeCard(slug: string | null, title?: string | null): string | null {
  const fromSlug = getCollegeImageBySlug(slug);
  if (fromSlug) return fromSlug;
  if (!title?.trim()) return null;
  const titleSlug = slugFromHref(title);
  if (titleSlug && titleSlug !== title) return getCollegeImageBySlug(titleSlug);
  return null;
}

/** Fill jkit / Elementor college card images from slug → image index. */
export function injectCollegeCardImagesInHtml(html: string, pageSlug?: string | null): string {
  if (!html) return html;

  let out = html;

  if (/\bjkit-image-box\b/i.test(out)) {
    out = out.replace(/<div class="jkit-image-box\b[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, (card) => {
      const href = card.match(/href=["']([^"']+)["']/i)?.[1] ?? '';
      const title = plainTextFromHtml(card.match(/body-title[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? '');
      const slug = slugFromHref(href);
      const image = imageForCollegeCard(slug, title);
      if (!image) return card;

      return card.replace(/<img\b([^>]*?)>/i, (match, imgRest) => {
        if (!/\ssrc=/i.test(match)) return `<img src="${image}"${cleanImgAttrs(imgRest)}>`;
        return match.replace(/\ssrc=["'][^"']*["']/i, ` src="${image}"`).replace(/\ssrcset=["'][^"']*["']/gi, '');
      });
    });

    out = out.replace(
      /(<a href=["']([^"']+)["'][^>]*>\s*<div class="image-box-header[^"]*">\s*)<img([^>]*?)>/gi,
      (match, prefix, href, imgRest) => {
        const slug = slugFromHref(href);
        const image = imageForCollegeCard(slug);
        if (!image) return match;
        return `${prefix}<img src="${image}"${cleanImgAttrs(imgRest)}>`;
      }
    );
  }

  if (pageSlug && /\bwp-university-profile\b/i.test(out)) {
    const image = getCollegeImageBySlug(pageSlug);
    if (image) {
      out = out.replace(
        /(<section[^>]*\bwp-university-profile\b[\s\S]*?<img[^>]*?\ssrc=)["'][^"']*["']/i,
        `$1"${image}"`
      );
    }
  }

  if (pageSlug) {
    const image = getCollegeImageBySlug(pageSlug);
    if (image) {
      out = out.replace(
        /(<div[^>]*\belementor-widget-image\b[\s\S]*?<img[^>]*?\ssrc=)["'][^"']*["']/i,
        `$1"${image}"`
      );
    }
  }

  return out;
}
