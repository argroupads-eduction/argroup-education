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
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'id', 'title', 'role', 'aria-*', 'data-*'],
      a: ['href', 'name', 'target', 'rel', 'class', 'id', 'title'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'class', 'srcset', 'sizes'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
      td: ['colspan', 'rowspan', 'width', 'height'],
      th: ['colspan', 'rowspan', 'width', 'height'],
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
