/**
 * 입력 검증 및 Sanitization 유틸리티
 */

export class InputValidator {
  /**
   * XSS 방어를 위한 HTML 이스케이프
   */
  static sanitizeHtml(input: string): string {
    if (!input) return ''

    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }

    return input.replace(/[&<>"'/]/g, (char) => map[char] || char)
  }

  /**
   * SQL Injection 방어를 위한 문자열 검증
   */
  static sanitizeSql(input: string): string {
    if (!input) return ''

    // 위험한 SQL 키워드 제거
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|\*|;|\/\*|\*\/)/g,
      /(\bOR\b.*=.*)/gi,
      /(\bAND\b.*=.*)/gi,
    ]

    let sanitized = input
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })

    return sanitized.trim()
  }

  /**
   * 이메일 검증
   */
  static validateEmail(email: string): { valid: boolean; message?: string } {
    if (!email) {
      return { valid: false, message: '이메일을 입력해주세요.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { valid: false, message: '올바른 이메일 형식이 아닙니다.' }
    }

    // 이메일 길이 제한 (최대 254자)
    if (email.length > 254) {
      return { valid: false, message: '이메일이 너무 깁니다.' }
    }

    return { valid: true }
  }

  /**
   * 비밀번호 강도 검증
   */
  static validatePassword(password: string): { valid: boolean; message?: string; strength?: 'weak' | 'medium' | 'strong' } {
    if (!password) {
      return { valid: false, message: '비밀번호를 입력해주세요.' }
    }

    if (password.length < 8) {
      return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' }
    }

    if (password.length > 128) {
      return { valid: false, message: '비밀번호가 너무 깁니다.' }
    }

    // 강도 계산
    let strength: 'weak' | 'medium' | 'strong' = 'weak'
    let score = 0

    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    if (password.length >= 12) score++

    if (score >= 4) strength = 'strong'
    else if (score >= 3) strength = 'medium'

    // 최소 요구사항: 숫자와 문자 포함
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { valid: false, message: '비밀번호는 영문과 숫자를 포함해야 합니다.', strength }
    }

    return { valid: true, strength }
  }

  /**
   * URL 검증
   */
  static validateUrl(url: string): { valid: boolean; message?: string } {
    if (!url) {
      return { valid: false, message: 'URL을 입력해주세요.' }
    }

    try {
      const parsed = new URL(url)

      // HTTP/HTTPS만 허용
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, message: 'HTTP 또는 HTTPS URL만 허용됩니다.' }
      }

      // localhost 체크 (프로덕션에서)
      if (process.env.NODE_ENV === 'production' &&
          (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
        return { valid: false, message: 'localhost URL은 허용되지 않습니다.' }
      }

      return { valid: true }
    } catch {
      return { valid: false, message: '올바른 URL 형식이 아닙니다.' }
    }
  }

  /**
   * 전화번호 검증 (한국 형식)
   */
  static validatePhone(phone: string): { valid: boolean; message?: string } {
    if (!phone) {
      return { valid: false, message: '전화번호를 입력해주세요.' }
    }

    // 숫자만 추출
    const cleaned = phone.replace(/\D/g, '')

    // 한국 전화번호 형식 (010-1234-5678 또는 02-1234-5678)
    const phoneRegex = /^(01[0-9]|02|0[3-9][0-9])[0-9]{3,4}[0-9]{4}$/

    if (!phoneRegex.test(cleaned)) {
      return { valid: false, message: '올바른 전화번호 형식이 아닙니다.' }
    }

    return { valid: true }
  }

  /**
   * 파일 이름 검증
   */
  static validateFileName(fileName: string): { valid: boolean; message?: string } {
    if (!fileName) {
      return { valid: false, message: '파일 이름을 입력해주세요.' }
    }

    // 위험한 문자 체크
    const dangerousChars = /[<>:"|?*\x00-\x1f]/
    if (dangerousChars.test(fileName)) {
      return { valid: false, message: '파일 이름에 사용할 수 없는 문자가 포함되어 있습니다.' }
    }

    // 파일 이름 길이 제한
    if (fileName.length > 255) {
      return { valid: false, message: '파일 이름이 너무 깁니다.' }
    }

    // 확장자 체크
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx']
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))

    if (!allowedExtensions.includes(ext)) {
      return { valid: false, message: '허용되지 않는 파일 형식입니다.' }
    }

    return { valid: true }
  }

  /**
   * 텍스트 길이 검증
   */
  static validateTextLength(
    text: string,
    minLength: number,
    maxLength: number,
    fieldName: string = '입력'
  ): { valid: boolean; message?: string } {
    if (!text) {
      return { valid: false, message: `${fieldName}을(를) 입력해주세요.` }
    }

    const length = text.trim().length

    if (length < minLength) {
      return { valid: false, message: `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.` }
    }

    if (length > maxLength) {
      return { valid: false, message: `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.` }
    }

    return { valid: true }
  }

  /**
   * 숫자 범위 검증
   */
  static validateNumberRange(
    value: number,
    min: number,
    max: number,
    fieldName: string = '값'
  ): { valid: boolean; message?: string } {
    if (isNaN(value)) {
      return { valid: false, message: `${fieldName}은(는) 숫자여야 합니다.` }
    }

    if (value < min) {
      return { valid: false, message: `${fieldName}은(는) ${min} 이상이어야 합니다.` }
    }

    if (value > max) {
      return { valid: false, message: `${fieldName}은(는) ${max} 이하여야 합니다.` }
    }

    return { valid: true }
  }
}
