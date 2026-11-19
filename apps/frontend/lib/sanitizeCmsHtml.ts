import sanitizeHtml from 'sanitize-html';

/**
 * Strip XSS vectors from migrated WordPress / CMS HTML while keeping layout tags.
 */
export function sanitizeCmsHtml(html: string): string {
  if (!html?.trim()) return '';

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'figure',
      'figcaption',
      'picture',
      'source',
      'video',
      'audio',
      'iframe',
      'section',
      'article',
      'header',
      'footer',
      'nav',
      'main',
      'details',
      'summary',
      'button',
      // Elementor / Font Awesome icon SVGs in checklist & benefit cards
      'svg',
      'path',
      'g',
      'use',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'id', 'title', 'role', 'aria-*', 'data-*'],
      a: ['href', 'name', 'target', 'rel', 'class', 'id', 'title'],
      button: ['type', 'class', 'data-open-lead-capture'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'class', 'srcset', 'sizes'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
      td: ['colspan', 'rowspan', 'width', 'height', 'data-label', 'class'],
      th: ['colspan', 'rowspan', 'width', 'height', 'data-label', 'class'],
      svg: ['viewBox', 'xmlns', 'width', 'height', 'fill', 'stroke', 'class', 'aria-hidden', 'role'],
      path: ['d', 'fill', 'stroke', 'stroke-width', 'class'],
      use: ['href', 'xlink:href'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowVulnerableTags: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
      }),
    },
  });
}
