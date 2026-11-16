import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Banknote,
  Camera,
  ClipboardCheck,
  FileBadge,
  FileText,
  GraduationCap,
  Handshake,
  Languages,
  Plane,
  Stethoscope,
} from 'lucide-react';

export type AbroadDocumentItem = {
  id: string;
  title: string;
  hint: string;
  icon: LucideIcon;
};

export const MBBS_ABROAD_DOCUMENTS: AbroadDocumentItem[] = [
  {
    id: 'marksheet',
    title: 'X & XII Marksheet',
    hint: 'Attested copies with school seal',
    icon: GraduationCap,
  },
  {
    id: 'neet',
    title: 'NEET Score Card',
    hint: 'Valid for current admission cycle',
    icon: ClipboardCheck,
  },
  {
    id: 'birth',
    title: 'Birth Certificate',
    hint: 'Government-issued original or copy',
    icon: Baby,
  },
  {
    id: 'bank',
    title: 'Bank Statement',
    hint: 'Proof of funds for tuition & living',
    icon: Banknote,
  },
  {
    id: 'english',
    title: 'English Certificate',
    hint: 'Where university requires language proof',
    icon: Languages,
  },
  {
    id: 'medical',
    title: 'Medical Test Report',
    hint: 'Fitness certificate as per embassy norms',
    icon: Stethoscope,
  },
  {
    id: 'photos',
    title: 'Photographs',
    hint: '35mm × 45mm, white background',
    icon: Camera,
  },
  {
    id: 'affidavit',
    title: 'Sponsorship Affidavit',
    hint: 'If parents or guardian sponsor fees',
    icon: FileBadge,
  },
  {
    id: 'minor',
    title: 'Minor Certificate',
    hint: 'For students below 18 years of age',
    icon: Handshake,
  },
  {
    id: 'passport',
    title: 'Passport',
    hint: 'Minimum 18 months validity recommended',
    icon: Plane,
  },
];

export const MBBS_ABROAD_INTAKE_STEPS = [
  {
    id: 'neet-qualified',
    title: 'NEET qualified',
    body: 'Confirm eligibility and score requirements for your target country and university.',
    icon: FileText,
  },
  {
    id: 'student-visa',
    title: 'Student visa',
    body: 'Apply with admission letter, financial proof, and medical documents.',
    icon: Plane,
  },
  {
    id: 'fly-enrol',
    title: 'Fly & enrol',
    body: 'Book travel, complete university formalities, and hostel registration.',
    icon: GraduationCap,
  },
] as const;
