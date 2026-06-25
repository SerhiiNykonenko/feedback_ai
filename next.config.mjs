/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb"
    }
  },
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;
