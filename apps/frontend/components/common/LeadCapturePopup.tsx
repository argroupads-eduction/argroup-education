'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
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
import { MBBS_ABROAD_HERO_COUNTRY_OPTIONS } from '@/lib/mbbsAbroadHeroCountryOptions';
import {
  type HeroMbbsFormDoc,
  type HeroMbbsFormFieldBlock,
  loadHeroMbbsFormDefinition,
} from '@/lib/mbbsHeroFormDefinitionsCache';

const SHOW_DELAY_MS = 1500;

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

const PIN_COUNTRIES = MBBS_ABROAD_HERO_COUNTRY_OPTIONS.slice(0, 10);

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

const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9 [background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231a365d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")]`;

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

function PromoPanel({ compact }: { compact?: boolean }) {
  return (
    <div
      className={clsx(
        'relative flex flex-col overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white',
        compact ? 'px-5 py-6' : 'px-6 py-8 md:px-8 md:py-10'
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

      <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300">
        AR Group of Education
      </p>
      <h2
        id="lead-capture-title"
        className="relative mt-2 font-serif text-xl font-bold leading-tight text-white md:text-2xl"
      >
        Your MBBS abroad journey starts here
      </h2>
      <p className="relative mt-2 text-sm leading-relaxed text-navy-100/90">
        WHO-listed universities, transparent fees, and counselling from application to campus —
        trusted by thousands of Indian medical aspirants.
      </p>

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

      <motion.div
        className="relative mt-6 min-h-[7rem] flex-1 rounded-xl border border-white/10 bg-navy-950/40 p-3 backdrop-blur-sm"
        aria-hidden
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Globe2 className="absolute left-3 top-3 h-5 w-5 text-gold-400/80" />
        <svg
          viewBox="0 0 320 140"
          className="mx-auto mt-1 h-full w-full max-w-[280px] text-navy-600/80"
          fill="currentColor"
        >
          <ellipse cx="160" cy="72" rx="130" ry="52" className="fill-navy-700/50" />
          <path
            d="M40 72 Q100 48 160 72 T280 72"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-gold-500/25"
          />
        </svg>
        <ul className="absolute inset-0">
          {PIN_COUNTRIES.map((c, i) => {
            const positions = [
              { top: '18%', left: '22%' },
              { top: '28%', left: '48%' },
              { top: '22%', left: '72%' },
              { top: '42%', left: '18%' },
              { top: '48%', left: '38%' },
              { top: '44%', left: '58%' },
              { top: '40%', left: '78%' },
              { top: '62%', left: '30%' },
              { top: '68%', left: '52%' },
              { top: '58%', left: '70%' },
            ];
            const pos = positions[i % positions.length];
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

      <p className="relative mt-5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-center text-xs font-semibold text-gold-100">
        Limited seats — book free counselling with AR experts today
      </p>

      <ul className="relative mt-4 space-y-1.5">
        {TRUST_BULLETS.map((text) => (
          <li key={text} className="flex gap-2 text-xs text-navy-100/95">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LeadCapturePopup() {
  const formId = useId();
  const reduceMotion = useReducedMotion();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LeadFormValues>(EMPTY_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [payloadForm, setPayloadForm] = useState<HeroMbbsFormDoc | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    loadHeroMbbsFormDefinition('abroad').then((r) => {
      if (r.ok) setPayloadForm(r.doc);
    });

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open || submitted) return;
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, submitted]);

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
        const msg =
          data.errors?.[0]?.message || data.message || `Submit failed (${res.status})`;
        setSubmitError(msg);
        return;
      }
      setSubmitted(true);
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

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[100] bg-navy-950/70 backdrop-blur-sm"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
                transition={{ duration: reduceMotion ? 0 : 0.25 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount aria-describedby="lead-capture-desc">
              <motion.div
                className="fixed inset-0 z-[101] flex items-end justify-center p-0 sm:items-center sm:p-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={contentVariants}
              >
                <motion.div
                  role="document"
                  className="relative flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl shadow-navy-900/30 sm:max-h-[90vh] sm:rounded-2xl md:flex-row"
                  layout={!reduceMotion}
                >
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-navy-800 shadow-md transition-colors hover:bg-navy-50 hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                      aria-label="Close lead form"
                      onClick={dismiss}
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </Dialog.Close>

                  <motion.div
                    className="w-full shrink-0 md:w-[40%]"
                    initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, duration: 0.35 }}
                  >
                    <PromoPanel />
                  </motion.div>

                  <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white md:w-[60%]">
                    <motion.div
                      className="min-w-0 w-full px-5 py-6 sm:px-7 sm:py-8"
                      initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08, duration: 0.35 }}
                    >
                      {submitted ? (
                        <motion.div
                          className="flex min-h-[280px] flex-col items-center justify-center py-8 text-center"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <CheckCircle2
                            className="mb-4 h-14 w-14 text-emerald-500"
                            aria-hidden
                          />
                          <h3 className="font-serif text-2xl font-bold text-navy-900">
                            Thank you!
                          </h3>
                          <p className="mt-2 max-w-sm text-sm text-slate-600">
                            Our counsellors will contact you within 24 hours with MBBS abroad
                            options tailored to your profile.
                          </p>
                          <Button
                            type="button"
                            variant="navy"
                            size="md"
                            className="mt-6 bg-navy-900 hover:bg-navy-800"
                            onClick={dismiss}
                          >
                            Continue browsing
                          </Button>
                        </motion.div>
                      ) : (
                        <>
                          <Dialog.Title className="pr-10 font-serif text-xl font-bold text-navy-900 md:text-2xl">
                            Looking for MBBS Abroad?
                          </Dialog.Title>
                          <Dialog.Description
                            id="lead-capture-desc"
                            className="mt-1 text-sm text-slate-600"
                          >
                            Free counselling — AR Group of Education. Fill in your details below.
                          </Dialog.Description>

                          <form
                            id={formId}
                            onSubmit={onSubmit}
                            className="mt-5 w-full min-w-0 space-y-4"
                            noValidate
                          >
                            <motion.div
                              className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2"
                              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.12 }}
                            >
                              <motion.div className={fieldWrapClass}>
                                <label
                                  htmlFor="lead-fullName"
                                  className="mb-1.5 block text-xs font-semibold text-navy-900"
                                >
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
                                  className={inputClass}
                                  value={values.fullName}
                                  onChange={(e) => setField('fullName', e.target.value)}
                                />
                              </motion.div>

                              <motion.div className={fieldWrapClass}>
                                <label
                                  htmlFor="lead-email"
                                  className="mb-1.5 block text-xs font-semibold text-navy-900"
                                >
                                  Email *
                                </label>
                                <input
                                  id="lead-email"
                                  name="email"
                                  type="email"
                                  autoComplete="email"
                                  required
                                  placeholder="you@email.com"
                                  className={inputClass}
                                  value={values.email}
                                  onChange={(e) => setField('email', e.target.value)}
                                />
                              </motion.div>

                              <motion.div className={fieldWrapClass}>
                                <label
                                  htmlFor="lead-phone"
                                  className="mb-1.5 block text-xs font-semibold text-navy-900"
                                >
                                  Phone *
                                </label>
                                <input
                                  id="lead-phone"
                                  name="phone"
                                  type="tel"
                                  autoComplete="tel"
                                  required
                                  placeholder="10-digit mobile"
                                  className={inputClass}
                                  value={values.phone}
                                  onChange={(e) => setField('phone', e.target.value)}
                                />
                              </motion.div>

                              <motion.div className={fieldWrapClass}>
                                <label
                                  htmlFor="lead-city"
                                  className="mb-1.5 block text-xs font-semibold text-navy-900"
                                >
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
                                  className={inputClass}
                                  value={values.city}
                                  onChange={(e) => setField('city', e.target.value)}
                                />
                                <datalist id="lead-city-suggestions">
                                  {INDIAN_CITY_SUGGESTIONS.map((city) => (
                                    <option key={city} value={city} />
                                  ))}
                                </datalist>
                              </motion.div>

                              <motion.div className={`${fieldWrapClass} md:col-span-2`}>
                                <label
                                  htmlFor="lead-country"
                                  className="mb-1.5 block text-xs font-semibold text-navy-900"
                                >
                                  Target country *
                                </label>
                                <select
                                  id="lead-country"
                                  name="targetCountry"
                                  required
                                  className={selectClass}
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
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                                role="alert"
                              >
                                {submitError}
                              </p>
                            )}

                            <Button
                              type="submit"
                              variant="primary"
                              size="md"
                              className="w-full rounded-lg bg-navy-900 py-3 font-bold text-white shadow-lg shadow-navy-900/20 hover:bg-navy-800 focus-visible:ring-gold-500"
                              disabled={submitting}
                              isLoading={submitting}
                            >
                              Get free counselling
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
                          </form>
                        </>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
