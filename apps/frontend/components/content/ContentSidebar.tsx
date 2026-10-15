import Link from 'next/link';
import { Phone, MessageCircle, GraduationCap } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';

type ContentSidebarProps = {
  helpText?: string;
  quickLinks?: { href: string; label: string }[];
};

const DEFAULT_QUICK_LINKS = [
  { href: '/mbbs-india', label: 'MBBS in India →' },
  { href: '/mbbs-abroad', label: 'MBBS Abroad →' },
  { href: '/blog', label: 'Latest guides →' },
];

export function ContentSidebar({
  helpText = 'Get expert help with college shortlisting, NEET counselling, fees, and documentation.',
  quickLinks = DEFAULT_QUICK_LINKS,
}: ContentSidebarProps = {}) {
  return (
    <div className="wp-content-sidebar space-y-5">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-navy-900 to-navy-800 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 inline-flex rounded-full bg-gold-500/20 p-2.5">
          <GraduationCap className="h-5 w-5 text-gold-400" />
        </div>
        <p className="font-serif text-lg font-bold">Expert admission counselling</p>
        <p className="mt-2 text-sm leading-relaxed text-blue-100/85">
          {helpText}
        </p>
        <div className="mt-5 space-y-2.5">
          <Link
            href="/contact"
            className="site-gold-cta flex min-h-[44px] w-full items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Book consultation
          </Link>
          <a
            href={`tel:${CONTACT_INFO.phoneTel}`}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            <Phone className="h-4 w-4 text-gold-400" />
            {CONTACT_INFO.phone}
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick links</p>
        <ul className="mt-3 space-y-2 text-sm">
          {quickLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="font-medium text-navy-900 hover:text-gold-600">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
