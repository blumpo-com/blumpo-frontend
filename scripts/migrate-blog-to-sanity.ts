/**
 * Migrate MDX blog posts to Sanity.
 * Usage:
 *   pnpm run migrate:blog -- <slug>     Migrate one post by slug
 *   pnpm run migrate:blog -- --all     Migrate all MDX posts
 *
 * Requires: .env with NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 *           and SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) for writes.
 */

import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import { createClient } from 'next-sanity'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import { htmlToBlocks } from '@portabletext/block-tools'

// Load env (same as Next.js)
import 'dotenv/config'

const CONTENT_ROOT = path.join(process.cwd(), 'content/blog')
const PUBLIC_ROOT = path.join(process.cwd(), 'public')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-03'

if (!projectId || !dataset) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET in .env')
  process.exit(1)
}
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) in .env for creating documents')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

// Portable text schema shape expected by htmlToBlocks (block/span required for isTextBlock)
const portableTextSchema = {
  block: { name: 'block' },
  span: { name: 'span' },
  styles: [
    { name: 'normal' },
    { name: 'h1' },
    { name: 'h2' },
    { name: 'h3' },
    { name: 'h4' },
    { name: 'blockquote' },
  ],
  decorators: [{ name: 'strong' }, { name: 'em' }],
  annotations: [{ name: 'link' }],
  blockObjects: [
    { name: 'image', fields: [{ name: 'alt', type: 'string' }] },
    {
      name: 'tableBlock',
      fields: [{ name: 'rows', type: 'array' }],
    },
  ],
  lists: [{ name: 'bullet' }],
  inlineObjects: [],
}

const SANITY_TABLE_PLACEHOLDER = 'data-sanity-table-index'

