'use client';

import { Database, Eye, Lock, Mail, Share2, ShieldCheck } from 'lucide-react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from '@/lib/privacyContent';

const SECTION_ICONS = {
  introduction: Lock,
  'information-we-collect': Database,
  'use-of-information': Eye,
  disclosure: Share2,
  security: ShieldCheck,
  'contact-us': Mail,
} as const;

const RELATED_LINKS = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/contact', label: 'Contact counsellors' },
] as const;

export function PrivacyPageView() {
  return (
    <LegalPageShell
      variant="privacy"
      pageId="privacy"
      eyebrow="Your data matters"
      eyebrowIcon={ShieldCheck}
      title={
        <>
          Privacy <em>Policy</em>
        </>
      }
      lead="How AR Group of Education collects, uses, and protects your personal information when you explore MBBS counselling, forms, and our website."
      lastUpdated={PRIVACY_LAST_UPDATED}
      sectionCountLabel={`${PRIVACY_SECTIONS.length} sections`}
      sections={PRIVACY_SECTIONS}
      sectionIcons={SECTION_ICONS}
      relatedLinks={RELATED_LINKS}
    />
  );
}
