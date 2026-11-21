import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Error 404</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-navy-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
        The page you requested does not exist or may have been moved. Try the homepage or contact
        our counselling team for help.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="site-gold-cta inline-flex min-h-[44px] items-center justify-center px-5">
          Back to home
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-navy-900 transition hover:border-navy-900"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
