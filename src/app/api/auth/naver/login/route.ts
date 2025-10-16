import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/naver/callback`
  const state = Math.random().toString(36).substring(7)

  if (!clientId) {
    return NextResponse.json(
      { error: '네이버 클라이언트 ID가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  // 네이버 OAuth 인증 URL
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

  // state를 쿠키에 저장 (CSRF 방지)
  const response = NextResponse.redirect(naverAuthUrl)
  response.cookies.set('naver_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10분
    path: '/',
  })

  return response
}
