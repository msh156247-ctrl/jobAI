/**
 * 소셜 로그인 팝업 유틸리티
 * 구글, 카카오, 네이버 로그인을 팝업 창으로 처리
 */

interface PopupOptions {
  width?: number
  height?: number
}

/**
 * 팝업 창 열기
 */
export function openPopup(url: string, title: string, options: PopupOptions = {}): Window | null {
  const width = options.width || 500
  const height = options.height || 600

  // 화면 중앙에 팝업 위치 계산
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2

  const popup = window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
  )

  // 팝업이 차단되었는지 확인
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
    return null
  }

  // 팝업 포커스
  popup.focus()

  return popup
}

/**
 * 소셜 로그인 팝업 처리
 */
export function handleSocialLoginPopup(
  provider: 'google' | 'kakao' | 'naver',
  onSuccess?: () => void,
  onError?: (error: string) => void,
  onCancel?: () => void
): void {
  let authUrl: string
  let popupTitle: string

  // Provider별 URL 설정
  if (provider === 'naver') {
    authUrl = '/api/auth/naver/login'
    popupTitle = '네이버 로그인'
  } else {
    // 구글, 카카오는 Supabase OAuth 사용
    authUrl = `/auth/${provider}/login`
    popupTitle = provider === 'google' ? '구글 로그인' : '카카오 로그인'
  }

  // 팝업 열기
  const popup = openPopup(authUrl, popupTitle, {
    width: 500,
    height: 600,
  })

  if (!popup) {
    onError?.('팝업이 차단되었습니다.')
    return
  }

  // 팝업 창 모니터링
  const checkPopup = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(checkPopup)

      // localStorage에서 로그인 성공 여부 확인
      const loginSuccess = localStorage.getItem('social_login_success')
      const loginError = localStorage.getItem('social_login_error')

      if (loginSuccess === 'true') {
        localStorage.removeItem('social_login_success')
        onSuccess?.()
        // 페이지 새로고침하여 세션 업데이트
        window.location.reload()
      } else if (loginError) {
        localStorage.removeItem('social_login_error')
        onError?.(loginError)
      } else {
        // 사용자가 팝업을 그냥 닫은 경우 - 조용히 종료 (에러 메시지 없음)
        onCancel?.()
      }
    }
  }, 500)

  // 10분 후 타임아웃
  setTimeout(() => {
    clearInterval(checkPopup)
    if (popup && !popup.closed) {
      popup.close()
      onError?.('로그인 시간이 초과되었습니다.')
    }
  }, 600000) // 10분
}

/**
 * 팝업에서 부모 창으로 로그인 성공 알림
 */
export function notifyLoginSuccess(): void {
  if (window.opener) {
    localStorage.setItem('social_login_success', 'true')
    window.close()
  }
}

/**
 * 팝업에서 부모 창으로 로그인 실패 알림
 */
export function notifyLoginError(error: string): void {
  if (window.opener) {
    localStorage.setItem('social_login_error', error)
    window.close()
  }
}
