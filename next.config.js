const isExtension = process.env.NEXT_PUBLIC_EXTENSION === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The browser extension build (`yarn build:extension`) is a static export.
  ...(isExtension && {
    output: 'export',
    distDir: '.next-extension',
    // Route files are `.ts` and pages/layouts `.tsx`, so this leaves out
    // app/api/backgrounds/route.ts, which a static export can't serve. The
    // extension uses the deployed site's route instead (`SITE_URL`).
    pageExtensions: ['tsx'],
  }),
};

module.exports = nextConfig;
