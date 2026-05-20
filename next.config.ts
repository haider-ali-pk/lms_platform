import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 120,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  turbopack: {},
}

export default nextConfig