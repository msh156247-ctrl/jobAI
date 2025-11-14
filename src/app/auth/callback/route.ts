import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * OAuth Callback Route Handler
 *
 * This route handles the OAuth callback after users authenticate
 * with social providers (Google, GitHub, etc.)
 *
 * Flow:
 * 1. User clicks "Sign in with Google/GitHub"
 * 2. User authenticates with provider
 * 3. Provider redirects to this route with auth code
 * 4. Exchange code for session
 * 5. Redirect user to dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    )
  }

  // Exchange code for session
  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        throw exchangeError
      }

      if (data.session) {
        // Successful authentication
        console.log('User authenticated:', data.user?.email)

        // Redirect to dashboard or intended destination
        const next = requestUrl.searchParams.get('next') || '/dashboard'
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      }
    } catch (err: any) {
      console.error('Error exchanging code for session:', err)
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다.')}`,
          requestUrl.origin
        )
      )
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
