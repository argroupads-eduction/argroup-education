'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FEATURED_COUNTRIES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const CountriesSection = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="section bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Study <span className="text-gold-500">Across Global</span> Universities
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore top medical universities in 9+ countries with proven track record
          </p>
        </motion.div>

        {/* Countries Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {FEATURED_COUNTRIES.map((country) => (
            <motion.div
              key={country.slug}
              variants={item}
              className="group"
            >
              <Link href={`/countries/${country.slug}`}>
                <motion.div
                  className="rounded-lg overflow-hidden shadow-elevation-1 bg-white h-full flex flex-col"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gold-500 to-navy-500">
                    <motion.div
                      className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">
                      {country.name === 'Russia' && '🇷🇺'}
                      {country.name === 'Georgia' && '🇬🇪'}
                      {country.name === 'Kazakhstan' && '🇰🇿'}
                      {country.name === 'Kyrgyzstan' && '🇰🇬'}
                      {country.name === 'Bangladesh' && '🇧🇩'}
                      {country.name === 'Nepal' && '🇳🇵'}
                      {country.name === 'Uzbekistan' && '🇺🇿'}
                      {country.name === 'Egypt' && '🇪🇬'}
                      {country.name === 'China' && '🇨🇳'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-navy-900 mb-3">
                      {country.name}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1">
                      {country.description}
                    </p>

                    {/* Benefits */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {country.benefits.map((benefit, index) => (
                        <Badge key={index} variant="primary">
                          {benefit}
                        </Badge>
                      ))}
                    </div>

                    {/* Button */}
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="text-gold-500 font-semibold"
                    >
                      Explore → 
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <Button variant="navy" size="lg">
            View All Countries
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
