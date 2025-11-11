import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ✅ Correct placement (NOT under experimental)
  allowedDevOrigins: [
    "http://192.168.0.108:3000",
    "http://192.168.0.108:4000",
    "http://192.168.0.108:4001",
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.0.113:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://192.168.0.113:4000',
    'http://localhost:4001',
    'http://127.0.0.1:4001',
    'http://192.168.0.113:4001',
    'http://192.168.0.125:4001',
    'http://192.168.0.125:4000',
    'http://192.168.0.125:3001',
    'http://192.168.0.128:4000',
    'http://192.168.0.128:4001',
    'http://192.168.0.128:3000',
    'http://192.168.100.42:4000',
    'http://192.168.100.42:4001',
    'http://192.168.100.42:3000',
    'http://192.168.0.101:4000',
    'http://192.168.0.101:4001',
    'http://192.168.0.101:3000',
  ],
};

export default nextConfig;
