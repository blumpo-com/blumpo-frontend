'use client'

import React, { useState, useCallback } from 'react'
import {
  Box,
  Stack,
  Button,
  Dialog,
  TextArea,
  Label,
  Flex,
} from '@sanity/ui'
import { CopyIcon } from '@sanity/icons'
import { set, PatchEvent } from 'sanity'
import { markdownToPortableText } from '../lib/markdownToPortableText'

type Block = { _type: string; _key?: string; [key: string]: unknown }

type Props = {
  value?: Block[] | null
  onChange?: (event: PatchEvent) => void
  renderDefault?: (props: Props) => React.ReactElement
  [key: string]: unknown
}

export function MarkdownImportInput(props: Props) {
  const { value, onChange, renderDefault } = props
  const handleChange = onChange || (() => {})
  const render = renderDefault || (() => null as unknown as React.ReactElement)
  const [open, setOpen] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [mode, setMode] = useState<'replace' | 'append'>('replace')

  const handleConvert = useCallback(() => {
    const text = markdown.trim()
    if (!text) return
    try {
      const doc = (html: string) => {
        const parser = new DOMParser()
        return parser.parseFromString(
          html.startsWith('<') ? html : `<body>${html}</body>`,
          'text/html'
        )
      }
      const blocks = markdownToPortableText(text, doc)
      const newValue = mode === 'replace' ? blocks : [...(value || []), ...blocks]
      handleChange(PatchEvent.from(set(newValue, [])))
      setMarkdown('')
      setOpen(false)
    } catch (err) {
      console.error('Markdown import failed:', err)
    }
  }, [markdown, mode, value, onChange])

  return (
    <Stack space={3}>
      <Flex gap={2} align="center" wrap="wrap">
        <Button
          icon={CopyIcon}
          text="Import markdown"
          mode="ghost"
          tone="primary"
          onClick={() => setOpen(true)}
        />
      </Flex>
      <Box>
        {render(props)}
      </Box>
      {open && (
        <Dialog
          header="Import markdown"
          id="markdown-import-dialog"
          onClose={() => setOpen(false)}
          width={1}
          zOffset={1000}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Label>Paste markdown (headings, lists, tables, **bold**, *italic*, links)</Label>
              <TextArea
                rows={12}
                value={markdown}
                onChange={(e) => setMarkdown(e.currentTarget.value)}
                placeholder={`## Heading\n\nParagraph with **bold** and *italic*.\n\n| Col A | Col B |\n|-------|-------|\n| a     | b     |`}
              />
              <Flex gap={2} align="center">
                <Label>Mode:</Label>
                <Button
                  text="Replace body"
                  mode={mode === 'replace' ? 'default' : 'ghost'}
                  tone="primary"
                  onClick={() => setMode('replace')}
                />
                <Button
                  text="Append to body"
                  mode={mode === 'append' ? 'default' : 'ghost'}
                  tone="primary"
                  onClick={() => setMode('append')}
                />
              </Flex>
              <Flex gap={2} justify="flex-end">
                <Button text="Cancel" mode="ghost" onClick={() => setOpen(false)} />
                <Button text="Convert" tone="primary" onClick={handleConvert} />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
