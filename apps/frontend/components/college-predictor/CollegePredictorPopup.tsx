'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';
import { formatRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory } from '@/lib/neetRankPredictor/types';
import { NeetRankCollegeResults } from '@/components/neet-rank-predictor/NeetRankCollegeResults';
import { validatePersonName } from '@/lib/validatePersonName';
import { sanitizeCityInput, validateCityName } from '@/lib/validateCityName';
import {
  DUPLICATE_LEAD_MESSAGE,
  validateIndianMobile,
  validateLeadEmail,
} from '@/lib/leadSubmissionMessages';
import { notifyLeadSubmissionFromResponse } from '@/lib/notifyLeadSubmission';
import { EmailOtpVerification } from '@/components/forms/EmailOtpVerification';
import { emailOtpInitiallyVerified, isEmailOtpEnabled } from '@/lib/emailOtp/isEmailOtpEnabled';
import {
  isCollegePredictorPopupDismissed,
  isCollegePredictorPopupExcludedPath,
  isCollegeScheduleArmed,
  markCollegePredictorPopupDismissed,
  remainingCollegePopupDelayMs,
} from '@/lib/collegePredictorPopup';
import {
  isLeadPopupOpen,
  isUserFillingAnyForm,
  setCollegePopupOpen,
} from '@/lib/sitePopupCoordination';
import '@/styles/college-predictor-popup.css';
import '@/styles/neet-rank-predictor.css';

type Step = 'form' | 'result';
type Track = 'india' | 'abroad' | 'md-ms' | 'bams';

const TRACK_OPTIONS: { id: Track; label: string }[] = [
  { id: 'india', label: 'MBBS India' },
  { id: 'abroad', label: 'MBBS Abroad' },
  { id: 'md-ms', label: 'MD/MS' },
  { id: 'bams', label: 'BAMS' },
];

const INDIAN_CITIES = [
  'Delhi',
  'Mumbai',
  'Kolkata',
  'Chennai',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Patna',
  'Chandigarh',
  'Indore',
  'Bhopal',
  'Noida',
  'Gurgaon',
];

function Req({ children }: { children: React.ReactNode }) {
  return (
    <span className="cpp-label">
      {children}
      <span className="cpp-req" aria-hidden>
        *
      </span>
    </span>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="cpp-field" htmlFor={id}>
      {label}
      <span className="cpp-select-wrap">
        <select
          id={id}
          className="cpp-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <ChevronDown className="cpp-select-icon" aria-hidden />
      </span>
    </label>
  );
}

/**
 * Site-wide College Predictor popup — full form → Google Sheet lead → college list.
 * Opens 3 minutes after the lead popup opens on the current page (no reload needed).
 */
