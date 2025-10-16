/**
 * 비밀번호 유효성 검증 유틸리티
 */

export interface PasswordValidationResult {
  valid: boolean
  strength: 'weak' | 'medium' | 'strong'
  errors: string[]
  suggestions: string[]
}

/**
 * 비밀번호 강도를 검증하고 결과를 반환합니다
 *
 * @param password - 검증할 비밀번호
 * @returns 검증 결과
 *
 * 규칙:
 * - 최소 8자 이상
 * - 영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합
 * - 연속된 문자 3개 이상 금지 (예: abc, 123)
 * - 동일한 문자 3개 이상 연속 금지 (예: aaa, 111)
 * - 일반적인 비밀번호 패턴 금지 (password, 12345678 등)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  const suggestions: string[] = []
  let score = 0

  // 1. 길이 검증
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다')
  } else if (password.length >= 8) {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  // 2. 문자 타입 검증
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const charTypeCount = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length

  if (charTypeCount < 3) {
    errors.push('영문 대소문자, 숫자, 특수문자 중 3가지 이상을 조합해주세요')
    suggestions.push('대문자, 소문자, 숫자, 특수문자를 섞어 사용하세요')
  } else {
    score += charTypeCount
  }

  // 3. 연속된 문자 검증 (abc, 123 등)
  if (hasConsecutiveChars(password)) {
    errors.push('연속된 문자(abc, 123 등)를 사용할 수 없습니다')
    suggestions.push('연속된 문자 대신 무작위 조합을 사용하세요')
    score -= 1
  }

  // 4. 반복 문자 검증 (aaa, 111 등)
  if (hasRepeatedChars(password)) {
    errors.push('동일한 문자를 3번 이상 연속으로 사용할 수 없습니다')
    suggestions.push('다양한 문자를 사용하세요')
    score -= 1
  }

  // 5. 일반적인 비밀번호 패턴 검증
  const commonPasswords = [
    'password', 'password1', 'password123',
    '12345678', '123456789', '1234567890',
    'qwerty', 'qwerty123', 'abc123',
    'admin', 'admin123', 'welcome'
  ]

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('일반적인 비밀번호 패턴은 사용할 수 없습니다')
    suggestions.push('예측하기 어려운 고유한 비밀번호를 만드세요')
    score -= 2
  }

  // 강도 계산
  let strength: 'weak' | 'medium' | 'strong'
  if (score >= 5) {
    strength = 'strong'
  } else if (score >= 3) {
    strength = 'medium'
  } else {
    strength = 'weak'
  }

  // 추가 제안사항
  if (strength !== 'strong') {
    if (password.length < 12) {
      suggestions.push('12자 이상으로 만들면 더 안전합니다')
    }
    if (!hasSpecialChar) {
      suggestions.push('특수문자(!@#$%^&* 등)를 추가하세요')
    }
    if (!hasUpperCase) {
      suggestions.push('대문자를 추가하세요')
    }
  }

  return {
    valid: errors.length === 0,
    strength,
    errors,
    suggestions: suggestions.slice(0, 3) // 최대 3개까지만
  }
}

/**
 * 연속된 문자가 있는지 검증
 * 예: abc, 123, xyz 등
 */
function hasConsecutiveChars(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i)
    const char2 = password.charCodeAt(i + 1)
    const char3 = password.charCodeAt(i + 2)

    // 연속된 숫자 또는 알파벳
    if (char2 === char1 + 1 && char3 === char2 + 1) {
      return true
    }
  }
  return false
}

/**
 * 반복된 문자가 있는지 검증
 * 예: aaa, 111 등
 */
function hasRepeatedChars(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true
    }
  }
  return false
}

/**
 * 비밀번호 강도를 색상으로 반환
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): {
  bg: string
  text: string
  label: string
} {
  switch (strength) {
    case 'strong':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: '강함'
      }
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: '보통'
      }
    case 'weak':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: '약함'
      }
  }
}
