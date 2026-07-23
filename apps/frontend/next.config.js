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
  'ar-browser-icon.png',
  'ar-group-logo.png',
  'ar-group-logo.webp',
  'india-homepage.jpg',
  'india-homepage.webp',
  'abroad-homepage.jpg',
  'abroad-homepage.webp',
  'about-counsellor.png',
  'lead-mbbs-doctor.png',
  'medical-admission-counselling-hero.png',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ['@prisma/client', 'web-push'],

  // Monorepo tracing only when repo root is in the deployment bundle.
  ...(outputFileTracingRoot ? { outputFileTracingRoot } : {}),

  // @vercel/nft traces all of public/ when route uses dynamic path.join(cwd, 'public', …) — exclude then re-include only fallbacks.
  outputFileTracingExcludes: {
    // Keep Amplify/Vercel server bundles under the ~220MB deploy limit (public/wp-content is ~770MB).
    '*': [
      './public/wp-content/**',
      './public/**',
      '../../public/wp-content/**',
    ],
    '/api/public-asset/[...path]': ['./public/**'],
    // wp-media must NOT bundle public/wp-content (~763MB). Static files deploy via public/; API proxies on miss.
    '/api/wp-media/[...path]': ['./public/**', '../../_uploads/**'],
  },

  outputFileTracingIncludes: {
    // Only the marketing fallbacks — not all of public/ (~787MB wp-content).
    '/api/public-asset/[...path]': PUBLIC_MARKETING_ASSETS.map((file) => `./public/${file}`),
    '/[slug]': ['./data/wp-export-bundle/**/*'],
    '/blog/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/mbbs-india/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/mbbs-india': ['./data/mbbs-india-tree.json'],
    '/mbbs-abroad/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/mbbs-abroad': ['./data/mbbs-abroad-tree.json'],
    '/md-ms/[...slug]': ['./data/wp-export-bundle/**/*'],
    '/md-ms': ['./data/wp-export-bundle/**/*'],
    '/blog': ['./data/wp-export-bundle/**/*'],
    '/api/google-reviews': ['./data/google-reviews.json'],
    '/api/blogs': ['../../node_modules/.prisma/client/**/*', '../../apps/backend/prisma/schema.prisma'],
    '/api/blogs/[slug]': ['../../node_modules/.prisma/client/**/*'],
    '/api/content/[slug]': ['../../node_modules/.prisma/client/**/*'],
    '/api/cms/payload-sync': ['../../node_modules/.prisma/client/**/*'],
    '/api/leads/submit': ['../../node_modules/.prisma/client/**/*'],
    '/api/newsletter/subscribe': ['../../node_modules/.prisma/client/**/*'],
    '/api/sitemap': ['./data/wp-export-bundle/**/*', './data/mbbs-india-tree.json', './data/mbbs-abroad-tree.json'],
    '/sitemap.xml': ['./data/wp-export-bundle/**/*', './data/mbbs-india-tree.json', './data/mbbs-abroad-tree.json'],
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
    const longCache = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ];

    return [
      {
        source: '/_next/static/:path*',
        headers: longCache,
      },
      {
        source: '/:path*.jpg',
        headers: longCache,
      },
      {
        source: '/:path*.jpeg',
        headers: longCache,
      },
      {
        source: '/:path*.png',
        headers: longCache,
      },
      {
        source: '/:path*.webp',
        headers: longCache,
      },
      {
        source: '/:path*.avif',
        headers: longCache,
      },
      {
        source: '/:path*.svg',
        headers: longCache,
      },
      {
        source: '/:path*.ico',
        headers: longCache,
      },
      {
        source: '/:path*.woff2',
        headers: longCache,
      },
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

  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
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
          source: '/llms.txt',
          destination: '/api/llms',
        },
      ],
      // After public/ — wp-content paths missing from public/ fall back to /api/wp-media (_uploads or remote).
      afterFiles: [
        {
          source: '/wp-content/:path*',
          destination: '/api/wp-media/:path*',
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
