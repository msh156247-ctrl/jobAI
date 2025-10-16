/**
 * Rate Limiting 미들웨어
 * API 과도한 요청 방어
 */

interface RateLimitConfig {
  windowMs: number // 시간 윈도우 (밀리초)
  maxRequests: number // 최대 요청 수
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

export class RateLimiter {
  private static instances = new Map<string, RateLimiter>()
  private requests = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  private constructor(config: RateLimitConfig) {
    this.config = config
    // 주기적으로 오래된 항목 정리 (1분마다)
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Rate Limiter 인스턴스 가져오기
   */
  static getInstance(key: string, config: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(key, new RateLimiter(config))
    }
    return RateLimiter.instances.get(key)!
  }

  /**
   * 요청 제한 체크
   */
  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    // 첫 요청이거나 윈도우가 리셋된 경우
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      this.requests.set(identifier, newEntry)

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime
      }
    }

    // 요청 수 증가
    entry.count++

    // 제한 초과 체크
    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * 오래된 항목 정리
   */
  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    this.requests.forEach((entry, key) => {
      if (now > entry.resetTime) {
        toDelete.push(key)
      }
    })

    toDelete.forEach(key => this.requests.delete(key))
  }

  /**
   * 특정 식별자의 제한 초기화
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

/**
 * 사전 정의된 Rate Limit 설정
 */
export const RateLimitPresets = {
  // API 호출: 1분당 60회
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60
  },
  // 로그인: 5분당 5회
  login: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5
  },
  // 회원가입: 1시간당 3회
  signup: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3
  },
  // 파일 업로드: 1분당 10회
  upload: {
    windowMs: 60 * 1000,
    maxRequests: 10
  },
  // 검색: 1분당 30회
  search: {
    windowMs: 60 * 1000,
    maxRequests: 30
  },
  // 지원서 제출: 1시간당 10회
  application: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10
  }
}

/**
 * 클라이언트 측 Rate Limiter 래퍼
 */
export class ClientRateLimiter {
  /**
   * API 호출 Rate Limit 체크
   */
  static async checkApiLimit(endpoint: string, userId?: string): Promise<boolean> {
    const identifier = userId || 'anonymous'
    const key = `api:${endpoint}`
    const limiter = RateLimiter.getInstance(key, RateLimitPresets.api)
    const result = limiter.checkLimit(identifier)

    if (!result.allowed) {
      const resetDate = new Date(result.resetTime)
      const seconds = Math.ceil((result.resetTime - Date.now()) / 1000)
      console.warn(`Rate limit exceeded for ${endpoint}. Resets in ${seconds}s`)
    }

    return result.allowed
  }

  /**
   * 로그인 Rate Limit 체크
   */
  static checkLoginLimit(email: string): boolean {
    const limiter = RateLimiter.getInstance('login', RateLimitPresets.login)
    const result = limiter.checkLimit(email)

    if (!result.allowed) {
      const seconds = Math.ceil((result.resetTime - Date.now()) / 1000)
      throw new Error(`로그인 시도 횟수를 초과했습니다. ${Math.ceil(seconds / 60)}분 후에 다시 시도해주세요.`)
    }

    return result.allowed
  }

  /**
   * 회원가입 Rate Limit 체크
   */
  static checkSignupLimit(identifier: string): boolean {
    const limiter = RateLimiter.getInstance('signup', RateLimitPresets.signup)
    const result = limiter.checkLimit(identifier)

    if (!result.allowed) {
      const seconds = Math.ceil((result.resetTime - Date.now()) / 1000)
      throw new Error(`회원가입 시도 횟수를 초과했습니다. ${Math.ceil(seconds / 60)}분 후에 다시 시도해주세요.`)
    }

    return result.allowed
  }

  /**
   * 파일 업로드 Rate Limit 체크
   */
  static checkUploadLimit(userId: string): boolean {
    const limiter = RateLimiter.getInstance('upload', RateLimitPresets.upload)
    const result = limiter.checkLimit(userId)

    if (!result.allowed) {
      throw new Error('파일 업로드 횟수를 초과했습니다. 잠시 후에 다시 시도해주세요.')
    }

    return result.allowed
  }
}
