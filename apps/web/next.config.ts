import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    // Disable Turbopack for now due to the error
    // turbo: false
  },
  images: {
    domains: ['localhost', 'api'],
  },
  typescript: {
    // Skip type checking during build to deploy faster
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
