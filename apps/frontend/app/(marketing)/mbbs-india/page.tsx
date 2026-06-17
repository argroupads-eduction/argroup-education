import { Metadata } from 'next';
import { MbbsIndiaHub } from '@/components/program-hub/MbbsIndiaHub';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.india;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.path },
  };
}

/** Hub index — explicit route avoids optional catch-all conflicts on Vercel. */
export default function MbbsIndiaHubPage() {
  return <MbbsIndiaHub wpContent={null} />;
}
