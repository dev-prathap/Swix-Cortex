import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Exclude native modules from server bundling (Next.js 16+ for Vercel)
  serverExternalPackages: [
    'duckdb',
    'duckdb-async',
    '@mapbox/node-pre-gyp',
    'node-pre-gyp',
  ],
  
  // Experimental features for better performance
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
