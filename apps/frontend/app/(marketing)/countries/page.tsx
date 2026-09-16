import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FEATURED_COUNTRIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Study MBBS Abroad - Countries List',
  description: 'Explore medical universities across 9+ countries worldwide.',
};

export default function CountriesPage() {
  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Study MBBS <span className="text-gold-500">Across Global</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore top medical universities in countries around the world
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {FEATURED_COUNTRIES.map((country) => (
            <Link key={country.slug} href={`/countries/${country.slug}`}>
              <div className="rounded-lg overflow-hidden shadow-elevation-1 hover:shadow-elevation-3 transition-all hover:-translate-y-2 h-full bg-white cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-gold-500 to-navy-500 flex items-center justify-center px-6 text-center">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {country.name}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-navy-900 mb-3">
                    {country.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{country.description}</p>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {country.benefits.map((benefit, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gold-100 text-gold-800 px-3 py-1 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                  <span className="text-gold-500 font-semibold">Explore &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="navy">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
