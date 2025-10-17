'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function PopupCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      // 에러 발생 시 부모 창에 알림
      if (window.opener) {
        localStorage.setItem('social_login_error', errorDescription || error)
        window.close()
      }
    } else {
      // 성공 시 부모 창에 알림
      if (window.opener) {
        localStorage.setItem('social_login_success', 'true')
        window.close()
      } else {
        // 팝업이 아닌 경우 메인 페이지로 리다이렉트
        window.location.href = '/'
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function PopupCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <PopupCallbackContent />
    </Suspense>
  )
}
