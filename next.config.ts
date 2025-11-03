import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  }
};

// Configure MDX without plugins for Turbopack compatibility
// Plugins will be configured at runtime via mdx-components.tsx
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {}
});

export default withMDX(nextConfig);
