/**
 * API 설정 및 환경 변수 관리
 *
 * Mock 데이터와 실제 Supabase API 간 전환을 관리합니다.
 */

// API 사용 여부 (환경 변수로 제어)
export const USE_SUPABASE_API = process.env.NEXT_PUBLIC_USE_API === 'true'

// Supabase 설정
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

// API 상태 확인
export function checkApiConfig() {
  if (!USE_SUPABASE_API) {
    console.info('📦 Mock 데이터 모드로 실행 중입니다.')
    console.info('💡 실제 API를 사용하려면 .env.local에서 NEXT_PUBLIC_USE_API=true로 설정하세요.')
    return { mode: 'mock' as const, configured: true }
  }

  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    console.error('❌ Supabase 설정이 누락되었습니다!')
    console.error('👉 .env.local 파일에서 다음 환경 변수를 설정하세요:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return { mode: 'api' as const, configured: false }
  }

  console.info('🚀 Supabase API 모드로 실행 중입니다.')
  console.info(`📍 URL: ${SUPABASE_CONFIG.url}`)
  return { mode: 'api' as const, configured: true }
}

// 개발 환경에서만 실행
if (process.env.NODE_ENV === 'development') {
  checkApiConfig()
}

/**
 * API 응답 타입 (통일된 응답 형식)
 */
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

/**
 * API 에러 처리 헬퍼
 */
export function handleApiError(error: unknown): ApiResponse<null> {
  if (error instanceof Error) {
    console.error('API Error:', error.message)
    return { data: null, error }
  }

  const unknownError = new Error('알 수 없는 에러가 발생했습니다.')
  console.error('Unknown Error:', error)
  return { data: null, error: unknownError }
}

/**
 * Mock 데이터 응답 래퍼
 */
export function mockResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null }
}
