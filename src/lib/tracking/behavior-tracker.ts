/**
 * 사용자 행동 추적 시스템
 * 페이지 조회, 지원, 저장 등의 행동을 추적하여 추천 시스템에 활용
 */

interface TrackingEvent {
  userId: string
  eventType: 'page_view' | 'job_view' | 'job_apply' | 'job_save' | 'job_reject' | 'search' | 'filter'
  targetId?: string // jobId, companyId, etc.
  metadata?: Record<string, any>
  timestamp: number
  sessionId: string
}

interface Session {
  id: string
  userId?: string
  startTime: number
  lastActivityTime: number
  events: TrackingEvent[]
}

/**
 * 행동 추적 클래스
 */
export class BehaviorTracker {
  private static instance: BehaviorTracker
  private currentSession: Session | null = null
  private sessionTimeout = 30 * 60 * 1000 // 30분

  private constructor() {
    // 싱글톤 패턴
    this.initializeSession()
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): BehaviorTracker {
    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker()
    }
    return BehaviorTracker.instance
  }

  /**
   * 세션 초기화
   */
  private initializeSession(): void {
    // LocalStorage에서 기존 세션 복원 시도
    try {
      const stored = localStorage.getItem('tracking_session')
      if (stored) {
        const session: Session = JSON.parse(stored)
        const now = Date.now()

        // 세션이 아직 유효한지 확인
        if (now - session.lastActivityTime < this.sessionTimeout) {
          this.currentSession = session
          this.currentSession.lastActivityTime = now
          return
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error)
    }

    // 새 세션 생성
    this.createNewSession()
  }

  /**
   * 새 세션 생성
   */
  private createNewSession(): void {
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      events: [],
    }
    this.saveSession()
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 세션 저장
   */
  private saveSession(): void {
    if (!this.currentSession) return

    try {
      // 최근 100개 이벤트만 저장 (용량 제한)
      const sessionToSave = {
        ...this.currentSession,
        events: this.currentSession.events.slice(-100),
      }
      localStorage.setItem('tracking_session', JSON.stringify(sessionToSave))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * 사용자 ID 설정 (로그인 시)
   */
  setUserId(userId: string): void {
    if (this.currentSession) {
      this.currentSession.userId = userId
      this.saveSession()
    }
  }

  /**
   * 이벤트 추적
   */
  track(
    eventType: TrackingEvent['eventType'],
    targetId?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.currentSession) {
      this.initializeSession()
    }

    const now = Date.now()

    // 세션 타임아웃 확인
    if (this.currentSession && now - this.currentSession.lastActivityTime > this.sessionTimeout) {
      this.createNewSession()
    }

    const event: TrackingEvent = {
      userId: this.currentSession!.userId || 'anonymous',
      eventType,
      targetId,
      metadata,
      timestamp: now,
      sessionId: this.currentSession!.id,
    }

    this.currentSession!.events.push(event)
    this.currentSession!.lastActivityTime = now
    this.saveSession()

    // 이벤트 로그 (디버깅용)
    if (process.env.NODE_ENV === 'development') {
      console.log('[BehaviorTracker]', event)
    }
  }

  /**
   * 페이지 조회 추적
   */
  trackPageView(page: string): void {
    this.track('page_view', undefined, { page })
  }

  /**
   * 공고 조회 추적
   */
  trackJobView(jobId: string, jobTitle?: string, company?: string): void {
    this.track('job_view', jobId, { jobTitle, company })
  }

  /**
   * 공고 지원 추적
   */
  trackJobApply(jobId: string, jobTitle?: string): void {
    this.track('job_apply', jobId, { jobTitle })
  }

  /**
   * 공고 저장 추적
   */
  trackJobSave(jobId: string, jobTitle?: string): void {
    this.track('job_save', jobId, { jobTitle })
  }

  /**
   * 공고 거부 추적 (관심 없음)
   */
  trackJobReject(jobId: string, reason?: string): void {
    this.track('job_reject', jobId, { reason })
  }

  /**
   * 검색 추적
   */
  trackSearch(query: string, filters?: Record<string, any>): void {
    this.track('search', undefined, { query, filters })
  }

  /**
   * 필터 적용 추적
   */
  trackFilter(filters: Record<string, any>): void {
    this.track('filter', undefined, { filters })
  }

  /**
   * 세션 통계 조회
   */
  getSessionStats(): {
    sessionId: string
    duration: number
    eventCount: number
    jobViews: number
    jobApplies: number
    searches: number
  } | null {
    if (!this.currentSession) return null

    const duration = Date.now() - this.currentSession.startTime
    const events = this.currentSession.events

    return {
      sessionId: this.currentSession.id,
      duration,
      eventCount: events.length,
      jobViews: events.filter((e) => e.eventType === 'job_view').length,
      jobApplies: events.filter((e) => e.eventType === 'job_apply').length,
      searches: events.filter((e) => e.eventType === 'search').length,
    }
  }

  /**
   * 사용자의 최근 관심 공고 조회
   */
  getRecentInterests(limit: number = 10): string[] {
    if (!this.currentSession) return []

    const interestEvents = this.currentSession.events.filter(
      (e) =>
        (e.eventType === 'job_view' ||
          e.eventType === 'job_save' ||
          e.eventType === 'job_apply') &&
        e.targetId
    )

    // 최근순으로 정렬
    interestEvents.sort((a, b) => b.timestamp - a.timestamp)

    // 중복 제거 및 제한
    const uniqueJobIds = Array.from(new Set(interestEvents.map((e) => e.targetId!)))
    return uniqueJobIds.slice(0, limit)
  }

  /**
   * 사용자가 거부한 공고 목록
   */
  getRejectedJobs(): string[] {
    if (!this.currentSession) return []

    return this.currentSession.events
      .filter((e) => e.eventType === 'job_reject' && e.targetId)
      .map((e) => e.targetId!)
  }

  /**
   * 전체 이벤트 데이터 내보내기 (분석용)
   */
  exportEvents(): TrackingEvent[] {
    if (!this.currentSession) return []
    return [...this.currentSession.events]
  }

  /**
   * 세션 초기화 (로그아웃 시)
   */
  clearSession(): void {
    this.currentSession = null
    try {
      localStorage.removeItem('tracking_session')
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  }
}

/**
 * 편의 함수들
 */
export const trackPageView = (page: string) => {
  BehaviorTracker.getInstance().trackPageView(page)
}

export const trackJobView = (jobId: string, jobTitle?: string, company?: string) => {
  BehaviorTracker.getInstance().trackJobView(jobId, jobTitle, company)
}

export const trackJobApply = (jobId: string, jobTitle?: string) => {
  BehaviorTracker.getInstance().trackJobApply(jobId, jobTitle)
}

export const trackJobSave = (jobId: string, jobTitle?: string) => {
  BehaviorTracker.getInstance().trackJobSave(jobId, jobTitle)
}

export const trackJobReject = (jobId: string, reason?: string) => {
  BehaviorTracker.getInstance().trackJobReject(jobId, reason)
}

export const trackSearch = (query: string, filters?: Record<string, any>) => {
  BehaviorTracker.getInstance().trackSearch(query, filters)
}

export const trackFilter = (filters: Record<string, any>) => {
  BehaviorTracker.getInstance().trackFilter(filters)
}
