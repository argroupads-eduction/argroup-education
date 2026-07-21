'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { sanitizeCityInput, validateCityName } from '@/lib/validateCityName';
import { CONTACT_INFO } from '@/lib/constants';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';
import { formatRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory } from '@/lib/neetRankPredictor/types';
import { NeetRankCollegeResults } from '@/components/neet-rank-predictor/NeetRankCollegeResults';
import { validatePersonName } from '@/lib/validatePersonName';
import {
  validateIndianMobile,
  validateLeadEmail,
  DUPLICATE_LEAD_MESSAGE,
} from '@/lib/leadSubmissionMessages';
import { notifyLeadSubmissionFromResponse } from '@/lib/notifyLeadSubmission';
import { EmailOtpVerification } from '@/components/forms/EmailOtpVerification';
import { emailOtpInitiallyVerified, isEmailOtpEnabled } from '@/lib/emailOtp/isEmailOtpEnabled';

type Step = 'form' | 'result';
type Track = 'india' | 'abroad' | 'md-ms' | 'bams';

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
  'Bhopal',
  'Noida',
  'Dehradun',
  'Kota',
];

const TRACK_OPTIONS: { id: Track; label: string }[] = [
  { id: 'india', label: 'MBBS India' },
  { id: 'abroad', label: 'MBBS Abroad' },
  { id: 'md-ms', label: 'MD/MS' },
  { id: 'bams', label: 'BAMS' },
];

function Req({ children }: { children: React.ReactNode }) {
  return (
    <span className="neet-field-label">
      {children}
      <span className="neet-req" aria-hidden>
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
    <label className="neet-field-block" htmlFor={id}>
      {label}
      <div className="neet-select-wrap">
        <select
          id={id}
          className="neet-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        >
          {children}
        </select>
        <ChevronDown className="neet-select-icon" aria-hidden />
      </div>
    </label>
  );
}

export function CollegePredictorWizard() {
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

  function onScoreInput(raw: string) {
    setScoreInput(raw.replace(/\D/g, '').slice(0, 3));
  }

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
      document.getElementById('college-predictor-tool')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg !== DUPLICATE_LEAD_MESSAGE) {
        setError(msg);
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="college-predictor-tool" className="neet-tool-card">
      <header className="neet-tool-card__head">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-800">
          <Sparkles className="h-3 w-3 text-gold-600" aria-hidden />
          AR Group tool
        </span>
        <h2 className="mt-2 font-serif text-xl font-bold text-navy-900 md:text-2xl">
          {track === 'md-ms'
            ? 'Check MD/MS colleges from your NEET PG score'
            : 'Check colleges from your NEET score'}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {track === 'md-ms'
            ? 'Enter your NEET PG score and category to see matching colleges grouped by state.'
            : 'Enter your score, get the college list that fits your predicted rank, and our team will follow up.'}
        </p>
      </header>

      <div className="neet-tool-card__body">
        {error ? (
          <p
            className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onSubmit={(e) => void handleSubmit(e)}
              className="neet-form-shell w-full min-w-0 max-w-full box-border overflow-x-hidden"
            >
              <div className="neet-form-panel">
                <p className="neet-form-panel__title">Your details</p>

                <div className="neet-form-grid">
                  <SelectField
                    id="cp-track"
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
                    id="cp-category"
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

                  <label className="neet-field-block neet-field-block--score sm:col-span-2">
                    <Req>
                      {track === 'md-ms'
                        ? 'Your NEET PG Score'
                        : 'Your NEET Score'}
                    </Req>
                    <div className="neet-score-digit-wrap">
                      <input
                        id="cp-rank"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={scoreInput}
                        onChange={(e) => onScoreInput(e.target.value)}
                        className="neet-score-digit-input"
                        placeholder="e.g. 450"
                        required
                        aria-describedby="cp-rank-hint"
                      />
                    </div>
                    <p id="cp-rank-hint" className="mt-1.5 text-xs text-slate-500">
                      {track === 'md-ms'
                        ? 'Enter the score from your NEET PG result / scorecard'
                        : 'Enter the score from your NEET result / scorecard'}
                    </p>
                  </label>

                  <label className="neet-field-block sm:col-span-2">
                    <Req>
                      <User className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      Full name
                    </Req>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="neet-field-input box-border w-full max-w-full min-w-0"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </label>

                  <label className="neet-field-block">
                    <Req>
                      <Phone className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      Mobile number
                    </Req>
                    <div className="neet-phone-wrap">
                      <span className="neet-phone-prefix">+91</span>
                      <input
                        required
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="neet-phone-input"
                        placeholder="10-digit number"
                        autoComplete="tel"
                      />
                    </div>
                  </label>

                  <label className="neet-field-block">
                    <Req>
                      <Mail className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      Email address
                    </Req>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setOtpUiActive(true)}
                      className="neet-field-input box-border w-full max-w-full min-w-0"
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                  </label>

                  {isEmailOtpEnabled() ? (
                    <div className="min-w-0 w-full sm:col-span-2">
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

                  <label className="neet-field-block sm:col-span-2">
                    <Req>
                      <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      City
                    </Req>
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(sanitizeCityInput(e.target.value))}
                      list="cp-city-list"
                      className="neet-field-input box-border w-full max-w-full min-w-0"
                      placeholder="Your city"
                      autoComplete="address-level2"
                    />
                    <datalist id="cp-city-list">
                      {INDIAN_CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <button
                  type="submit"
                  className="ui-btn ui-btn--primary ui-btn--lg neet-form-submit"
                  disabled={loading || (isEmailOtpEnabled() && !emailVerified)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      Checking colleges…
                    </>
                  ) : (
                    <>
                      Check Colleges
                      <ArrowRight className="h-5 w-5" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            resultRank != null && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="cp-air-hero">
                  <div className="cp-air-hero__ready">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Shortlist ready
                  </div>
                  <p className="cp-air-hero__label">
                    {track === 'md-ms' ? 'Your NEET PG AIR' : 'Your NEET AIR'}
                  </p>
                  <p className="cp-air-hero__rank">{formatRank(resultRank)}</p>
                  <p className="cp-air-hero__meta">
                    {categoryLabel ? `${categoryLabel} · ` : ''}
                    Colleges matched to this rank
                  </p>
                  <p className="cp-air-hero__hint">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                    Scroll for state-wise college options
                  </p>
                </div>

                <NeetRankCollegeResults
                  india={colleges.india}
                  abroad={colleges.abroad}
                  track={track}
                  title={track === 'md-ms' ? 'MD/MS colleges for your rank' : 'Colleges for your rank'}
                  subtitle={`Matched for ${categoryLabel || 'your category'} and ${
                    track === 'md-ms' ? 'NEET PG ' : ''
                  }AIR ${formatRank(resultRank)}. Tap any college for fees & counselling.`}
                  disclaimer={disclaimer}
                />

                <div className="cp-cta-bar">
                  <Link href="/contact" className="ui-btn ui-btn--primary ui-btn--md">
                    Expert counselling
                  </Link>
                  <a href={`tel:${CONTACT_INFO.phoneTel}`} className="cp-cta-bar__phone">
                    <Phone className="h-4 w-4" />
                    {CONTACT_INFO.phone}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setResultRank(null);
                  }}
                  className="text-sm font-semibold text-gold-700 hover:underline"
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Check another rank
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
