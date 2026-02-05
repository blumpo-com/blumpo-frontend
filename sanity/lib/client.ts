import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})

const previewToken =
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN

/** Client with draft perspective for Presentation tool preview. Use when draftMode().isEnabled. */
export function getPreviewClient() {
  return client.withConfig({
    perspective: 'previewDrafts',
    useCdn: false,
    ...(previewToken && { token: previewToken }),
  })
}
