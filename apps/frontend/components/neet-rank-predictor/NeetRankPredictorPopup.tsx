'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  GraduationCap,
  Loader2,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { NEET_CATEGORIES, NEET_EXAM_YEAR_LABEL } from '@/lib/neetRankPredictor/data';
import { getCollegeRecommendations } from '@/lib/neetRankPredictor/collegeMatches';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';
import { formatRank, predictNeetRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory, NeetRankPrediction } from '@/lib/neetRankPredictor/types';
import { validatePersonName } from '@/lib/validatePersonName';
import {
  validateIndianMobile,
  validateLeadEmail,
} from '@/lib/leadSubmissionMessages';
import {
  isRankPopupExcludedPath,
  RANK_PREDICTOR_POPUP_DELAY_MS,
} from '@/lib/rankPredictorPopup';
import { ensureFormInteractionGuard, setRankPopupOpen } from '@/lib/sitePopupCoordination';
import { RankPredictorHeroIllustration } from '@/components/neet-rank-predictor/RankPredictorHeroIllustration';

type Step = 'form' | 'result';
type Track = 'india' | 'abroad' | 'both' | 'md-ms' | 'bams';

const TRACK_OPTIONS: { id: Track; label: string }[] = [
  { id: 'india', label: 'MBBS India' },
  { id: 'abroad', label: 'MBBS Abroad' },
  { id: 'both', label: 'India + Abroad' },
];

const CITIES = [
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
  'Noida',
  'Kota',
];