export function CollegePredictorPopup() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');

  const [track, setTrack] = useState<Track>('india');
  const [category, setCategory] = useState<NeetCategory>('general_ews');
  const [scoreInput, setScoreInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpUiActive, setOtpUiActive] = useState(false);
  const [emailVerified, setEmailVerified] = useState(emailOtpInitiallyVerified);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [resultRank, setResultRank] = useState<number | null>(null);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [colleges, setColleges] = useState<{ india: CollegeMatch[]; abroad: CollegeMatch[] }>({
    india: [],
    abroad: [],
  });
  const [disclaimer, setDisclaimer] = useState<string | undefined>();

  const dismiss = useCallback(() => {
    markCollegePredictorPopupDismissed();
    setOpen(false);
  }, []);

  const resetForm = useCallback(() => {
    setStep('form');
    setError(null);
    setLoading(false);
    setTrack('india');
    setCategory('general_ews');
    setScoreInput('');
    setName('');
    setEmail('');
    setPhone('');
    setCity('');
    setOtpUiActive(false);
    setEmailVerified(emailOtpInitiallyVerified);
    setEmailVerificationToken(null);
    setResultRank(null);
    setCategoryLabel('');
    setColleges({ india: [], abroad: [] });
    setDisclaimer(undefined);
  }, []);

  useEffect(() => {
    setCollegePopupOpen(open);
    return () => setCollegePopupOpen(false);
  }, [open]);

  useEffect(() => {
    if (isCollegePredictorPopupExcludedPath(pathname)) {
      setOpen(false);
      return undefined;
    }
    if (isCollegePredictorPopupDismissed()) return undefined;

    let revealed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const reveal = () => {
      if (revealed) return;
      if (isCollegePredictorPopupDismissed()) return;
      if (isCollegePredictorPopupExcludedPath(pathname)) return;
      if (!isCollegeScheduleArmed()) return;
      if (remainingCollegePopupDelayMs() > 0) return;
      // Don't interrupt typing on a page form; wait if lead is open again.
      if (isUserFillingAnyForm() || isLeadPopupOpen()) return;

      revealed = true;
      setOpen(true);
    };

    const armOrWait = () => {
      clearTimer();
      if (revealed || isCollegePredictorPopupDismissed()) return;
      if (!isCollegeScheduleArmed()) return;

      const delay = remainingCollegePopupDelayMs();
      if (!Number.isFinite(delay)) return;

      if (delay <= 0) {
        reveal();
        return;
      }

      timer = setTimeout(() => {
        timer = null;
        reveal();
      }, delay);
    };

    armOrWait();
    // Persist across navigation — no reload needed; poll until armed + due.
    const retry = window.setInterval(() => {
      if (revealed || isCollegePredictorPopupDismissed()) return;
      if (!isCollegeScheduleArmed()) return;
      if (remainingCollegePopupDelayMs() > 0) {
        armOrWait();
        return;
      }
      reveal();
    }, 2000);

    return () => {
      clearTimer();
      window.clearInterval(retry);
    };
  }, [pathname]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const score = parseInt(scoreInput, 10);
    if (!scoreInput || Number.isNaN(score) || score < 0) {
      setError(track === 'md-ms' ? 'Enter your NEET PG score' : 'Enter your NEET score');
      return;
    }
    const maxScore = track === 'md-ms' ? 800 : 720;
    if (score > maxScore) {
      setError(track === 'md-ms' ? 'Enter a valid NEET PG score' : 'Enter a valid NEET score');
      return;
    }
    const nameErr = validatePersonName(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    const emailErr = validateLeadEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const phoneErr = validateIndianMobile(phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    const cityErr = validateCityName(city);
    if (cityErr) {
      setError(cityErr);
      return;
    }
    if (isEmailOtpEnabled() && (!emailVerified || !emailVerificationToken)) {
      setError('Please verify your email before submitting.');
      setOtpUiActive(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/college-predictor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          city,
          category,
          score,
          track,
          emailVerificationToken,
        }),
      });
      const json = (await res.json()) as {
        message?: string;
        duplicate?: boolean;
        rank?: number;
        categoryLabel?: string;
        colleges?: { india: CollegeMatch[]; abroad: CollegeMatch[] };
        disclaimer?: string;
      };
      if (!res.ok) {
        notifyLeadSubmissionFromResponse(res, json);
        throw new Error(
          res.status === 409 || json.duplicate
            ? DUPLICATE_LEAD_MESSAGE
            : json.message || 'Could not load colleges'
        );
      }
      notifyLeadSubmissionFromResponse(res, json);
      setResultRank(json.rank ?? null);
      setCategoryLabel(json.categoryLabel ?? '');
      setColleges(json.colleges ?? { india: [], abroad: [] });
      setDisclaimer(json.disclaimer);
      setStep('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg === DUPLICATE_LEAD_MESSAGE ? msg : msg);
    } finally {
      setLoading(false);
    }
  }

  const overlayMotion = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.35 } } };

  const cardMotion = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring' as const, stiffness: 300, damping: 26 },
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
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="cpp-overlay"
                variants={overlayMotion}
                initial="hidden"
                animate="visible"
                exit="hidden"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={`${formId}-desc`}>
              <motion.div
                className="cpp-shell"
                variants={cardMotion}
                initial="hidden"
                animate="visible"
                exit="hidden"
                data-college-predictor-popup
              >
                <div className={`cpp-modal${step === 'result' ? ' cpp-modal--result' : ''}`}>
                  <Dialog.Close asChild>
                    <button type="button" className="cpp-close" aria-label="Close">
                      <X className="h-5 w-5" strokeWidth={2.25} />
                    </button>
                  </Dialog.Close>

                  <aside className="cpp-panel">
                    <div className="cpp-panel__media">
                      <Image
                        src="/images/college-predictor-popup-panel.jpg"
                        alt="Medical student exploring college options"
                        fill
                        sizes="(max-width: 900px) 100vw, 42vw"
                        className="cpp-panel__img"
                        priority
                      />
                      <div className="cpp-panel__scrim" aria-hidden />
                    </div>
                    <div className="cpp-panel__copy">
                      <p className="cpp-panel__eyebrow">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        AR Group of Education
                      </p>
                      <Dialog.Title className="cpp-panel__brand">College Predictor</Dialog.Title>
                      <p id={`${formId}-desc`} className="cpp-panel__lead">
                        Enter your NEET score once — see which MBBS colleges match your predicted
                        AIR, state by state and abroad by country.
                      </p>
                      <ul className="cpp-panel__bullets">
                        <li>
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Free · Instant shortlist
                        </li>
                        <li>
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          India & Abroad pathways
                        </li>
                      </ul>
                    </div>
                  </aside>

                  <div className="cpp-body">
                    <AnimatePresence mode="wait">
                      {step === 'form' ? (
                        <motion.form
                          key="form"
                          className="cpp-form"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          onSubmit={(e) => void handleSubmit(e)}
                        >
                          <p className="cpp-body__live">
                            <span className="cpp-body__dot" aria-hidden />
                            Live for NEET 2026
                          </p>
                          <h2 className="cpp-body__title">
                            Still exploring colleges?
                            <span>Let your score decide the shortlist.</span>
                          </h2>

                          {error ? (
                            <p className="cpp-error" role="alert">
                              {error}
                            </p>
                          ) : null}

                          <div className="cpp-form-grid">
                            <SelectField
                              id={`${formId}-track`}
                              label={<Req>Where do you want to study?</Req>}
                              value={track}
                              onChange={(v) => {
                                setTrack(v as Track);
                                setScoreInput('');
                              }}
                            >
                              {TRACK_OPTIONS.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </SelectField>

                            <SelectField
                              id={`${formId}-category`}
                              label={<Req>Reservation category</Req>}
                              value={category}
                              onChange={(v) => setCategory(v as NeetCategory)}
                            >
                              {NEET_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </SelectField>

                            <label className="cpp-field cpp-field--full" htmlFor={`${formId}-score`}>
                              <Req>
                                {track === 'md-ms' ? 'Your NEET PG Score' : 'Your NEET Score'}
                              </Req>
                              <input
                                id={`${formId}-score`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={3}
                                value={scoreInput}
                                onChange={(e) =>
                                  setScoreInput(e.target.value.replace(/\D/g, '').slice(0, 3))
                                }
                                className="cpp-input cpp-input--score"
                                placeholder="e.g. 450"
                                required
                              />
                            </label>

                            <label className="cpp-field cpp-field--full" htmlFor={`${formId}-name`}>
                              <Req>
                                <User className="cpp-label-icon" aria-hidden />
                                Full name
                              </Req>
                              <input
                                id={`${formId}-name`}
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="cpp-input"
                                placeholder="Your full name"
                                autoComplete="name"
                              />
                            </label>

                            <label className="cpp-field" htmlFor={`${formId}-phone`}>
                              <Req>
                                <Phone className="cpp-label-icon" aria-hidden />
                                Mobile
                              </Req>
                              <span className="cpp-phone">
                                <span className="cpp-phone__prefix">+91</span>
                                <input
                                  id={`${formId}-phone`}
                                  required
                                  inputMode="numeric"
                                  value={phone}
                                  onChange={(e) =>
                                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                                  }
                                  className="cpp-phone__input"
                                  placeholder="10-digit number"
                                  autoComplete="tel"
                                />
                              </span>
                            </label>

                            <label className="cpp-field" htmlFor={`${formId}-email`}>
                              <Req>
                                <Mail className="cpp-label-icon" aria-hidden />
                                Email
                              </Req>
                              <input
                                id={`${formId}-email`}
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setOtpUiActive(true)}
                                className="cpp-input"
                                placeholder="you@email.com"
                                autoComplete="email"
                              />
                            </label>

                            {isEmailOtpEnabled() ? (
                              <div className="cpp-field--full">
                                <EmailOtpVerification
                                  email={email}
                                  activated={otpUiActive}
                                  variant="light"
                                  onVerifiedChange={({ verified, verifiedToken }) => {
                                    setEmailVerified(verified);
                                    setEmailVerificationToken(verifiedToken);
                                  }}
                                />
                              </div>
                            ) : null}

                            <label className="cpp-field cpp-field--full" htmlFor={`${formId}-city`}>
                              <Req>
                                <MapPin className="cpp-label-icon" aria-hidden />
                                City
                              </Req>
                              <input
                                id={`${formId}-city`}
                                required
                                value={city}
                                onChange={(e) => setCity(sanitizeCityInput(e.target.value))}
                                list={`${formId}-city-list`}
                                className="cpp-input"
                                placeholder="Your city"
                                autoComplete="address-level2"
                              />
                              <datalist id={`${formId}-city-list`}>
                                {INDIAN_CITIES.map((c) => (
                                  <option key={c} value={c} />
                                ))}
                              </datalist>
                            </label>
                          </div>

                          <button
                            type="submit"
                            className="cpp-cta"
                            disabled={loading || (isEmailOtpEnabled() && !emailVerified)}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                Finding colleges…
                              </>
                            ) : (
                              <>
                                <GraduationCap className="h-4 w-4" aria-hidden />
                                Get my college list
                                <ArrowRight className="h-4 w-4" aria-hidden />
                              </>
                            )}
                          </button>
                        </motion.form>
                      ) : (
                        <motion.div
                          key="result"
                          className="cpp-result"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {resultRank != null ? (
                            <div className="cpp-air">
                              <p className="cpp-air__label">
                                {track === 'md-ms' ? 'Your NEET PG AIR' : 'Your NEET AIR'}
                              </p>
                              <p className="cpp-air__rank">{formatRank(resultRank)}</p>
                              <p className="cpp-air__meta">
                                {categoryLabel ? `${categoryLabel} · ` : ''}
                                Shortlist ready
                              </p>
                            </div>
                          ) : null}

                          <div className="cpp-result__list">
                            <NeetRankCollegeResults
                              india={colleges.india}
                              abroad={colleges.abroad}
                              track={track}
                              title={
                                track === 'md-ms'
                                  ? 'MD/MS colleges for your rank'
                                  : 'Colleges for your rank'
                              }
                              subtitle={`Matched for ${categoryLabel || 'your category'}${
                                resultRank != null ? ` · AIR ${formatRank(resultRank)}` : ''
                              }`}
                              disclaimer={disclaimer}
                            />
                          </div>

                          <div className="cpp-result__actions">
                            <Link href="/contact" className="cpp-cta" onClick={dismiss}>
                              Expert counselling
                            </Link>
                            <a href={`tel:${CONTACT_INFO.phoneTel}`} className="cpp-secondary">
                              {CONTACT_INFO.phone}
                            </a>
                            <button
                              type="button"
                              className="cpp-text-btn"
                              onClick={() => {
                                resetForm();
                              }}
                            >
                              <ArrowLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                              Check another score
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
