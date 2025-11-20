import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // 개발 모드에서 타입 체크 비활성화 (빠른 시작)
  typescript: {
    ignoreBuildErrors: false, // 빌드 시에는 체크
  },
  // ESLint 체크 비활성화 (개발 중)
  eslint: {
    ignoreDuringBuilds: false, // 빌드 시에는 체크
  },
}

export default nextConfig
