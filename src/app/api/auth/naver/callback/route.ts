import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // 에러 처리
  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=naver_auth_failed`)
  }

  // 필수 파라미터 확인
  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=invalid_request`)
  }

  // State 검증 (CSRF 방지)
  const savedState = request.cookies.get('naver_oauth_state')?.value
  if (state !== savedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=state_mismatch`)
  }

  try {
    // 네이버 Access Token 요청
    const clientId = process.env.NAVER_CLIENT_ID
    const clientSecret = process.env.NAVER_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/naver/callback`

    console.log('[Naver OAuth] Requesting token with:', { clientId, redirectUri, hasSecret: !!clientSecret })

    const tokenResponse = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&state=${state}`,
      { method: 'GET' }
    )

    const tokenData = await tokenResponse.json()
    console.log('[Naver OAuth] Token response:', tokenData)

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Naver OAuth] Token error:', tokenData)
      throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`)
    }

    // 네이버 사용자 정보 요청
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const userData = await userResponse.json()
    console.log('[Naver OAuth] User data:', userData)

    if (userData.resultcode !== '00') {
      console.error('[Naver OAuth] User info error:', userData)
      throw new Error(`Failed to get user info: ${userData.message}`)
    }

    const { id, email, name, profile_image } = userData.response
    console.log('[Naver OAuth] User info:', { id, email, name })

    // 이메일이 없으면 에러
    if (!email) {
      console.error('[Naver OAuth] Email not provided by Naver')
      throw new Error('네이버에서 이메일 정보를 제공하지 않았습니다. 네이버 개발자센터에서 이메일을 필수 제공 항목으로 설정해주세요.')
    }

    // Supabase에 사용자 생성 또는 로그인
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서비스 롤 키 사용
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 이메일로 기존 사용자 확인
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users.find(u => u.email === email)

    let userId: string

    if (userExists) {
      userId = userExists.id
    } else {
      // 새 사용자 생성
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          name: name,
          avatar_url: profile_image,
          provider: 'naver',
          naver_id: id,
        },
      })

      if (createError || !newUser.user) {
        throw createError || new Error('Failed to create user')
      }

      userId = newUser.user.id
    }

    // 세션 생성
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError) {
      throw sessionError
    }

    // 팝업 콜백 페이지로 리다이렉트
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/popup-callback`)

    const response = NextResponse.redirect(redirectUrl.toString())

    // State 쿠키 삭제
    response.cookies.delete('naver_oauth_state')

    return response

  } catch (error) {
    console.error('[Naver OAuth] Callback error:', error)
    console.error('[Naver OAuth] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=naver_callback_failed`)
  }
}
