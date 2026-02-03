import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { svgo: false },
          },
        ],
        as: "*.js",
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },

  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule: unknown) =>
      (rule as { test?: { test?: (s: string) => boolean } }).test?.test?.(".svg")
    );

    if (fileLoaderRule && typeof fileLoaderRule === "object") {
      (fileLoaderRule as { exclude?: RegExp }).exclude = /\.svg$/i;
    }

    // Single rule with top-level test so Next.js detects custom SVG handling and excludes SVG from next-image-loader
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: false,
          },
        },
      ],
    });

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: { not: /\.[jt]sx?$/ },
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });

    return config;
  },
};

export default nextConfig;
