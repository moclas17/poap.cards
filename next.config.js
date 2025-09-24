/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better mobile compatibility
  experimental: {
    optimizePackageImports: ['@reown/appkit', 'wagmi', 'viem'],
  },

  // Configure headers for better mobile security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent mobile browsers from blocking scripts
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Allow wallet connections from mobile browsers
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ],
      },
    ]
  },

  // Allow access from mobile devices on local network
  allowedDevOrigins: ['192.168.1.67'],

  // Webpack config for better mobile compatibility
  webpack: (config, { isServer }) => {
    // Fix for mobile wallet connections
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    // Resolve fallbacks for mobile browsers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // Fix MetaMask SDK React Native dependency
        '@react-native-async-storage/async-storage': false,
      }
    }

    // Fix MetaMask SDK module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    }

    return config
  },
}

module.exports = nextConfig