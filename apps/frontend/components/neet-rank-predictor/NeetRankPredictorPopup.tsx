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
  Info,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Rocket,
  Shield,
  ShieldCheck,
  Sprout,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import { INDIAN_ELIGIBILITY_STATES } from '@/lib/indianEligibilityStates';
import {
  RANK_POPUP_BRAND_LINE,
  RANK_POPUP_PANEL_STATS,
} from '@/lib/rankPredictorPopupContent';
import { getCollegeRecommendations } from '@/lib/neetRankPredictor/collegeMatches';
import type { CollegeMatch } from '@/lib/neetRankPredictor/collegeMatches';
import { formatRank, predictNeetRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory, NeetRankPrediction } from '@/lib/neetRankPredictor/types';
import { validatePersonName } from '@/lib/validatePersonName';
import { validateIndianMobile } from '@/lib/leadSubmissionMessages';
import {
  isRankPopupExcludedPath,
  RANK_PREDICTOR_POPUP_DELAY_MS,
} from '@/lib/rankPredictorPopup';
import { ensureFormInteractionGuard, setRankPopupOpen } from '@/lib/sitePopupCoordination';

type Step = 'form' | 'result';

const PANEL_STAT_ICONS = {
  users: Users,
  shield: ShieldCheck,
  building: Building2,
} as const;

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

