// 유효성 검증 유틸리티

// 이메일 유효성 검증
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 전화번호 유효성 검증 (한국 번호)
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/
  return phoneRegex.test(phone)
}

// 비밀번호 유효성 검증 (최소 8자, 영문+숫자 조합)
export function validatePassword(password: string): {
  valid: boolean
  message?: string
} {
  if (password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '비밀번호는 영문을 포함해야 합니다.' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '비밀번호는 숫자를 포함해야 합니다.' }
  }
  return { valid: true }
}

// 사업자 번호 유효성 검증
export function validateBusinessNumber(number: string): boolean {
  const cleaned = number.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) return false

  const digits = cleaned.split('').map(Number)
  const checksum = [1, 3, 7, 1, 3, 7, 1, 3, 5]

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * checksum[i]
  }

  sum += Math.floor((digits[8] * 5) / 10)
  const result = (10 - (sum % 10)) % 10

  return result === digits[9]
}

// URL 유효성 검증
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 필수 입력 필드 검증
export function validateRequired(value: string | null | undefined, fieldName: string): {
  valid: boolean
  message?: string
} {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName}은(는) 필수 입력 항목입니다.` }
  }
  return { valid: true }
}

// 숫자 범위 검증
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number,
  fieldName?: string
): {
  valid: boolean
  message?: string
} {
  if (min !== undefined && value < min) {
    return {
      valid: false,
      message: `${fieldName || '값'}은(는) ${min} 이상이어야 합니다.`
    }
  }
  if (max !== undefined && value > max) {
    return {
      valid: false,
      message: `${fieldName || '값'}은(는) ${max} 이하여야 합니다.`
    }
  }
  return { valid: true }
}

// 날짜 유효성 검증 (시작일이 종료일보다 이전인지)
export function validateDateRange(startDate: string, endDate: string): {
  valid: boolean
  message?: string
} {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return {
      valid: false,
      message: '시작일은 종료일보다 이전이어야 합니다.'
    }
  }
  return { valid: true }
}

// 파일 크기 검증 (MB 단위)
export function validateFileSize(file: File, maxSizeMB: number): {
  valid: boolean
  message?: string
} {
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      message: `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다. (현재: ${sizeMB.toFixed(2)}MB)`
    }
  }
  return { valid: true }
}

// 파일 확장자 검증
export function validateFileExtension(file: File, allowedExtensions: string[]): {
  valid: boolean
  message?: string
} {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      message: `허용된 파일 형식: ${allowedExtensions.join(', ')}`
    }
  }
  return { valid: true }
}
