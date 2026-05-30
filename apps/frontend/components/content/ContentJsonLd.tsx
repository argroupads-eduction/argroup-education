import type { SiteContent } from '@/lib/contentApi';
import { plainTitle, metaDescriptionFromContent } from '@/lib/wpHtmlPrepare';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

type ContentJsonLdProps = {
  content: Pick<
    SiteContent,
    'title' | 'slug' | 'excerpt' | 'content' | 'featuredImage' | 'publishedAt' | 'updatedAt' | 'type'
  >;
  breadcrumbs?: { label: string; href?: string }[];
};

export function ContentJsonLd({ content, breadcrumbs }: ContentJsonLdProps) {
  const title = plainTitle(content.title);
  const description = metaDescriptionFromContent(content.excerpt, content.content);
  const url = `${SITE_URL}/${content.slug}`;
  const isArticle = content.type === 'post';

  const graph: Record<string, unknown>[] = [
    {
      '@type': isArticle ? 'Article' : 'WebPage',
      '@id': `${url}#content`,
      url,
      name: title,
      headline: title,
      description,
      datePublished: content.publishedAt ?? undefined,
      dateModified: content.updatedAt ?? undefined,
      image: content.featuredImage ?? undefined,
      publisher: {
        '@type': 'Organization',
        name: 'AR Group of Education',
        url: SITE_URL,
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
  ];

  if (breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        ...breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: b.label,
          ...(b.href ? { item: `${SITE_URL}${b.href}` } : {}),
        })),
      ],
    });
  }

  const schema = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
