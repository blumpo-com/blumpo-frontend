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

export default withMDX(nextConfig);
