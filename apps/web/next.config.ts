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
};

export default nextConfig;
