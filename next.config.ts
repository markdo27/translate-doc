import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large file uploads (10 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
  // Webpack config to allow pdf-parse to work correctly in Node runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse relies on fs — make sure it stays server-side
      config.externals = [...(config.externals ?? []), "canvas"];
    }
    return config;
  },
};

export default nextConfig;
