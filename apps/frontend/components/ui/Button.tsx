'use client';

import React, { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClass = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  navy: 'ui-btn--navy',
} as const;

const sizeClass = {
  sm: 'ui-btn--sm',
  md: 'ui-btn--md',
  lg: 'ui-btn--lg',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      isLoading,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        disabled={disabled || isLoading}
        className={clsx(
          'ui-btn',
          variantClass[variant],
          sizeClass[size],
          pill && 'ui-btn--pill',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
