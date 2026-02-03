export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-03'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
if (!rawProjectId?.trim()) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID')
}
const trimmed = rawProjectId.trim().toLowerCase()
if (!/^[a-z0-9-]+$/.test(trimmed)) {
  throw new Error(
    'NEXT_PUBLIC_SANITY_PROJECT_ID must contain only a-z, 0-9 and dashes. Check env on Vercel.'
  )
}
export const projectId = trimmed

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
