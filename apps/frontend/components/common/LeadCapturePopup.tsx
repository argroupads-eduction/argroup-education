'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { LeadCapturePromoBanner } from '@/components/common/LeadCapturePromoBanner';
import { LeadCaptureMobileSheet } from '@/components/common/LeadCaptureMobileSheet';
import { LEAD_CAPTURE_TARGET_OPTIONS } from '@/lib/mbbsAbroadHeroCountryOptions';
import { LEAD_CAPTURE_OPEN_EVENT } from '@/lib/openLeadCapture';
import {
  cancelPreparedThankYouTab,
  openThankYouInNewTab,
  prepareThankYouTab,
} from '@/lib/openThankYouPage';
import { submitWebsiteLead } from '@/lib/submitWebsiteLead';
import {
  type HeroMbbsFormDoc,
  type HeroMbbsFormFieldBlock,
  loadHeroMbbsFormDefinition,
} from '@/lib/mbbsHeroFormDefinitionsCache';

/** Brief delay so layout paints before the modal animates in */
const AUTO_OPEN_DELAY_MS = 300;

const PROMO_BADGES = [
  { icon: GraduationCap, label: 'WHO-listed universities' },
  { icon: Award, label: 'Transparent low fees' },
  { icon: ShieldCheck, label: 'End-to-end support' },
] as const;

const TRUST_BULLETS = [
  '4,000+ students guided across India and abroad',
  'NMC-aligned counselling with honest fee guidance',
  'Visa, documentation & pre-departure briefing',
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

import { validatePersonName } from '@/lib/validatePersonName';

function validate(values: LeadFormValues): string | null {
  const nameErr = validatePersonName(values.fullName);
  if (nameErr) return nameErr;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return 'A valid email address is required.';
  }
  if (!/^[0-9]{10}$/.test(values.phone.replace(/\D/g, '').slice(-10))) {
    return 'Enter a valid 10-digit mobile number.';
  }
  if (!values.city.trim()) return 'City is required.';
  if (!values.targetCountry.trim()) return 'Please select a target destination.';
  return null;
}

