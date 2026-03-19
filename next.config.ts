import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/hvylyna-movchannya',
  assetPrefix: '/hvylyna-movchannya',
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
