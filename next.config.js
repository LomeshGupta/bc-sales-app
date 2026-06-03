/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  reactStrictMode: true,

  transpilePackages: ["@mui/x-data-grid"],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "framer-motion",
    ],
  },

  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
