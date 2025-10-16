/**
 * 환경 변수 검증 및 보안 체크
 */

export class EnvValidator {
  private static instance: EnvValidator
  private validated = false

  private constructor() {}

  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator()
    }
    return EnvValidator.instance
  }

  /**
   * 필수 환경 변수 검증
   */
  validate(): void {
    if (this.validated) return

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    const missing: string[] = []
    const invalid: string[] = []

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar]

      if (!value) {
        missing.push(envVar)
      } else {
        // URL 검증
        if (envVar.includes('URL')) {
          try {
            new URL(value)
          } catch {
            invalid.push(`${envVar} (invalid URL format)`)
          }
        }

        // 키 길이 검증 (최소 32자)
        if (envVar.includes('KEY') && value.length < 32) {
          invalid.push(`${envVar} (key too short, minimum 32 characters)`)
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file.'
      )
    }

    if (invalid.length > 0) {
      throw new Error(
        `Invalid environment variables: ${invalid.join(', ')}\n` +
        'Please check the format of your environment variables.'
      )
    }

    this.validated = true
  }

  /**
   * 개발 환경에서만 실행되는 보안 경고
   */
  checkDevelopmentSecurity(): void {
    if (process.env.NODE_ENV === 'production') return

    const warnings: string[] = []

    // Supabase URL이 localhost인 경우 경고
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl?.includes('localhost')) {
      warnings.push('⚠️  Using localhost Supabase URL in development')
    }

    // API 키가 기본값인 경우 경고
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anonKey && anonKey.length < 100) {
      warnings.push('⚠️  Supabase anon key seems too short - is it a real key?')
    }

    if (warnings.length > 0) {
      console.warn('\n🔒 Security Warnings:\n' + warnings.join('\n'))
    }
  }

  /**
   * API 키 마스킹 (로그용)
   */
  static maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***'
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
  }
}

// 앱 시작 시 자동 검증
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  try {
    const validator = EnvValidator.getInstance()
    validator.validate()
    validator.checkDevelopmentSecurity()
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    throw error
  }
}
