const path = require('path');

/** Marketing images referenced as plain /filename paths in components. */
const PUBLIC_MARKETING_ASSETS = [
  'ar-group-logo.webp',
  'india-homepage.jpg',
  'abroad-homepage.jpg',
  'about-counsellor.png',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Monorepo: trace dependencies from repo root (Vercel + local).
  outputFileTracingRoot: path.join(__dirname, '../..'),

  outputFileTracingIncludes: {
    '/api/public-asset/[...path]': ['./public/**/*'],
  },

  images: {
    // Serve /public assets directly — matches local dev and avoids Vercel
    // /_next/image 400s for widths outside imageSizes (e.g. logo 56px/80px).
    unoptimized: true,
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
      // WordPress trailing slashes → Next paths (SEO / backlinks)
      {
        source: '/:slug/',
        destination: '/:slug',
        permanent: true,
      },
      // Old /blog/post-slug pattern → root slug (matches live WP)
      {
        source: '/blog/:slug',
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
