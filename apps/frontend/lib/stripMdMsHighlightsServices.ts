/**
 * Remove "Highlights 2026" + "Our Services" blocks from MD/MS hub HTML.
 * Live WP still has them; strip at render until CMS is updated.
 */
export function stripMdMsHighlightsServicesHtml(html: string): string {
  if (!html) return html;
  if (!html.includes('Highlights 2026') && !html.includes('Our Services')) return html;

  const hi = html.indexOf('Highlights 2026');
  if (hi < 0) return html;

  const start = html.lastIndexOf('<section', hi);
  if (start < 0) return html;

  // Next major section after the services cluster (stable Elementor id on live + export).
  const nextMarkers = [
    'elementor-element-0deecd4',
    'MD/MS Course Duration and Structure',
  ];

  let end = -1;
  for (const marker of nextMarkers) {
    const idx = html.indexOf(marker, hi);
    if (idx < 0) continue;
    const sec = html.lastIndexOf('<section', idx);
    if (sec > start) {
      end = sec;
      break;
    }
  }

  if (end < 0) {
    // Fallback: cut through the section that contains "Post Admission"
    const post = html.indexOf('Post Admission', hi);
    if (post < 0) return html;
    const close = html.indexOf('</section>', post);
    if (close < 0) return html;
    end = close + '</section>'.length;
  }

  return html.slice(0, start) + html.slice(end);
}
