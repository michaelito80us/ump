/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ump/ui', '@ump/core', '@ump/engine'],
  experimental: {
    optimizePackageImports: ['@ump/ui'],
  },
};

module.exports = nextConfig;
