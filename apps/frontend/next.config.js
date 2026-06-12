const fs = require('fs');
const path = require('path');

/** Monorepo root when present (Git deploy / local). Omit on Vercel app-only uploads. */
function resolveOutputFileTracingRoot() {
  const monorepoRoot = path.join(__dirname, '../..');
  if (fs.existsSync(path.join(monorepoRoot, 'package.json'))) {
    return monorepoRoot;
  }
  return undefined;
}

const outputFileTracingRoot = resolveOutputFileTracingRoot();

/** Marketing images referenced as plain /filename paths in components. */
const PUBLIC_MARKETING_ASSETS = [
  'ar-group-logo.png',
  'india-homepage.jpg',
  'abroad-homepage.jpg',
  'about-counsellor.png',
  'lead-mbbs-doctor.png',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ['@prisma/client'],

  // Monorepo tracing only when repo root is in the deployment bundle.
  ...(outputFileTracingRoot ? { outputFileTracingRoot } : {}),

  outputFileTracingIncludes: {
    '/api/public-asset/[...path]': ['./public/**/*'],
    '/[slug]': ['./data/wp-export-bundle/**/*'],
    '/blog/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/mbbs-india/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/mbbs-abroad/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/blog': ['./data/wp-export-bundle/**/*'],
    '/api/google-reviews': ['./data/google-reviews.json'],
    '/api/blogs': ['../../node_modules/.prisma/client/**/*', '../../apps/backend/prisma/schema.prisma'],
    '/api/blogs/[slug]': ['../../node_modules/.prisma/client/**/*'],
    '/api/content/[slug]': ['../../node_modules/.prisma/client/**/*'],
    '/api/cms/payload-sync': ['../../node_modules/.prisma/client/**/*'],
    '/api/leads/submit': ['../../node_modules/.prisma/client/**/*'],
    '/api/newsletter/subscribe': ['../../node_modules/.prisma/client/**/*'],
    '/api/wp-media/[...path]': ['./public/wp-content/**/*'],
  },

  images: {
    // Serve /public assets directly — matches local dev and avoids Vercel
    // /_next/image 400s for widths outside imageSizes (e.g. logo 56px/80px).
    unoptimized: true,
    localPatterns: [
      { pathname: '/api/wp-media/**' },
      { pathname: '/wp-content/**' },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'argroupofeducation.com',
      },
      {
        protocol: 'https',
        hostname: 'www.argroupofeducation.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384, 560, 640, 800],
  },

  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "connect-src 'self' https:",
              "frame-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  redirects: async () => {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/mbbs-admission-in-top-colleges',
        destination: '/',
        permanent: true,
      },
      {
        source: '/mbbs-admission-in-top-colleges/',
        destination: '/',
        permanent: true,
      },
      {
        source: '/study-mbbs-in-abroad',
        destination: '/mbbs-abroad',
        permanent: true,
      },
      {
        source: '/study-mbbs-in-abroad/',
        destination: '/mbbs-abroad',
        permanent: true,
      },
      {
        source: '/mbbs-in-india',
        destination: '/mbbs-india',
        permanent: true,
      },
      {
        source: '/mbbs-in-india/',
        destination: '/mbbs-india',
        permanent: true,
      },
      {
        source: '/contact-ar-group-of-education-mbbs-admission-help',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/contact-ar-group-of-education-mbbs-admission-help/',
        destination: '/contact',
        permanent: true,
      },
      // WordPress trailing slashes → Next paths (SEO / backlinks)
      {
        source: '/:slug/',
        destination: '/:slug',
        permanent: true,
      },
    ];
  },

  rewrites: async () => {
    const publicAssetFallbacks = PUBLIC_MARKETING_ASSETS.map((file) => ({
      source: `/${file}`,
      destination: `/api/public-asset/${file}`,
    }));

    return {
      beforeFiles: [
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap',
        },
        {
          source: '/robots.txt',
          destination: '/api/robots',
        },
      ],
      // After public/ — serves from bundled public/ when Vercel omits static files.
      fallback: publicAssetFallbacks,
    };
  },

  webpack: (config) => {
    return config;
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
