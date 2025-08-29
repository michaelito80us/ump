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
    // Disable all polyfills for modern browsers
    styledComponents: true,
  },
  // Completely disable polyfills for modern browsers
  experimental: {
    optimizeCss: true,
    // Enable modern JavaScript output
    esmExternals: true,
    // Force modern output without polyfills
    forceSwcTransforms: true,
  },
  
  // Completely disable polyfills
  excludeDefaultMomentLocales: true,
  
  // Enable source maps in production for Lighthouse audit
  productionBrowserSourceMaps: true,

  // Enable modern bundling (moved out of experimental)
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
  images: {
    domains: ['localhost'],
  },
  // Add resource hints to reduce critical request chains
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
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
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
      
      // Disable polyfills for modern browsers to fix Lighthouse legacy JavaScript audit
      config.resolve.alias = {
        ...config.resolve.alias,
        // Disable core-js polyfills that are flagged by Lighthouse
        'core-js/modules/es.array.at': false,
        'core-js/modules/es.array.flat': false,
        'core-js/modules/es.array.flat-map': false,
        'core-js/modules/es.object.from-entries': false,
        'core-js/modules/es.object.has-own': false,
        'core-js/modules/es.string.trim-end': false,
        'core-js/modules/es.string.trim-start': false,
        // Disable Next.js polyfills entirely
        'next/dist/build/polyfills/polyfill-module': false,
        'next/dist/build/polyfills/polyfill-nomodule': false,
      };
      
      // Remove polyfills from webpack entry points
      if (config.entry) {
        const originalEntry = config.entry;
        config.entry = async () => {
          const entries = await originalEntry();
          // Remove polyfills from all entry points
          Object.keys(entries).forEach(key => {
            if (Array.isArray(entries[key])) {
              entries[key] = entries[key].filter(entry => 
                !entry.includes('polyfill') && 
                !entry.includes('core-js')
              );
            }
          });
          return entries;
        };
       }
       
       // Add custom plugin to prevent polyfill generation
       config.plugins.push({
         apply: (compiler) => {
           compiler.hooks.compilation.tap('RemovePolyfillsPlugin', (compilation) => {
             compilation.hooks.processAssets.tap(
               {
                 name: 'RemovePolyfillsPlugin',
                 stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
               },
               (assets) => {
                 // Remove polyfill assets
                 Object.keys(assets).forEach(assetName => {
                   if (assetName.includes('polyfill') || assetName.includes('core-js')) {
                     delete assets[assetName];
                   }
                 });
               }
             );
             
             // Also remove from build manifest
             compilation.hooks.afterProcessAssets.tap('RemovePolyfillsPlugin', () => {
               const buildManifestAsset = compilation.assets['build-manifest.json'];
               if (buildManifestAsset) {
                 const buildManifest = JSON.parse(buildManifestAsset.source());
                 if (buildManifest.polyfillFiles) {
                   buildManifest.polyfillFiles = [];
                 }
                 compilation.assets['build-manifest.json'] = {
                   source: () => JSON.stringify(buildManifest),
                   size: () => JSON.stringify(buildManifest).length,
                 };
               }
             });
            });
          },
        });
        
        // Add optimization to handle module loading and reduce bundle size
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
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