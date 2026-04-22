/** @type {import('next').NextConfig} */
const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // In Next.js 16, these might be under 'dev' or handled differently
  // For now, let's just use the core flags if possible, or remove them
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removing eslint as it was reported as unrecognized
  
  // Disable basePath for Capacitor builds
  basePath: isCapacitor ? '' : '/hvylyna-movchannya',
  assetPrefix: isCapacitor ? '' : '/hvylyna-movchannya/',
};

module.exports = nextConfig;
