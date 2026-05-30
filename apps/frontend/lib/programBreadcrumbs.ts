import { MBBS_INDIA_STATES } from '@/lib/mbbsIndiaTree';
import { MBBS_ABROAD_COUNTRIES } from '@/lib/mbbsAbroadTree';
import { dedupeLinks } from '@/lib/decodeHtmlEntities';
import type { BreadcrumbItem } from '@/components/content/ContentBreadcrumbs';

export type ProgramContext = {
  program: 'india' | 'abroad';
  breadcrumbs: BreadcrumbItem[];
  theme: 'india' | 'abroad';
  badge: string;
  relatedTitle: string;
  relatedLinks: { label: string; href: string }[];
};

export function findProgramContextBySlug(slug: string): ProgramContext | null {
  for (const state of MBBS_INDIA_STATES) {
    const college = state.colleges.find((c) => c.slug === slug);
    if (college) {
      return {
        program: 'india',
        theme: 'india',
        badge: 'MBBS in India',
        breadcrumbs: [
          { label: 'MBBS India', href: '/mbbs-india' },
          { label: state.name, href: state.href },
          { label: college.name },
        ],
        relatedTitle: 'More colleges in this state',
        relatedLinks: dedupeLinks(
          state.colleges
            .filter((c) => c.slug !== slug)
            .slice(0, 12)
            .map((c) => ({ label: c.name, href: c.href }))
        ),
      };
    }
  }

  for (const country of MBBS_ABROAD_COUNTRIES) {
    if (country.colleges) {
      const college = country.colleges.find((c) => c.slug === slug);
      if (college) {
        return {
          program: 'abroad',
          theme: 'abroad',
          badge: 'MBBS Abroad',
          breadcrumbs: [
            { label: 'MBBS Abroad', href: '/mbbs-abroad' },
            { label: country.name, href: country.href },
            { label: college.name },
          ],
          relatedTitle: `More universities in ${country.name}`,
          relatedLinks: dedupeLinks(
            country.colleges
              .filter((c) => c.slug !== slug)
              .slice(0, 12)
              .map((c) => ({ label: c.name, href: c.href }))
          ),
        };
      }
    }

    for (const uni of country.universities ?? []) {
      const college = uni.colleges?.find((c) => c.slug === slug);
      if (college) {
        return {
          program: 'abroad',
          theme: 'abroad',
          badge: 'MBBS Abroad',
          breadcrumbs: [
            { label: 'MBBS Abroad', href: '/mbbs-abroad' },
            { label: country.name, href: country.href },
            { label: uni.name, href: uni.href },
            { label: college.name },
          ],
          relatedTitle: `More colleges under ${uni.name}`,
          relatedLinks: dedupeLinks(
            (uni.colleges ?? [])
              .filter((c) => c.slug !== slug)
              .slice(0, 12)
              .map((c) => ({ label: c.name, href: c.href }))
          ),
        };
      }
    }
  }

  return null;
}
