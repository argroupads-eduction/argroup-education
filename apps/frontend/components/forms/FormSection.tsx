'use client'

import React, { useState } from 'react'
import {
  cancelPreparedThankYouTab,
  openThankYouInNewTab,
  prepareThankYouTab,
} from '@/lib/openThankYouPage'
import { submitWebsiteLead } from '@/lib/submitWebsiteLead'
import { validatePersonName } from '@/lib/validatePersonName'
import { validateIndianMobile, validateLeadEmail } from '@/lib/leadSubmissionMessages'
import { EmailOtpVerification } from '@/components/forms/EmailOtpVerification'

interface FormSectionProps {
  program: 'mbbs-india' | 'mbbs-abroad' | 'md-ms'
  title?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ program, title = 'Get counselling' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpUiActive, setOtpUiActive] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const nameErr = validatePersonName(formData.name)
    if (nameErr) {
      setError(nameErr)
      return
    }

    const emailErr = validateLeadEmail(formData.email)
    if (emailErr) {
      setError(emailErr)
      return
    }

    const phoneErr = validateIndianMobile(formData.phone)
    if (phoneErr) {
      setError(phoneErr)
      return
    }

    if (!emailVerified || !emailVerificationToken) {
      setError('Please verify your email before submitting.')
      setOtpUiActive(true)
      return
    }

    const thankYouTab = prepareThankYouTab()
    setLoading(true)

    try {
      const lead = await submitWebsiteLead({
        source: `form-section-${program}`,
        formName: `Program enquiry (${program})`,
        emailVerificationToken,
        fields: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          program,
        },
      });

      if (!lead.ok) {
        cancelPreparedThankYouTab(thankYouTab);
        if (!lead.duplicate) {
          setError(lead.message || 'An error occurred');
        }
        return;
      }

      openThankYouInNewTab(
        {
          name: formData.name,
          source: `form-section-${program}`,
        },
        undefined,
        thankYouTab
      )
      setFormData({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      cancelPreparedThankYouTab(thankYouTab)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8"
    >
      <h3 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6">{title}</h3>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => setOtpUiActive(true)}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>

        <EmailOtpVerification
          email={formData.email}
          activated={otpUiActive}
          onVerifiedChange={({ verified, verifiedToken }) => {
            setEmailVerified(verified)
            setEmailVerificationToken(verifiedToken)
          }}
          className="w-full min-w-0"
        />

        <div>
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>

        <div>
          <textarea
            name="message"
            placeholder="Message (Optional)"
            value={formData.message}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 transition resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !emailVerified}
          className="w-full py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 disabled:bg-slate-400 transition text-sm md:text-base"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
