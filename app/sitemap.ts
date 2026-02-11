import { getAllPosts } from '@/lib/posts-sanity'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts(false)

  const blogUrls = posts.map((post) => ({
    url: `https://blumpo.com/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: 'https://blumpo.com',
      lastModified: new Date(),
      priority: 1.0,
    },
    {
      url: 'https://blumpo.com/blog',
      lastModified: new Date(),
      priority: 0.8,
    },
    // strony statyczne: terms, privacy, contact, refund...
    ...blogUrls,
  ]
}
