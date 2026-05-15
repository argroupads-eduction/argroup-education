'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formService } from '@/services/api';

interface NewsletterFormProps {
  className?: string;
}

export const NewsletterForm = ({ className = '' }: NewsletterFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await formService.subscribeNewsletter(email);
      setMessage({ type: 'success', text: 'Thank you for subscribing!' });
      setEmail('');
      setTimeout(() => setMessage(null), 5000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
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
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="px-6"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Subscribe</span>
        </Button>
      </form>
    </motion.div>
  );
};
