import { defineType, defineArrayMember } from 'sanity'
import { DocumentSheetIcon } from '@sanity/icons'

/**
 * One row of a table: an array of cell strings.
 * Wrapped as an object so it can be used inside block content (arrays can't be stored directly in Portable Text).
 */
export const tableRowType = defineType({
  name: 'tableRow',
  type: 'object',
  title: 'Table row',
  fields: [
    {
      name: 'cells',
      type: 'array',
      title: 'Cells',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
    },
  ],
  preview: {
    select: { cells: 'cells' },
    prepare({ cells }: { cells?: string[] }) {
      const text = Array.isArray(cells) ? cells.join(' | ') : ''
      return { title: text || 'Empty row', subtitle: 'Table row' }
    },
  },
})

/**
 * Table block for Portable Text. Insert between paragraphs in block content.
 * See: https://www.sanity.io/docs/studio/portable-text-editor-configuration#dde2a7a4c661
 */
export const tableBlockType = defineType({
  name: 'tableBlock',
  type: 'object',
  title: 'Table',
  icon: DocumentSheetIcon,
  fields: [
    {
      name: 'rows',
      type: 'array',
      title: 'Rows',
      of: [defineArrayMember({ type: 'tableRow' })],
      validation: (Rule) => Rule.required().min(1),
    },
  ],
  preview: {
    select: { rows: 'rows' },
    prepare({ rows }: { rows?: { cells?: string[] }[] }) {
      const count = Array.isArray(rows) ? rows.length : 0
      const firstRow = Array.isArray(rows) && rows[0]?.cells ? rows[0].cells.join(' | ') : ''
      return { title: firstRow || 'Table', subtitle: `${count} row(s)` }
    },
  },
})
