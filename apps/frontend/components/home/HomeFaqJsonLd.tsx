import { HOME_PAGE_FAQS } from '@/lib/homePageSeoContent';
import { getSiteUrl } from '@/lib/siteUrl';

const SITE = getSiteUrl();

function faqAnswerText(faq: (typeof HOME_PAGE_FAQS)[number]): string {
  if ('linkLabel' in faq && faq.linkLabel) {
    const lead = 'linkLeadIn' in faq && faq.linkLeadIn ? `${faq.linkLeadIn} ` : '';
    return `${lead}${faq.linkLabel} ${faq.answer}`.trim();
  }
  return faq.answer;
}

export function HomeFaqJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_PAGE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faqAnswerText(faq),
      },
    })),
    url: SITE,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