function MarksBoxes({
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

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className="nrp-marks" onClick={focusInput} role="group" aria-labelledby={`${inputId}-label`}>
      <div className="nrp-marks__boxes" aria-hidden>
        {digits.map((digit, i) => (
          <span
            key={i}
            className={`nrp-marks__box${digit ? ' nrp-marks__box--filled' : ''}${activeIndex === i ? ' nrp-marks__box--active' : ''}`}
          >
            {digit || '·'}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className="nrp-marks__input"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        required
        aria-label="NEET 2026 marks out of 720"
      />
    </div>
  );
}

export function NeetRankPredictorPopup() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState<NeetCategory>('general_ews');
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
    setPhone('');
    setState('');
    setCategory('general_ews');
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
    const phoneErr = validateIndianMobile(phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    if (!state) {
      setError('Select your state of eligibility');
      return;
    }

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const leadEmail = `${normalizedPhone}@leads.argroupofeducation.com`;

    setLoading(true);
    try {
      const res = await fetch('/api/neet-rank-predictor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: leadEmail,
          phone: normalizedPhone,
          city: state,
          category,
          score,
          track: 'both',
        }),
      });

      const json = (await res.json()) as {
        message?: string;
        prediction?: NeetRankPrediction;
        colleges?: { india: CollegeMatch[]; abroad: CollegeMatch[] };
      };

      const prediction = json.prediction ?? predictNeetRank(category, score);
      const collegeData =
        json.colleges ?? getCollegeRecommendations(category, score, prediction.expectedRank);

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
                    <Image
                      src="/images/rank-predictor-sidebar-panel.png"
                      alt="NEET 2026 Rank Predictor — predict your AIR and find MBBS colleges"
                      width={447}
                      height={661}
                      sizes="(max-width: 1023px) 100vw, 42vw"
                      className="nrp-sidebar__art"
                      priority
                    />
                    <p id="nrp-desc" className="sr-only">
                      Fill in your details to get your NEET 2026 expected rank and college list.
                    </p>
                  </aside>

                  <div className="nrp-panel">
                    <div className="nrp-panel__header">
                      <div className="nrp-stepper" aria-label="Progress">
                      <div className={`nrp-stepper__step${step === 'form' ? ' nrp-stepper__step--active' : ' nrp-stepper__step--done'}`}>
                        <span className="nrp-stepper__dot">
                          {step === 'result' ? <Check className="h-3.5 w-3.5" /> : '1'}
                        </span>
                        <span>Your Details</span>
                      </div>
                      <span className="nrp-stepper__line" aria-hidden />
                      <div className={`nrp-stepper__step${step === 'result' ? ' nrp-stepper__step--active' : ''}`}>
                        <span className="nrp-stepper__dot">2</span>
                        <span>Get Prediction</span>
                      </div>
                    </div>

                      <Dialog.Close asChild>
                        <button type="button" className="nrp-close" aria-label="Close">
                          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </button>
                      </Dialog.Close>
                    </div>

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
                          <p className="nrp-tip">
                            <Sprout className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                            Fill in a few details to get your rank &amp; college prediction
                          </p>

                          {error ? (
                            <p className="nrp-error" role="alert">
                              {error}
                            </p>
                          ) : null}

                          <div className="nrp-form__row">
                            <label className="nrp-field">
                              <span className="nrp-field__label">Your Name</span>
                              <span className="nrp-field__wrap">
                                <User className="nrp-field__icon" aria-hidden />
                                <input
                                  className="nrp-field__input"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Enter your name"
                                  autoComplete="name"
                                  required
                                />
                              </span>
                            </label>

                            <label className="nrp-field">
                              <span className="nrp-field__label">Mobile Number</span>
                              <span className="nrp-field__wrap">
                                <Phone className="nrp-field__icon" aria-hidden />
                                <input
                                  className="nrp-field__input"
                                  type="tel"
                                  inputMode="numeric"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="10-digit mobile number"
                                  autoComplete="tel"
                                  required
                                />
                              </span>
                            </label>
                          </div>

                          <div className="nrp-form__row">
                            <label className="nrp-field">
                              <span className="nrp-field__label">State of Eligibility</span>
                              <span className="nrp-field__wrap">
                                <MapPin className="nrp-field__icon" aria-hidden />
                                <select
                                  className="nrp-field__input nrp-field__select"
                                  value={state}
                                  onChange={(e) => setState(e.target.value)}
                                  required
                                >
                                  <option value="">Select your state</option>
                                  {INDIAN_ELIGIBILITY_STATES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </label>

                            <label className="nrp-field">
                              <span className="nrp-field__label">Category</span>
                              <span className="nrp-field__wrap">
                                <Users className="nrp-field__icon" aria-hidden />
                                <select
                                  className="nrp-field__input nrp-field__select"
                                  value={category}
                                  onChange={(e) => setCategory(e.target.value as NeetCategory)}
                                  required
                                >
                                  <option value="">Select your category</option>
                                  {NEET_CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </label>
                          </div>

                          <div className="nrp-marks-row">
                            <div>
                              <p className="nrp-field__label" id="rp-marks-label">
                                NEET 2026 Marks (Out of 720)
                              </p>
                              <MarksBoxes
                                inputId="rp-marks"
                                value={scoreInput}
                                onChange={(v) => {
                                  setScoreInput(v);
                                  setError(null);
                                }}
                              />
                            </div>
                            <p className="nrp-marks-hint">
                              <Info className="h-4 w-4 shrink-0" aria-hidden />
                              Enter marks as per your NEET 2026 Result/Score
                            </p>
                          </div>

                          <p className="nrp-secure">
                            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            100% Secure · Your data is safe with us and will never be shared.
                          </p>

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
                                <Rocket className="h-4 w-4" aria-hidden />
                                Predict My Rank &amp; Show Colleges
                                <ArrowRight className="h-4 w-4" aria-hidden />
                              </>
                            )}
                          </button>

                          <ul className="nrp-trust-badges">
                            {['100% Free', 'Instant Result', 'No Spam Promise'].map((t) => (
                              <li key={t}>
                                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                                {t}
                              </li>
                            ))}
                          </ul>

                          <PanelStatsBar />
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
                                  {result.categoryLabel} · {result.score}/720 · {state}
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

                            <CollegeScroll title="MBBS India matches" colleges={colleges.india} onNavigate={closePopup} />
                            <CollegeScroll title="MBBS Abroad matches" colleges={colleges.abroad} onNavigate={closePopup} />

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

                  <footer className="nrp-footer">
                    <div className="nrp-footer__brand">
                      <p className="nrp-footer__brand-title">
                        Trusted Counselling Partner | <strong>AR Group of Education</strong>
                      </p>
                      <p className="nrp-footer__brand-sub">{RANK_POPUP_BRAND_LINE}</p>
                    </div>

                    <p className="nrp-footer__privacy">
                      <span className="nrp-footer__privacy-lock" aria-hidden>
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                      Your privacy is our priority
                    </p>
                  </footer>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
