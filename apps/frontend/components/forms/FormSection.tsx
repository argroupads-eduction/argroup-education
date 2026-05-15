'use client'

import React, { useState } from 'react'

interface FormSectionProps {
  program: 'mbbs-india' | 'mbbs-abroad' | 'md-ms'
  title?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ program, title = 'Get Free Counselling' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
    setLoading(true)

    try {
      const response = await fetch('/api/form-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          program,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit form')
      }

      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', message: '' })

      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-md">
        <div className="text-center">
          <h3 className="text-lg md:text-xl font-bold text-green-600 mb-2">Thank You!</h3>
          <p className="text-sm md:text-base text-slate-600">
            Your inquiry has been received. Our team will contact you shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-md"
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
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 transition"
          />
        </div>

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
          disabled={loading}
          className="w-full py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 disabled:bg-slate-400 transition text-sm md:text-base"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
