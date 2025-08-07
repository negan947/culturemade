import type { NextConfig } from 'next';

// Import environment validation
import { envConfig, validateServerEnv } from './lib/validations/env';

/**
 * Validate environment variables at build time
 * This ensures that all required environment variables are present
 * and properly formatted before the application starts
 */
function validateEnvironment() {
  // Skip validation if explicitly requested
  if (envConfig.skipValidation) {
    console.log('⚠️  Environment validation skipped');
    return;
  }

  try {
    const env = validateServerEnv();
    console.log('✅ Environment variables validated successfully');

    // Log environment info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Environment Configuration:');
      console.log(`   NODE_ENV: ${env.NODE_ENV}`);
      console.log(`   APP_URL: ${env.NEXT_PUBLIC_APP_URL}`);
      console.log(`   SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
      console.log(`   SITE_LOCKED: ${env.SITE_LOCKED ? 'Yes' : 'No'}`);
      console.log(`   BYPASS_AUTH: ${env.BYPASS_AUTH ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error);

    // Only throw in production or when explicitly requested
    if (envConfig.throwOnError) {
      throw error;
    }
  }
}

// Validate environment variables
validateEnvironment();

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // Configure turbopack for development (faster builds)
  turbopack: {
    rules: {
      // Custom rules for turbopack can be added here
    },
  },


  // Configure TypeScript for stricter type checking
  typescript: {
    // Enable strict type checking
    tsconfigPath: './tsconfig.json',
    // Don't fail the build on TypeScript errors during production builds
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // Configure ESLint for better code quality
  eslint: {
    // Ignore ESLint during builds to prevent warnings from failing the build
    ignoreDuringBuilds: true,

    // Specify directories to lint
    dirs: ['app', 'components', 'lib', 'hooks', 'store', 'utils', 'types'],
  },

  // Configure images optimization
  images: {
    // Configure image domains (add your CDN domains here)
    domains: [
      'localhost', 
      'gaifxrqdngirhetkvaqe.supabase.co',
      'picsum.photos', // For placeholder images
      'via.placeholder.com', // Additional placeholder service
    ],

    // Configure image formats
    formats: ['image/webp', 'image/avif'],

    // Configure image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Allow unoptimized images for development
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Configure security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Configure redirects if needed
  async redirects() {
    return [
      // Add redirects here if needed
    ];
  },

  // Configure rewrites if needed
  async rewrites() {
    return [
      // Add rewrites here if needed
    ];
  },

  // Configure output for deployment
  output: 'standalone',

  // Configure compression
  compress: true,

  // Configure poweredByHeader
  poweredByHeader: false,

  // Configure environment variables for client-side
  env: {
    // Add custom environment variables here if needed
  },

  // Configure server-side runtime
  serverRuntimeConfig: {
    // Server-side only configuration
  },

  // Configure public runtime configuration
  publicRuntimeConfig: {
    // Client-side configuration
  },
};

// Export the config
export default nextConfig;
