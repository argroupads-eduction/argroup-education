'use client';

import { useCallback, useState } from 'react';
import { testimonials } from './testimonialsData';
import { TestimonialCard } from './TestimonialCard';

const CARD_WRAPPER_CLASS =
  'group relative shrink-0 w-[min(85vw,18rem)] sm:w-72 md:w-80 z-0 hover:z-10';

export const TestimonialMarquee = () => {
  const [paused, setPaused] = useState(false);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const loopItems = [...testimonials, ...testimonials];

  return (
    <div
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-hidden"
      aria-label="Student testimonials carousel"
    >
      <div
        className="overflow-hidden px-4 sm:px-6 touch-pan-y"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
      >
        <div
          className={`testimonial-marquee-track flex w-max gap-4 sm:gap-6 ${
            paused ? 'marquee-paused' : ''
          }`}
        >
          {loopItems.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className={CARD_WRAPPER_CLASS}
              aria-hidden={index >= testimonials.length ? true : undefined}
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
