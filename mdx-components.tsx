import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Map img to Next.js Image
    img: (props: any) => {
      const { src, alt, width, height, ...rest } = props;
      
      // For static imports, src will be an object with properties
      if (typeof src === 'object' && src.src) {
        return (
          <Image
            src={src}
            alt={alt || ''}
            className="rounded-lg"
            {...rest}
          />
        );
      }
      
      // For string src, use the Image component with inferred dimensions
      return (
        <Image
          src={src}
          alt={alt || ''}
          width={width || 800}
          height={height || 600}
          className="rounded-lg"
          {...rest}
        />
      );
    },
    
    // Map anchor tags to Next.js Link
    a: ({ href, children, ...props }: any) => {
      // External links
      if (href?.startsWith('http')) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      }
      
      // Internal links
      return (
        <Link href={href || '#'} {...props}>
          {children}
        </Link>
      );
    },
    
    // Custom heading components with better styling
    h1: ({ children, ...props }: any) => (
      <h1 className="text-4xl font-bold mt-8 mb-4" {...props}>
        {children}
      </h1>
    ),
    
    h2: ({ children, ...props }: any) => (
      <h2 className="text-3xl font-semibold mt-8 mb-4" {...props}>
        {children}
      </h2>
    ),
    
    h3: ({ children, ...props }: any) => (
      <h3 className="text-2xl font-semibold mt-6 mb-3" {...props}>
        {children}
      </h3>
    ),
    
    h4: ({ children, ...props }: any) => (
      <h4 className="text-xl font-semibold mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    
    // Code blocks
    pre: ({ children, ...props }: any) => (
      <pre className="overflow-x-auto rounded-lg my-4" {...props}>
        {children}
      </pre>
    ),
    
    code: ({ children, ...props }: any) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    ),
    
    // Blockquote
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-2 my-4 italic" {...props}>
        {children}
      </blockquote>
    ),
    
    // Tables
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
          {children}
        </table>
      </div>
    ),
    
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold" {...props}>
        {children}
      </th>
    ),
    
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-2 text-sm" {...props}>
        {children}
      </td>
    ),
    
    // Horizontal rule
    hr: (props: any) => (
      <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />
    ),
    
    // Lists
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside my-4 space-y-2" {...props}>
        {children}
      </ul>
    ),
    
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside my-4 space-y-2" {...props}>
        {children}
      </ol>
    ),
    
    li: ({ children, ...props }: any) => (
      <li className="ml-4" {...props}>
        {children}
      </li>
    ),
    
    // Paragraph
    p: ({ children, ...props }: any) => (
      <p className="my-4 leading-7" {...props}>
        {children}
      </p>
    ),
    
    ...components
  };
}

