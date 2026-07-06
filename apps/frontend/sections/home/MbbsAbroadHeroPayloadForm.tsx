'use client';

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { isHeroMbbsFallbackForm } from '@/lib/mbbsHeroFormFallback';
import { useHeroMbbsFormDefinition } from '@/lib/useHeroMbbsFormDefinition';
import { HeroFormSkeleton } from '@/sections/home/HeroFormSkeleton';
import {
  cancelPreparedThankYouTab,
  nameFromFormValues,
  openThankYouInNewTab,
  prepareThankYouTab,
} from '@/lib/openThankYouPage';
import { validateDynamicFormNames } from '@/lib/validatePersonName';
import { validateLeadSubmissionData, leadApiErrorMessage } from '@/lib/validateLeadForm';
import { notifyLeadSubmissionFromResponse } from '@/lib/notifyLeadSubmission';
import { EmailOtpVerification } from '@/components/forms/EmailOtpVerification';
import { getEmailFromHeroFormValues } from '@/lib/emailOtp/heroFormEmail';
import { emailOtpInitiallyVerified, isEmailOtpEnabled } from '@/lib/emailOtp/isEmailOtpEnabled';

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

function isStateOrCountryField(field: FormFieldBlock): boolean {
  const n = field.name?.toLowerCase() ?? '';
  const l = field.label?.toLowerCase() ?? '';
  if (field.blockType === 'state' || field.blockType === 'country') return true;
  return (
    n.includes('state') ||
    n.includes('country') ||
    l.includes('state') ||
    l.includes('country')
  );
}

export type MbbsAbroadHeroPayloadFormProps = {
  layout?: 'stacked' | 'heroSide';
  className?: string;
  /** Notifies parent (e.g. hero carousel) when the enquiry form is successfully submitted. */
  onCarouselFormSubmitted?: () => void;
};

export function MbbsAbroadHeroPayloadForm({
  layout = 'stacked',
  className: outerClassName,
  onCarouselFormSubmitted,
}: MbbsAbroadHeroPayloadFormProps) {
  const { form: loadedForm, debugMessage, values, setValues } =
    useHeroMbbsFormDefinition('abroad');
  const form = loadedForm as PayloadFormDoc | null;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [otpUiActive, setOtpUiActive] = useState(false);
  const [emailVerified, setEmailVerified] = useState(emailOtpInitiallyVerified);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);

  const fields = useMemo(() => (form?.fields || []).filter(isInputField), [form?.fields]);

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

      const nameErr = validateDynamicFormNames(values, fields);
      if (nameErr) {
        setSubmitError(nameErr);
        return;
      }

      const submissionData = fields.map((f) => ({
        field: f.name,
        value: values[f.name] ?? '',
      }));

      const leadErr = validateLeadSubmissionData(submissionData);
      if (leadErr) {
        setSubmitError(leadErr);
        return;
      }

      if (isEmailOtpEnabled() && (!emailVerified || !emailVerificationToken)) {
        setSubmitError('Please verify your email before submitting.');
        setOtpUiActive(true);
        return;
      }

      const thankYouTab = prepareThankYouTab();
      setSubmitting(true);
      try {
        const useOffline = isHeroMbbsFallbackForm(form);
        const res = await fetch(
          useOffline ? '/api/cms/hero-enquiry' : '/api/cms/form-submissions',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              useOffline
                ? { kind: 'abroad', submissionData, emailVerificationToken }
                : {
                    form: form.id,
                    source: 'hero-mbbs-abroad',
                    formName: 'MBBS Abroad hero enquiry',
                    submissionData,
                    emailVerificationToken,
                  }
            ),
          }
        );
        const raw = await res.text();
        let data: { errors?: { message?: string }[]; message?: string; duplicate?: boolean } = {};
        try {
          if (raw.trim()) data = JSON.parse(raw) as typeof data;
        } catch {
          cancelPreparedThankYouTab(thankYouTab);
          setSubmitError(raw.trim() ? 'Could not read CMS response after submit.' : 'Empty CMS response after submit.');
          return;
        }
        if (!res.ok) {
          cancelPreparedThankYouTab(thankYouTab);
          notifyLeadSubmissionFromResponse(res, data);
          const msg = leadApiErrorMessage(res, data);
          if (res.status !== 409) {
            setSubmitError(
              data.errors?.[0]?.message || msg || `Submit failed (${res.status})`
            );
          }
          return;
        }
        notifyLeadSubmissionFromResponse(res, data);
        openThankYouInNewTab(
          {
            name: nameFromFormValues(values, fields),
            source: 'hero-mbbs-abroad',
          },
          undefined,
          thankYouTab
        );
        setSubmitted(true);
        onCarouselFormSubmitted?.();
      } catch {
        cancelPreparedThankYouTab(thankYouTab);
        setSubmitError('Network error. Try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [form, fields, values, emailVerified, emailVerificationToken, onCarouselFormSubmitted]
  );

  const isSide = layout === 'heroSide';

  const panelClass = clsx(
    isSide ? 'mt-0 w-full' : 'mt-8',
    isSide
      ? 'rounded-2xl border border-white/35 bg-gradient-to-b from-white/[0.22] to-white/[0.07] p-5 shadow-2xl shadow-black/35 ring-1 ring-white/20 backdrop-blur-xl md:p-6'
      : 'rounded-xl border border-white/30 bg-white/10 p-4 backdrop-blur-md md:p-6',
    outerClassName
  );

  if (!form) {
    const devDetails = process.env.NODE_ENV === 'development' ? debugMessage : null;
    return (
      <HeroFormSkeleton
        title="Quick enquiry (MBBS Abroad)"
        panelClass={panelClass}
        hint="Loading enquiry form…"
        details={devDetails}
      />
    );
  }


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
          Quick enquiry (MBBS Abroad)
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid min-w-0 w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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

          if (isStateOrCountryField(field)) {
            return (
              <div key={field.id || field.name}>
                <label className="mb-1 block text-xs font-medium text-white" htmlFor={field.name}>
                  {label}
                  {req && <span className="text-gold-300">{req}</span>}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  placeholder={field.placeholder || 'Type here…'}
                  className={inputClass}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
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
                onBlur={type === 'email' ? () => setOtpUiActive(true) : undefined}
              />
            </div>
          );
        })}

        <div className="min-w-0 w-full sm:col-span-2">
          {isEmailOtpEnabled() ? (
            <EmailOtpVerification
              email={getEmailFromHeroFormValues(values, fields)}
              activated={otpUiActive}
              variant="dark"
              onVerifiedChange={({ verified, verifiedToken }) => {
                setEmailVerified(verified);
                setEmailVerificationToken(verifiedToken);
              }}
            />
          ) : null}
        </div>

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
            disabled={submitting || (isEmailOtpEnabled() && !emailVerified)}
            isLoading={submitting}
          >
            {form.submitButtonLabel || 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
