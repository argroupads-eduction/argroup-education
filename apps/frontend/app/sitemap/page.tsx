import { Metadata } from 'next';
import Link from 'next/link';
import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';
import { getSiteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Sitemap | AR Group of Education',
  description:
    'Browse all AR Group of Education website pages — MBBS India, MBBS Abroad destinations, predictors, counselling, and legal pages.',
  alternates: {
    canonical: `${getSiteUrl()}/sitemap`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

type SitemapLink = { title: string; href: string };
type SitemapSection = { category: string; links: SitemapLink[] };

function buildSitemapSections(): SitemapSection[] {
  return [
    {
      category: 'Main Pages',
      links: [
        { title: 'Home', href: '/' },
        { title: 'About Us', href: '/about' },
        { title: 'Services', href: '/services' },
        { title: 'Contact', href: '/contact' },
        { title: 'Blog & Updates', href: '/blog' },
      ],
    },
    {
      category: 'Programs & Tools',
      links: [
        { title: 'MBBS in India', href: '/mbbs-india' },
        { title: 'MBBS Abroad', href: '/mbbs-abroad' },
        { title: 'MD / MS', href: '/md-ms' },
        { title: 'NEET Rank Predictor', href: '/neet-rank-predictor' },
        { title: 'College Predictor', href: '/college-predictor' },
        { title: 'NEET UG Counselling', href: '/neet-ug-counselling' },
        { title: 'NEET PG Counselling', href: '/neet-pg-counselling' },
      ],
    },
    {
      category: 'MBBS Abroad Destinations',
      links: [
        { title: 'All MBBS Abroad', href: '/mbbs-abroad' },
        ...MBBS_ABROAD_COUNTRIES.map((c) => ({
          title: `MBBS in ${c.name}`,
          href: c.href,
        })),
      ],
    },
    {
      category: 'MBBS in India (States)',
      links: [
        { title: 'All MBBS India', href: '/mbbs-india' },
        ...MBBS_INDIA_STATES.map((s) => ({
          title: s.name,
          href: s.href,
        })),
      ],
    },
    {
      category: 'Legal',
      links: [
        { title: 'Privacy Policy', href: '/privacy' },
        { title: 'Terms & Conditions', href: '/terms' },
        { title: 'Disclaimer', href: '/disclaimer' },
      ],
    },
  ];
}

export default function SitemapPage() {
  const sections = buildSitemapSections();

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-4 text-4xl font-bold text-navy-900 md:text-5xl">Sitemap</h1>
        <p className="mb-10 max-w-2xl text-base text-gray-600 md:text-lg">
          Explore AR Group of Education in one place — programmes, destinations, counselling tools, and
          key site pages, organised so you can jump straight to what you need.
        </p>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.category}>
              <h2 className="mb-4 text-lg font-bold text-navy-900">{section.category}</h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.category}-${link.href}-${link.title}`}>
                    <Link
                      href={link.href}
                      className="text-gray-600 transition-colors hover:text-gold-500"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
