import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],

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
    // Find the existing SVG rule and modify it
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg")
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    // Use oneOf to handle SVG differently based on issuer
    config.module.rules.push({
      oneOf: [
        // SVGR loader for SVG files from TS/TSX (React components)
        {
          test: /\.svg$/,
          issuer: /\.[jt]sx?$/,
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                svgo: false,
              },
            },
          ],
        },
        // Asset loader for SVG files from MDX or other files (as URLs)
        {
          test: /\.svg$/,
          type: "asset/resource",
          generator: {
            filename: "static/media/[name].[hash][ext]",
          },
        },
      ],
    });

    return config;
  },
};

// MDX config
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm],
  },
});

// Apply MDX + Next config
const config = withMDX(nextConfig);

export default config;
