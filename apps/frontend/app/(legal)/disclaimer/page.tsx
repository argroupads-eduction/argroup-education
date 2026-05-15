import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Disclaimer',
};

export default function DisclaimerPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-8">
          Disclaimer
        </h1>

        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            1. No Guarantee
          </h2>
          <p>
            While AR Group of Education strives to provide accurate and up-to-date information,
            we make no warranties, either express or implied, regarding the accuracy,
            completeness, or timeliness of the information provided on this website.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            2. Educational Guidance
          </h2>
          <p>
            The services provided by AR Group are educational and consultancy in nature.
            Admission to universities and visa approvals are subject to the specific policies
            and decisions of respective universities and government authorities.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            3. No Guarantee of Admission
          </h2>
          <p>
            AR Group does not guarantee admission to any university. Admissions are solely
            determined by the universities based on their criteria, merit, and availability of seats.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            4. Visa & Immigration
          </h2>
          <p>
            While we assist with visa documentation and applications, the final approval is
            subject to the discretion of the respective embassies and immigration authorities.
            We are not responsible for visa rejections or immigration complications.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            5. External Links
          </h2>
          <p>
            Our website may contain links to external websites. We are not responsible for
            the content, accuracy, or practices of these external sites.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            6. Limitation of Liability
          </h2>
          <p>
            In no event shall AR Group be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or inability to
            use the website or services.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            7. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold AR Group harmless from any claims, damages,
            or expenses arising from your use of our services or violation of any laws.
          </p>
        </div>

        <div className="mt-12">
          <Link href="/">
            <Button variant="navy">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
