import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables `"use cache"` + cacheTag(): catalog data is served from cache
  // until an admin write invalidates the matching tag (see server/catalog.ts).
  cacheComponents: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
