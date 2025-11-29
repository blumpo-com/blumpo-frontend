import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  }
};

// Configure MDX with plugins
// remarkFrontmatter: Strips YAML frontmatter from MDX before rendering
// remarkGfm: Enables GitHub Flavored Markdown (tables, task lists, strikethrough, etc.)
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm]
  }
});

// Apply MDX config
const config = withMDX(nextConfig);

// Remove problematic Turbopack rules - MDX will work with webpack
// For Turbopack compatibility, use: pnpm dev:webpack instead of pnpm dev
if (config.turbopack?.rules && '{*,next-mdx-rule}' in config.turbopack.rules) {
  delete config.turbopack.rules['{*,next-mdx-rule}'];
}

export default config;
