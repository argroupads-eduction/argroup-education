'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import {
  RANK_POPUP_FORM_FOOTER,
  RANK_POPUP_FORM_TRUST_ITEMS,
  RANK_POPUP_PANEL_STATS,
  RANK_POPUP_SIDEBAR_SUBTITLE,
  RANK_POPUP_SIDEBAR_TAGLINE,
  RANK_POPUP_TRACK_OPTIONS,
} from '@/lib/rankPredictorPopupContent';
import { getCollegeRecommendations } from '@/lib/neetRankPredictor/collegeMatches';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';
import { formatRank, predictNeetRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory, NeetRankPrediction } from '@/lib/neetRankPredictor/types';
import { validatePersonName } from '@/lib/validatePersonName';
import { sanitizeCityInput, validateCityName } from '@/lib/validateCityName';
import { validateIndianMobile, validateLeadEmail } from '@/lib/leadSubmissionMessages';
import {
  isRankPopupExcludedPath,
  RANK_PREDICTOR_POPUP_DELAY_MS,
} from '@/lib/rankPredictorPopup';
import { ensureFormInteractionGuard, setRankPopupOpen } from '@/lib/sitePopupCoordination';
import '@/styles/neet-rank-predictor.css';
import '@/styles/rank-predictor-popup.css';

type NeetRankPredictorPopupProps = {
  /** Remaining ms before auto-open (from DeferredSitePopups). Defaults to full delay. */
  openDelayMs?: number;
};

type Step = 'form' | 'result';
type Track = 'india' | 'abroad' | 'md-ms' | 'bams';

const PANEL_STAT_ICONS = {
  users: Users,
  shield: ShieldCheck,
  building: Building2,
} as const;

const FORM_TRUST_ICONS = {
  users: Users,
  shield: ShieldCheck,
  check: Check,
  building: Building2,
} as const;

