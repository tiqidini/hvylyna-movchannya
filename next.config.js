/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  basePath: '/hvylyna-movchannya',
  assetPrefix: '/hvylyna-movchannya/',
};

module.exports = nextConfig;
