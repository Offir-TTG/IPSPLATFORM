/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a production build run beside `npm run dev` without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    domains: [
      'localhost',
    ],
  },
  // Pages may be shown inside a frame only by this site itself (the portal
  // shows the enrollment wizard inside the child page). Other websites can't
  // frame them, which stops click-jacking.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Externalize docusign-esign to avoid webpack bundling issues
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
        'docusign-esign': 'commonjs docusign-esign',
        // Email templates: loaded by Node as is. Bundling it triggered
        // "require.extensions is not supported by webpack" (harmless, noisy).
        'handlebars': 'commonjs handlebars',
      });
    } else {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig
