/** @type {import('next').NextConfig} */
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
  basePath: '/hvylyna-movchannya',
  assetPrefix: '/hvylyna-movchannya/',
};

module.exports = nextConfig;
