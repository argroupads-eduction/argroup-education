import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type RelatedLinksPillsProps = {
  title: string;
  links: { label: string; href: string }[];
};

export function RelatedLinksPills({ title, links }: RelatedLinksPillsProps) {
  if (!links.length) return null;

  return (
    <section className="border-t border-slate-100 bg-slate-50/80 py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-gold-400 hover:text-navy-900 hover:shadow-md"
            >
              {link.label}
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-gold-600" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
