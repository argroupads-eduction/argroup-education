'use client';

import { useMemo, useState } from 'react';
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
  TrendingUp,
  Trophy,
  AlertTriangle,
  User,
} from 'lucide-react';
import { NEET_EXAM_YEAR_LABEL } from '@/lib/neetRankPredictor/data';
import { CONTACT_INFO } from '@/lib/constants';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';
import { formatRank, predictNeetRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory, NeetRankPrediction } from '@/lib/neetRankPredictor/types';
import { NeetRankCollegeResults } from './NeetRankCollegeResults';
import { validatePersonName } from '@/lib/validatePersonName';

type Step = 'form' | 'result';
type Track = 'india' | 'abroad' | 'both';

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
  { id: 'both', label: 'MBBS India + Abroad' },
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

function PreviewIdlePrompt({ scoreInput }: { scoreInput: string }) {
  const filled = scoreInput.length;
  const partial = filled > 0 && filled < 3;

  return (
    <div className="neet-preview-idle">
      <div className="neet-preview-idle__digits" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`neet-preview-digit${filled > i ? ' neet-preview-digit--on' : ''}${partial && filled === i ? ' neet-preview-digit--pulse' : ''}`}
          >
            {filled > i ? scoreInput[i] : '·'}
          </span>
        ))}
        <span className="neet-preview-idle__of">/ 720</span>
      </div>
      <p className="neet-preview-idle__title">{partial ? 'Almost there…' : 'Your AIR unlocks here'}</p>
      <p className="neet-preview-idle__sub">
        {partial
          ? `${3 - filled} digit${3 - filled > 1 ? 's' : ''} left — rank & colleges load instantly`
          : 'Add your score below · live rank & percentile in seconds'}
      </p>
    </div>
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
        <select id={id} className="neet-select" value={value} onChange={(e) => onChange(e.target.value)} required>
          {children}
        </select>
        <ChevronDown className="neet-select-icon" aria-hidden />
      </div>
    </label>
  );
}

