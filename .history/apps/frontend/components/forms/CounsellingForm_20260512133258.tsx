'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, CheckCircle } from 'lucide-react';

// Validation Schema
const CounsellingFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Valid 10-digit phone number is required'),
  targetCountry: z.string().min(1, 'Please select a target country'),
  currentEducation: z.string().min(1, 'Please select your current education level'),
  examScore: z.string().optional(),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
});

type CounsellingFormData = z.infer<typeof CounsellingFormSchema>;

export const CounsellingForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      // Simulate API call
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-600 to-gold-500 px-8 py-12 text-white text-center">
          <motion.h2 
            className="font-serif text-4xl font-bold mb-2"
            variants={itemVariants}
          >
            Free Counselling Session
          </motion.h2>
          <motion.p 
            className="font-body text-gold-100 text-lg"
            variants={itemVariants}
          >
            Book your personalized consultation with our experts
          </motion.p>
        </div>

        {/* Form Content */}
        <div className="p-8 md:p-12">
          {submitted ? (
            <motion.div
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
              </motion.div>
              <h3 className="font-serif text-3xl font-bold text-navy-900 mb-3">
                Thank You!
              </h3>
              <p className="font-body text-gray-600 mb-6 text-lg">
                Your counselling request has been submitted successfully.
              </p>
              <p className="font-body text-gray-500">
                Our team will contact you within 24 hours at your provided phone number.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block font-body font-semibold text-navy-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-lg border-2 font-body transition-all focus:outline-none ${
                      errors.fullName
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
                    }`}
                    {...register('fullName')}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1 font-body">
                      {errors.fullName.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block font-body font-semibold text-navy-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className={`w-full px-4 py-3 rounded-lg border-2 font-body transition-all focus:outline-none ${
                      errors.email
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
                    }`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 font-body">
                      {errors.email.message}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Phone Row */}
              <motion.div variants={itemVariants}>
                <label className="block font-body font-semibold text-navy-900 mb-2">
                  Phone Number (10 digits) *
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  className={`w-full px-4 py-3 rounded-lg border-2 font-body transition-all focus:outline-none ${
                    errors.phone
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
                  }`}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 font-body">
                    {errors.phone.message}
                  </p>
                )}
              </motion.div>

              {/* Country and Education Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block font-body font-semibold text-navy-900 mb-2">
                    Target Country *
                  </label>
                  <select
                    className={`w-full px-4 py-3 rounded-lg border-2 font-body transition-all focus:outline-none ${
                      errors.targetCountry
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
                    }`}
                    {...register('targetCountry')}
                  >
                    <option value="">Select Country</option>
                    <option value="russia">Russia</option>
                    <option value="nepal">Nepal</option>
                    <option value="bangladesh">Bangladesh</option>
                    <option value="uzbekistan">Uzbekistan</option>
                    <option value="kazakhstan">Kazakhstan</option>
                    <option value="serbia">Serbia</option>
                    <option value="iran">Iran</option>
                    <option value="bosnia">Bosnia</option>
                    <option value="egypt">Egypt</option>
                    <option value="vietnam">Vietnam</option>
                    <option value="philippines">Philippines</option>
                    <option value="georgia">Georgia</option>
                    <option value="china">China</option>
                    <option value="romania">Romania</option>
                  </select>
                  {errors.targetCountry && (
                    <p className="text-red-500 text-sm mt-1 font-body">
                      {errors.targetCountry.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block font-body font-semibold text-navy-900 mb-2">
                    Current Education Level *
                  </label>
                  <select
                    className={`w-full px-4 py-3 rounded-lg border-2 font-body transition-all focus:outline-none ${
                      errors.currentEducation
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gray-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-200'
                    }`}
                    {...register('currentEducation')}
                  >
                    <option value="">Select Education Level</option>
                    <option value="12th">12th Grade</option>
                    <option value="neet-aspirant">NEET Aspirant</option>
                    <option value="neet-qualified">NEET Qualified</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                  {errors.currentEducation && (
                    <p className="text-red-500 text-sm mt-1 font-body">
                      {errors.currentEducation.message}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Exam Score and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <label className="block font-body font-semibold text-navy-900 mb-2">
                    NEET/Exam Score (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 650/720"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 font-body transition-all focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
                    {...register('examScore')}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block font-body font-semibold text-navy-900 mb-2">
                    Preferred Counselling Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 font-body transition-all focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
                    {...register('preferredDate')}
                  />
                </motion.div>
              </div>

              {/* Message */}
              <motion.div variants={itemVariants}>
                <label className="block font-body font-semibold text-navy-900 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  placeholder="Tell us about your career goals and aspirations..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 font-body transition-all focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 resize-none"
                  {...register('message')}
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 disabled:from-gray-400 disabled:to-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 font-body text-lg shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Book Free Counselling Session
                    </>
                  )}
                </button>
              </motion.div>

              {/* Disclaimer */}
              <motion.p 
                variants={itemVariants}
                className="text-center text-sm font-body text-gray-500 mt-4"
              >
                We'll contact you within 24 hours. Your information is secure and confidential.
              </motion.p>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};
