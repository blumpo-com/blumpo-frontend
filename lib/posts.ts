import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
  excerpt?: string;
  cover?: string;
  ogImage?: string;
  canonicalUrl?: string;
  draft?: boolean;
}

/**
 * Get all MDX posts from content/blog directory
 * Filters out drafts in production
 */
export function getAllPosts(): PostMeta[] {
  // Check if directory exists, return empty array if not
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      const { data } = matter(fileContents);
      
      return {
        slug,
        title: data.title,
        date: data.date,
        tags: data.tags,
        excerpt: data.excerpt,
        cover: data.cover,
        ogImage: data.ogImage,
        canonicalUrl: data.canonicalUrl,
        draft: data.draft ?? false
      } as PostMeta;
    });

  // Filter out drafts in production
  const posts = process.env.NODE_ENV === 'production' 
    ? allPostsData.filter(post => !post.draft)
    : allPostsData;

  // Sort posts by date (newest first)
  return posts.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

/**
 * Get the raw MDX content for a specific post by slug
 */
export function getPostSource(slug: string): string {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  return fileContents;
}

/**
 * Get post metadata by slug
 */
export function getPostBySlug(slug: string): PostMeta | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    
    return {
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags,
      excerpt: data.excerpt,
      cover: data.cover,
      ogImage: data.ogImage,
      canonicalUrl: data.canonicalUrl,
      draft: data.draft ?? false
    } as PostMeta;
  } catch {
    return null;
  }
}


