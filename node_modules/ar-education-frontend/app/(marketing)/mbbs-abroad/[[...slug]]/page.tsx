import { Metadata } from 'next';

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

function formatSlug(parts?: string[]) {
  if (!parts || parts.length === 0) return 'MBBS Abroad';
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

export default async function MbbsAbroadPage({ params }: PageProps) {
  const { slug } = await params;
  const section = formatSlug(slug);

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden flex items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          {/* Header Badge */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-2 text-white text-sm font-semibold inline-flex items-center gap-2">
              <span className="text-2xl">✨</span>
              MBBS Abroad - Global Pathways
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center space-y-6">
            <p className="text-sm text-white/60">{section}</p>
            {/* "Abroad" in orange */}
            <h1 className="text-7xl md:text-8xl font-bold">
              <span className="text-orange-400">Abroad</span>
            </h1>

            {/* "Study MBBS - World-Class Universities" */}
            <div className="space-y-2">
              <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Study MBBS
              </h2>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                World-Class Universities
              </h2>
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mt-8">
              Pursue your medical dreams at prestigious international universities with globally recognized degrees
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <button className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Explore Countries
              </button>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Free Counselling
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured College Section */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="text-sm font-semibold tracking-wider mb-4 opacity-90">
              FEATURED COLLEGE (ABROAD)
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Al-Farabi Kazakh National University
            </h3>
            <p className="text-white/80 mb-6 max-w-2xl">
              One of the leading universities in Central Asia, offering world-class MBBS education with modern facilities and experienced faculty.
            </p>
            <button className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">Why Study MBBS Abroad?</h2>
        <p className="text-gray-700 mb-8">
          Detailed content for this route is being prepared. You can still request free counselling from our team for personalized admission support.
        </p>
      </section>
    </>
  );
}
