'use client';

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { MBBS_INDIA_HERO_STATE_OPTIONS } from '@/lib/mbbsIndiaHeroStateOptions';
import { useHeroMbbsFormDefinition } from '@/lib/useHeroMbbsFormDefinition';

type FormFieldBlock = {
  id?: string | null;
  blockName?: string | null;
  blockType: string;
  name?: string;
  label?: string | null;
  required?: boolean | null;
  defaultValue?: string | number | boolean | null;
  placeholder?: string | null;
  width?: number | null;
  options?: { label: string; value: string }[] | null;
};

type PayloadFormDoc = {
  id: number;
  title?: string;
  submitButtonLabel?: string | null;
  confirmationType?: 'message' | 'redirect' | null;
  fields?: FormFieldBlock[] | null;
};

function isInputField(f: FormFieldBlock): f is FormFieldBlock & { name: string } {
  if (!f.name) return false;
  if (f.blockType === 'message') return false;
  return true;
}

const inputClass =
  'w-full rounded-lg border border-white/40 bg-white/95 px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 shadow-sm outline-none ring-0 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/40';

export type MbbsIndiaHeroPayloadFormProps = {
  /** `heroSide`: right-column panel in home hero (no top margin, stronger card). */
  layout?: 'stacked' | 'heroSide';
  className?: string;
};

export function MbbsIndiaHeroPayloadForm({
  layout = 'stacked',
  className: outerClassName,
}: MbbsIndiaHeroPayloadFormProps) {
  const { form: loadedForm, loadError, loading, retrying, values, setValues } =
    useHeroMbbsFormDefinition('india');
  const form = loadedForm as PayloadFormDoc | null;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fields = useMemo(
    () => (form?.fields || []).filter(isInputField),
    [form?.fields]
  );

  const setField = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, [setValues]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form) return;
      setSubmitError(null);
      for (const f of fields) {
        if (f.required && !String(values[f.name] ?? '').trim()) {
          setSubmitError(`Please fill in: ${f.label || f.name}`);
          return;
        }
      }
      setSubmitting(true);
      try {
        const submissionData = fields.map((f) => ({
          field: f.name,
          value: values[f.name] ?? '',
        }));
        const res = await fetch('/api/cms/form-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form: form.id,
            submissionData,
          }),
        });
        const raw = await res.text();
        let data: { errors?: { message?: string }[]; message?: string } = {};
        try {
          if (raw.trim()) data = JSON.parse(raw) as typeof data;
        } catch {
          setSubmitError(
            raw.trim()
              ? 'Could not read CMS response after submit.'
              : 'Empty CMS response after submit.'
          );
          return;
        }
        if (!res.ok) {
          const msg =
            data.errors?.[0]?.message || data.message || `Submit failed (${res.status})`;
          setSubmitError(msg);
          return;
        }
        setSubmitted(true);
      } catch {
        setSubmitError('Network error. Try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [form, fields, values]
  );

  const isSide = layout === 'heroSide';

  const panelClass = clsx(
    isSide ? 'mt-0 w-full' : 'mt-8',
    isSide
      ? 'rounded-2xl border border-white/35 bg-gradient-to-b from-white/[0.22] to-white/[0.07] p-5 shadow-2xl shadow-black/35 ring-1 ring-white/20 backdrop-blur-xl md:p-6'
      : 'rounded-xl border border-white/30 bg-white/10 p-4 backdrop-blur-md md:p-6',
    outerClassName
  );

  if (loading || retrying) {
    return (
      <div className={panelClass}>
        <div className="py-8 text-center text-sm text-white/90 md:py-10">
          {retrying ? 'Connecting to CMS…' : 'Loading enquiry form…'}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={panelClass}>
        <div className="rounded-lg border border-red-400/30 bg-red-950/40 px-4 py-4 text-sm text-red-100">
          {loadError}
        </div>
      </div>
    );
  }

  if (!form) return null;

  if (submitted) {
    return (
      <div className={panelClass}>
        <div className="rounded-lg border border-emerald-400/35 bg-emerald-950/30 px-4 py-8 text-center text-sm font-medium text-emerald-50 md:px-6 md:py-10 md:text-base">
          Thank you! We received your details and will contact you soon.
        </div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-8 w-1 shrink-0 rounded-full bg-gold-400" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/95">
          Quick enquiry (MBBS India)
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {fields.map((field) => {
          const label = field.label || field.name;
          const req = field.required ? ' *' : '';

          if (field.blockType === 'textarea') {
            return (
              <div key={field.id || field.name} className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-white" htmlFor={field.name}>
                  {label}
                  {req && <span className="text-gold-300">{req}</span>}
                </label>
                <textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  placeholder={field.placeholder || undefined}
                  className={inputClass}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              </div>
            );
          }

          if (field.blockType === 'state') {
            return (
              <div key={field.id || field.name}>
                <label className="mb-1 block text-xs font-medium text-white" htmlFor={field.name}>
                  {label}
                  {req && <span className="text-gold-300">{req}</span>}
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  className={inputClass}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {MBBS_INDIA_HERO_STATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          const isIndiaHeroStateSelect =
            field.blockType === 'select' &&
            (field.name?.toLowerCase().includes('state') ||
              (field.label && field.label.toLowerCase().includes('state')));

          if (isIndiaHeroStateSelect) {
            return (
              <div key={field.id || field.name}>
                <label className="mb-1 block text-xs font-medium text-white" htmlFor={field.name}>
                  {label}
                  {req && <span className="text-gold-300">{req}</span>}
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  className={inputClass}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {MBBS_INDIA_HERO_STATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.blockType === 'select' && field.options?.length) {
            return (
              <div key={field.id || field.name}>
                <label className="mb-1 block text-xs font-medium text-white" htmlFor={field.name}>
                  {label}
                  {req && <span className="text-gold-300">{req}</span>}
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  className={inputClass}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.blockType === 'checkbox') {
            return (
              <div key={field.id || field.name} className="flex items-center gap-2 sm:col-span-2">
                <input
                  id={field.name}
                  name={field.name}
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/50 text-gold-500 focus:ring-gold-400"
                  checked={values[field.name] === 'true'}
                  onChange={(e) => setField(field.name, e.target.checked ? 'true' : '')}
                />
                <label htmlFor={field.name} className="text-sm text-white">
                  {label}
                  {req && <span className="text-gold-300">{req}</span>}
                </label>
              </div>
            );
          }

          const type =
            field.blockType === 'email'
              ? 'email'
              : field.blockType === 'number'
                ? 'number'
                : 'text';

          return (
            <div key={field.id || field.name}>
              <label className="mb-1 block text-xs font-medium text-white" htmlFor={field.name}>
                {label}
                {req && <span className="text-gold-300">{req}</span>}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={type}
                placeholder={field.placeholder || undefined}
                className={inputClass}
                value={values[field.name] ?? ''}
                onChange={(e) => setField(field.name, e.target.value)}
              />
            </div>
          );
        })}

        {submitError && (
          <div className="sm:col-span-2 rounded-lg border border-red-300/50 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {submitError}
          </div>
        )}

        <div className="sm:col-span-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className={isSide ? 'w-full' : 'w-full sm:w-auto'}
            disabled={submitting}
            isLoading={submitting}
          >
            {form.submitButtonLabel || 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
