'use client';

import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  RefreshCw,
  Scale,
  Shield,
  UserCheck,
} from 'lucide-react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { TERMS_CLOSING, TERMS_LAST_UPDATED, TERMS_SECTIONS } from '@/lib/termsContent';

const SECTION_ICONS = {
  'acceptance-of-terms': Handshake,
  'use-of-website': Globe,
  'our-commitment': FileText,
  'service-limitations': AlertTriangle,
  'website-content-updates': RefreshCw,
  'external-resources': ExternalLink,
  'user-responsibility': UserCheck,
  'limitation-of-liability': Shield,
  'governing-law': Scale,
} as const;

const RELATED_LINKS = [
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/contact', label: 'Contact counsellors' },
] as const;

export function TermsPageView() {
  return (
    <LegalPageShell
      variant="terms"
      pageId="terms"
      eyebrow="User agreement"
      eyebrowIcon={Scale}
      title={
        <>
          Terms &amp; <em>Conditions</em>
        </>
      }
      lead="Clear rules for using our website and counselling services. By continuing, you agree to these terms designed for a safe and transparent experience."
      lastUpdated={TERMS_LAST_UPDATED}
      sectionCountLabel={`${TERMS_SECTIONS.length} sections`}
      sections={TERMS_SECTIONS}
      sectionIcons={SECTION_ICONS}
      closing={{ label: 'Our promise', text: TERMS_CLOSING }}
      relatedLinks={RELATED_LINKS}
    />
  );
}
