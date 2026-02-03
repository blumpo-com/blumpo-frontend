import { getAllPosts, getPostBySlug } from '@/lib/posts-sanity';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import type { Metadata } from 'next';
import { PortableText } from 'next-sanity';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import '@/styles/prose.css';

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug
  }));
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const post = await getPostBySlug(slug, preview);

  if (!post) {
    return {
      title: 'Post Not Found'
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      ...(post.cover && {
        images: [
          {
            url: post.cover,
            alt: post.title
          }
        ]
      })
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(post.cover && {
        images: [post.cover]
      })
    }
  };
}

interface TableRowValue {
  _type?: string
  cells?: string[]
}

interface TableBlockValue {
  rows?: TableRowValue[]
}

const portableTextComponents = {
  types: {
    image: ({ value }: { value: { asset?: { _ref: string }; alt?: string } }) => {
      if (!value?.asset?._ref) return null
      const src = urlFor(value).width(800).height(500).url()
      return (
        <span className="block my-6 relative w-full aspect-video rounded-lg overflow-hidden">
          <Image
            src={src}
            alt={value.alt ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </span>
      )
    },
    tableBlock: ({ value }: { value: TableBlockValue }) => {
      const rows = value?.rows ?? []
      if (rows.length === 0) return null
      const [headRow, ...bodyRows] = rows
      return (
        <div className="my-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden prose-table:border prose dark:prose-invert max-w-none">
            {headRow && (
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  {(headRow.cells ?? []).map((cell, j) => (
                    <th
                      key={j}
                      className="px-4 py-2 text-left font-semibold border-r last:border-r-0 border-gray-200 dark:border-gray-700"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  {(row.cells ?? []).map((cell, j) => (
                    <td
                      key={j}
                      className="px-4 py-2 text-left border-r last:border-r-0 border-gray-200 dark:border-gray-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
  },
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const post = await getPostBySlug(slug, preview);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        <time 
          dateTime={post.date} 
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
        
        <h1 className="text-4xl font-bold mt-2 mb-4">
          {post.title}
        </h1>
        
        {post.excerpt && (
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
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
      </header>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {post.body && post.body.length > 0 ? (
          <PortableText value={post.body} components={portableTextComponents} />
        ) : null}
      </div>
      
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <a 
          href="/blog"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to all posts
        </a>
      </footer>
    </article>
  );
}


