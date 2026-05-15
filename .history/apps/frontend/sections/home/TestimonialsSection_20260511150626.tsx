'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    university: 'Russian Medical University',
    country: 'Russia',
    review:
      'AR Group made my dream of studying MBBS abroad a reality. Their guidance was exceptional and they supported me at every step.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Rahul Patel',
    university: 'Tbilisi State Medical University',
    country: 'Georgia',
    review:
      'The team was professional, responsive, and genuinely invested in my success. Highly recommended!',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ananya Gupta',
    university: 'Almaty Medical University',
    country: 'Kazakhstan',
    review:
      'Best decision to choose AR Group. They handled all documentation smoothly and got my visa approved within weeks.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Arjun Singh',
    university: 'Bishkek National Medical Academy',
    country: 'Kyrgyzstan',
    review:
      'Affordable fees, quality education, and excellent support. Everything was perfect!',
    rating: 5,
  },
];

export const TestimonialsSection = () => {
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
            Success <span className="text-gold-500">Stories</span> from Our Students
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from students who achieved their dreams with AR Group
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.id} variants={item}>
              <Card hover className="h-full">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="text-gold-500 text-lg">
                      ★
                    </span>
                  ))}
                </div>

                {/* Review */}
                <p className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.review}"
                </p>

                {/* Author */}
                <div className="border-t pt-4">
                  <p className="font-bold text-navy-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    {testimonial.university}
                  </p>
                  <Badge variant="primary">{testimonial.country}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
