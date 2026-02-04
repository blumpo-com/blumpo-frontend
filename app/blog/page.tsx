import { getAllPosts } from '@/lib/posts-sanity'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { BlogPostList } from './blog-post-list'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest articles and insights',
}

export default async function BlogPage() {
  const { isEnabled: preview } = await draftMode()
  const posts = await getAllPosts(preview)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Articles, tutorials, and insights about web development
        </p>
      </div>

      <BlogPostList posts={posts} />
    </div>
  )
}


