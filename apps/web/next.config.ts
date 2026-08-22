import type { NextConfig } from "next";

const API_BACKEND =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@globetrotter/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_BACKEND}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
