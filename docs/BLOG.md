# MDX Blog Documentation

This project includes a full-featured MDX blog implementation using Next.js App Router.

## Features

✅ **MDX Support** - Write content in Markdown with JSX components  
✅ **Static Site Generation** - All posts generated at build time  
✅ **Code Highlighting** - Beautiful syntax highlighting with `rehype-pretty-code`  
✅ **GitHub Flavored Markdown** - Tables, task lists, strikethrough, and more  
✅ **Auto-linked Headings** - Anchor links for all headings  
✅ **Image Optimization** - Automatic Next.js Image optimization  
✅ **SEO & Metadata** - Full Open Graph and Twitter Card support  
✅ **Draft Mode** - Hide drafts in production, show in development  
✅ **TypeScript** - Fully typed for great DX  

## Quick Start

### Create a New Post

```bash
pnpm new:post "Your Post Title"
```

This creates:
- `content/blog/your-post-title.mdx` with frontmatter
- `content/blog/your-post-title/` folder for images
- Post marked as `draft: true` by default

### View Your Blog

- **Index**: http://localhost:3000/blog
- **Post**: http://localhost:3000/blog/your-post-title

### Publish a Post

Edit the post's frontmatter and change `draft: false`:

```yaml
---
title: Your Post Title
slug: your-post-title
date: 2025-11-02
draft: false  # Change this to publish
---
```

## Directory Structure

```
content/
  blog/
    post-slug.mdx              # Post content with frontmatter
    post-slug/                  # Post assets
      cover.jpg                 # Cover image
      diagram.png               # Other images

app/
  blog/
    page.tsx                    # Blog index listing
    [slug]/
      page.tsx                  # Individual post page

lib/
  posts.ts                      # MDX file reading & parsing

mdx-components.tsx              # MDX component mappings
styles/
  prose.css                     # Typography styles
scripts/
  new-post.ts                   # Post scaffolding script
```

## Frontmatter Fields

Every `.mdx` post must include frontmatter:

```yaml
---
title: string                   # Post title (required)
slug: string                    # URL slug (required)
date: YYYY-MM-DD                # Publication date (required)
tags?: string[]                 # Post tags (optional)
excerpt?: string                # Short description (optional)
cover?: string                  # Cover image path (optional)
ogImage?: string                # Open Graph image (optional)
canonicalUrl?: string           # Canonical URL (optional)
draft?: boolean                 # Draft status (optional)
---
```

### Field Details

- **title**: Displayed as the page title and in listings
- **slug**: Must match the filename (without `.mdx`)
- **date**: Used for sorting (newest first)
- **tags**: Array of strings for categorization
- **excerpt**: Shown in listings and meta description
- **cover**: Relative path to cover image (e.g., `./post-slug/cover.jpg`)
- **ogImage**: Social sharing image (defaults to cover)
- **canonicalUrl**: Prevents duplicate content issues
- **draft**: If `true`, hidden in production builds

## Writing Posts

### Basic Markdown

```mdx
# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*.

[Link to Next.js](https://nextjs.org)

- Unordered list
- Another item

1. Ordered list
2. Second item

> Blockquote
```

### Code Blocks

````mdx
```typescript
function greet(name: string) {
  console.log(`Hello, ${name}!`);
}
```
````

### Tables

```mdx
| Feature | Status |
|---------|--------|
| MDX | ✅ |
| SSG | ✅ |
```

### Task Lists

```mdx
- [x] Completed task
- [ ] Todo task
```

### Images

#### Using Cover Images

Reference in frontmatter:

```yaml
---
cover: ./post-slug/cover.jpg
---
```

The cover shows in the blog index automatically.

#### Inline Images

```mdx
![Alt text](./post-slug/image.jpg)
```

Images are automatically optimized via `next/image`.

#### Using Static Imports (Recommended)

```mdx
import coverImage from './post-slug/cover.jpg'

<Image src={coverImage} alt="Description" />
```

This gives you full control over the Next.js Image component.

## Draft Mode

Posts with `draft: true`:

- ✅ **Development**: Visible at `/blog` and `/blog/[slug]` with warning banner
- ❌ **Production**: Excluded from build entirely

This lets you work on posts locally without publishing them.

## Development

### Run Dev Server

```bash
pnpm dev
```

Visit:
- http://localhost:3000/blog - All posts (including drafts)
- http://localhost:3000/blog/welcome-to-the-blog - Example post

#### Note on Turbopack

The default dev command uses Turbopack (`--turbopack` flag). Due to Turbopack limitations with MDX plugin serialization, some features (syntax highlighting, auto-linked headings, GFM tables) may not work perfectly in dev mode.

**Options:**

1. **Use Webpack in development** (full plugin support):
   ```bash
   pnpm dev:webpack
   ```

2. **Keep Turbopack** (faster, but limited MDX plugins):
   ```bash
   pnpm dev
   ```

3. **Test with production build**:
   ```bash
   pnpm build
   pnpm start
   ```

