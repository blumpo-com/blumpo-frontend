import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import '@/styles/prose.css';

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug
  }));
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found'
    };
  }

  const ogImage = post.ogImage || post.cover;

  return {
    title: post.title,
    description: post.excerpt,
    ...(post.canonicalUrl && {
      alternates: {
        canonical: post.canonicalUrl
      }
    }),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            alt: post.title
          }
        ]
      })
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(ogImage && {
        images: [ogImage]
      })
    }
  };
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Check if draft in production
  if (process.env.NODE_ENV === 'production' && post.draft) {
    notFound();
  }

  // Dynamically import the MDX file
  let MDXContent;
  try {
    MDXContent = (await import(`@/content/blog/${slug}.mdx`)).default;
  } catch (error) {
    console.error(`Error loading MDX for slug: ${slug}`, error);
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        {post.draft && (
          <div className="mb-4 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded text-yellow-800 dark:text-yellow-200">
            ⚠️ Draft post - not visible in production
          </div>
        )}
        
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
        <MDXContent />
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


