import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SERVICES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Comprehensive services for your medical education journey abroad.',
};

export default function ServicesPage() {
  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Our <span className="text-gold-500">Services</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete guidance from counseling to admission to visa to pre-departure support
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {SERVICES.map((service) => (
            <Card key={service.id} hover className="text-center">
              <div className="text-5xl mb-4">
                {service.icon === 'Globe' && '🌍'}
                {service.icon === 'MapPin' && '📍'}
                {service.icon === 'FileText' && '📄'}
                {service.icon === 'Passport' && '🛂'}
                {service.icon === 'Users' && '👥'}
                {service.icon === 'Award' && '🏆'}
                {service.icon === 'CheckCircle' && '✓'}
                {service.icon === 'Plane' && '✈️'}
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600">{service.description}</p>
            </Card>
          ))}
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
