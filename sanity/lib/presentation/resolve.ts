import { defineDocuments, defineLocations } from 'sanity/presentation'

/** Maps post documents to frontend blog routes for the Presentation tool. */
export const locations = {
  post: defineLocations({
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    resolve: (doc) => ({
      locations: [
        { title: doc?.title || 'Untitled', href: `/blog/${doc?.slug ?? ''}` },
        { title: 'Blog', href: '/blog' },
      ],
    }),
  }),
}

/** Tells Presentation which document to open when the iframe navigates to /blog/:slug. */
export const mainDocuments = defineDocuments([
  {
    route: '/blog/:slug',
    filter: `_type == "post" && slug.current == $slug`,
  },
])
