'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useAnimation, useInView, useReducedMotion } from 'framer-motion';

type PlaneAnimationControls = ReturnType<typeof useAnimation>;
import {
  Award,
  Building2,
  GraduationCap,
  Plane,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { STATISTICS } from '@/lib/constants';

const STAT_ICON_MAP: Record<(typeof STATISTICS)[number]['icon'], LucideIcon> = {
  Users,
  Award,
  Building2,
  TrendingUp,
};

const VALUE_PROPS = [
  {
    icon: GraduationCap,
    title: 'Expert Team',
    description:
      '19+ years guiding students with dedicated MBBS admission counsellors across India and abroad.',
  },
  {
    icon: Building2,
    title: 'Top Universities',
    description:
      'Partnerships with 500+ accredited medical colleges — vetted for NMC and WHO alignment.',
  },
  {
    icon: Plane,
    title: 'Complete Support',
    description:
      'From NEET counselling and documentation to visa filing and pre-departure briefings.',
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.35 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/** One leg of the flight path (entry or ping-pong) */
const PLANE_LEG_DURATION = 3.75;
const PLANE_EASE = [0.42, 0, 0.58, 1] as const;

/** vw-based travel: % on x is element-relative in Framer; vw spans the flight layer */
const PLANE_X_LEFT = '-10vw';
const PLANE_X_RIGHT = '92vw';

const PLANE_POSE_LEFT = {
  y: '2%',
  rotate: 6,
  rotateY: -32,
  rotateX: 10,
  scale: 0.8,
  opacity: 0.55,
};

const PLANE_POSE_RIGHT = {
  y: '-5%',
  rotate: 0,
  rotateY: 20,
  rotateX: 2,
  scale: 1.02,
  opacity: 0.72,
};

const GHOST_POSE_LEFT = {
  y: '14%',
  rotate: 4,
  rotateY: -18,
  rotateX: 6,
  scale: 0.65,
  opacity: 0.35,
};

const GHOST_POSE_RIGHT = {
  y: '8%',
  rotate: 2,
  rotateY: 14,
  rotateX: 2,
  scale: 0.8,
  opacity: 0.45,
};

type PlaneFlightConfig = {
  controls: PlaneAnimationControls;
  isInView: boolean;
  reducedMotion: boolean;
  entryDelay: number;
  xLeft: string;
  xRight: string;
  poseLeft: typeof PLANE_POSE_LEFT;
  poseRight: typeof PLANE_POSE_RIGHT;
  reducedX?: string;
  onLegStart?: (toRight: boolean) => void;
};

/** Entry L→R once, then R↔L ping-pong while in view; pauses when scrolled away */
function usePlaneFlight({
  controls,
  isInView,
  reducedMotion,
  entryDelay,
  xLeft,
  xRight,
  poseLeft,
  poseRight,
  reducedX = '4%',
  onLegStart,
}: PlaneFlightConfig) {
  const [entryDone, setEntryDone] = useState(false);
  const onLegStartRef = useRef(onLegStart);
  onLegStartRef.current = onLegStart;

  useEffect(() => {
    if (reducedMotion) {
      onLegStartRef.current?.(true);
      void controls.start({
        x: [ reducedX, '12%', reducedX ],
        y: '0%',
        rotate: 2,
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        opacity: 0.78,
        transition: {
          duration: 14,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        },
      });
      return;
    }

    if (!isInView) {
      controls.stop();
      return;
    }

    let cancelled = false;
    const leg = { duration: PLANE_LEG_DURATION, ease: PLANE_EASE };

    const run = async () => {
      if (!entryDone) {
        onLegStartRef.current?.(true);
        await controls.start({
          x: xRight,
          ...poseRight,
          opacity: poseRight.opacity,
          transition: { ...leg, delay: entryDelay },
        });
        if (cancelled) return;
        setEntryDone(true);
        return;
      }

      while (!cancelled) {
        onLegStartRef.current?.(false);
        await controls.start({ x: xLeft, ...poseLeft, transition: leg });
        if (cancelled) return;
        onLegStartRef.current?.(true);
        await controls.start({ x: xRight, ...poseRight, transition: leg });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    controls,
    entryDelay,
    entryDone,
    isInView,
    poseLeft,
    poseRight,
    reducedMotion,
    reducedX,
    xLeft,
    xRight,
  ]);
}

function FlightPathArc({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 200"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M40 95 C 320 25, 680 30, 1160 125"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="12 10"
        strokeLinecap="round"
        className="text-gold-500/75"
      />
    </svg>
  );
}

/** Custom SVG plane facing right — gold/navy gradient, high visibility */
function BrandedPlaneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="achievePlaneFill" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#1a365d" />
          <stop offset="45%" stopColor="#ffa726" />
          <stop offset="100%" stopColor="#ff9800" />
        </linearGradient>
        <filter id="achievePlaneShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#051219" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter="url(#achievePlaneShadow)">
        <path
          d="M4 24 L28 22 L52 14 L76 24 L52 26 L28 28 Z"
          fill="url(#achievePlaneFill)"
          stroke="#142d4c"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M28 22 L36 8 L44 22"
          fill="#ffb74d"
          stroke="#f57c00"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <ellipse cx="48" cy="24" rx="6" ry="3" fill="#fff3e0" opacity="0.9" />
        <path d="M18 26 L22 32 M18 22 L22 16" stroke="#1a365d" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const CLOUD_PUFFS = [
  { left: '12%', top: '32%', delay: 0.9, size: 'h-10 w-14' },
  { left: '38%', top: '26%', delay: 1.6, size: 'h-8 w-12' },
  { left: '62%', top: '30%', delay: 2.4, size: 'h-9 w-13' },
  { left: '85%', top: '28%', delay: 3.1, size: 'h-7 w-11' },
] as const;

function AnimatedPlane({
  controls,
  facingRight,
  reducedMotion,
  className,
  contrailClassName,
  children,
}: {
  controls: PlaneAnimationControls;
  facingRight: boolean;
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
  contrailClassName?: string;
}) {
  return (
    <motion.div
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
      initial={
        reducedMotion
          ? { x: '4%', y: '0%', rotate: 2, rotateY: 0, rotateX: 0, scale: 1, opacity: 0.78 }
          : { x: PLANE_X_LEFT, ...PLANE_POSE_LEFT, opacity: 0 }
      }
      animate={controls}
    >
      {!reducedMotion && contrailClassName && (
        <motion.div
          className={
            facingRight
              ? `absolute right-full top-1/2 -mr-0.5 -translate-y-1/2 rounded-full bg-gradient-to-l to-transparent ${contrailClassName}`
              : `absolute left-full top-1/2 -ml-0.5 -translate-y-1/2 rounded-full bg-gradient-to-r to-transparent ${contrailClassName}`
          }
          animate={{ opacity: facingRight ? [ 0.7, 0.95, 0.75 ] : [ 0.55, 0.85, 0.6 ] }}
          transition={{ duration: PLANE_LEG_DURATION, repeat: Infinity, repeatType: 'reverse' }}
          aria-hidden
        />
      )}
      <motion.div
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ scaleX: facingRight ? 1 : -1 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function FlyingPlaneLayer({ reducedMotion }: { reducedMotion: boolean }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(layerRef, { margin: '-80px', amount: 0.15 });
  const primaryControls = useAnimation();
  const ghostControls = useAnimation();
  const [primaryFacingRight, setPrimaryFacingRight] = useState(true);
  const [ghostFacingRight, setGhostFacingRight] = useState(true);

  usePlaneFlight({
    controls: primaryControls,
    isInView,
    reducedMotion,
    entryDelay: 0.25,
    xLeft: PLANE_X_LEFT,
    xRight: PLANE_X_RIGHT,
    poseLeft: PLANE_POSE_LEFT,
    poseRight: PLANE_POSE_RIGHT,
    onLegStart: (toRight) => setPrimaryFacingRight(toRight),
  });

  usePlaneFlight({
    controls: ghostControls,
    isInView,
    reducedMotion,
    entryDelay: 0.7,
    xLeft: PLANE_X_LEFT,
    xRight: PLANE_X_RIGHT,
    poseLeft: GHOST_POSE_LEFT,
    poseRight: GHOST_POSE_RIGHT,
    reducedX: '10%',
    onLegStart: (toRight) => setGhostFacingRight(toRight),
  });

  return (
    <motion.div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ perspective: reducedMotion ? undefined : '1200px' }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      aria-hidden
    >
      {/* Sky band behind flight zone */}
      <motion.div
        className="absolute inset-x-0 top-[14%] h-[42%] bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-transparent md:top-[16%] md:h-[40%]"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.8 } },
        }}
      />

      {/* Dashed flight arc — left to right */}
      <motion.div
        className="absolute inset-x-0 top-[20%] h-28 md:top-[24%] md:h-36"
        variants={{
          hidden: { opacity: 0, scaleX: 0.35 },
          visible: {
            opacity: 1,
            scaleX: 1,
            transition: { duration: 1.2, delay: 0.1, ease: 'easeOut' },
          },
        }}
        style={{ transformOrigin: 'left center' }}
      >
        <FlightPathArc className="h-full w-full" />
      </motion.div>

      {/* Cloud puffs along path */}
      {!reducedMotion &&
        CLOUD_PUFFS.map((puff, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-white/50 blur-md ${puff.size}`}
            style={{ left: puff.left, top: puff.top }}
            variants={{
              hidden: { opacity: 0, scale: 0.5 },
              visible: {
                opacity: [ 0, 0.55, 0.35 ],
                scale: [ 0.5, 1.1, 0.95 ],
                transition: { duration: 1.2, delay: puff.delay, ease: 'easeOut' },
              },
            }}
          />
        ))}

      {/* Primary plane — entry L→R, then infinite R↔L ping-pong */}
      <AnimatedPlane
        controls={primaryControls}
        facingRight={primaryFacingRight}
        reducedMotion={reducedMotion}
        className="absolute left-0 top-[22%] will-change-transform md:top-[26%]"
        contrailClassName="h-1.5 w-28 from-gold-500/90 via-gold-400/50 shadow-[0_0_12px_rgba(255,167,38,0.35)] md:h-2 md:w-44"
      >
        <BrandedPlaneIcon className="h-16 w-24 drop-shadow-xl sm:h-20 sm:w-28 md:h-24 md:w-36 lg:h-28 lg:w-40" />
      </AnimatedPlane>

      {/* Secondary plane — parallax ghost, same flight pattern */}
      <AnimatedPlane
        controls={ghostControls}
        facingRight={ghostFacingRight}
        reducedMotion={reducedMotion}
        className="absolute left-0 top-[36%] will-change-transform md:top-[40%]"
        contrailClassName="h-1 w-20 from-navy-500/50 via-navy-400/25 md:w-32"
      >
        <Plane
          className="h-8 w-8 text-navy-600 drop-shadow-md sm:h-9 sm:w-9 md:h-11 md:w-11"
          strokeWidth={2.25}
          fill="currentColor"
          fillOpacity={0.15}
          aria-hidden
        />
      </AnimatedPlane>
    </motion.div>
  );
}

export const AchievementsSection = () => {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-navy-50/30 py-16 md:py-24"
      aria-labelledby="achievements-heading"
    >
      {/* Navy accent band */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-900/[0.04] to-transparent"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        aria-hidden
      />

      <FlyingPlaneLayer reducedMotion={reducedMotion} />

      <motion.div
        className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-gold-400/12 blur-3xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-navy-500/8 blur-3xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.15 }}
        viewport={{ once: true }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-700">
            <Plane className="h-3.5 w-3.5 text-gold-600" strokeWidth={2.5} aria-hidden />
            Global education journeys
          </span>
          <h2
            id="achievements-heading"
            className="mt-5 font-serif text-3xl font-bold leading-tight text-navy-900 md:text-4xl lg:text-[2.65rem]"
          >
            Our{' '}
            <span className="bg-gradient-to-r from-gold-500 to-gold-700 bg-clip-text text-transparent">
              Proven Track Record
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
            Trusted by thousands of aspiring doctors — admissions, visas, and successful
            study-abroad journeys since 2005.
          </p>
        </div>

        {/* KPI stats — glass cards */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {STATISTICS.map((stat) => {
            const Icon = STAT_ICON_MAP[stat.icon];
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-4 shadow-lg shadow-navy-900/5 backdrop-blur-md transition duration-300 hover:border-gold-300/60 hover:shadow-xl md:p-5"
              >
                <motion.div
                  className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold-400/15 blur-2xl transition group-hover:bg-gold-400/25"
                  aria-hidden
                />
                <motion.div
                  className="mb-2.5 inline-flex rounded-lg border border-gold-400/30 bg-gold-50/80 p-2"
                  whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <Icon className="h-4 w-4 text-gold-600 md:h-5 md:w-5" strokeWidth={2} />
                </motion.div>
                <p className="font-serif text-2xl font-bold leading-none text-gold-600 sm:text-3xl md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-snug text-slate-600 sm:text-xs md:text-sm">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Three pillars */}
        <motion.div
          className="mt-10 grid gap-4 sm:gap-5 md:mt-14 md:grid-cols-3 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {VALUE_PROPS.map((item, index) => (
            <motion.article
              key={item.title}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-2xl border-2 border-navy-900/10 bg-white/90 p-5 shadow-md shadow-navy-900/5 transition duration-300 hover:border-gold-400/50 hover:shadow-lg md:p-6"
            >
              <motion.div
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-0 transition group-hover:opacity-100"
                aria-hidden
              />
              <div className="flex items-start gap-4">
                <motion.div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-navy-900/15 bg-navy-50 text-navy-900 transition group-hover:border-gold-400/40 group-hover:bg-gold-50 group-hover:text-gold-700 md:h-12 md:w-12"
                  whileHover={reducedMotion ? undefined : { rotate: index === 2 ? -6 : 0, scale: 1.04 }}
                >
                  <item.icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
                </motion.div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-navy-900 md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
