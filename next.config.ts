/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
        'https://www.scchs.co.in',
        'https://scchs.co.in',
        'http://localhost:3000',
        '*'
    ],
  },
};

module.exports = nextConfig;
