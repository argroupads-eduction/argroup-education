'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formService } from '@/services/api';

const counsellingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9\s\-\+\(\)]{10,}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  course: z.string().min(1, 'Please select a course'),
  neetScore: z.string().optional(),
  countryPreference: z.string().min(1, 'Please select a country'),
});

type CounsellingFormData = z.infer<typeof counsellingSchema>;

interface CounsellingFormProps {
  onSuccess?: () => void;
}

export const CounsellingForm = ({ onSuccess }: CounsellingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CounsellingFormData>({
    resolver: zodResolver(counsellingSchema),
  });

  const onSubmit = async (data: CounsellingFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await formService.submitCounsellingForm(data);
      setSuccessMessage('Thank you! Our team will contact you soon.');
      reset();
      onSuccess?.();
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage('Failed to submit form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {successMessage && (
        <Alert type="success" message={successMessage} />
      )}
      {errorMessage && (
        <Alert type="error" message={errorMessage} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          placeholder="Your name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="Your email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91 XXXXXXXXXX"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="NEET Score"
          placeholder="Your NEET score (optional)"
          {...register('neetScore')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Course"
          placeholder="Select course"
          options={[
            { value: 'mbbs', label: 'MBBS' },
            { value: 'bds', label: 'BDS' },
            { value: 'nursing', label: 'Nursing' },
          ]}
          {...register('course')}
          error={errors.course?.message}
        />
        <Select
          label="Country Preference"
          placeholder="Select country"
          options={[
            { value: 'russia', label: 'Russia' },
            { value: 'georgia', label: 'Georgia' },
            { value: 'kazakhstan', label: 'Kazakhstan' },
            { value: 'kyrgyzstan', label: 'Kyrgyzstan' },
            { value: 'nepal', label: 'Nepal' },
            { value: 'bangladesh', label: 'Bangladesh' },
          ]}
          {...register('countryPreference')}
          error={errors.countryPreference?.message}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
      >
        Get Free Counselling
      </Button>

      <p className="text-center text-sm text-gray-600">
        We respect your privacy. Your information is secure with us.
      </p>
    </motion.form>
  );
};
