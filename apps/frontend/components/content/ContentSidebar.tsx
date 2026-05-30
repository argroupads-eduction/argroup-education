import Link from 'next/link';
import { Phone, MessageCircle, GraduationCap } from 'lucide-react';

export function ContentSidebar() {
  return (
    <div className="wp-content-sidebar space-y-5">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-navy-900 to-navy-800 p-4 text-white shadow-xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 inline-flex rounded-full bg-gold-500/20 p-2.5">
          <GraduationCap className="h-5 w-5 text-gold-400" />
        </div>
        <p className="font-serif text-lg font-bold">Free admission counselling</p>
        <p className="mt-2 text-sm leading-relaxed text-blue-100/85">
          Get expert help with college shortlisting, NEET counselling, fees, and documentation.
        </p>
        <div className="mt-5 space-y-2.5">
          <Link
            href="/contact"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-navy-900 transition hover:bg-gold-400"
          >
            <MessageCircle className="h-4 w-4" />
            Book consultation
          </Link>
          <a
            href="tel:+917076909090"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            <Phone className="h-4 w-4 text-gold-400" />
            +91-7076909090
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick links</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/mbbs-india" className="font-medium text-navy-900 hover:text-gold-600">
              MBBS in India →
            </Link>
          </li>
          <li>
            <Link href="/mbbs-abroad" className="font-medium text-navy-900 hover:text-gold-600">
              MBBS Abroad →
            </Link>
          </li>
          <li>
            <Link href="/blog" className="font-medium text-navy-900 hover:text-gold-600">
              Latest guides →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
