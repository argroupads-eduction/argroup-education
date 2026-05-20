'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Globe2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { LeadCapturePromoBanner } from '@/components/common/LeadCapturePromoBanner';
import { LeadCaptureMobileSheet } from '@/components/common/LeadCaptureMobileSheet';
import { MBBS_ABROAD_HERO_COUNTRY_OPTIONS } from '@/lib/mbbsAbroadHeroCountryOptions';
import {
  type HeroMbbsFormDoc,
  type HeroMbbsFormFieldBlock,
  loadHeroMbbsFormDefinition,
} from '@/lib/mbbsHeroFormDefinitionsCache';

const DESKTOP_SHOW_DELAY_MS = 1500;
/** Match desktop cadence so the form is the first meaningful interaction after load */
const MOBILE_SHOW_DELAY_MS = 1500;

/**
 * Mobile popup visibility (sessionStorage):
 * - `ar-lead-mobile-submitted`: user submitted successfully this session — no more auto-opens.
 * - `ar-lead-mobile-dismissed-<pathname>`: user closed on this path — won't auto-open again until
 *   a full reload on another URL or they clear storage. This mirrors desktop "once per visit per path"
 *   without firing the sheet on every client-side navigation (which would feel spammy in the SPA).
 */
const MOBILE_SUBMITTED_SESSION_KEY = 'ar-lead-mobile-submitted';

function mobileDismissStorageKey(pathname: string) {
  return `ar-lead-mobile-dismissed-${pathname}`;
}

const PROMO_BADGES = [
  { icon: GraduationCap, label: 'WHO-listed universities' },
  { icon: Award, label: 'Transparent low fees' },
  { icon: ShieldCheck, label: 'End-to-end support' },
] as const;

const TRUST_BULLETS = [
  '4,000+ students guided across India & abroad',
  'NMC-aligned counselling with honest fee guidance',
  'Visa, documentation & pre-departure briefing',
] as const;

/** Map pins: abroad destinations + India (origin hub). */
const LEAD_MAP_PINS = [
  ...MBBS_ABROAD_HERO_COUNTRY_OPTIONS,
  { label: 'India', value: 'India' },
] as const;

const LEAD_MAP_PIN_POSITIONS = [
  { top: '18%', left: '22%' },
  { top: '48%', left: '42%' },
  { top: '32%', left: '52%' },
  { top: '22%', left: '48%' },
  { top: '38%', left: '28%' },
  { top: '58%', left: '55%' },
] as const;

const INDIAN_CITY_SUGGESTIONS = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Patna',
  'Bhopal',
  'Indore',
  'Chandigarh',
  'Kochi',
] as const;

type LeadFormValues = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  targetCountry: string;
};

const EMPTY_VALUES: LeadFormValues = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  targetCountry: '',
};

const fieldWrapClass = 'min-w-0 w-full';

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-body text-base text-navy-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20';

const inputClassMobile =
  'w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 font-body text-sm text-navy-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20';

