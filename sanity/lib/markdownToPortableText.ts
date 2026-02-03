/**
 * Converts Markdown to Sanity Portable Text blocks.
 * Works in both Node (migration) and browser (Studio) when you pass the right parseHtml.
 *
 * @param markdown - Markdown string (GFM supported: tables, lists, etc.)
 * @param parseHtml - Function that returns a Document from HTML string (e.g. DOMParser in browser, JSDOM in Node)
 * @returns Array of block objects suitable for blockContent body
 */

import { marked } from 'marked'
import { htmlToBlocks } from '@portabletext/block-tools'

const SANITY_TABLE_PLACEHOLDER = 'data-sanity-table-index'

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
  decorators: [{ name: 'strong' }, { name: 'em' }, { name: 'code' }],
  annotations: [{ name: 'link' }],
  blockObjects: [
    { name: 'image', fields: [{ name: 'alt', type: 'string' }] },
    { name: 'tableBlock', fields: [{ name: 'rows', type: 'array' }] },
  ],
  lists: [{ name: 'bullet' }, { name: 'number' }],
  inlineObjects: [],
}

type TableRow = { _type: 'tableRow'; _key: string; cells: string[] }

function parseTableElement(tableEl: Element): TableRow[] {
  const rows: TableRow[] = []
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

function extractTablesFromHtml(doc: Document): {
  tables: TableRow[][]
  bodyHtml: string
} {
  const tables: TableRow[][] = []
  const tableElements = Array.from(doc.querySelectorAll('table'))
  tableElements.forEach((tableEl) => {
    const rows = parseTableElement(tableEl)
    if (rows.length > 0) {
      const index = tables.length
      tables.push(rows)
      const placeholder = doc.createElement('div')
      placeholder.setAttribute(SANITY_TABLE_PLACEHOLDER, String(index))
      placeholder.textContent = ' '
      tableEl.parentNode?.replaceChild(placeholder, tableEl)
    }
  })
  const body = doc.body
  return { tables, bodyHtml: body ? body.innerHTML : '' }
}

export type PortableTextBlock = Array<{
  _type: string
  _key?: string
  [key: string]: unknown
}>

export function markdownToPortableText(
  markdown: string,
  parseHtml: (html: string) => Document
): PortableTextBlock {
  const html = marked.parse(markdown, { async: false, gfm: true }) as string
  const doc = parseHtml(html.startsWith('<') ? html : `<body>${html}</body>`)
  if (!doc.body && doc.documentElement) {
    const body = doc.createElement('body')
    body.innerHTML = html
    doc.documentElement.appendChild(body)
  }

  const { tables: extractedTables } = extractTablesFromHtml(doc)

  const rules = [
    {
      deserialize(
        el: unknown,
        _next: (elements: unknown) => unknown[],
        block: (props: Record<string, unknown>) => unknown
      ) {
        const node = el as Element
        const tableIndex = node.getAttribute?.(SANITY_TABLE_PLACEHOLDER)
        if (tableIndex != null && extractedTables[parseInt(tableIndex, 10)]) {
          const rows = extractedTables[parseInt(tableIndex, 10)]
          return block({ _type: 'tableBlock', rows })
        }
        return undefined
      },
    },
  ]

  const htmlForBlocks = doc.body ? doc.body.innerHTML : ''
  const blocks = htmlToBlocks(htmlForBlocks, portableTextSchema as never, {
    parseHtml: (htmlString: string) =>
      parseHtml(htmlString.startsWith('<') ? htmlString : `<body>${htmlString}</body>`),
    rules: rules as never,
  }) as PortableTextBlock

  return blocks.map((b, i) => ({
    ...b,
    _key: (b._key as string) || `block-${i}-${Date.now()}`,
  }))
}
