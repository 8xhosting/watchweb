import type { NextConfig } from "next";

// Standalone output is meant for self-hosted node servers (bun .next/standalone/server.js).
// Netlify's Next.js Runtime does its own bundling, so we skip standalone when building there
// (Netlify sets NETLIFY=1 in its build environment).
const nextConfig: NextConfig = {
  ...(process.env.NETLIFY ? {} : { output: "standalone" as const }),
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