const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9 [background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231a365d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")]`;

const selectClassMobile = `${inputClassMobile} appearance-none bg-[length:0.875rem] bg-[right_0.5rem_center] bg-no-repeat pr-8 [background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231a365d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")]`;

function isInputField(f: HeroMbbsFormFieldBlock): f is HeroMbbsFormFieldBlock & { name: string } {
  if (!f.name) return false;
  if (f.blockType === 'message') return false;
  return true;
}

function findPayloadFieldName(
  fields: HeroMbbsFormFieldBlock[],
  aliases: string[]
): string | null {
  for (const f of fields) {
    if (!f.name) continue;
    const n = f.name.toLowerCase();
    const l = (f.label || '').toLowerCase();
    if (aliases.some((a) => n.includes(a) || l.includes(a))) return f.name;
  }
  return null;
}

function buildSubmissionPayload(
  values: LeadFormValues,
  form: HeroMbbsFormDoc | null
): { formId: number; submissionData: { field: string; value: string }[] } | null {
  const envFormId = process.env.NEXT_PUBLIC_LEAD_CAPTURE_FORM_ID?.trim();
  const parsedEnvId = envFormId && /^\d+$/.test(envFormId) ? Number(envFormId) : null;
  const formId = parsedEnvId ?? form?.id ?? null;
  if (!formId) return null;

  const fields = (form?.fields || []).filter(isInputField);
  if (fields.length > 0) {
    const nameField =
      findPayloadFieldName(fields, ['fullname', 'full_name', 'name']) || 'fullName';
    const emailField = findPayloadFieldName(fields, ['email']) || 'email';
    const phoneField =
      findPayloadFieldName(fields, ['phone', 'mobile', 'contact']) || 'phone';
    const cityField = findPayloadFieldName(fields, ['city']) || 'city';
    const countryField =
      findPayloadFieldName(fields, ['country', 'state', 'destination', 'target']) ||
      'country';

    const logical: Record<string, string> = {
      [nameField]: values.fullName,
      [emailField]: values.email,
      [phoneField]: values.phone,
      [cityField]: values.city,
      [countryField]: values.targetCountry,
    };

    const used = new Set<string>();
    const submissionData: { field: string; value: string }[] = [];

    for (const f of fields) {
      const value = logical[f.name] ?? '';
      if (value || f.required) {
        submissionData.push({ field: f.name, value });
        used.add(f.name);
      }
    }

    for (const [field, value] of Object.entries(logical)) {
      if (!used.has(field) && value.trim()) {
        submissionData.push({ field, value });
      }
    }

    if (submissionData.length === 0) {
      submissionData.push(
        { field: nameField, value: values.fullName },
        { field: emailField, value: values.email },
        { field: phoneField, value: values.phone },
        { field: cityField, value: values.city },
        { field: countryField, value: values.targetCountry }
      );
    }

    return { formId, submissionData };
  }

  return {
    formId,
    submissionData: [
      { field: 'fullName', value: values.fullName },
      { field: 'email', value: values.email },
      { field: 'phone', value: values.phone },
      { field: 'city', value: values.city },
      { field: 'targetCountry', value: values.targetCountry },
      { field: 'source', value: 'website-lead-popup' },
    ],
  };
}

function validate(values: LeadFormValues): string | null {
  if (!values.fullName.trim()) return 'Full name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'A valid email address is required.';
  }
  if (!/^[0-9]{10}$/.test(values.phone.replace(/\D/g, '').slice(-10))) {
    return 'Enter a valid 10-digit mobile number.';
  }
  if (!values.city.trim()) return 'City is required.';
  if (!values.targetCountry.trim()) return 'Please select a target country.';
  return null;
}

