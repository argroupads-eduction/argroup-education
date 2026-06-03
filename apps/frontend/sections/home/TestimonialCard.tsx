'use client';

import Image from 'next/image';
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
    <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
      <StarRating rating={testimonial.rating} />
      {testimonial.source === 'google' ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          <GoogleMark />
          Google
        </span>
      ) : null}
    </div>
    <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 italic leading-relaxed line-clamp-6 flex-1">
      &ldquo;{testimonial.review}&rdquo;
    </p>
    <div className="border-t pt-3 sm:pt-4 mt-auto flex items-center gap-3">
      {testimonial.authorPhotoUrl ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-200/60">
          <Image
            src={testimonial.authorPhotoUrl}
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="font-bold text-navy-900 text-sm sm:text-base truncate">{testimonial.name}</p>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{testimonial.university}</p>
        <Badge variant="primary">{testimonial.country}</Badge>
      </div>
    </div>
  </Card>
);

function StarRating({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-base sm:text-lg ${i < full ? 'text-gold-500' : 'text-gray-300'}`}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
