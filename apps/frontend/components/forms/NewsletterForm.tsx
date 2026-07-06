'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmailOtpVerification } from '@/components/forms/EmailOtpVerification';
import { emailOtpInitiallyVerified, isEmailOtpEnabled } from '@/lib/emailOtp/isEmailOtpEnabled';

interface NewsletterFormProps {
  className?: string;
}

export const NewsletterForm = ({ className = '' }: NewsletterFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [otpUiActive, setOtpUiActive] = useState(false);
  const [emailVerified, setEmailVerified] = useState(emailOtpInitiallyVerified);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (isEmailOtpEnabled() && (!emailVerified || !emailVerificationToken)) {
      setMessage({ type: 'error', text: 'Please verify your email before subscribing.' });
      setOtpUiActive(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, emailVerificationToken }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Subscribe failed');
      }
      setMessage({ type: 'success', text: 'Thank you for subscribing!' });
      setEmail('');
      setEmailVerified(emailOtpInitiallyVerified);
      setEmailVerificationToken(null);
      setOtpUiActive(false);
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to subscribe. Please try again.',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={`space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {message && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setOtpUiActive(true)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isEmailOtpEnabled() && !emailVerified}
          className="px-6"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Subscribe</span>
        </Button>
        </div>
        {isEmailOtpEnabled() ? (
          <EmailOtpVerification
            email={email}
            activated={otpUiActive}
            onVerifiedChange={({ verified, verifiedToken }) => {
              setEmailVerified(verified);
              setEmailVerificationToken(verifiedToken);
            }}
            className="w-full min-w-0"
          />
        ) : null}
      </form>
    </motion.div>
  );
};
