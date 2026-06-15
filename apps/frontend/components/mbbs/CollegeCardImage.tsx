'use client';

import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

type CollegeCardImageProps = {
  src: string | null;
  alt: string;
  variant?: 'default' | 'compact';
};

export function CollegeCardImage({ src, alt, variant = 'default' }: CollegeCardImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (variant === 'compact') return null;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
        <GraduationCap className="h-10 w-10" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wider">Medical college</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className="relative mr-1 h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain object-center"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain object-center p-2 transition duration-300 group-hover:scale-[1.02]"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </>
  );
}
