import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            1. Introduction
          </h2>
          <p>
            AR Group of Education ("we," "us," "our," or "Company") is committed
            to protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you visit
            our website.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            2. Information We Collect
          </h2>
          <p>We may collect information about you in a variety of ways:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Information you provide directly (name, email, phone, etc.)</li>
            <li>Automatically collected information (IP address, browser type, etc.)</li>
            <li>Information from third-party sources</li>
          </ul>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            3. Use of Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Process your counseling requests</li>
            <li>Send you marketing communications</li>
            <li>Improve our website and services</li>
            <li>Prevent fraudulent transactions</li>
          </ul>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            4. Disclosure of Your Information
          </h2>
          <p>
            We may share your information with third-party service providers who
            assist us in operating our website and conducting our business.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            5. Security of Your Information
          </h2>
          <p>
            We implement appropriate security measures to protect your personal
            information against unauthorized access and alteration.
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mt-10 mb-4">
            6. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            Email: info@argroup.edu
            <br />
            Phone: +91 (800) 123-4567
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
