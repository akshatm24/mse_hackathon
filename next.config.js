/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@google/generative-ai"]
  }
};

module.exports = nextConfig;
