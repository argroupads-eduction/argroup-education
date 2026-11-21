import { NextRequest, NextResponse } from 'next/server';
import { CONTACT_INFO, SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants';
import {
  HOME_PAGE_H1,
  HOME_PAGE_META_DESCRIPTION,
} from '@/lib/homePageSeoContent';
import { SERVICES_FLAGSHIP } from '@/lib/servicesContent';
import { getSiteUrl } from '@/lib/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function markdownResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}

function humanizePath(pathname: string): string {
  const cleaned = pathname.replace(/^\/+|\/+$/g, '');
  if (!cleaned) return SITE_NAME;
  return cleaned
    .split('/')
    .filter(Boolean)
    .map((part) =>
      decodeURIComponent(part)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(' · ');
}

function homepageMarkdown(origin: string): string {
  const services = SERVICES_FLAGSHIP.map(
    (s) => `- **${s.title}** — ${s.tagline} (${origin}${s.href})`,
  ).join('\n');

  return [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `## ${HOME_PAGE_H1}`,
    '',
    HOME_PAGE_META_DESCRIPTION,
    '',
    '## Services',
    services,
    '',
    '## Contact',
    `- Phone: ${CONTACT_INFO.phone}`,
    `- Email: ${CONTACT_INFO.email}`,
    `- Address: ${CONTACT_INFO.address}`,
    `- Hours: ${CONTACT_INFO.hours}`,
    `- Website: ${origin}/`,
    '',
  ].join('\n');
}

export async function GET(req: NextRequest) {
  const origin = getSiteUrl().replace(/\/$/, '');
  const rawPath = req.nextUrl.searchParams.get('path') || '/';
  const pathname = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const pageUrl = normalized === '/' ? `${origin}/` : `${origin}${normalized}`;

  if (normalized === '/') {
    return markdownResponse(homepageMarkdown(origin));
  }

  const title = humanizePath(normalized);
  const body = [
    `# ${title}`,
    '',
    `URL: ${pageUrl}`,
    '',
    `Description: ${SITE_DESCRIPTION}`,
    '',
    `Site: ${SITE_NAME}`,
    '',
  ].join('\n');

  return markdownResponse(body);
}
