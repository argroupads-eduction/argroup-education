import { getCollegeImageBySlug } from '@/lib/collegeImageIndex';

function slugFromHref(href: string): string | null {
  const trimmed = href.trim();
  const withoutHost = trimmed.replace(/^https?:\/\/(?:www\.)?argroupofeducation\.com/i, '');
  const pathOnly = withoutHost.replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '');
  if (!pathOnly || pathOnly.includes('/')) {
    const last = pathOnly.split('/').filter(Boolean).pop();
    return last ?? null;
  }
  return pathOnly;
}

/** Fill jkit / Elementor college card images from slug → image index. */
export function injectCollegeCardImagesInHtml(html: string, pageSlug?: string | null): string {
  if (!html) return html;

  let out = html;

  if (/\bjkit-image-box\b/i.test(out)) {
    out = out.replace(
      /(<a href=["']([^"']+)["'][^>]*>\s*<div class="image-box-header[^"]*">\s*)<img([^>]*?)>/gi,
      (match, prefix, href, imgRest) => {
        const slug = slugFromHref(href);
        const image = getCollegeImageBySlug(slug);
        if (!image) return match;
        const cleaned = String(imgRest)
          .replace(/\ssrcset=["'][^"']*["']/gi, '')
          .replace(/\ssrc=["'][^"']*["']/gi, '');
        return `${prefix}<img src="${image}"${cleaned}>`;
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

  return out;
}
