'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-navy-900 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 resize-none
            ${error ? 'border-red-500' : 'border-gray-300'}
            focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
            placeholder:text-gray-400
            ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {helperText && <p className="text-gray-500 text-sm mt-2">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
