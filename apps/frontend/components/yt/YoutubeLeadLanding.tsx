'use client';

import {
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowRight, ChevronDown, Lock, Search, Sparkles } from 'lucide-react';

const COURSES = ['MBBS India', 'MBBS Abroad', 'MD/MS', 'BAMS'] as const;

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

type Course = (typeof COURSES)[number];

function siteHomeUrl(): string {
  if (typeof window === 'undefined') return '/';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '/';
  return 'https://www.argroupofeducation.com/';
}

function StateDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIAN_STATES;
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-3 text-left text-base outline-none transition duration-200 ${
          open
            ? 'border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]'
            : 'border-slate-200 hover:border-orange-300 hover:shadow-sm'
        }`}
      >
        <span className={value ? 'text-navy-900' : 'text-slate-400'}>
          {value || 'Select your state'}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-orange-500 transition duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.25)] animate-[ytDrop_160ms_ease-out]"
        >
          <div className="relative mb-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15"
            />
          </div>
          <ul className="yt-state-scroll max-h-52 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No state found</li>
            ) : (
              filtered.map((s) => {
                const active = value === s;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(s);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`mb-0.5 w-full rounded-xl px-3 py-2.5 text-left text-sm transition duration-150 ${
                        active
                          ? 'bg-orange-50 font-semibold text-orange-600'
                          : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {s}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function YoutubeLeadLanding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [course, setCourse] = useState<Course | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const home = useMemo(() => siteHomeUrl(), []);

  useEffect(() => {
    document.body.setAttribute('data-yt-landing', '1');
    document.documentElement.style.overflowX = 'hidden';

    window.history.pushState({ ytLanding: true }, '', window.location.href);
    const onPopState = () => {
      window.location.replace(home);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      document.body.removeAttribute('data-yt-landing');
      window.removeEventListener('popstate', onPopState);
    };
  }, [home]);

  function onPhoneChange(value: string) {
    setPhone(value.replace(/\D/g, '').slice(0, 10));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!state) {
      setError('Please select your state.');
      return;
    }
    if (!course) {
      setError('Please select a course of interest.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/yt-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: trimmedName, phone, state, course }),
        cache: 'no-store',
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!res.ok || !json.ok) {
        setError(json.message || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      setDone(true);
      window.setTimeout(() => {
        window.location.replace(home);
      }, 1200);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body[data-yt-landing='1'] nav,
        body[data-yt-landing='1'] footer,
        body[data-yt-landing='1'] [data-college-predictor-promo],
        body[data-yt-landing='1'] [data-deferred-site-popups],
        body[data-yt-landing='1'] [data-pwa-registrar],
        body[data-yt-landing='1'] [data-lead-submission-feedback] {
          display: none !important;
        }
        body[data-yt-landing='1'] main {
          padding: 0 !important;
          margin: 0 !important;
          min-height: 100dvh;
        }
        @keyframes ytDashMove {
          to { stroke-dashoffset: -64; }
        }
        @keyframes ytDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .yt-dash {
          animation: ytDashMove 1.8s linear infinite;
        }
        .group:hover .yt-dash {
          animation-duration: 0.9s;
        }
        .yt-state-scroll {
          scrollbar-width: thin;
          scrollbar-color: #fb923c transparent;
        }
        .yt-state-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .yt-state-scroll::-webkit-scrollbar-thumb {
          background: #fb923c;
          border-radius: 999px;
        }
        .yt-state-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .yt-input:hover {
          border-color: #fdba74;
        }
        .yt-input:focus {
          border-color: #fb923c;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
        }
        .yt-chip {
          transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease;
        }
        .yt-chip:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px -8px rgba(249,115,22,0.45);
        }
        .yt-submit {
          transition: transform 200ms ease, background-color 200ms ease, box-shadow 200ms ease;
        }
        .yt-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px -12px rgba(249,115,22,0.55);
        }
        .yt-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        @keyframes ytFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ytPulseSoft {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
        .yt-float {
          animation: ytFloat 4s ease-in-out infinite;
        }
        .yt-pulse-soft {
          animation: ytPulseSoft 3.2s ease-in-out infinite;
        }
        .yt-stat-card {
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
        }
        .yt-stat-card:hover {
          transform: translateY(-3px);
          border-color: #fdba74;
          box-shadow: 0 14px 28px -16px rgba(249,115,22,0.45);
        }
      `,
        }}
      />

      <div
        data-yt-landing-root
        className="relative min-h-dvh w-full overflow-x-hidden bg-[radial-gradient(ellipse_at_top_left,_#fff7ed_0%,_#f7f8fb_42%,_#eef2ff_100%)]"
      >
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl yt-pulse-soft" />
        <div className="pointer-events-none absolute bottom-10 right-0 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl yt-pulse-soft" />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Mobile: content first, then form. Desktop: content left, form right. */}
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Left: clean brand intro only */}
            <div className="relative order-1 flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Counselling form
              </div>
              <h1 className="mt-5 font-sans text-3xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]">
                Need Help with{' '}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  MBBS Admissions?
                </span>
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                Fill the form and our counselling team will contact you.
              </p>
            </div>

            {/* Form card */}
            <div className="order-2">
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] transition duration-300 hover:shadow-[0_28px_70px_-24px_rgba(15,23,42,0.28)] sm:p-7 lg:p-8">
                <h2 className="text-xl font-bold text-navy-900 sm:text-2xl">
                  Fill the Details Below.
                </h2>

                {done ? (
                  <div className="mt-8 rounded-2xl bg-emerald-50 px-4 py-6 text-center">
                    <p className="font-semibold text-emerald-800">Thank you! Opening our website…</p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Our counsellor will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                    <div>
                      <label
                        htmlFor="yt-name"
                        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-900"
                      >
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="yt-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={120}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=""
                        className="yt-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-navy-900 outline-none transition"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="yt-phone"
                        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-900"
                      >
                        Phone number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="yt-phone"
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        placeholder="10 digit"
                        className="yt-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-navy-900 outline-none transition placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-900">
                        State of residence <span className="text-red-500">*</span>
                      </span>
                      <StateDropdown value={state} onChange={setState} />
                    </div>

                    <fieldset>
                      <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-900">
                        Course of interest <span className="text-red-500">*</span>
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {COURSES.map((c) => {
                          const active = course === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setCourse(c)}
                              className={`yt-chip rounded-full border px-3.5 py-2 text-sm font-medium ${
                                active
                                  ? 'border-orange-500 bg-orange-50 font-semibold text-orange-700 shadow-sm'
                                  : 'border-slate-200 bg-white text-navy-800 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                              }`}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {error ? (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="yt-submit flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? 'Please wait…' : 'Request Free Callback'}
                      {!submitting ? (
                        <ArrowRight
                          className="h-5 w-5 transition group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      ) : null}
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      Your information is secure and never shared.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
