'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';

const CounsellingFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number is required'),
  counsellingInterest: z.enum(['mbbs-india', 'mbbs-abroad'], {
    errorMap: () => ({ message: 'Please select MBBS India or MBBS Abroad' }),
  }),
  examScore: z.string().optional(),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
});

type CounsellingFormData = z.infer<typeof CounsellingFormSchema>;

type CounsellingFormProps = {
  embedded?: boolean;
  compact?: boolean;
};

const Field = ({
  children,
  animate,
}: {
  children: ReactNode;
  animate: boolean;
}) => (animate ? <motion.div>{children}</motion.div> : <div>{children}</div>);

export const CounsellingForm = ({
  embedded = false,
  compact = false,
}: CounsellingFormProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const animate = !embedded;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CounsellingFormData>({
    resolver: zodResolver(CounsellingFormSchema),
  });

  const onSubmit = async (data: CounsellingFormData) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Form submitted:', data);
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const focusRing =
    'border-slate-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20';

  const inputClass = (hasError: boolean) => {
    const base = compact
      ? 'w-full rounded-lg border bg-white px-3 py-2 font-body text-sm text-navy-900 shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none'
      : 'w-full rounded-xl border bg-slate-50/50 px-4 py-3 font-body text-navy-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none';
    return `${base} ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
        : focusRing
    }`;
  };

  const selectClass = (hasError: boolean) =>
    `${inputClass(hasError)} appearance-none bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9 [background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231a365d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")]`;

  const labelClass = compact
    ? 'mb-1 block text-xs font-semibold text-navy-900'
    : 'mb-2 block font-body font-semibold text-navy-900';

  const errorClass = compact
    ? 'mt-0.5 font-body text-xs text-red-500'
    : 'mt-1 font-body text-sm text-red-500';

  const formSpace = compact ? 'space-y-3' : 'space-y-6';
  const gridGap = compact ? 'gap-3' : 'gap-6';

  const submitBtnClass = compact
    ? 'counselling-form-submit flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 font-body text-sm font-bold text-white shadow-md shadow-gold-600/25 transition-all hover:bg-gold-600 active:scale-[0.99] disabled:opacity-60 touch-manipulation'
    : 'counselling-form-submit flex w-full min-h-11 items-center justify-center gap-3 rounded-xl bg-gold-500 py-4 font-body text-lg font-bold text-white shadow-lg shadow-gold-600/30 transition-all hover:bg-gold-600 active:scale-[0.99] disabled:opacity-60 touch-manipulation';

  const inner = (
    <div className={embedded ? 'w-full' : 'p-8 md:p-12'}>
      {submitted ? (
        <div
          className={
            compact
              ? 'flex flex-col items-center py-6 text-center'
              : 'flex flex-col items-center justify-center py-12 text-center'
          }
        >
          <CheckCircle
            className={compact ? 'mb-3 h-12 w-12 text-green-500' : 'mb-6 h-24 w-24 text-green-500'}
          />
          <h3
            className={
              compact
                ? 'mb-1 font-serif text-xl font-bold text-navy-900'
                : 'mb-3 font-serif text-3xl font-bold text-navy-900'
            }
          >
            Thank you!
          </h3>
          <p className={compact ? 'text-sm text-gray-600' : 'mb-6 font-body text-lg text-gray-600'}>
            We will call you within 24 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={formSpace}>
          <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'} ${gridGap}`}>
            <Field animate={animate}>
              <label className={labelClass}>Full name *</label>
              <input
                type="text"
                placeholder="Your name"
                className={inputClass(!!errors.fullName)}
                {...register('fullName')}
              />
              {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
            </Field>

            <Field animate={animate}>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                placeholder="you@email.com"
                className={inputClass(!!errors.email)}
                {...register('email')}
              />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </Field>
          </div>

          <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'} ${gridGap}`}>
            <Field animate={animate}>
              <label className={labelClass}>Phone (10 digits) *</label>
              <input
                type="tel"
                placeholder="9876543210"
                className={inputClass(!!errors.phone)}
                {...register('phone')}
              />
              {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
            </Field>

            <Field animate={animate}>
              <label className={labelClass}>I want counselling for *</label>
              <select
                className={selectClass(!!errors.counsellingInterest)}
                {...register('counsellingInterest')}
                defaultValue=""
              >
                <option value="" disabled>
                  Select option
                </option>
                <option value="mbbs-india">MBBS India</option>
                <option value="mbbs-abroad">MBBS Abroad</option>
              </select>
              {errors.counsellingInterest && (
                <p className={errorClass}>{errors.counsellingInterest.message}</p>
              )}
            </Field>
          </div>

          {!compact && (
            <>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGap}`}>
                <Field animate={animate}>
                  <label className={labelClass}>NEET / exam score (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 650/720"
                    className={inputClass(false)}
                    {...register('examScore')}
                  />
                </Field>
                <Field animate={animate}>
                  <label className={labelClass}>Preferred date (optional)</label>
                  <input type="date" className={inputClass(false)} {...register('preferredDate')} />
                </Field>
              </div>

              <Field animate={animate}>
                <label className={labelClass}>Message (optional)</label>
                <div className="overflow-hidden rounded-xl border border-navy-100 bg-gradient-to-br from-navy-50/40 to-white shadow-sm focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-500/20">
                  <textarea
                    placeholder="Your goals or questions..."
                    rows={4}
                    className="w-full resize-none border-0 bg-transparent px-4 py-3 font-body text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                    {...register('message')}
                  />
                </div>
              </Field>
            </>
          )}

          {compact && (
            <Field animate={animate}>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-gold-600" aria-hidden />
                <label className="text-xs font-semibold text-navy-900">
                  Quick note <span className="font-normal text-slate-400">(optional)</span>
                </label>
              </div>
              <div className="mt-1.5 overflow-hidden rounded-xl border border-navy-100 bg-gradient-to-br from-navy-50/50 via-white to-gold-50/30 shadow-sm transition-all focus-within:border-gold-400 focus-within:shadow-md focus-within:ring-2 focus-within:ring-gold-500/15">
                <textarea
                  placeholder="NEET score, preferred state or country, budget range…"
                  rows={2}
                  className="w-full resize-none border-0 bg-transparent px-3 py-2.5 font-body text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  {...register('message')}
                />
                <div className="border-t border-navy-50/80 bg-white/60 px-3 py-1.5">
                  <p className="text-[10px] text-slate-400">
                    Share anything that helps our counsellor prepare for your call.
                  </p>
                </div>
              </div>
            </Field>
          )}

          <Field animate={animate}>
            <button type="submit" disabled={isLoading} className={submitBtnClass}>
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
                  {compact ? 'Get free counselling' : 'Book free counselling session'}
                </>
              )}
            </button>
          </Field>

          <p
            className={
              compact
                ? 'text-center text-[10px] leading-snug text-slate-500'
                : 'mt-4 text-center text-sm font-body text-gray-500'
            }
          >
            We reply within 24 hours. Your details stay confidential.
          </p>
        </form>
      )}
    </div>
  );

  if (embedded) {
    return <div className="w-full">{inner}</div>;
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-2xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
      }}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-gold-600 to-gold-500 px-8 py-12 text-center text-white">
          <h2 className="mb-2 font-serif text-4xl font-bold">MBBS counselling session</h2>
          <p className="font-body text-lg text-gold-100">
            Book your personalized consultation with our experts
          </p>
        </div>
        {inner}
      </div>
    </motion.div>
  );
};
