'use client';

import Link from 'next/link';
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { HOME_INTERNAL_PATHS } from '@/lib/homePageSeoContent';
import { MD_MS_NAV_ITEMS } from '@/lib/mdMsNav';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';

const BRANCHES = [
  'Medicine',
  'Surgery',
  'Radiology',
  'Orthopaedics',
  'Paediatrics',
  'Dermatology',
  'Anaesthesia',
  'ENT',
] as const;

const FEATURED_STATES = MD_MS_NAV_ITEMS.slice(0, 8);

const STATS = [
  { value: '21+', label: 'Years guidance' },
  { value: 'NEET PG', label: 'Counselling focus' },
  { value: '9+', label: 'State pathways' },
] as const;

export function MdMsHomeSection() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLElement>(null);
  const [spot, setSpot] = useState({ x: 72, y: 28 });

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setSpot({ x, y });
    },
    [reduceMotion]
  );

  return (
    <section
      ref={stageRef}
      className="mdms-home"
      aria-labelledby="mdms-home-title"
      onPointerMove={onPointerMove}
      style={
        {
          '--mdms-spot-x': `${spot.x}%`,
          '--mdms-spot-y': `${spot.y}%`,
        } as CSSProperties
      }
    >
      <div className="mdms-home__aurora" aria-hidden />
      <div className="mdms-home__spotlight" aria-hidden />
      <div className="mdms-home__mesh" aria-hidden />
      <div className="mdms-home__noise" aria-hidden />
      <div className="mdms-home__watermark" aria-hidden>
        <span>MD</span>
        <span>MS</span>
      </div>

      <div className="mdms-home__inner">
        <div className="mdms-home__layout">
          <motion.div
            className="mdms-home__copy"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-50px' }}
          >
            <div className="mdms-home__kicker">
              <Sparkles className="mdms-home__kicker-icon" aria-hidden />
              <span className="mdms-home__kicker-dot" aria-hidden />
              NEET PG · Specialisation pathways
            </div>

            <h2 id="mdms-home-title" className="mdms-home__title">
              Secure your <span className="mdms-home__title-accent">MD/MS seat</span>
              <span className="mdms-home__title-line">with expert PG guidance</span>
            </h2>

            <p className="mdms-home__lede">
              From branch shortlisting to state counselling strategy — AR Group of Education helps medical
              graduates plan MD/MS Admission in India with clear cut-offs, fees, and seat-matrix clarity.
            </p>

            <div className="mdms-home__actions">
              <Link href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia} className="mdms-home__btn mdms-home__btn--primary">
                <span className="mdms-home__btn-shine" aria-hidden />
                Explore MD/MS
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                className="mdms-home__btn mdms-home__btn--ghost"
                onClick={openLeadCapturePopup}
              >
                <GraduationCap className="h-4 w-4" aria-hidden />
                Talk to PG counsellor
              </button>
            </div>

            <ul className="mdms-home__stats" aria-label="MD/MS counselling highlights">
              {STATS.map((stat, index) => (
                <motion.li
                  key={stat.label}
                  className="mdms-home__stat"
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.12 + index * 0.06 }}
                  viewport={{ once: true }}
                >
                  <span className="mdms-home__stat-value">{stat.value}</span>
                  <span className="mdms-home__stat-label">{stat.label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="mdms-home__stage"
            initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: '-50px' }}
          >
            <div className="mdms-home__panel">
              <div className="mdms-home__panel-glow" aria-hidden />

              <div className="mdms-home__dual">
                <article className="mdms-home__track mdms-home__track--md">
                  <div className="mdms-home__track-glow" aria-hidden />
                  <div className="mdms-home__track-top">
                    <span className="mdms-home__track-code">MD</span>
                    <span className="mdms-home__track-tag">Clinical path</span>
                  </div>
                  <h3 className="mdms-home__track-title">Doctor of Medicine</h3>
                  <p className="mdms-home__track-text">
                    Clinical &amp; non-clinical medicine pathways after NEET PG.
                  </p>
                </article>

                <article className="mdms-home__track mdms-home__track--ms">
                  <div className="mdms-home__track-glow" aria-hidden />
                  <div className="mdms-home__track-top">
                    <span className="mdms-home__track-code">MS</span>
                    <span className="mdms-home__track-tag">Surgical path</span>
                  </div>
                  <h3 className="mdms-home__track-title">Master of Surgery</h3>
                  <p className="mdms-home__track-text">
                    Surgical specialities with seat planning by state &amp; quota.
                  </p>
                </article>
              </div>

              <div className="mdms-home__marquee" aria-label="Popular PG branches">
                <div className="mdms-home__marquee-track">
                  {[...BRANCHES, ...BRANCHES].map((branch, index) => (
                    <span key={`${branch}-${index}`} className="mdms-home__branch">
                      {branch}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mdms-home__states">
                <div className="mdms-home__states-head">
                  <p className="mdms-home__states-label">Counselling by state</p>
                  <span className="mdms-home__states-hint">Tap a state</span>
                </div>
                <div className="mdms-home__state-row">
                  {FEATURED_STATES.map((state, index) => (
                    <motion.div
                      key={state.id}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.04 * index }}
                      viewport={{ once: true }}
                    >
                      <Link href={state.href} className="mdms-home__state" title={state.label}>
                        <span className="mdms-home__state-code">{state.shortLabel}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mdms-home__panel-foot">
                <p>Need branch-wise cut-off and fee clarity before choice filling?</p>
                <Link href={HOME_INTERNAL_PATHS.mdMsAdmissionIndia} className="mdms-home__panel-link">
                  View all states
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default MdMsHomeSection;
