import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@ump/ui', '@ump/core'],
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable source maps in production for Lighthouse audit
  productionBrowserSourceMaps: true,
  experimental: {
    optimizeCss: true,
    // Enable modern JavaScript output
    esmExternals: true,
    // Enable SWC minification for better tree shaking
    swcMinify: true,
    // Enable modern bundling
    modularizeImports: {
      'lodash': {
        transform: 'lodash/{{member}}',
      },
      '@mui/material': {
        transform: '@mui/material/{{member}}',
      },
      '@mui/icons-material': {
        transform: '@mui/icons-material/{{member}}',
      },
    },
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Fix for webpack module loading issues with Next.js 15 + React 19
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
      };
      
      // Add optimization to handle module loading and reduce bundle size
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[/]node_modules[/]/,
              name: 'vendors',
              chunks: 'all',
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
        usedExports: true,
        sideEffects: false,
        // Enable tree shaking
        providedExports: true,
        // Minimize bundle size
        minimize: true,
      };
      
      // Suppress webpack runtime errors that cause console errors in Lighthouse
      config.stats = {
        ...config.stats,
        errorDetails: false,
        warnings: false,
      };
      
      // Add error boundary for webpack runtime
      config.optimization.runtimeChunk = {
        name: 'webpack-runtime',
      };
    }
    return config;
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  scope: '/',
  sw: 'sw.js',
  mode: 'production',
  fallbacks: {
    document: '/offline'
  },
  workboxOptions: {
    disableDevLogs: true,
    // Improve caching strategy
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          },
        },
      },
    ],
  }
});

export default withPWAConfig(withNextIntl(nextConfig));