export function NeetRankPredictorWizard() {
  const [step, setStep] = useState<Step>('form');
  const [track, setTrack] = useState<Track>('both');
  const [category, setCategory] = useState<NeetCategory>('general_ews');
  const [scoreInput, setScoreInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NeetRankPrediction | null>(null);
  const [colleges, setColleges] = useState<{ india: CollegeMatch[]; abroad: CollegeMatch[] }>({
    india: [],
    abroad: [],
  });

  const score = useMemo(() => {
    if (!scoreInput) return 0;
    const n = parseInt(scoreInput, 10);
    return Number.isNaN(n) ? 0 : Math.min(720, Math.max(0, n));
  }, [scoreInput]);

  const previewReady = scoreInput.length === 3 && score >= 1 && score <= 720;

  const preview = useMemo(() => {
    if (!previewReady) return null;
    return predictNeetRank(category, score);
  }, [category, score, previewReady]);

  function onScoreInput(raw: string) {
    setScoreInput(raw.replace(/\D/g, '').slice(0, 3));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (scoreInput.length !== 3 || score < 1) {
      setError('Enter your full 3-digit NEET score (001–720)');
      return;
    }
    if (score > 720) {
      setError('Maximum score is 720');
      return;
    }
    const nameErr = validatePersonName(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!city.trim()) {
      setError('Enter your city');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/neet-rank-predictor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, city, category, score, track }),
      });
      const json = (await res.json()) as {
        message?: string;
        prediction?: NeetRankPrediction;
        colleges?: { india: CollegeMatch[]; abroad: CollegeMatch[] };
      };
      if (!res.ok) throw new Error(json.message || 'Could not generate prediction');
      setResult(json.prediction ?? predictNeetRank(category, score));
      setColleges(json.colleges ?? { india: [], abroad: [] });
      setStep('result');
      document.getElementById('neet-rank-tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="neet-rank-tool" className="neet-tool-card">
      <header className="neet-tool-card__head">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-800">
          <Sparkles className="h-3 w-3 text-gold-600" aria-hidden />
          AR Group tool
        </span>
        <h2 className="mt-2 font-serif text-xl font-bold text-navy-900 md:text-2xl">
          Predict your rank &amp; colleges
        </h2>
        <p className="mt-1 text-sm text-slate-600">Fill the form below — get rank range &amp; college matches instantly</p>
      </header>

      <div className="neet-tool-card__body">
        {error ? (
          <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100" role="alert">
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
              className="neet-form-shell"
            >
              <div
                className={`neet-preview-strip${preview ? ' neet-preview-strip--live' : ' neet-preview-strip--idle'}`}
                aria-live="polite"
              >
                <div className="neet-preview-strip__left">
                  <span className="neet-preview-strip__badge">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    Live rank preview
                  </span>
                  <span className="neet-preview-strip__year">{NEET_EXAM_YEAR_LABEL}</span>
                </div>
                <div className="neet-preview-strip__stats">
                  {preview ? (
                    <>
                      <div className="neet-preview-stat neet-preview-stat--main">
                        <span className="neet-preview-stat__label">Expected AIR</span>
                        <span className="neet-preview-stat__value">{formatRank(preview.expectedRank)}</span>
                      </div>
                      <div className="neet-preview-stat">
                        <span className="neet-preview-stat__label">Percentile</span>
                        <span className="neet-preview-stat__value neet-preview-stat__value--sm">
                          {preview.percentileLabel}
                        </span>
                      </div>
                      <div className="neet-preview-stat">
                        <span className="neet-preview-stat__label">Range</span>
                        <span className="neet-preview-stat__value neet-preview-stat__value--sm">
                          {formatRank(preview.bestRank)} – {formatRank(preview.worstRank)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <PreviewIdlePrompt scoreInput={scoreInput} />
                  )}
                </div>
              </div>

              <div className="neet-form-panel">
                <p className="neet-form-panel__title">Your details</p>

                <div className="neet-form-grid">
                  <SelectField
                    id="neet-track"
                    label={<Req>Where do you want to study?</Req>}
                    value={track}
                    onChange={(v) => setTrack(v as Track)}
                  >
                    {TRACK_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    id="neet-category"
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

                  <label className="neet-field-block neet-field-block--score">
                    <Req>Your NEET score (out of 720)</Req>
                    <div className="neet-score-digit-wrap">
                      <input
                        id="neet-score"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={scoreInput}
                        onChange={(e) => onScoreInput(e.target.value)}
                        className="neet-score-digit-input"
                        placeholder="000"
                        required
                      />
                      <span className="neet-score-digit-suffix">/ 720</span>
                    </div>
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
                      className="neet-field-input"
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
                      className="neet-field-input"
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                  </label>

                  <label className="neet-field-block sm:col-span-2">
                    <Req>
                      <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                      City
                    </Req>
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      list="neet-city-list"
                      className="neet-field-input"
                      placeholder="Your city"
                      autoComplete="address-level2"
                    />
                    <datalist id="neet-city-list">
                      {INDIAN_CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg neet-form-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      Calculating…
                    </>
                  ) : (
                    <>
                      Get my rank &amp; colleges
                      <ArrowRight className="h-5 w-5" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-navy-900">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-gold-600" />
                  <div>
                    <p className="font-bold">Your prediction is ready</p>
                    <p className="text-sm text-slate-600">
                      {result.categoryLabel} · {result.score}/720
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <Trophy className="mx-auto h-5 w-5 text-gold-500" />
                    <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Best</p>
                    <p className="text-2xl font-black text-navy-900">{formatRank(result.bestRank)}</p>
                  </div>
                  <div className="rounded-xl border-2 border-gold-400 bg-gold-50/50 p-4 text-center shadow-sm">
                    <GraduationCap className="mx-auto h-5 w-5 text-navy-700" />
                    <p className="mt-2 text-[10px] font-bold uppercase text-gold-800">Most likely</p>
                    <p className="text-2xl font-black text-navy-900">{formatRank(result.expectedRank)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <AlertTriangle className="mx-auto h-5 w-5 text-orange-500" />
                    <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Buffer</p>
                    <p className="text-2xl font-black text-navy-900">{formatRank(result.worstRank)}</p>
                  </div>
                </div>

                <p className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-slate-700">{result.qualifyingNote}</p>
                <p className="text-xs text-slate-500">
                  Based on {result.dataSource} (reference year {result.dataYear}). Exact NEET 2026 AIR will be
                  confirmed by NTA at result declaration.
                </p>

                <NeetRankCollegeResults india={colleges.india} abroad={colleges.abroad} track={track} />

                <div className="flex flex-wrap gap-3 rounded-xl border border-navy-200 bg-navy-50/50 p-4">
                  <Link href="/contact" className="ui-btn ui-btn--primary ui-btn--md">
                    Expert counselling
                  </Link>
                  <a
                    href={`tel:${CONTACT_INFO.phoneTel}`}
                    className="inline-flex items-center gap-2 self-center text-sm font-bold text-navy-800"
                  >
                    <Phone className="h-4 w-4" />
                    {CONTACT_INFO.phone}
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setResult(null);
                  }}
                  className="text-sm font-semibold text-gold-700 hover:underline"
                >
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Try another score
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
