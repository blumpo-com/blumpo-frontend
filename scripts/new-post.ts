#!/usr/bin/env node
/**
 * @deprecated This script is deprecated. Use Sanity Studio to add new blog posts.
 * See docs/BLOG-SANITY-MIGRATION.md for the current blog workflow.
 */

import fs from 'fs';
import path from 'path';

/**
 * Convert a title to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create MDX frontmatter and content template
 */
function createMDXTemplate(title: string, slug: string, date: string): string {
  return `---
title: ${title}
slug: ${slug}
date: ${date}
tags: []
excerpt: A brief description of your post
cover: ./${slug}/cover.jpg
draft: true
---

## Introduction

Write your blog post content here using **MDX**.

## Features

- Support for Markdown syntax
- GFM (GitHub Flavored Markdown) extensions
- Code highlighting
- Auto-linked headings

## Code Example

\`\`\`typescript
function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

## Images

You can use local images with Next.js Image optimization:

![Cover Image](./${slug}/cover.jpg)

## Conclusion

Happy blogging!
`;
}

/**
 * Main script
 */
async function main() {
  console.warn(
    '⚠️  DEPRECATED: Use Sanity Studio to add new blog posts. See docs/BLOG-SANITY-MIGRATION.md'
  );

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Please provide a post title');
    console.log('\nUsage: pnpm new:post "Your Post Title"');
    console.log('Example: pnpm new:post "Getting Started with Next.js"');
    process.exit(1);
  }

  const title = args.join(' ');
  const slug = slugify(title);
  const date = getTodayDate();

  const contentDir = path.join(process.cwd(), 'content', 'blog');
  const postPath = path.join(contentDir, `${slug}.mdx`);
  const imagesDir = path.join(contentDir, slug);

  // Create content/blog directory if it doesn't exist
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
    console.log('✅ Created content/blog directory');
  }

  // Check if post already exists
  if (fs.existsSync(postPath)) {
    console.error(`❌ Error: Post "${slug}.mdx" already exists`);
    process.exit(1);
  }

  // Create images directory
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`✅ Created images directory: ${slug}/`);
  }

  // Create MDX file
  const content = createMDXTemplate(title, slug, date);
  fs.writeFileSync(postPath, content, 'utf8');
  
  console.log('\n🎉 Success! New blog post created:');
  console.log(`\n📄 File: content/blog/${slug}.mdx`);
  console.log(`📁 Images: content/blog/${slug}/`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Add a cover image to content/blog/${slug}/cover.jpg`);
  console.log(`   2. Edit content/blog/${slug}.mdx`);
  console.log(`   3. Set draft: false when ready to publish`);
  console.log(`\n💡 View locally: http://localhost:3000/blog/${slug}`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});


