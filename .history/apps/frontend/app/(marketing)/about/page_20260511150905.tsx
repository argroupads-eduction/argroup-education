import { Metadata } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'About Us - 19+ Years of Excellence',
  description: 'Learn about AR Group of Education and our mission to guide students to medical excellence.',
};

export default function AboutPage() {
  const values = [
    {
      icon: '🎯',
      title: 'Mission',
      description: 'To guide and support students in achieving their dreams of medical education excellence.',
    },
    {
      icon: '👁️',
      title: 'Vision',
      description: 'To be the most trusted education consultancy for medical aspirants globally.',
    },
    {
      icon: '💎',
      title: 'Values',
      description: 'Integrity, Excellence, Student-Centric Approach, Innovation.',
    },
  ];

  const achievements = [
    { stat: '4000+', label: 'Students Helped' },
    { stat: '500+', label: 'University Partners' },
    { stat: '19+', label: 'Years Experience' },
    { stat: '98%', label: 'Visa Success Rate' },
  ];

  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            About <span className="text-gold-500">AR Group</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Over 19 years of excellence in guiding medical students to global universities
          </p>
        </div>

        {/* Story */}
        <div className="bg-gradient-to-r from-navy-50 to-gold-50 rounded-lg p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-navy-900 mb-6">Our Story</h2>
          <p className="text-lg text-gray-700 mb-6">
            Founded in 2005, AR Group of Education began with a simple vision: to make quality medical education accessible to every deserving student. What started with a small team has now grown into India's leading education consultancy.
          </p>
          <p className="text-lg text-gray-700">
            Over the past two decades, we've successfully guided over 4000 students to premier medical universities across the globe, built partnerships with 500+ universities, and maintained a remarkable 98% visa success rate. We're not just a consultancy; we're your trusted partner in achieving your medical dreams.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-navy-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <Card key={i} hover>
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-navy-900 mb-8 text-center">Our Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gold-500 mb-2">
                  {achievement.stat}
                </div>
                <p className="text-gray-600">{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="bg-navy-50 rounded-lg p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-navy-900 mb-6">Our Team</h2>
          <p className="text-lg text-gray-700 mb-6">
            Our expert team comprises experienced education consultants, former medical professionals, and admission specialists who understand the complexities of the medical education landscape.
          </p>
          <p className="text-lg text-gray-700">
            Each team member is dedicated to providing personalized guidance and ensuring your success. We believe that every student is unique, and so should be their educational journey.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-navy-900 mb-6">
            Ready to Start Your Medical Journey?
          </h3>
          <Link href="/contact">
            <Button variant="primary" size="lg">
              Get In Touch Today
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
