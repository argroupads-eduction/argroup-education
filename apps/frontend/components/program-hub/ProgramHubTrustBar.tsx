import { Award, GraduationCap, ShieldCheck, Users, type LucideIcon } from 'lucide-react';

const TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'NMC-aligned guidance' },
  { icon: GraduationCap, label: 'College shortlisting' },
  { icon: Users, label: '4000+ students counselled' },
  { icon: Award, label: 'End-to-end admission support' },
];

export const MD_MS_TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'Guidance on NMC rules' },
  { icon: GraduationCap, label: 'College shortlisting' },
  { icon: Users, label: '4000+ students guided' },
  { icon: Award, label: 'Complete admission support' },
];

export function ProgramHubTrustBar({
  items = TRUST_ITEMS,
}: {
  items?: { icon: LucideIcon; label: string }[];
}) {
  return (
    <div className="program-hub-trust">
      <div className="mx-auto max-w-7xl px-4">
        <div className="program-hub-trust-inner">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="program-hub-trust-item">
              <span className="program-hub-trust-icon">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
