/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disables Next.js telemetry
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
