'use client'

/**
 * Renders a link that exits draft mode by calling the disable route.
 * Only show this when draft mode is enabled (e.g. in blog layout).
 * Used so the Sanity Presentation tool preview can exit back to published content.
 */
export function ExitPreview() {
  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-lg hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
    >
      Exit preview
    </a>
  )
}