/** Parse HTML <table> into Sanity tableBlock rows (tableRow with cells). Skips GFM separator rows (|---|---|). */
function parseTableElement(tableEl: Element): Array<{ _type: 'tableRow'; _key: string; cells: string[] }> {
  const rows: Array<{ _type: 'tableRow'; _key: string; cells: string[] }> = []
  const trs = tableEl.querySelectorAll('tr')
  trs.forEach((tr, i) => {
    const cells: string[] = []
    tr.querySelectorAll('td, th').forEach((cell) => {
      cells.push((cell.textContent || '').trim())
    })
    if (cells.length === 0) return
    const isSeparatorRow = cells.every((c) => /^-+$/.test(c) || c === '')
    if (isSeparatorRow) return
    rows.push({
      _type: 'tableRow',
      _key: `row-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      cells,
    })
  })
  return rows
}

/** Extract tables from DOM, replace with placeholders, return extracted table data and modified HTML (body innerHTML). */
function extractTablesFromHtml(dom: Document): { tables: Array<{ _type: 'tableRow'; _key: string; cells: string[] }[]>; bodyHtml: string } {
  const tables: Array<{ _type: 'tableRow'; _key: string; cells: string[] }[]> = []
  const tableElements = Array.from(dom.querySelectorAll('table'))
  tableElements.forEach((tableEl) => {
    const rows = parseTableElement(tableEl)
    if (rows.length > 0) {
      const index = tables.length
      tables.push(rows)
      const placeholder = dom.createElement('div')
      placeholder.setAttribute(SANITY_TABLE_PLACEHOLDER, String(index))
      placeholder.textContent = ' ' // ensure it's not empty so it may be treated as block
      tableEl.parentNode?.replaceChild(placeholder, tableEl)
    }
  })
  const body = dom.body
  const bodyHtml = body ? body.innerHTML : ''
  return { tables, bodyHtml }
}

function getMdxSlugs(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) return []
  return fs
    .readdirSync(CONTENT_ROOT)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}

/**
 * Strip import lines and replace <Image src={var} alt="..." /> with ![alt](path)
 * by parsing import var from './slug/file' to build var -> path map.
 */
function mdxContentToMarkdown(content: string, slug: string): string {
  const lines = content.split('\n')
  const varToPath = new Map<string, string>()
  const slugDir = `./${slug}/`

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const importMatch = line.match(/^import\s+(\S+)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/)
    if (importMatch) {
      const [, varName, fromPath] = importMatch
      const normalized = fromPath.startsWith('./') ? fromPath : `./${fromPath}`
      if (normalized.includes(slug) || normalized.startsWith('.')) {
        varToPath.set(varName, normalized)
      }
      continue
    }
  }

  let body = lines
    .filter((line) => !line.trimStart().startsWith('import '))
    .join('\n')

  // Replace <Image src={varName} alt="..." /> with ![alt](./slug/filename)
  body = body.replace(
    /<Image\s+src=\{([^}]+)\}\s+alt=["']([^"']*)["'][^/]*\/?\s*\/?>/g,
    (_, varName, alt) => {
      const v = varName.trim()
      const p = varToPath.get(v)
      if (p) return `![${alt}](${p})`
      return ''
    }
  )

  return body
}

function resolveImagePath(src: string, slug: string): string | null {
  const decoded = decodeURIComponent(src).replace(/\\/g, '/')
  const basename = path.basename(decoded)

  const candidates = [
    path.join(CONTENT_ROOT, slug, basename),
    path.join(CONTENT_ROOT, slug, decoded.replace(/^\.\//, '').replace(/^[^/]+\//, '')),
    path.join(PUBLIC_ROOT, 'blog', slug, basename),
    path.join(PUBLIC_ROOT, decoded.replace(/^\/blog\//, '')),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  const inSlug = path.join(CONTENT_ROOT, slug, basename)
  if (fs.existsSync(inSlug)) return inSlug
  return null
}

async function uploadImage(filePath: string): Promise<string | null> {
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  }
  const contentType = mime[ext] || `image/${ext}`
  try {
    const asset = await client.assets.upload('image', buffer, {
      filename: path.basename(filePath),
      contentType,
    })
    return asset._id
  } catch (e) {
    console.warn('Upload failed for', filePath, e)
    return null
  }
}

async function migrateOne(slug: string): Promise<void> {
  const mdxPath = path.join(CONTENT_ROOT, `${slug}.mdx`)
  if (!fs.existsSync(mdxPath)) {
    console.error('Not found:', mdxPath)
    return
  }

  const raw = fs.readFileSync(mdxPath, 'utf8')
  const { data: frontmatter, content: rawContent } = matter(raw)
  const title = frontmatter.title || slug
  const date = frontmatter.date || new Date().toISOString().slice(0, 10)
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : []
  const excerpt = frontmatter.excerpt ?? ''
  const coverPath = frontmatter.cover ? String(frontmatter.cover).trim() : ''
  console.log(`[${slug}] cover from frontmatter:`, coverPath ? `"${coverPath}"` : '(empty)', coverPath ? `(length ${coverPath.length})` : '')

  const markdown = mdxContentToMarkdown(rawContent, slug)
  const html = await Promise.resolve(
    marked.parse(markdown, { async: false, gfm: true }) as string | Promise<string>
  )
  const dom = new JSDOM(html.startsWith('<') ? html : `<body>${html}</body>`)
  const doc = dom.window.document
  if (!doc.body && doc.documentElement) {
    const body = doc.createElement('body')
    body.innerHTML = html
    doc.documentElement.appendChild(body)
  }

  const { tables: extractedTables, bodyHtml } = extractTablesFromHtml(doc)

  const imgElements = Array.from(doc.querySelectorAll('img'))
  const imageRefMap = new Map<string, string>()
  for (const img of imgElements) {
    const src = (img as Element).getAttribute('src')
    if (!src || src.startsWith('http')) continue
    const resolved = resolveImagePath(src, slug)
    if (resolved) {
      const ref = await uploadImage(resolved)
      if (ref) imageRefMap.set(src, ref)
    }
  }

  const rules = [
    {
      deserialize(
        el: unknown,
        _next: (elements: unknown) => unknown[],
        block: (props: Record<string, unknown>) => unknown
      ) {
        const node = el as Element
        if (node.tagName?.toLowerCase() !== 'img') {
          const tableIndex = node.getAttribute?.(SANITY_TABLE_PLACEHOLDER)
          if (tableIndex != null && extractedTables[parseInt(tableIndex, 10)]) {
            const rows = extractedTables[parseInt(tableIndex, 10)]
            return block({
              _type: 'tableBlock',
              rows,
            })
          }
          return undefined
        }
        const src = node.getAttribute('src')
        const alt = node.getAttribute('alt') || undefined
        const ref = src ? imageRefMap.get(src) : undefined
        if (!ref) return undefined
        return block({
          _type: 'image',
          asset: { _type: 'reference', _ref: ref },
          alt,
        })
      },
    },
  ]

  const htmlForBlocks = doc.body ? doc.body.innerHTML : bodyHtml
  const blocks = htmlToBlocks(htmlForBlocks, portableTextSchema as never, {
    parseHtml: (htmlString: string) => new JSDOM(htmlString.startsWith('<') ? htmlString : `<body>${htmlString}</body>`).window.document,
    rules: rules as never,
  }) as Array<{ _type: string; _key?: string; [k: string]: unknown }>

  const blocksWithKeys = blocks.map((b, i) => ({
    ...b,
    _key: b._key || `block-${i}-${Date.now()}`,
  }))

  let mainImageValue: { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined
  if (coverPath) {
    const resolvedCover = resolveImagePath(coverPath, slug)
    console.log(`[${slug}] cover resolveImagePath(${JSON.stringify(coverPath)}, ${slug}):`, resolvedCover ?? '(not found)')
    if (resolvedCover) {
      const ref = await uploadImage(resolvedCover)
      console.log(`[${slug}] cover upload "${resolvedCover}":`, ref ?? '(upload failed)')
      if (ref) {
        mainImageValue = { _type: 'image', asset: { _type: 'reference', _ref: ref } }
      }
    } else {
      console.warn(`[${slug}] Cover image not found. Tried candidates for basename: ${path.basename(coverPath.replace(/^\/blog\/[^/]+\//, ''))}`)
    }
  } else {
    console.log(`[${slug}] No cover path in frontmatter, skipping mainImage`)
  }

  const existingId = await client.fetch<string | null>(
    `*[_type == "post" && slug.current == $slug][0]._id`,
    { slug }
  )

  const docPayload = {
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    publishedAt: date.includes('T') ? date : `${date}T00:00:00.000Z`,
    excerpt: excerpt || undefined,
    tags: tags.length ? tags : undefined,
    mainImage: mainImageValue,
    body: blocksWithKeys,
  }
  console.log(`[${slug}] docPayload.mainImage:`, mainImageValue ? `asset ref ${mainImageValue.asset._ref}` : '(none)')

  if (existingId) {
    await client.createOrReplace({ ...docPayload, _id: existingId })
    console.log('Updated post:', slug)
  } else {
    await client.create(docPayload)
    console.log('Created post:', slug)
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  const all = args.includes('--all')
  const slugArg = args.find((a) => a !== '--all')

  if (all) {
    const slugs = getMdxSlugs()
    console.log('Migrating', slugs.length, 'posts...')
    for (const slug of slugs) {
      await migrateOne(slug)
    }
    return
  }

  const slug = slugArg || 'fast-ai-vs-strategic-ai-the-real-difference-in-b2b-advertising'
  await migrateOne(slug)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
