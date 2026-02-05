'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { PostMeta } from '@/lib/posts-sanity'

/** Format date in a deterministic way to avoid server/client hydration mismatch. */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function BlogPostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No posts published yet. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {posts.map((post) => (
        <article key={post.slug} className="group">
          <Link href={`/blog/${post.slug}`} className="block">
            {post.cover && (
              <div className="mb-4 overflow-hidden rounded-lg aspect-video relative bg-gray-100 dark:bg-gray-800">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
            )}

            <div>
              <time
                dateTime={post.date}
                className="text-sm text-gray-600 dark:text-gray-400"
                suppressHydrationWarning
              >
                {formatDate(post.date)}
              </time>

              <h2 className="text-2xl font-bold mt-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h2>

              {post.excerpt && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </article>
      ))}
    </div>
  )
}