function CollegeScroll({
  title,
  colleges,
  onNavigate,
}: {
  title: string;
  colleges: CollegeMatch[];
  onNavigate: () => void;
}) {
  if (!colleges.length) return null;
  return (
    <div className="rank-popup-colleges">
      <p className="rank-popup-colleges__title">{title}</p>
      <div className="rank-popup-college-scroll">
        {colleges.map((c) => (
          <Link key={c.href} href={c.href} className="rank-popup-college-chip" onClick={onNavigate}>
            <p className="rank-popup-college-chip__name">{c.name}</p>
            <p className="rank-popup-college-chip__meta">{c.meta}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function scoreVaultTier(score: number, digitCount: number): string {
  if (digitCount < 3) return digitCount > 0 ? 'Keep typing your 3-digit score…' : 'Tap below to enter your NEET marks';
  if (score >= 650) return 'Elite tier · Top performer bracket';
  if (score >= 550) return 'Excellent · Highly competitive AIR';
  if (score >= 450) return 'Strong · Good college options';
  if (score >= 350) return 'Solid · Broad counselling scope';
  if (score >= 200) return 'Building · Explore pathways';
  return 'Foundation · We can guide your plan';
}

function NeetScoreVault({
  value,
  onChange,
  inputId,
}: {
  value: string;
  onChange: (raw: string) => void;
  inputId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = [0, 1, 2].map((i) => value[i] ?? '');
  const activeIndex = Math.min(value.length, 2);
  const scoreNum = value.length ? parseInt(value, 10) : 0;
  const complete = value.length === 3;
  const progressPct = complete ? Math.min(100, (scoreNum / 720) * 100) : value.length ? (scoreNum / 720) * 100 : 0;
  const tier = scoreVaultTier(scoreNum, value.length);

  const focusInput = () => inputRef.current?.focus();

  return (
    <div
      className={`rank-popup-score-vault${complete ? ' rank-popup-score-vault--complete' : ''}${value.length ? ' rank-popup-score-vault--active' : ''}`}
      onClick={focusInput}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          focusInput();
        }
      }}
      role="group"
      aria-labelledby={`${inputId}-label`}
    >
      <div className="rank-popup-score-vault__glow" aria-hidden />
      <div className="rank-popup-score-vault__inner">
        <div className="rank-popup-score-vault__head">
          <label id={`${inputId}-label`} className="rank-popup-score-vault__title" htmlFor={inputId}>
            <span className="rank-popup-score-vault__title-icon" aria-hidden>
              <Trophy className="h-3 w-3" />
            </span>
            NEET Score
          </label>
          <span className="rank-popup-score-vault__max">
            <span className="rank-popup-score-vault__max-num">{complete ? scoreNum : '—'}</span>
            <span className="rank-popup-score-vault__max-of">/ 720</span>
          </span>
        </div>

        <div className="rank-popup-score-vault__digits" aria-hidden>
          {digits.map((digit, i) => (
            <span key={i} className="rank-popup-score-vault__digit-wrap">
              {i > 0 ? <span className="rank-popup-score-vault__sep">·</span> : null}
              <span
                className={`rank-popup-score-vault__digit${digit ? ' rank-popup-score-vault__digit--filled' : ''}${activeIndex === i ? ' rank-popup-score-vault__digit--cursor' : ''}`}
              >
                {digit || (
                  <span className="rank-popup-score-vault__placeholder">{activeIndex === i ? '|' : '·'}</span>
                )}
              </span>
            </span>
          ))}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          className="rank-popup-score-vault__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={3}
          required
          aria-label="NEET score out of 720, three digits"
        />

        <div className="rank-popup-score-vault__meter" aria-hidden>
          <div className="rank-popup-score-vault__meter-track">
            <div
              className="rank-popup-score-vault__meter-fill"
              style={{ width: `${Math.max(progressPct, value.length ? 4 : 0)}%` }}
            />
            <div className="rank-popup-score-vault__meter-ticks">
              <span /><span /><span /><span />
            </div>
          </div>
          <div className="rank-popup-score-vault__meter-labels">
            <span>0</span>
            <span className="rank-popup-score-vault__meter-pct">
              {complete ? `${progressPct.toFixed(0)}%` : 'marks'}
            </span>
            <span>720</span>
          </div>
        </div>

        <p className="rank-popup-score-vault__tier" aria-live="polite">
          {tier}
        </p>
      </div>
    </div>
  );
}

export function NeetRankPredictorPopup() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<NeetCategory>('general_ews');
  const [track, setTrack] = useState<Track>('both');
  const [scoreInput, setScoreInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    ensureFormInteractionGuard();
  }, []);

  useEffect(() => {
    setRankPopupOpen(open);
  }, [open]);

  const resetForNewPage = useCallback(() => {
    setOpen(false);
    setStep('form');
    setError(null);
    setLoading(false);
    setName('');
    setEmail('');
    setPhone('');
    setCity('');
    setCategory('general_ews');
    setTrack('both');
    setScoreInput('');
    setResult(null);
    setColleges({ india: [], abroad: [] });
  }, []);

  const closePopup = useCallback(() => {
    setOpen(false);
  }, []);

  // Show first on every page load, refresh, and client-side navigation.
  useEffect(() => {
    if (isRankPopupExcludedPath(pathname)) {
      setOpen(false);
      return;
    }

    resetForNewPage();

    const delay = Math.max(0, RANK_PREDICTOR_POPUP_DELAY_MS);
    const timer = window.setTimeout(() => {
      if (isRankPopupExcludedPath(pathname)) return;
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pathname, resetForNewPage]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onScoreInput = (raw: string) => {
    setScoreInput(raw.replace(/\D/g, '').slice(0, 3));
    setError(null);
  };

  const revealResults = useCallback(
    (prediction: NeetRankPrediction, collegeData: { india: CollegeMatch[]; abroad: CollegeMatch[] }) => {
      setResult(prediction);
      setColleges(collegeData);
      setStep('result');
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (scoreInput.length !== 3 || score < 1) {
      setError('Enter your full 3-digit NEET score (001–720)');
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
    if (!city.trim()) {
      setError('Enter your city');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/neet-rank-predictor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone,
          city: city.trim(),
          category,
          score,
          track,
        }),
      });

      const json = (await res.json()) as {
        message?: string;
        duplicate?: boolean;
        prediction?: NeetRankPrediction;
        colleges?: { india: CollegeMatch[]; abroad: CollegeMatch[] };
      };

      const prediction = json.prediction ?? predictNeetRank(category, score);
      const collegeData =
        json.colleges ??
        getCollegeRecommendations(category, score, prediction.expectedRank);

      if (res.ok || res.status === 409) {
        revealResults(prediction, collegeData);
        return;
      }

      setError(json.message || 'Could not calculate your rank. Please try again.');
    } catch {
      const prediction = predictNeetRank(category, score);
      revealResults(prediction, getCollegeRecommendations(category, score, prediction.expectedRank));
    } finally {
      setLoading(false);
    }
  };

  const overlayVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const cardVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring' as const, stiffness: 340, damping: 30 },
        },
      };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else setOpen(true);
      }}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="rank-popup-overlay"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
              />
            </Dialog.Overlay>

            <div className="rank-popup-shell">
              <Dialog.Content asChild forceMount aria-describedby="rank-popup-desc">
                <motion.div
                  className="rank-popup-card"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={cardVariants}
                >
                  <div className="rank-popup-hero">
                    <Dialog.Close asChild>
                      <button type="button" className="rank-popup-close" aria-label="Close">
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>

                    <div>
                      <span className="rank-popup-live">
                        <span className="rank-popup-live__dot" aria-hidden />
                        Live predictor
                      </span>
                      <Dialog.Title asChild>
                        <h2 className="rank-popup-title">
                          Your <span>NEET Rank</span> &amp; college map
                        </h2>
                      </Dialog.Title>
                      <p id="rank-popup-desc" className="rank-popup-sub">
                        {NEET_EXAM_YEAR_LABEL}. Fill details once — rank updates as you enter your score.
                      </p>
                    </div>

                    <RankPredictorHeroIllustration />
                  </div>

                  <div className="rank-popup-body">
                    <AnimatePresence mode="wait">
                      {step === 'form' ? (
                        <motion.form
                          key="form"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          onSubmit={(e) => void handleSubmit(e)}
                        >
                          {error ? <p className="rank-popup-error" role="alert">{error}</p> : null}

                          <div className="rank-popup-form-grid">
                            <div className="rank-popup-field rank-popup-field--full">
                              <label className="rank-popup-label" htmlFor="rp-name">
                                Full name
                              </label>
                              <input
                                id="rp-name"
                                className="rank-popup-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                autoComplete="name"
                                required
                              />
                            </div>

                            <div className="rank-popup-field">
                              <label className="rank-popup-label" htmlFor="rp-email">
                                Email
                              </label>
                              <input
                                id="rp-email"
                                type="email"
                                className="rank-popup-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                autoComplete="email"
                                required
                              />
                            </div>

                            <div className="rank-popup-field">
                              <label className="rank-popup-label" htmlFor="rp-phone">
                                Mobile
                              </label>
                              <input
                                id="rp-phone"
                                type="tel"
                                inputMode="numeric"
                                className="rank-popup-input"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="10-digit"
                                autoComplete="tel"
                                required
                              />
                            </div>

                            <div className="rank-popup-field">
                              <label className="rank-popup-label" htmlFor="rp-city">
                                City
                              </label>
                              <input
                                id="rp-city"
                                className="rank-popup-input"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                list="rp-city-list"
                                placeholder="Your city"
                                required
                              />
                              <datalist id="rp-city-list">
                                {CITIES.map((c) => (
                                  <option key={c} value={c} />
                                ))}
                              </datalist>
                            </div>

                            <div className="rank-popup-field">
                              <label className="rank-popup-label" htmlFor="rp-category">
                                Category
                              </label>
                              <select
                                id="rp-category"
                                className="rank-popup-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as NeetCategory)}
                              >
                                {NEET_CATEGORIES.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="rank-popup-field rank-popup-field--full">
                              <NeetScoreVault
                                inputId="rp-score"
                                value={scoreInput}
                                onChange={onScoreInput}
                              />
                            </div>

                            <div className="rank-popup-field rank-popup-field--full">
                              <span className="rank-popup-label">I&apos;m exploring</span>
                              <div className="rank-popup-track-pills" role="group" aria-label="Study track">
                                {TRACK_OPTIONS.map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    className={`rank-popup-track-pill${track === t.id ? ' rank-popup-track-pill--active' : ''}`}
                                    onClick={() => setTrack(t.id)}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button type="submit" className="rank-popup-cta" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                Calculating your rank…
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" aria-hidden />
                                Unlock my rank &amp; colleges
                                <ArrowRight className="h-4 w-4" aria-hidden />
                              </>
                            )}
                          </button>

                          <p className="rank-popup-footer-note mt-3">
                            Powered by AR Group of Education — trusted NEET rank guidance for MBBS counselling ·
                            100% free tool.
                          </p>
                        </motion.form>
                      ) : (
                        result && (
                          <motion.div
                            key="result"
                            className="rank-popup-results"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2.5 text-navy-900">
                              <Trophy className="h-5 w-5 shrink-0 text-gold-600" aria-hidden />
                              <div>
                                <p className="text-sm font-bold">Your personalised prediction</p>
                                <p className="text-xs text-slate-600">
                                  {result.categoryLabel} · {result.score}/720
                                </p>
                              </div>
                            </div>

                            <div className="rank-popup-rank-grid">
                              <div className="rank-popup-rank-tile">
                                <p className="rank-popup-rank-tile__label">Best</p>
                                <p className="rank-popup-rank-tile__value">{formatRank(result.bestRank)}</p>
                              </div>
                              <div className="rank-popup-rank-tile rank-popup-rank-tile--main">
                                <p className="rank-popup-rank-tile__label">Most likely</p>
                                <p className="rank-popup-rank-tile__value">{formatRank(result.expectedRank)}</p>
                              </div>
                              <div className="rank-popup-rank-tile">
                                <p className="rank-popup-rank-tile__label">Buffer</p>
                                <p className="rank-popup-rank-tile__value">{formatRank(result.worstRank)}</p>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600">{result.qualifyingNote}</p>

                            {(track === 'india' || track === 'both') && (
                              <CollegeScroll
                                title="MBBS India matches"
                                colleges={colleges.india}
                                onNavigate={closePopup}
                              />
                            )}
                            {(track === 'abroad' || track === 'both') && (
                              <CollegeScroll
                                title="MBBS Abroad matches"
                                colleges={colleges.abroad}
                                onNavigate={closePopup}
                              />
                            )}

                            <Link
                              href="/neet-rank-predictor"
                              className="rank-popup-cta"
                              onClick={closePopup}
                            >
                              <GraduationCap className="h-4 w-4" aria-hidden />
                              Open full predictor
                            </Link>

                            <button
                              type="button"
                              className="rank-popup-done-btn"
                              onClick={closePopup}
                            >
                              Done — thanks!
                            </button>

                            <p className="rank-popup-footer-note">
                              Rank predicted by AR Group&apos;s NEET counselling experts · Official AIR is published
                              by NTA at result declaration.
                            </p>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
