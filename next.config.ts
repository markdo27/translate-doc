import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Vercel Hobby plan caps serverless function request body at 4.5 MB.
  // Pro/Team plans support up to 100 MB. Our API routes use formData() directly.


  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdfjs-dist needs canvas as an optional peer dep — mark it as external
      // so it's not bundled (and doesn't error when absent on Vercel)
      const existingExternals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...existingExternals, "canvas", "sharp"];
    }
    return config;
  },
};

export default nextConfig;
