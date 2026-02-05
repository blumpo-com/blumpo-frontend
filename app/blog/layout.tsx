import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { SanityLive } from '@/sanity/lib/live'
import { ExitPreview } from '@/components/exit-preview'

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isEnabled } = await draftMode()
  return (
    <>
      {children}
      {isEnabled && (
        <>
          <SanityLive />
          <VisualEditing />
          <ExitPreview />
        </>
      )}
    </>
  )
}
