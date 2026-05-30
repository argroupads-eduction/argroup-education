import { prepareWpHtml } from '@/lib/wpHtmlPrepare';
import { parseContentStructure } from '@/lib/wpContentStructure';
import { AboutWpContentClient } from './AboutWpContentClient';

type AboutWpContentProps = {
  html: string;
  featuredImage?: string | null;
  title: string;
};

/** About-only WP renderer — no sidebar TOC, unique accordion + pill nav layout. */
export function AboutWpContent({ html, featuredImage, title }: AboutWpContentProps) {
  const prepared = prepareWpHtml(html, { featuredImage, title });
  const { html: structuredHtml, headings, quickFacts } = parseContentStructure(prepared);

  const sectionHeadings = headings.filter((h) => h.level === 2);

  return (
    <AboutWpContentClient
      html={structuredHtml}
      headings={sectionHeadings}
      quickFacts={quickFacts}
      title={title}
    />
  );
}
