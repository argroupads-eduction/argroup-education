'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Testimonial } from './testimonialsData';

type TestimonialCardProps = {
  testimonial: Testimonial;
  className?: string;
};

export const TestimonialCard = ({ testimonial, className = '' }: TestimonialCardProps) => (
  <Card
    hover={false}
    className={`h-full flex flex-col transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:shadow-lg group-hover:scale-[1.02] pointer-events-auto ${className}`}
  >
    <StarRating rating={testimonial.rating} />
    <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 italic leading-relaxed line-clamp-5 flex-1">
      &ldquo;{testimonial.review}&rdquo;
    </p>
    <div className="border-t pt-3 sm:pt-4 mt-auto">
      <p className="font-bold text-navy-900 text-sm sm:text-base">{testimonial.name}</p>
      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{testimonial.university}</p>
      <Badge variant="primary">{testimonial.country}</Badge>
    </div>
  </Card>
);

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-3 sm:mb-4" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <span key={i} className="text-gold-500 text-base sm:text-lg" aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}
