import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
};

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-8">
          Terms & Conditions
        </h1>

        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing and using this website, you accept and agree to be bound
            by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            2. Use License
          </h2>
          <p>
            Permission is granted to temporarily download one copy of the materials
            (information or software) on our website for personal, non-commercial
            transitory viewing only.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            3. Disclaimer
          </h2>
          <p>
            The materials on our website are provided on an 'as is' basis. AR Group
            makes no warranties, expressed or implied, and hereby disclaims and
            negates all other warranties including, without limitation, implied
            warranties or conditions of merchantability, fitness for a particular
            purpose, or non-infringement of intellectual property or other
            violation of rights.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            4. Limitations
          </h2>
          <p>
            In no event shall AR Group or its suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit, or
            due to business interruption) arising out of the use or inability to
            use the materials on our website.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            5. Accuracy of Materials
          </h2>
          <p>
            The materials appearing on our website could include technical,
            typographical, or photographic errors. AR Group does not warrant that
            any of the materials on its website are accurate, complete, or current.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            6. Modifications
          </h2>
          <p>
            AR Group may revise these terms and conditions for its website at any
            time without notice. By using this website, you are agreeing to be
            bound by the then current version of these terms and conditions.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            7. Governing Law
          </h2>
          <p>
            These terms and conditions are governed by and construed in accordance
            with the laws of India, and you irrevocably submit to the exclusive
            jurisdiction of the courts in that location.
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
