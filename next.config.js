/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // API proxy
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://103.171.85.146:3000/api/v1/:path*',
      },
    ]
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Webpack optimizations
  webpack: (config, { isServer, webpack }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Vendor chunks
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          
          // Common chunks
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          
          // Firebase chunk
          firebase: {
            name: 'firebase',
            test: /[\\/]node_modules[\\/]firebase[\\/]/,
            priority: 30,
            reuseExistingChunk: true,
          },
          
          // Chart library
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/]lightweight-charts[\\/]/,
            priority: 30,
            reuseExistingChunk: true,
          },
        },
      }
      
      // Optimize imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'date-fns': 'date-fns/esm',
      }
    }
    
    // Bundle analyzer (only in development)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')()
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      )
    }
    
    return config
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/:path*',
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
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      // Cache static assets
      {
        source: '/stc-logo.png',
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