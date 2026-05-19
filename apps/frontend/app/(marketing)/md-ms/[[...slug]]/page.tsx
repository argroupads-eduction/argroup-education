import { Metadata } from 'next';

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

function formatSlug(parts?: string[]) {
  if (!parts || parts.length === 0) return 'MD/MS';
  return parts
    .map((part) =>
      part
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' - ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = formatSlug(slug);
  return {
    title: `${section} | AR Group of Education`,
    description: `Explore guidance and counselling resources for ${section}.`,
  };
}

export default async function MdMsPage({ params }: PageProps) {
  const { slug } = await params;
  const section = formatSlug(slug);

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-navy-900">{section}</h1>
      <p className="mt-4 text-gray-700">
        Detailed content for this route is being prepared. You can still request free counselling
        from our team for personalized admission support.
      </p>
    </section>
  );
}
