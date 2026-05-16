'use client';

import { useEffect, useState } from 'react';
import { isTransientHeroCmsError } from '@/lib/heroCmsConnection';
import {
  buildHeroMbbsFormInitialValues,
  loadHeroMbbsFormDefinition,
  peekHeroMbbsFormDefinition,
  type HeroMbbsFormDoc,
} from '@/lib/mbbsHeroFormDefinitionsCache';

type Kind = 'india' | 'abroad';

const POLL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export function useHeroMbbsFormDefinition(kind: Kind) {
  const [form, setForm] = useState<HeroMbbsFormDoc | null>(() => {
    const c = peekHeroMbbsFormDefinition(kind);
    return c?.ok ? c.doc : null;
  });
  const [loadError, setLoadError] = useState<string | null>(() => {
    const c = peekHeroMbbsFormDefinition(kind);
    return c && !c.ok ? c.message : null;
  });
  const [loading, setLoading] = useState(() => !peekHeroMbbsFormDefinition(kind)?.ok);
  const [retrying, setRetrying] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const c = peekHeroMbbsFormDefinition(kind);
    return c?.ok ? buildHeroMbbsFormInitialValues(c.doc) : {};
  });

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let pollAttempts = 0;

    const apply = (r: Awaited<ReturnType<typeof loadHeroMbbsFormDefinition>>) => {
      if (cancelled) return;
      if (r.ok) {
        setForm(r.doc);
        setValues(buildHeroMbbsFormInitialValues(r.doc));
        setLoadError(null);
        setLoading(false);
        setRetrying(false);
        return;
      }
      setForm(null);
      setLoadError(r.message);
      setLoading(false);
      if (isTransientHeroCmsError(r.message) && pollAttempts < MAX_POLL_ATTEMPTS) {
        setRetrying(true);
        pollTimer = setTimeout(() => {
          pollAttempts += 1;
          void run(true);
        }, POLL_MS);
      } else {
        setRetrying(false);
      }
    };

    const run = (force = false) => {
      if (!peekHeroMbbsFormDefinition(kind)?.ok) {
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

  return { form, loadError, loading, retrying, values, setValues };
}
