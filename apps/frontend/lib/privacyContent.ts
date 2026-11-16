import { CONTACT_INFO } from '@/lib/constants';

export const PRIVACY_LAST_UPDATED = 'June 2026';

export const PRIVACY_SECTIONS = [
  {
    id: 'introduction',
    number: 1,
    title: 'Introduction',
    body: 'AR Group of Education ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.',
  },
  {
    id: 'information-we-collect',
    number: 2,
    title: 'Information We Collect',
    body: 'We may collect information about you in a variety of ways:',
    bullets: [
      'Information you provide directly (name, email, phone, etc.)',
      'Automatically collected information (IP address, browser type, etc.)',
      'Information from third-party sources',
    ],
  },
  {
    id: 'use-of-information',
    number: 3,
    title: 'Use of Your Information',
    body: 'We use the information we collect to:',
    bullets: [
      'Provide and maintain our services',
      'Process your counseling requests',
      'Send you marketing communications',
      'Improve our website and services',
      'Prevent fraudulent transactions',
    ],
  },
  {
    id: 'disclosure',
    number: 4,
    title: 'Disclosure of Your Information',
    body: 'We may share your information with third-party service providers who assist us in operating our website and conducting our business.',
  },
  {
    id: 'security',
    number: 5,
    title: 'Security of Your Information',
    body: 'We implement appropriate security measures to protect your personal information against unauthorized access and alteration.',
  },
  {
    id: 'contact-us',
    number: 6,
    title: 'Contact Us',
    body: 'If you have questions about this Privacy Policy, please contact us:',
    contact: {
      email: CONTACT_INFO.email,
      phone: CONTACT_INFO.phone,
      phoneTel: CONTACT_INFO.phoneTel,
    },
  },
] as const;
