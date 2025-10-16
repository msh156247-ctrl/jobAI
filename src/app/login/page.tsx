'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { ClientRateLimiter } from '@/lib/security/rate-limiter'
import { InputValidator } from '@/lib/security/input-validator'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 이메일 유효성 검증
      const emailValidation = InputValidator.validateEmail(email)
      if (!emailValidation.valid) {
        setError(emailValidation.message || '올바른 이메일을 입력해주세요.')
        setLoading(false)
        return
      }

      // Rate limiting 체크
      try {
        ClientRateLimiter.checkLoginLimit(email)
      } catch (rateLimitError) {
        setError(rateLimitError instanceof Error ? rateLimitError.message : '로그인 시도 횟수를 초과했습니다.')
        setLoading(false)
        return
      }

      await signIn(email, password)
      refreshUser()

      // next 파라미터가 있으면 해당 페이지로, 없으면 홈으로
      const next = searchParams.get('next')
      router.push(next || '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 animate-fade-in-up">
        <div className="animate-fade-in">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            JobAI에 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{' '}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              새 계정 만들기
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 focus:scale-[1.01]"
                placeholder="이메일 주소"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 focus:scale-[1.01]"
                placeholder="비밀번호"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded animate-shake">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Kakao
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Naver
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}