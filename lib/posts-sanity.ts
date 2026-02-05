import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'

export interface PostMeta {
  slug: string
  title: string
  date: string
  tags?: string[]
  excerpt?: string
  cover?: string
}

/** Portable Text body from Sanity (block array). Compatible with next-sanity PortableText. */
export type SanityPortableTextBlock = Array<{ _type: string; _key?: string; [key: string]: unknown }>

export interface SanityPost extends PostMeta {
  _id: string
  body: SanityPortableTextBlock | null
}

const POSTS_LIST_GROQ = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  "date": publishedAt,
  excerpt,
  "cover": mainImage.asset->url,
  tags
}`

const POST_BY_SLUG_GROQ = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  "date": publishedAt,
  excerpt,
  "cover": mainImage.asset->url,
  tags,
  body
}`

function mapToPostMeta(row: {
  slug?: string
  title?: string
  date?: string
  excerpt?: string
  cover?: string
  tags?: string[]
}): PostMeta {
  return {
    slug: row.slug ?? '',
    title: row.title ?? '',
    date: row.date ?? '',
    excerpt: row.excerpt ?? undefined,
    cover: row.cover ?? undefined,
    tags: row.tags ?? undefined,
  }
}

/**
 * Get all posts from Sanity.
 * Production (preview=false): published posts only. Preview (preview=true): drafts + published, with live updates when used inside SanityLive.
 */
export async function getAllPosts(preview = false): Promise<PostMeta[]> {
  if (preview) {
    const { data: rows } = await sanityFetch({
      query: POSTS_LIST_GROQ,
      perspective: 'previewDrafts',
    })
    const list = Array.isArray(rows) ? rows : []
    return list.map((row) => mapToPostMeta(row as Parameters<typeof mapToPostMeta>[0]))
  }
  const rows = await client.fetch<Array<Record<string, unknown>>>(POSTS_LIST_GROQ)
  if (!Array.isArray(rows)) return []
  return rows.map((row) => mapToPostMeta(row as Parameters<typeof mapToPostMeta>[0]))
}

/**
 * Get a single post by slug from Sanity, including body for rendering.
 * Production (preview=false): published only. Preview (preview=true): draft if present, with live updates inside SanityLive.
 */
export async function getPostBySlug(slug: string, preview = false): Promise<SanityPost | null> {
  if (preview) {
    const { data: row } = await sanityFetch({
      query: POST_BY_SLUG_GROQ,
      params: { slug },
      perspective: 'previewDrafts',
    })
    if (!row || typeof row !== 'object') return null
    const meta = mapToPostMeta(row as Parameters<typeof mapToPostMeta>[0])
    return {
      ...meta,
      _id: (row._id as string) ?? '',
      body: (row.body as SanityPortableTextBlock | null) ?? null,
    }
  }
  const row = await client.fetch<Record<string, unknown> | null>(POST_BY_SLUG_GROQ, { slug })
  if (!row) return null
  const meta = mapToPostMeta(row as Parameters<typeof mapToPostMeta>[0])
  return {
    ...meta,
    _id: (row._id as string) ?? '',
    body: (row.body as SanityPortableTextBlock | null) ?? null,
  }
}
