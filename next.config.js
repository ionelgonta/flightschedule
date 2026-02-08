/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native/Node-only packages: do not bundle, require at runtime
  experimental: {
    serverComponentsExternalPackages: ['bwip-js'],
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Build performance
  webpack: (config, { dev, isServer }) => {
    // bwip-js: external pe server (native/optional), nu bundle
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      externals.push({ 'bwip-js': 'commonjs bwip-js' });
      config.externals = externals;
    }

    // Fix for client-side modules in server-side rendering
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    // Production optimizations
    if (!dev) {
      // Enable webpack caching for faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
    }
    
    return config
  },
  
  // Output optimizations
  output: 'standalone',
  
  // Image optimizations
  images: {
    domains: ['images.unsplash.com', 'openweathermap.org'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Reduce build output
  eslint: {
    // Skip ESLint during build for faster builds
    ignoreDuringBuilds: true,
  },
  
  // TypeScript optimizations
  typescript: {
    // Skip type checking during build (run separately)
    ignoreBuildErrors: true,
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://prod.api.market https://pagead2.googlesyndication.com https://www.google-analytics.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://fundingchoicesmessages.google.com https://csi.gstatic.com https://*.google.com; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google.com https://fundingchoicesmessages.google.com https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig