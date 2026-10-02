import type { NextConfig } from "next";

const basePath =
  process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : "";
const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },

  ...(isDevelopment && {
    async headers() {
      return [
        {
          source: "/:path*",
          basePath: false,
          headers: [
            {
              key: "X-Robots-Tag",
              value: "noindex, nofollow",
            },
          ],
        },
      ];
    },
  }),

  ...(basePath && {
    basePath,
    assetPrefix: basePath,
  }),

  allowedDevOrigins: ["*"],
  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverSourceMaps: false,
    turbopackSourceMaps: false,
  },
};

export default nextConfig;
