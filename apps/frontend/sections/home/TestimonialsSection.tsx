'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, Star } from 'lucide-react';
import type { GoogleReviewsSummary } from '@/lib/googleReviews/types';
import { TestimonialMarquee } from './TestimonialMarquee';

const DEFAULT_SUMMARY: GoogleReviewsSummary = {
  placeId: '',
  placeName: 'A R Group of Education',
  rating: 4.2,
  totalReviews: 115,
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=A+R+Group+of+Education+Sector+18+Noida',
  address: 'Sector 18, Noida, Uttar Pradesh',
};

export const TestimonialsSection = () => {
  const [summary, setSummary] = useState<GoogleReviewsSummary>(DEFAULT_SUMMARY);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) setSummary(data.summary);
      })
      .catch(() => {});
  }, []);

  const ratingLabel = summary.rating > 0 ? summary.rating.toFixed(1) : '4.2';
  const countLabel = summary.totalReviews > 0 ? summary.totalReviews : 115;

  return (
    <section className="section overflow-x-hidden bg-gray-50" aria-labelledby="testimonials-title">
      <div className="max-w-7xl mx-auto min-w-0 px-4 sm:px-6">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-600 mb-3">
            Google reviews
          </p>
          <h2
            id="testimonials-title"
            className="text-balance text-2xl sm:text-4xl md:text-5xl font-bold text-navy-900 mb-3 md:mb-4 px-1"
          >
            Success <span className="text-gold-500">Stories</span> from Our Students
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2 mb-5">
            Real reviews from families who trusted AR Group for MBBS in India and abroad
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-white px-4 py-2 shadow-sm"
              aria-label={`${ratingLabel} stars from ${countLabel} Google reviews`}
            >
              <span className="flex gap-0.5 text-gold-500" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(summary.rating) ? 'fill-current' : 'fill-none opacity-35'}`}
                  />
                ))}
              </span>
              <span className="text-sm font-bold text-navy-900">{ratingLabel}</span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm font-semibold text-gray-700">{countLabel} Google reviews</span>
            </div>
            <Link
              href={summary.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="program-hub-btn-primary inline-flex items-center gap-2 text-sm"
            >
              View on Google
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </div>

      <TestimonialMarquee />
    </section>
  );
};