function PromoPanel({ variant = 'default' }: { variant?: 'default' | 'compact' | 'mobileSheet' }) {
  const isMobileSheet = variant === 'mobileSheet';

  return (
    <div
      className={clsx(
        'relative flex flex-col overflow-hidden bg-navy-900 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white',
        isMobileSheet && 'px-3.5 pb-2.5 pt-8',
        variant === 'compact' && 'px-5 py-6',
        variant === 'default' && 'px-7 py-9 md:px-9 md:py-10'
      )}
    >
      <motion.div
        className="pointer-events-none absolute -right-16 top-6 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl"
        aria-hidden
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl"
        aria-hidden
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300/95">
        AR Group of Education
      </p>
      {isMobileSheet ? (
        <p
          aria-hidden
          className="relative mt-0.5 pr-9 font-serif text-[14px] font-bold leading-tight text-white"
        >
          MBBS abroad experts
        </p>
      ) : (
        <h2 className="relative mt-2.5 font-serif text-[1.35rem] font-bold leading-tight text-white md:text-[1.65rem]">
          Your MBBS abroad journey starts here
        </h2>
      )}
      {!isMobileSheet && (
        <p className="relative mt-2.5 max-w-sm text-[13px] leading-relaxed text-navy-100/90 md:text-sm">
          WHO-listed universities, transparent fees, and expert guidance from application to campus —
          trusted by thousands of Indian medical aspirants.
        </p>
      )}

      {isMobileSheet ? (
        <p className="relative mt-1 text-[11px] font-medium leading-snug text-gold-200">
          MBBS Abroad · WHO-listed · Low fees
        </p>
      ) : (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {PROMO_BADGES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gold-100 backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      )}

      {!isMobileSheet && (
      <motion.div
        className="relative mt-7 min-h-[7.5rem] flex-1 rounded-xl border border-white/12 bg-gradient-to-b from-navy-800/60 to-navy-900/40 p-3.5 shadow-inner shadow-black/20 backdrop-blur-sm"
        aria-hidden
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Globe2 className="absolute left-3.5 top-3.5 h-5 w-5 text-gold-400/90" />
        <svg
          viewBox="0 0 320 140"
          className="mx-auto mt-0.5 h-full w-full max-w-[292px] text-navy-600/80"
          fill="currentColor"
        >
          <defs>
            <radialGradient id="lead-map-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="160" cy="72" rx="128" ry="50" className="fill-navy-700/55" />
          <ellipse cx="160" cy="72" rx="90" ry="32" fill="url(#lead-map-glow)" className="text-gold-500/20" />
          <path
            d="M36 74 Q95 46 160 70 T284 74"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="4 3"
            className="text-gold-400/35"
          />
          <path
            d="M55 58 Q120 38 200 52 T265 88"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            className="text-teal-300/20"
          />
        </svg>
        <ul className="absolute inset-0">
          {LEAD_MAP_PINS.map((c, i) => {
            const pos = LEAD_MAP_PIN_POSITIONS[i % LEAD_MAP_PIN_POSITIONS.length];
            return (
              <motion.li
                key={c.value}
                className="absolute flex items-center gap-0.5 text-[9px] font-medium text-gold-100"
                style={pos}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <MapPin className="h-3 w-3 text-gold-400" aria-hidden />
                <span className="hidden sm:inline">{c.label}</span>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
      )}

      <div className={clsx('relative', isMobileSheet ? 'mt-2.5' : 'mt-5')}>
        <LeadCapturePromoBanner compact={isMobileSheet} />
      </div>

      {!isMobileSheet && (
        <ul className="relative mt-4 space-y-1.5">
          {TRUST_BULLETS.map((text) => (
            <li key={text} className="flex gap-2 text-xs text-navy-100/95">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type LeadCaptureFormPanelProps = {
  formId: string;
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  values: LeadFormValues;
  setField: <K extends keyof LeadFormValues>(key: K, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitted: boolean;
  submitting: boolean;
  submitError: string | null;
  dismiss: () => void;
  reduceMotion: boolean;
  variant?: 'desktop' | 'mobile';
};

function LeadCaptureFormPanel({
  formId,
  firstFieldRef,
  values,
  setField,
  onSubmit,
  submitted,
  submitting,
  submitError,
  dismiss,
  reduceMotion,
  variant = 'desktop',
}: LeadCaptureFormPanelProps) {
  const isMobile = variant === 'mobile';
  const labelClass = isMobile
    ? 'mb-1 block text-[11px] font-semibold text-navy-900'
    : 'mb-1.5 block text-xs font-semibold text-navy-900';
  const fieldInputClass = isMobile ? inputClassMobile : inputClass;
  const fieldSelectClass = isMobile ? selectClassMobile : selectClass;

  if (submitted) {
    return (
      <motion.div
        className={clsx(
          'flex flex-col items-center justify-center text-center',
          isMobile ? 'px-4 py-6' : 'min-h-[240px] py-8'
        )}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle2
          className={clsx('text-emerald-500', isMobile ? 'mb-3 h-12 w-12' : 'mb-4 h-14 w-14')}
          aria-hidden
        />
        <h3 className={clsx('font-serif font-bold text-navy-900', isMobile ? 'text-xl' : 'text-2xl')}>
          Thank you!
        </h3>
        <p className={clsx('mt-2 max-w-sm text-slate-600', isMobile ? 'text-xs' : 'text-sm')}>
          Our counsellors will contact you within 24 hours with MBBS abroad options tailored to your
          profile.
        </p>
        <Button
          type="button"
          variant="navy"
          size={isMobile ? 'sm' : 'md'}
          className={clsx('bg-navy-900 hover:bg-navy-800', isMobile ? 'mt-4' : 'mt-6')}
          onClick={dismiss}
        >
          Continue browsing
        </Button>
      </motion.div>
    );
  }

  const fieldsBlock = (
    <>
      <motion.div
        className={clsx(
          'grid w-full min-w-0',
          isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-4'
        )}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <motion.div className={fieldWrapClass}>
          <label htmlFor="lead-fullName" className={labelClass}>
            Full name *
          </label>
          <input
            ref={firstFieldRef}
            id="lead-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            placeholder="Your full name"
            className={fieldInputClass}
            value={values.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
          />
        </motion.div>

        <motion.div className={fieldWrapClass}>
          <label htmlFor="lead-email" className={labelClass}>
            Email *
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@email.com"
            className={fieldInputClass}
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
          />
        </motion.div>

        <motion.div className={fieldWrapClass}>
          <label htmlFor="lead-phone" className={labelClass}>
            Phone *
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="10-digit mobile"
            className={fieldInputClass}
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
          />
        </motion.div>

        <motion.div className={fieldWrapClass}>
          <label htmlFor="lead-city" className={labelClass}>
            City *
          </label>
          <input
            id="lead-city"
            name="city"
            type="text"
            list="lead-city-suggestions"
            autoComplete="address-level2"
            required
            placeholder="Your city"
            className={fieldInputClass}
            value={values.city}
            onChange={(e) => setField('city', e.target.value)}
          />
          <datalist id="lead-city-suggestions">
            {INDIAN_CITY_SUGGESTIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </motion.div>

        <motion.div className={clsx(fieldWrapClass, 'col-span-2')}>
          <label htmlFor="lead-country" className={labelClass}>
            Target country *
          </label>
          <select
            id="lead-country"
            name="targetCountry"
            required
            className={fieldSelectClass}
            value={values.targetCountry}
            onChange={(e) => setField('targetCountry', e.target.value)}
          >
            <option value="" disabled>
              Select country
            </option>
            {MBBS_ABROAD_HERO_COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </motion.div>
      </motion.div>

      {submitError && (
        <p
          className={clsx(
            'rounded-lg border border-red-200 bg-red-50 text-red-700',
            isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
          )}
          role="alert"
        >
          {submitError}
        </p>
      )}
    </>
  );

  const submitBlock = (
    <>
      <Button
        type="submit"
        variant="primary"
        size={isMobile ? 'sm' : 'md'}
        className={clsx(
          'w-full touch-manipulation rounded-lg bg-navy-900 font-bold uppercase tracking-wide text-white shadow-lg shadow-navy-900/20 hover:bg-navy-800 focus-visible:ring-gold-500',
          isMobile ? 'py-2 text-sm' : 'py-3.5'
        )}
        disabled={submitting}
        isLoading={submitting}
      >
        SUBMIT
      </Button>

      <p className="text-center text-[10px] leading-snug text-slate-500">
        By submitting, you agree to our{' '}
        <Link
          href="/terms"
          className="font-medium text-navy-700 underline-offset-2 hover:text-gold-600 hover:underline"
        >
          Terms
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="font-medium text-navy-700 underline-offset-2 hover:text-gold-600 hover:underline"
        >
          Privacy Policy
        </Link>
        . We use your details only to contact you about MBBS counselling.
      </p>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Dialog.Description
          id="lead-capture-desc"
          className="sr-only"
        >
          AR Group MBBS abroad counselling — enter your details for a callback.
        </Dialog.Description>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="flex w-full min-w-0 flex-col gap-2 overflow-hidden px-3.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2"
          noValidate
        >
          {fieldsBlock}
          <div className="space-y-1.5 border-t border-slate-100/90 pt-1.5">{submitBlock}</div>
        </form>
      </>
    );
  }

  return (
    <>
      <Dialog.Title className="pr-10 font-serif text-[1.35rem] font-bold leading-tight text-navy-900 md:pr-0 md:text-[1.65rem]">
        Looking for MBBS Abroad?
      </Dialog.Title>
      <Dialog.Description id="lead-capture-desc" className="mt-1.5 text-[13px] leading-relaxed text-slate-600 md:text-sm">
        Share your details — AR Group counsellors will call you with tailored university options.
      </Dialog.Description>

      <form id={formId} onSubmit={onSubmit} className="mt-4 w-full min-w-0 space-y-3.5" noValidate>
        {fieldsBlock}
        <div className="space-y-3">{submitBlock}</div>
      </form>
    </>
  );
}

export function LeadCapturePopup() {
  const pathname = usePathname();
  const formId = useId();
  const reduceMotion = useReducedMotion();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const isMobileRef = useRef(false);

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [values, setValues] = useState<LeadFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [payloadForm, setPayloadForm] = useState<HeroMbbsFormDoc | null>(null);

  const desktopAutoScheduledRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => {
      const next = mq.matches;
      setIsMobile(next);
      isMobileRef.current = next;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    loadHeroMbbsFormDefinition('abroad').then((r) => {
      if (r.ok) setPayloadForm(r.doc);
    });
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;
    if (desktopAutoScheduledRef.current) return;
    desktopAutoScheduledRef.current = true;
    const t = window.setTimeout(() => setDesktopOpen(true), DESKTOP_SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile !== true) return;

    let shouldShow = true;
    try {
      if (sessionStorage.getItem(MOBILE_SUBMITTED_SESSION_KEY) === '1') {
        shouldShow = false;
      } else if (sessionStorage.getItem(mobileDismissStorageKey(pathname)) === '1') {
        shouldShow = false;
      }
    } catch {
      shouldShow = true;
    }

    if (!shouldShow) {
      setMobileOpen(false);
      return;
    }

    setValues(EMPTY_VALUES);
    setSubmitError(null);
    setSubmitted(false);

    setMobileOpen(false);
    const t = window.setTimeout(() => setMobileOpen(true), MOBILE_SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pathname, isMobile]);

  const dismissDesktop = useCallback(() => {
    setDesktopOpen(false);
  }, []);

  const dismissMobile = useCallback(() => {
    try {
      sessionStorage.setItem(mobileDismissStorageKey(pathname), '1');
    } catch {
      /* private mode */
    }
    setMobileOpen(false);
  }, [pathname]);

  const handleMobileOpenChange = useCallback(
    (next: boolean) => {
      if (next) setMobileOpen(true);
      else dismissMobile();
    },
    [dismissMobile]
  );

  const activeOpen =
    isMobile === true ? mobileOpen : isMobile === false ? desktopOpen : false;

  useEffect(() => {
    if (!activeOpen || submitted) return;
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [activeOpen, submitted, isMobile]);

  const setField = useCallback(<K extends keyof LeadFormValues>(key: K, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(values);
    if (err) {
      setSubmitError(err);
      return;
    }

    const phone = values.phone.replace(/\D/g, '').slice(-10);
    const normalized: LeadFormValues = {
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone,
      city: values.city.trim(),
      targetCountry: values.targetCountry,
    };

    const payload = buildSubmissionPayload(normalized, payloadForm);
    if (!payload) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/cms/form-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: payload.formId,
          submissionData: payload.submissionData,
        }),
      });
      const raw = await res.text();
      let data: { errors?: { message?: string }[]; message?: string } = {};
      try {
        if (raw.trim()) data = JSON.parse(raw) as typeof data;
      } catch {
        setSubmitError(
          raw.trim() ? 'Could not read CMS response after submit.' : 'Empty CMS response after submit.'
        );
        return;
      }
      if (!res.ok) {
        const msg = data.errors?.[0]?.message || data.message || `Submit failed (${res.status})`;
        setSubmitError(msg);
        return;
      }
      setSubmitted(true);
      if (isMobileRef.current) {
        try {
          sessionStorage.setItem(MOBILE_SUBMITTED_SESSION_KEY, '1');
        } catch {
          /* noop */
        }
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const overlayVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const contentVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.96, y: 16 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
        },
      };

  if (isMobile === null) {
    return null;
  }

  return (
    <>
      {isMobile === true && (
        <LeadCaptureMobileSheet
          open={mobileOpen}
          onOpenChange={handleMobileOpenChange}
          reduceMotion={!!reduceMotion}
          header={<PromoPanel variant="mobileSheet" />}
        >
          <LeadCaptureFormPanel
            formId={formId}
            firstFieldRef={firstFieldRef}
            values={values}
            setField={setField}
            onSubmit={onSubmit}
            submitted={submitted}
            submitting={submitting}
            submitError={submitError}
            dismiss={dismissMobile}
            reduceMotion={!!reduceMotion}
            variant="mobile"
          />
        </LeadCaptureMobileSheet>
      )}

      {isMobile === false && (
        <Dialog.Root
          open={desktopOpen}
          onOpenChange={(next) => {
            if (!next) dismissDesktop();
            else setDesktopOpen(true);
          }}
        >
          <AnimatePresence>
            {desktopOpen && (
              <Dialog.Portal forceMount>
                <Dialog.Overlay asChild forceMount>
                  <motion.div
                    className="fixed inset-0 z-[100] bg-navy-900/70 backdrop-blur-sm"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={overlayVariants}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  />
                </Dialog.Overlay>

                <Dialog.Content asChild forceMount aria-describedby="lead-capture-desc">
                  <motion.div
                    className="fixed inset-0 z-[101] flex items-stretch justify-center p-0 sm:items-center sm:p-4"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={contentVariants}
                  >
                    <motion.div
                      role="document"
                      className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl shadow-navy-900/35 ring-1 ring-navy-900/5 sm:h-auto sm:max-h-[min(90vh,44rem)] sm:rounded-2xl md:flex-row"
                      layout={!reduceMotion}
                    >
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          className="absolute right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-navy-800 shadow-md transition-colors hover:bg-navy-50 hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 touch-manipulation"
                          aria-label="Close lead form"
                          onClick={dismissDesktop}
                        >
                          <X className="h-5 w-5" aria-hidden />
                        </button>
                      </Dialog.Close>

                      <motion.div
                        className="max-h-[40vh] w-full shrink-0 overflow-hidden bg-navy-900 sm:max-h-none md:w-[42%]"
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05, duration: 0.35 }}
                      >
                        <PromoPanel />
                      </motion.div>

                      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white md:w-[58%]">
                        <motion.div
                          className="min-w-0 w-full overflow-y-auto overflow-x-hidden px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-14 sm:px-8 sm:py-8 sm:pb-8 sm:pt-7 md:overflow-y-visible"
                          initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08, duration: 0.35 }}
                        >
                          <LeadCaptureFormPanel
                            formId={formId}
                            firstFieldRef={firstFieldRef}
                            values={values}
                            setField={setField}
                            onSubmit={onSubmit}
                            submitted={submitted}
                            submitting={submitting}
                            submitError={submitError}
                            dismiss={dismissDesktop}
                            reduceMotion={!!reduceMotion}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                </Dialog.Content>
              </Dialog.Portal>
            )}
          </AnimatePresence>
        </Dialog.Root>
      )}
    </>
  );
}