function PromoPanel({ variant = 'default' }: { variant?: 'default' | 'compact' | 'mobileSheet' }) {
  const isMobileSheet = variant === 'mobileSheet';

  return (
    <div
      className={clsx(
        'relative flex flex-col overflow-hidden bg-navy-900 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white',
        isMobileSheet && 'px-3.5 pb-2.5 pt-3.5 text-center',
        variant === 'compact' && 'px-5 py-6',
        variant === 'default' && 'px-6 py-7 md:px-7 md:py-8'
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

      <p
        className={clsx(
          'relative text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300/95',
          isMobileSheet && 'mx-auto max-w-full text-center'
        )}
      >
        AR Group of Education
      </p>
      {isMobileSheet ? (
        <div className="relative mt-2 w-full">
          <LeadCapturePromoBanner compact className="mx-auto w-full max-w-full" />
        </div>
      ) : (
        <h2 className="relative mt-2.5 font-sans text-[1.25rem] font-bold leading-snug text-white md:text-[1.5rem]">
          Your MBBS in India and abroad journey starts here
        </h2>
      )}
      {!isMobileSheet && (
        <p className="relative mt-2.5 max-w-sm text-[13px] leading-relaxed text-navy-100/90 md:text-sm">
          WHO-listed universities, transparent fees, and expert guidance from application to campus.
          Trusted by thousands of Indian medical aspirants.
        </p>
      )}

      {isMobileSheet ? null : (
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
        className="relative mt-5 h-[12.75rem] w-full overflow-hidden rounded-xl sm:h-[14.25rem]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Image
          src="/lead-mbbs-doctor.png"
          alt="Medical team supporting MBBS admission counselling for universities abroad"
          fill
          className="object-contain object-center"
          sizes="(max-width: 768px) 90vw, 400px"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-navy-950/95 via-navy-900/55 to-transparent"
          aria-hidden
        />
        <p className="absolute bottom-2.5 left-3 right-3 text-[11px] font-semibold leading-snug text-white md:text-xs">
          Studying MBBS at Top Universities Abroad
        </p>
      </motion.div>
      )}

      {!isMobileSheet && (
        <div className="relative mt-4 flex w-full flex-col items-stretch gap-2 rounded-xl border border-gold-500/25 bg-gradient-to-r from-navy-900/60 via-gold-500/10 to-navy-900/60 px-3 py-2">
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-gold-200/95">
            Limited seats
          </p>
          <LeadCapturePromoBanner className="w-full shadow-sm" />
        </div>
      )}

      {!isMobileSheet && (
        <ul className="relative mt-3 space-y-1.5 pb-0.5">
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
        <h3 className={clsx('font-sans font-bold text-navy-900', isMobile ? 'text-xl' : 'text-2xl')}>
          Thank you!
        </h3>
        <p className={clsx('mt-2 max-w-sm text-slate-600', isMobile ? 'text-xs' : 'text-sm')}>
          Our counsellors will contact you within 24 hours with MBBS in India and abroad options tailored to your
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
            Target destination *
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
              Select programme or destination
            </option>
            {LEAD_CAPTURE_TARGET_OPTIONS.map((o) => (
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
      <form
        id={formId}
        onSubmit={onSubmit}
        className="flex w-full min-w-0 flex-col gap-2 overflow-hidden px-3.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2"
        noValidate
      >
        {fieldsBlock}
        <div className="space-y-1.5 border-t border-slate-100/90 pt-1.5">{submitBlock}</div>
      </form>
    );
  }

  return (
    <>
      <h2 className="pr-10 font-sans text-[1.25rem] font-bold leading-snug text-navy-900 md:pr-0 md:text-[1.55rem]">
        Looking for MBBS in India or Abroad?
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 md:text-sm">
        Share your details, AR Group counsellors will call you with tailored options for India and international
        universities.
      </p>

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

  useEffect(() => {
    /** Tablet uses mobile sheet, desktop nav also switches at xl (1280px). */
    const mq = window.matchMedia('(max-width: 1279px)');
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
    const onOpenRequest = () => {
      setValues(EMPTY_VALUES);
      setSubmitError(null);
      setSubmitted(false);
      if (isMobileRef.current) setMobileOpen(true);
      else setDesktopOpen(true);
    };
    window.addEventListener(LEAD_CAPTURE_OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(LEAD_CAPTURE_OPEN_EVENT, onOpenRequest);
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;
    setValues(EMPTY_VALUES);
    setSubmitError(null);
    setSubmitted(false);
    setDesktopOpen(false);
    const t = window.setTimeout(() => setDesktopOpen(true), AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isMobile, pathname]);

  useEffect(() => {
    if (isMobile !== true) return;

    setValues(EMPTY_VALUES);
    setSubmitError(null);
    setSubmitted(false);

    setMobileOpen(false);
    const t = window.setTimeout(() => setMobileOpen(true), AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isMobile, pathname]);

  const dismissDesktop = useCallback(() => {
    setDesktopOpen(false);
  }, []);

  const dismissMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

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
    const thankYouTab = prepareThankYouTab();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const leadFields = payload?.submissionData
        ? Object.fromEntries(payload.submissionData.map(({ field, value }) => [field, value]))
        : {
            fullName: normalized.fullName,
            email: normalized.email,
            phone: normalized.phone,
            city: normalized.city,
            targetCountry: normalized.targetCountry,
          };

      const lead = await submitWebsiteLead({
        source: 'lead-popup',
        formName: 'Lead capture popup',
        fields: leadFields,
      });

      if (!lead.ok) {
        cancelPreparedThankYouTab(thankYouTab);
        setSubmitError(lead.message || 'Could not submit your enquiry.');
        return;
      }

      if (payload) {
        void fetch('/api/cms/form-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form: payload.formId,
            source: 'lead-popup',
            formName: 'Lead capture popup',
            submissionData: payload.submissionData,
          }),
        }).catch(() => undefined);
      }

      openThankYouInNewTab(
        {
          name: normalized.fullName,
          source: 'lead-popup',
        },
        undefined,
        thankYouTab
      );
      setSubmitted(true);
    } catch {
      cancelPreparedThankYouTab(thankYouTab);
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
          title="Looking for MBBS in India or Abroad?"
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
                    <Dialog.Title className="sr-only">Looking for MBBS in India or Abroad?</Dialog.Title>
                    <Dialog.Description id="lead-capture-desc" className="sr-only">
                      Share your details for MBBS in India or abroad, AR Group counsellors will call you with tailored
                      university options.
                    </Dialog.Description>

                    <motion.div
                      role="document"
                      className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl shadow-navy-900/35 ring-1 ring-navy-900/5 sm:h-auto sm:max-h-[min(92vh,54rem)] sm:rounded-2xl md:flex-row"
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
                        className="flex max-h-[38vh] w-full shrink-0 flex-col overflow-y-auto overflow-x-hidden bg-navy-900 sm:max-h-none md:max-h-[min(92vh,54rem)] md:w-[42%]"
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05, duration: 0.35 }}
                      >
                        <PromoPanel />
                      </motion.div>

                      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white md:w-[58%]">
                        <motion.div
                          className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-14 sm:px-7 sm:py-7 sm:pb-7 sm:pt-7"
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
