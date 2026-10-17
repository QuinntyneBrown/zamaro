import type { NextConfig } from 'next';

// Route handlers only, built as standalone output for the zamaro-api image (ADR-0027).
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
