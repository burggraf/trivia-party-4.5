import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig