import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getPayload } from 'payload'
import config from '@/payload.config'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, program, message } = body

    // Validate required fields
    if (!name || !email || !phone || !program) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Save to database
    try {
      await payload.create({
        collection: 'form-submissions',
        data: {
          name,
          email,
          phone,
          program,
          message: message || '',
        } as any,
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue with email even if database fails
    }

    // Send email
    const programLabels: { [key: string]: string } = {
      'mbbs-india': 'MBBS in India',
      'mbbs-abroad': 'MBBS Abroad',
      'md-ms': 'MD/MS',
    }

    const emailContent = `
      <h2>New Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Program:</strong> ${programLabels[program] || program}</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      <p><strong>Submitted at:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    `

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'argroupeduads@gmail.com',
      subject: `New ${programLabels[program] || program} Inquiry from ${name}`,
      html: emailContent,
    })

    // Also send confirmation email to user
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your inquiry has been received - AR Group of Education',
      html: `
        <h2>Thank you for your inquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your inquiry for <strong>${programLabels[program] || program}</strong>.</p>
        <p>Our team will get back to you shortly on the phone number: <strong>${phone}</strong></p>
        <p>Best regards,<br/>AR Group of Education</p>
      `,
    })

    return NextResponse.json(
      { success: true, message: 'Form submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
