import { Metadata } from 'next';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch',
  description: 'Contact AR Group of Education for free consultation and guidance.',
};

export default function ContactPage() {
  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Get In <span className="text-gold-500">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? Our expert counselors are here to help you.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card hover>
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">Call Us</h3>
            <p className="text-gray-600 mb-4">
              Speak with our counselors directly
            </p>
            <a
              href="tel:+918001234567"
              className="text-gold-500 font-semibold hover:text-gold-600"
            >
              +91 (800) 123-4567
            </a>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">Email Us</h3>
            <p className="text-gray-600 mb-4">Send us your queries</p>
            <a
              href="mailto:info@argroup.edu"
              className="text-gold-500 font-semibold hover:text-gold-600"
            >
              info@argroup.edu
            </a>
          </Card>

          <Card hover>
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">WhatsApp</h3>
            <p className="text-gray-600 mb-4">Chat with us instantly</p>
            <a
              href="https://wa.me/919999999999"
              className="text-gold-500 font-semibold hover:text-gold-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              Message Now
            </a>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <Button variant="navy">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
