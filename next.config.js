/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;
const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable basePath for Capacitor builds
  basePath: isCapacitor ? '' : (isGithubActions ? '/hvylyna-movchannya' : ''),
  assetPrefix: isCapacitor ? '' : (isGithubActions ? '/hvylyna-movchannya/' : ''),
};

module.exports = nextConfig;
