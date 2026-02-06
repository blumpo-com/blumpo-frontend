// Querying with "sanityFetch" keeps content updated when SanityLive is mounted.
// When draft mode is on (e.g. preview from Studio), serverToken allows fetching drafts.
// https://github.com/sanity-io/next-sanity#live-content-api
import { defineLive } from 'next-sanity/live'
import { client } from './client'

const serverToken =
  process.env.SANITY_API_READ_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: serverToken ?? false,
  // Only use preview from Studio Presentation Tool; no stand-alone draft preview in browser.
  browserToken: false,
})
