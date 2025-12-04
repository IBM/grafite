/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
      ignoreDuringBuilds: true
  }, 
  poweredByHeader: false,
  output: 'standalone'
};

export default nextConfig;
