'use client';

import { useEffect, useState } from 'react';
import { isTransientHeroCmsError, shouldUseHeroMbbsFallback } from '@/lib/heroCmsConnection';
import {
  buildHeroMbbsFormInitialValues,
  cacheHeroMbbsFallbackDefinition,
  loadHeroMbbsFormDefinition,
  peekHeroMbbsFormDefinition,
  type HeroMbbsFormDoc,
} from '@/lib/mbbsHeroFormDefinitionsCache';
import { isHeroMbbsFallbackForm } from '@/lib/mbbsHeroFormFallback';

type Kind = 'india' | 'abroad';

const POLL_MS_FAST = 1500;
const POLL_MS_SLOW = 3000;
const POLL_MS_IDLE = 10_000;
const FAST_POLL_WINDOW_MS = 10_000;

function pollDelayMs(startedAt: number, idle: boolean): number {
  if (idle) return POLL_MS_IDLE;
  return Date.now() - startedAt < FAST_POLL_WINDOW_MS ? POLL_MS_FAST : POLL_MS_SLOW;
}

function logCmsDevWarning(kind: Kind, message: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[hero-form:${kind}]`, message);
  }
}

function applyFallback(
  kind: Kind,
  setForm: (doc: HeroMbbsFormDoc) => void,
  setValues: (v: Record<string, string>) => void,
  setLoadError: (e: string | null) => void,
  setDebugMessage: (m: string | null) => void,
  setLoading: (l: boolean) => void,
  setRetrying: (r: boolean) => void,
  setUsingFallback: (f: boolean) => void
) {
  const fallback = cacheHeroMbbsFallbackDefinition(kind);
  setForm(fallback);
  setValues(buildHeroMbbsFormInitialValues(fallback));
  setLoadError(null);
  setDebugMessage(null);
  setLoading(false);
  setRetrying(false);
  setUsingFallback(true);
}

export function useHeroMbbsFormDefinition(kind: Kind) {
  const [form, setForm] = useState<HeroMbbsFormDoc | null>(() => {
    const c = peekHeroMbbsFormDefinition(kind);
    return c?.ok ? c.doc : null;
  });
  const [loadError, setLoadError] = useState<string | null>(() => {
    const c = peekHeroMbbsFormDefinition(kind);
    if (!c || c.ok) return null;
    return isTransientHeroCmsError(c.message) ? null : c.message;
  });
  const [loading, setLoading] = useState(() => !peekHeroMbbsFormDefinition(kind)?.ok);
  const [retrying, setRetrying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const c = peekHeroMbbsFormDefinition(kind);
    return c?.ok ? buildHeroMbbsFormInitialValues(c.doc) : {};
  });

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let pollAttempts = 0;
    const startedAt = Date.now();

    const schedulePoll = (force: boolean, idle: boolean) => {
      pollTimer = setTimeout(() => {
        pollAttempts += 1;
        void run(force);
      }, pollDelayMs(startedAt, idle));
    };

    const apply = (r: Awaited<ReturnType<typeof loadHeroMbbsFormDefinition>>) => {
      if (cancelled) return;
      if (r.ok) {
        setForm(r.doc);
        setValues(buildHeroMbbsFormInitialValues(r.doc));
        setLoadError(null);
        setDebugMessage(null);
        setLoading(false);
        setRetrying(false);
        setUsingFallback(false);
        return;
      }

      setDebugMessage(r.message);

      if (shouldUseHeroMbbsFallback(r.message, pollAttempts)) {
        logCmsDevWarning(kind, `Using offline form fields: ${r.message}`);
        applyFallback(
          kind,
          setForm,
          setValues,
          setLoadError,
          setDebugMessage,
          setLoading,
          setRetrying,
          setUsingFallback
        );
        const idle = pollAttempts >= 40;
        schedulePoll(true, idle);
        return;
      }

      setForm(null);

      if (isTransientHeroCmsError(r.message)) {
        logCmsDevWarning(kind, r.message);
        setLoadError(null);
        setLoading(true);
        setRetrying(true);
        const idle = pollAttempts >= 40;
        schedulePoll(true, idle);
        return;
      }

      logCmsDevWarning(kind, r.message);
      applyFallback(
        kind,
        setForm,
        setValues,
        setLoadError,
        setDebugMessage,
        setLoading,
        setRetrying,
        setUsingFallback
      );
      const idle = pollAttempts >= 40;
      schedulePoll(true, idle);
    };

    const run = (force = false) => {
      const cached = peekHeroMbbsFormDefinition(kind);
      const upgradingFallback = force && cached?.ok && isHeroMbbsFallbackForm(cached.doc);
      if (!cached?.ok && !upgradingFallback) {
        setLoading(true);
        if (force) setRetrying(true);
      }
      return loadHeroMbbsFormDefinition(kind, { force }).then(apply);
    };

    void run();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [kind]);

  const cmsStarting = !form && !usingFallback && (loading || retrying);

  return {
    form,
    loadError,
    loading,
    retrying,
    cmsStarting,
    usingFallback,
    debugMessage,
    values,
    setValues,
  };
}
