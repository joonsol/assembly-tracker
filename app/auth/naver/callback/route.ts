import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = request.cookies.get('naver_oauth_state')?.value

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`)
  }

  // 네이버 액세스 토큰 발급
  const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NAVER_CLIENT_ID!,
      client_secret: process.env.NAVER_CLIENT_SECRET!,
      code,
      state,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/naver/callback`,
    }),
  })
  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${origin}/login?error=token_failed`)
  }

  // 네이버 사용자 정보 조회
  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await profileRes.json()
  const naverUser = profileData.response

  if (!naverUser?.id) {
    return NextResponse.redirect(`${origin}/login?error=profile_failed`)
  }

  const email = naverUser.email ?? `${naverUser.id}@naver.provider`

  // Supabase 사용자 생성 또는 조회
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: naverUser.name ?? naverUser.nickname ?? '',
      provider: 'naver',
      naver_id: naverUser.id,
      avatar_url: naverUser.profile_image ?? '',
    },
  })

  if (createError && !createError.message.includes('already been registered')) {
    return NextResponse.redirect(`${origin}/login?error=user_creation_failed`)
  }

  // 매직링크로 세션 생성
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(`${origin}/login?error=session_failed`)
  }

  const response = NextResponse.redirect(linkData.properties.action_link)
  response.cookies.delete('naver_oauth_state')
  return response
}
