import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.NAVER_CLIENT_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/naver/callback`
  const state = Math.random().toString(36).slice(2)

  const url = new URL('https://nid.naver.com/oauth2.0/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)

  const response = NextResponse.redirect(url.toString())
  response.cookies.set('naver_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })
  return response
}
