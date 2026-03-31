/** @type {import('next').NextConfig} */
const nextConfig = {
  fastRefresh: false,
  experimental: {
    // Work around Windows environments that block child_process spawn during `next build`
    // (Next uses jest-worker; this flips it to worker_threads).
    workerThreads: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
  swcMinify: false,
  webpack: (config, { dev, isServer }) => {
    // Avoid generating Trusted Types wrappers around `eval` in dev bundles.
    // Some environments/extensions polyfill `trustedTypes` in a way that breaks
    // `eval(__webpack_require__.ts(...))` with "Invalid or unexpected token".
    if (config.output) {
      delete config.output.trustedTypes;
    }

    // Avoid `eval`-based sourcemaps in the browser to prevent runtime syntax errors.
    if (dev && !isServer) {
      config.devtool = 'source-map';
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
