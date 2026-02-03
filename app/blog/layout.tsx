import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isEnabled } = await draftMode()
  return (
    <>
      {children}
      {isEnabled && <VisualEditing />}
    </>
  )
}
