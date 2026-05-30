import { Award, GraduationCap, ShieldCheck, Users } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'NMC-aligned guidance' },
  { icon: GraduationCap, label: 'College shortlisting' },
  { icon: Users, label: '4000+ students counselled' },
  { icon: Award, label: 'End-to-end admission support' },
];

export function ProgramHubTrustBar() {
  return (
    <div className="program-hub-trust">
      <div className="mx-auto max-w-7xl px-4">
        <div className="program-hub-trust-inner">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
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
