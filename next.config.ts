import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  assetPrefix: isGitHubPages ? "/landing.redline" : undefined,
  basePath: isGitHubPages ? "/landing.redline" : undefined,
  images: {
    unoptimized: isGitHubPages,
  },
};

export default nextConfig;

