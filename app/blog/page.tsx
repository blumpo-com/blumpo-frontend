import { getAllPosts } from '@/lib/posts-sanity'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { BlogPostList } from './blog-post-list'
import { LandingHeader } from '@/components/landing-header'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Your marketing growth playbooks',
}

export default async function BlogPage() {
  const { isEnabled: preview } = await draftMode()
  const posts = await getAllPosts(preview)

  return (
    <>
      <LandingHeader />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 flex items-center">
          <div>
            <h1 className="font-black mb-4 header-gradient text-left">Your marketing growth playbooks</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Learn from our experiences and best practices to grow your business.
            </p>
          </div>

          <Image src="/images/blumpo/reading-blumpo-blog.png" alt="Blog hero" width={200} height={200} />
        </div>

        <BlogPostList posts={posts} />
      </div>
    </>
  )
}
