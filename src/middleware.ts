/**
 * Next.js Middleware for Security Headers
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next()

  // Security Headers
  const headers = response.headers

  // Content Security Policy (CSP)
  // 프로덕션 환경에서는 더 엄격하게 설정해야 함
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.supabase.co https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  headers.set('Content-Security-Policy', cspDirectives)

  // HTTP Strict Transport Security (HSTS)
  // HTTPS를 강제하는 헤더 (프로덕션에서만 활성화)
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // X-Frame-Options: 클릭재킹 공격 방지
  headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: MIME 스니핑 방지
  headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection: 브라우저 내장 XSS 필터 활성화
  headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy: 리퍼러 정보 제어
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: 브라우저 기능 제어
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // FLoC 차단
  ].join(', ')
  headers.set('Permissions-Policy', permissionsPolicy)

  return response
}

// Middleware를 적용할 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 경로에 적용:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
