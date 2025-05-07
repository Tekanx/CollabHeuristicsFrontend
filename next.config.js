/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8085/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig 