import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable Turbopack for now due to the error
    // turbo: false
  }
};

export default nextConfig;