function FormTrustStrip() {
  return (
    <div className="nrp-form-trust" aria-label="Why students trust AR Group">
      {RANK_POPUP_FORM_TRUST_ITEMS.map((item) => {
        const Icon = FORM_TRUST_ICONS[item.icon];
        return (
          <div key={item.label} className="nrp-form-trust__item">
            <span className={`nrp-form-trust__icon nrp-form-trust__icon--${item.icon}`} aria-hidden>
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <div>
              <p className="nrp-form-trust__value">{item.value}</p>
              <p className="nrp-form-trust__label">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PanelStatsBar() {
  return (
    <div className="nrp-panel-stats" aria-label="AR Group trust highlights">
      {RANK_POPUP_PANEL_STATS.map((stat) => {
        const Icon = PANEL_STAT_ICONS[stat.icon];
        return (
          <div key={stat.label} className="nrp-panel-stats__col">
            <span className={`nrp-panel-stats__icon nrp-panel-stats__icon--${stat.icon}`} aria-hidden>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="nrp-panel-stats__value">{stat.value}</p>
              <p className="nrp-panel-stats__label">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
    <div className="nrp-colleges">
      <p className="nrp-colleges__title">{title}</p>
      <div className="nrp-colleges__scroll">
        {colleges.map((c) => (
          <Link key={c.href} href={c.href} className="nrp-college-chip" onClick={onNavigate}>
            <p className="nrp-college-chip__name">{c.name}</p>
            <p className="nrp-college-chip__meta">{c.meta}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({
  scoreInput,
  score,
  onScoreInput,
  inputId,
}: {
  scoreInput: string;
  score: number;
  onScoreInput: (raw: string) => void;
  inputId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = [0, 1, 2].map((i) => scoreInput[i] ?? '');
  const activeIndex = Math.min(scoreInput.length, 2);

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className="nrp-score-card">
      <div className="nrp-score-card__head">
        <span className="nrp-score-card__label">
          <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
          NEET score
        </span>
        <span className="nrp-score-card__value">
          {scoreInput ? score : '—'} <span>/ 720</span>
        </span>
      </div>

      <div
        className="nrp-score-card__digits"
        onClick={focusInput}
        role="group"
        aria-labelledby={`${inputId}-label`}
      >
        {digits.map((digit, i) => (
          <span
            key={i}
            className={`nrp-score-card__digit${digit ? ' nrp-score-card__digit--filled' : ''}${activeIndex === i ? ' nrp-score-card__digit--active' : ''}`}
            aria-hidden
          >
            {digit || '·'}
          </span>
        ))}
      </div>

      <div className="nrp-score-card__slider-wrap">
        <span className="nrp-score-card__slider-edge">0</span>
        <input
          type="range"
          className="nrp-score-card__slider"
          min={0}
          max={720}
          step={1}
          value={score || 0}
          onChange={(e) => {
            const next = Number(e.target.value);
            onScoreInput(next > 0 ? String(next) : '');
          }}
          aria-label="NEET score slider"
        />
        <span className="nrp-score-card__slider-edge">720</span>
      </div>
      <p className="nrp-score-card__slider-hint">marks</p>

      <input
        ref={inputRef}
        id={inputId}
        className="nrp-score-card__input"
        value={scoreInput}
        onChange={(e) => onScoreInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        required
        aria-label="NEET marks out of 720"
      />
      <p className="nrp-score-card__hint">Tap below to enter your NEET marks</p>
    </div>
  );
}

export function NeetRankPredictorPopup({
  openDelayMs = RANK_PREDICTOR_POPUP_DELAY_MS,
}: NeetRankPredictorPopupProps = {}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<NeetCategory>('general_ews');
  const [track, setTrack] = useState<Track>('india');
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
    setTrack('india');
    setScoreInput('');
    setResult(null);
    setColleges({ india: [], abroad: [] });
  }, []);

  const closePopup = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (isRankPopupExcludedPath(pathname)) {
      setOpen(false);
      return;
    }

    resetForNewPage();

    const delay = Math.max(0, openDelayMs);
    const timer = window.setTimeout(() => {
      if (isRankPopupExcludedPath(pathname)) return;
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pathname, resetForNewPage, openDelayMs]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

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
    const cityErr = validateCityName(city);
    if (cityErr) {
      setError(cityErr);
      return;
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    setLoading(true);
    try {
      const res = await fetch('/api/neet-rank-predictor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: normalizedPhone,
          city: city.trim(),
          category,
          score,
          track,
        }),
      });

      const json = (await res.json()) as {
        message?: string;
        prediction?: NeetRankPrediction;
        colleges?: { india: CollegeMatch[]; abroad: CollegeMatch[] };
      };

      const prediction = json.prediction ?? predictNeetRank(category, score);
      const collegeData =
        json.colleges ?? getCollegeRecommendations(category, score, prediction.expectedRank, 'india');

      if (res.ok || res.status === 409) {
        revealResults(prediction, collegeData);
        return;
      }

      setError(json.message || 'Could not calculate your rank. Please try again.');
    } catch {
      const prediction = predictNeetRank(category, score);
      revealResults(prediction, getCollegeRecommendations(category, score, prediction.expectedRank, 'india'));
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
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
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
                className="nrp-overlay"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
              />
            </Dialog.Overlay>

            <div className="nrp-shell">
              <Dialog.Content asChild forceMount aria-describedby="nrp-desc">
                <motion.div
                  className="nrp-modal"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={cardVariants}
                >
                  <aside className="nrp-sidebar">
                    <Dialog.Title className="sr-only">NEET 2026 Rank Predictor</Dialog.Title>
                    <p id="nrp-desc" className="sr-only">
                      Fill in your details to get your NEET 2026 expected rank and college list.
                    </p>

                    <Dialog.Close asChild>
                      <button type="button" className="nrp-close nrp-close--sidebar" aria-label="Close">
                        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </button>
                    </Dialog.Close>

                    <div className="nrp-sidebar__copy">
                      <span className="nrp-live-badge">
                        <span className="nrp-live-badge__dot" aria-hidden />
                        Live predictor
                      </span>

                      <h2 className="nrp-sidebar__title">
                        Your <em>NEET Rank</em> &amp; <em>college map</em>
                      </h2>
                      <p className="nrp-sidebar__sub">{RANK_POPUP_SIDEBAR_SUBTITLE}</p>
                    </div>

                    <div className="nrp-sidebar__photo">
                      <Image
                        src="/images/rank-predictor-hero-doctor.png"
                        alt="NEET counsellor"
                        width={320}
                        height={380}
                        className="nrp-sidebar__photo-img"
                        priority
                      />
                      <span className="nrp-sidebar__photo-badge">NEET 2026</span>
                    </div>

                    <p className="nrp-sidebar__foot">{RANK_POPUP_SIDEBAR_TAGLINE}</p>
                  </aside>

                  <div className="nrp-panel">
                    <Dialog.Close asChild>
                      <button type="button" className="nrp-close nrp-close--panel" aria-label="Close">
                        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </button>
                    </Dialog.Close>

                    <AnimatePresence mode="wait">
                      {step === 'form' ? (
                        <motion.form
                          key="form"
                          className="nrp-form"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          onSubmit={(e) => void handleSubmit(e)}
                        >
                          {error ? (
                            <p className="nrp-error" role="alert">
                              {error}
                            </p>
                          ) : null}

                          <div className="nrp-form__body">
                          <label className="nrp-plain-field nrp-plain-field--full">
                            <span className="nrp-plain-field__label">Full name</span>
                            <input
                              className="nrp-plain-field__input"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Your name"
                              autoComplete="name"
                              required
                            />
                          </label>

                          <div className="nrp-form__row">
                            <label className="nrp-plain-field">
                              <span className="nrp-plain-field__label">Email</span>
                              <input
                                className="nrp-plain-field__input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@email.com"
                                autoComplete="email"
                                required
                              />
                            </label>

                            <label className="nrp-plain-field">
                              <span className="nrp-plain-field__label">Mobile</span>
                              <input
                                className="nrp-plain-field__input"
                                type="tel"
                                inputMode="numeric"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="10-digit"
                                autoComplete="tel"
                                required
                              />
                            </label>
                          </div>

                          <div className="nrp-form__row">
                            <label className="nrp-plain-field">
                              <span className="nrp-plain-field__label">City</span>
                              <input
                                className="nrp-plain-field__input"
                                value={city}
                                onChange={(e) => setCity(sanitizeCityInput(e.target.value))}
                                placeholder="Your city"
                                autoComplete="address-level2"
                                required
                              />
                            </label>

                            <label className="nrp-plain-field">
                              <span className="nrp-plain-field__label">Category</span>
                              <select
                                className="nrp-plain-field__input nrp-plain-field__select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as NeetCategory)}
                                required
                              >
                                {NEET_CATEGORIES.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <ScoreCard
                            inputId="rp-marks"
                            scoreInput={scoreInput}
                            score={score}
                            onScoreInput={(v) => {
                              setScoreInput(v);
                              setError(null);
                            }}
                          />

                          <fieldset className="nrp-track">
                            <legend className="nrp-track__legend">I&apos;m exploring</legend>
                            <div className="nrp-track__pills">
                              {RANK_POPUP_TRACK_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className={`nrp-track__pill${track === option.id ? ' nrp-track__pill--active' : ''}`}
                                  onClick={() => setTrack(option.id)}
                                  aria-pressed={track === option.id}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </fieldset>

                          <FormTrustStrip />
                          </div>

                          <div className="nrp-form__actions">
                            <button
                              type="submit"
                              className="nrp-cta counselling-form-submit site-gold-cta"
                              disabled={loading}
                            >
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

                            <p className="nrp-form__foot">{RANK_POPUP_FORM_FOOTER}</p>
                          </div>
                        </motion.form>
                      ) : (
                        result && (
                          <motion.div
                            key="result"
                            className="nrp-results"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="nrp-results__hero">
                              <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
                              <div>
                                <p className="nrp-results__title">Your NEET 2026 prediction</p>
                                <p className="nrp-results__meta">
                                  {result.categoryLabel} · {result.score}/720 · {city}
                                </p>
                              </div>
                            </div>

                            <div className="nrp-rank-grid">
                              <div className="nrp-rank-tile">
                                <p className="nrp-rank-tile__label">Best</p>
                                <p className="nrp-rank-tile__value">{formatRank(result.bestRank)}</p>
                              </div>
                              <div className="nrp-rank-tile nrp-rank-tile--main">
                                <p className="nrp-rank-tile__label">Expected AIR</p>
                                <p className="nrp-rank-tile__value">{formatRank(result.expectedRank)}</p>
                              </div>
                              <div className="nrp-rank-tile">
                                <p className="nrp-rank-tile__label">Buffer</p>
                                <p className="nrp-rank-tile__value">{formatRank(result.worstRank)}</p>
                              </div>
                            </div>

                            <p className="nrp-results__note">{result.qualifyingNote}</p>

                            {(track === 'md-ms' || track === 'bams') && (
                              <p className="nrp-results__note">
                                Our counsellors will call you with{' '}
                                {track === 'md-ms' ? 'MD/MS' : 'BAMS'} college options based on your
                                NEET rank and budget.
                              </p>
                            )}
                            {track === 'india' && (
                              <CollegeScroll
                                title="MBBS India matches"
                                colleges={colleges.india}
                                onNavigate={closePopup}
                              />
                            )}
                            {track === 'abroad' && (
                              <CollegeScroll
                                title="MBBS Abroad matches"
                                colleges={colleges.abroad}
                                onNavigate={closePopup}
                              />
                            )}

                            <Link
                              href="/neet-rank-predictor"
                              className="nrp-cta counselling-form-submit site-gold-cta"
                              onClick={closePopup}
                            >
                              <GraduationCap className="h-4 w-4" aria-hidden />
                              Open full predictor
                            </Link>

                            <button
                              type="button"
                              className="nrp-done ui-btn ui-btn--secondary ui-btn--md"
                              onClick={closePopup}
                            >
                              Done — thanks!
                            </button>

                            <PanelStatsBar />
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
