import { Metadata } from 'next';
import { MdMsHub } from '@/components/program-hub/MdMsHub';
import { PROGRAM_HUB_SEO } from '@/lib/programHubContent';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = PROGRAM_HUB_SEO.mdms;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.path },
  };
}

/** Hub index — explicit route avoids optional catch-all conflicts on Vercel. */
export default function MdMsHubPage() {
  return <MdMsHub wpContent={null} />;
}
