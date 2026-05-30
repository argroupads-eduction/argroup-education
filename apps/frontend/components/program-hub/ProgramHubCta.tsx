import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type ProgramHubCtaProps = {
  title: string;
  description: string;
};

export function ProgramHubCta({ title, description }: ProgramHubCtaProps) {
  return (
    <section className="program-hub-cta">
      <div className="mx-auto max-w-7xl px-4">
        <div className="program-hub-cta-inner">
          <div>
            <h2 className="program-hub-cta-title">{title}</h2>
            <p className="program-hub-cta-desc">{description}</p>
          </div>
          <Link href="/contact" className="program-hub-btn-primary shrink-0">
            Book free session
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
