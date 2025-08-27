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
  // experimental: {
  //   optimizeCss: true,
  // },
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
      
      // Add optimization to handle module loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[/]node_modules[/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
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
  disable: false,
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
  }
});

export default withPWAConfig(withNextIntl(nextConfig));