/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ump/ui', '@ump/core', '@ump/engine'],
  experimental: {
    optimizePackageImports: ['@ump/ui'],
  },
  webpack: (config, { isServer }) => {
    // Exclude Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'isolated-vm': false,
        fs: false,
        crypto: false,
        path: false,
        os: false,
        'node-fetch': false,
      };
    }

    // Mark Node.js modules as external for server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('isolated-vm');
    }

    return config;
  },
};

module.exports = nextConfig;
