import type { NextConfig } from 'next';
import path from 'path';

const rootDir = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' as const, outputFileTracingRoot: rootDir } : {}),
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'api', port: '4000', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
