import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: rootDir,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'api', port: '4000', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