All features work correctly in production builds regardless of dev mode settings.

### Build for Production

```bash
pnpm build
```

Draft posts are automatically excluded from production builds.

### Check Generated Routes

After building, check `.next/server/app/blog/` to see generated static pages.

## Plugins

The blog uses these MDX plugins (configured in `next.config.ts`):

### Remark Plugins
- **remark-gfm**: GitHub Flavored Markdown (tables, task lists, strikethrough)

### Rehype Plugins
- **rehype-slug**: Adds IDs to headings
- **rehype-autolink-headings**: Makes headings clickable anchors
- **rehype-pretty-code**: Syntax highlighting with Shiki

### Theme

Code highlighting uses the `github-dark` theme. To change:

```ts
// next.config.ts
[
  rehypePrettyCode,
  {
    theme: 'dracula', // or any Shiki theme
    keepBackground: true
  }
]
```

## Custom Components

The `mdx-components.tsx` file maps HTML elements to React components:

- `img` → Next.js `Image` (automatic optimization)
- `a` → Next.js `Link` (for internal links)
- Headings, code blocks, tables all have custom styling

### Adding Custom Components

```tsx
// mdx-components.tsx
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Alert: ({ type, children }: any) => (
      <div className={`alert alert-${type}`}>
        {children}
      </div>
    )
  };
}
```

Then use in MDX:

```mdx
<Alert type="warning">
  This is a warning!
</Alert>
```

## Styling

Posts use prose classes from `styles/prose.css` for typography:

```tsx
<div className="prose prose-lg dark:prose-invert">
  <MDXContent />
</div>
```

The prose styles include:
- Clean typography
- Proper spacing
- Code block styling
- Dark mode support
- Responsive design

## API

### `getAllPosts()`

Returns all posts sorted by date (newest first). Filters out drafts in production.

```ts
import { getAllPosts } from '@/lib/posts';

const posts = getAllPosts();
// => PostMeta[]
```

### `getPostBySlug(slug: string)`

Gets a single post's metadata.

```ts
import { getPostBySlug } from '@/lib/posts';

const post = getPostBySlug('welcome-to-the-blog');
// => PostMeta | null
```

### `getPostSource(slug: string)`

Gets the raw MDX content for a post.

```ts
import { getPostSource } from '@/lib/posts';

const source = getPostSource('welcome-to-the-blog');
// => string
```

## SEO

Each post page automatically generates:

- **Title** and **description** meta tags
- **Open Graph** tags for social sharing
- **Twitter Card** metadata
- **Canonical URL** (if specified)
- **JSON-LD** structured data (coming soon)

## Performance

The blog is optimized for performance:

- ✅ Static generation (SSG) for instant loads
- ✅ Automatic image optimization
- ✅ Minimal JavaScript
- ✅ Code splitting per route
- ✅ Edge-ready

## Extending

### Add Reading Time

```ts
// lib/posts.ts
export interface PostMeta {
  // ... existing fields
  readingTime?: string;
}

function calculateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}
```

### Add Tags Page

Create `app/blog/tags/[tag]/page.tsx`:

```tsx
export function generateStaticParams() {
  const posts = getAllPosts();
  const tags = new Set(posts.flatMap(p => p.tags || []));
  return Array.from(tags).map(tag => ({ tag }));
}
```

### Add RSS Feed

Create `app/blog/rss.xml/route.ts`:

```tsx
import { getAllPosts } from '@/lib/posts';

export async function GET() {
  const posts = getAllPosts();
  const rss = generateRSS(posts);
  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
```

## Troubleshooting

### Build Errors

If you see TypeScript errors, ensure:
```bash
pnpm add -D @types/mdx
```

### Images Not Loading

Check:
1. Image path is relative: `./post-slug/image.jpg`
2. Image file exists in the post's folder
3. Using `next/image` component

### Draft Not Showing Locally

Ensure:
1. `NODE_ENV` is not set to `production` in development
2. Post has `draft: true` in frontmatter

### Styles Not Applied

Import prose.css in the post page:
```tsx
import '@/styles/prose.css';
```

## Examples

See the included example posts:
- `content/blog/welcome-to-the-blog.mdx` - Feature overview
- `content/blog/getting-started-with-mdx.mdx` - MDX guide
- `content/blog/nextjs-performance-tips.mdx` - Draft example

## Commands Reference

```bash
# Create new post
pnpm new:post "Post Title"

# Development (Turbopack - faster, limited plugins)
pnpm dev

# Development (Webpack - full MDX plugin support)
pnpm dev:webpack

# Production build
pnpm build

# Start production server
pnpm start
```

## Resources

- [MDX Documentation](https://mdxjs.com/)
- [Next.js MDX Guide](https://nextjs.org/docs/app/building-your-application/configuring/mdx)
- [Rehype Pretty Code](https://rehype-pretty-code.netlify.app/)
- [Remark GFM](https://github.com/remarkjs/remark-gfm)

---

**Happy blogging!** 🚀


