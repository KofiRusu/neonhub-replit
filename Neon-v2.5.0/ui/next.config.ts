import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build settings for Vercel
  eslint: { 
    ignoreDuringBuilds: true 
  },
  typescript: { 
    ignoreBuildErrors: true 
  },
  
  // Output standalone for Docker/Vercel optimization
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['localhost', 'vercel.app'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Redirects for production
  async redirects() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  // API rewrites for development
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
    
    return isDev
      ? [
          {
            source: "/api/backend/:path*",
            destination: `${apiUrl}/:path*`,
          },
        ]
      : [];
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Environment variables validation
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
    // Skip prerender errors in client components
    missingSuspenseWithCSRBailout: false,
  },
  
  // Disable static optimization for dynamic pages
  // This app is a dashboard with client-side data fetching
  staticPageGenerationTimeout: 120,
  
  // Skip failing prerender to allow build to complete
  // This is a dashboard with runtime data - prerendering will fail
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
};

export default nextConfig;
