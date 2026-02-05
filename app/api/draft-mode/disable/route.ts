import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const draft = await draftMode()
  draft.disable()
  const baseUrl = process.env.BASE_URL ?? new URL(request.url).origin
  return NextResponse.redirect(new URL('/blog', baseUrl))
}
