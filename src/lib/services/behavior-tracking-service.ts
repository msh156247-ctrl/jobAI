/**
 * Behavior Tracking Service
 * 사용자 행동을 Supabase에 저장하고 관리하는 서비스
 */

import { apolloClient, USE_GRAPHQL } from '@/lib/graphql/client'
import { INSERT_USER_BEHAVIOR, INSERT_SESSION_EVENTS } from '@/lib/graphql/queries/recommendations'
import { BehaviorTracker } from '@/lib/tracking/behavior-tracker'
import { supabase } from '@/lib/supabase'

interface BehaviorEvent {
  userId: string
  jobId?: string
  action: 'job_view' | 'job_apply' | 'job_save' | 'job_reject' | 'search' | 'filter' | 'page_view'
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * 행동 추적 서비스
 */
export class BehaviorTrackingService {
  private static instance: BehaviorTrackingService
  private pendingEvents: BehaviorEvent[] = []
  private syncInterval: NodeJS.Timeout | null = null
  private readonly SYNC_INTERVAL_MS = 30000 // 30초마다 동기화
  private readonly MAX_PENDING_EVENTS = 10 // 최대 10개 쌓이면 즉시 동기화

  private constructor() {
    this.startAutoSync()
  }

  static getInstance(): BehaviorTrackingService {
    if (!BehaviorTrackingService.instance) {
      BehaviorTrackingService.instance = new BehaviorTrackingService()
    }
    return BehaviorTrackingService.instance
  }

  /**
   * 자동 동기화 시작
   */
  private startAutoSync(): void {
    if (typeof window === 'undefined') return // 서버 사이드에서는 실행 안 함

    this.syncInterval = setInterval(() => {
      this.syncPendingEvents()
    }, this.SYNC_INTERVAL_MS)

    // 페이지 종료 시 남은 이벤트 동기화
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.syncPendingEvents()
      })
    }
  }

  /**
   * 단일 행동 추적 (GraphQL 사용)
   */
  private async trackBehaviorGraphQL(event: BehaviorEvent): Promise<boolean> {
    try {
      await apolloClient.mutate({
        mutation: INSERT_USER_BEHAVIOR,
        variables: {
          userId: event.userId,
          jobId: event.jobId || null,
          action: event.action,
          metadata: event.metadata || {},
        },
      })
      return true
    } catch (error) {
      console.error('Failed to track behavior via GraphQL:', error)
      return false
    }
  }

  /**
   * 단일 행동 추적 (Supabase REST API 사용)
   */
  private async trackBehaviorREST(event: BehaviorEvent): Promise<boolean> {
    try {
      const { error } = await (supabase.from('user_behaviors') as any).insert({
        user_id: event.userId,
        job_id: event.jobId || null,
        action: event.action,
        session_id: event.sessionId,
        metadata: event.metadata || {},
        timestamp: new Date().toISOString(),
      })

      if (error) {
        console.error('Failed to track behavior via REST:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Failed to track behavior via REST:', error)
      return false
    }
  }

  /**
   * 행동 추적 (비동기)
   */
  async trackBehavior(event: BehaviorEvent): Promise<void> {
    // 로컬 BehaviorTracker에도 추적
    const tracker = BehaviorTracker.getInstance()
    tracker.track(event.action, event.jobId, event.metadata)

    // Pending 큐에 추가
    this.pendingEvents.push(event)

    // 최대 개수 도달 시 즉시 동기화
    if (this.pendingEvents.length >= this.MAX_PENDING_EVENTS) {
      await this.syncPendingEvents()
    }
  }

  /**
   * 대기 중인 이벤트를 Supabase에 동기화
   */
  async syncPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return

    const eventsToSync = [...this.pendingEvents]
    this.pendingEvents = []

    try {
      if (USE_GRAPHQL && eventsToSync.length > 1) {
        // GraphQL로 일괄 삽입
        await this.syncEventsGraphQL(eventsToSync)
      } else {
        // REST API로 일괄 삽입
        await this.syncEventsREST(eventsToSync)
      }

      console.log(`Synced ${eventsToSync.length} behavior events to Supabase`)
    } catch (error) {
      console.error('Failed to sync pending events:', error)
      // 실패한 이벤트는 다시 큐에 추가 (최대 3번 재시도)
      this.pendingEvents.push(...eventsToSync.slice(0, 30)) // 최대 30개만 재시도
    }
  }

  /**
   * GraphQL로 일괄 삽입
   */
  private async syncEventsGraphQL(events: BehaviorEvent[]): Promise<void> {
    const formattedEvents = events.map((event) => ({
      user_id: event.userId,
      job_id: event.jobId || null,
      action: event.action,
      session_id: event.sessionId,
      metadata: event.metadata || {},
      timestamp: new Date().toISOString(),
    }))

    await apolloClient.mutate({
      mutation: INSERT_SESSION_EVENTS,
      variables: { events: formattedEvents },
    })
  }

  /**
   * REST API로 일괄 삽입
   */
  private async syncEventsREST(events: BehaviorEvent[]): Promise<void> {
    const formattedEvents = events.map((event) => ({
      user_id: event.userId,
      job_id: event.jobId || null,
      action: event.action,
      session_id: event.sessionId,
      metadata: event.metadata || {},
      timestamp: new Date().toISOString(),
    }))

    const { error } = await (supabase.from('user_behaviors') as any).insert(formattedEvents)

    if (error) {
      throw error
    }
  }

  /**
   * 페이지 조회 추적
   */
  trackPageView(userId: string, page: string): void {
    this.trackBehavior({
      userId,
      action: 'page_view',
      metadata: { page },
    })
  }

  /**
   * 공고 조회 추적
   */
  trackJobView(userId: string, jobId: string, jobTitle?: string, company?: string): void {
    this.trackBehavior({
      userId,
      jobId,
      action: 'job_view',
      metadata: { jobTitle, company },
    })
  }

  /**
   * 공고 지원 추적
   */
  trackJobApply(userId: string, jobId: string, jobTitle?: string): void {
    this.trackBehavior({
      userId,
      jobId,
      action: 'job_apply',
      metadata: { jobTitle },
    })
  }

  /**
   * 공고 저장 추적
   */
  trackJobSave(userId: string, jobId: string, jobTitle?: string): void {
    this.trackBehavior({
      userId,
      jobId,
      action: 'job_save',
      metadata: { jobTitle },
    })
  }

  /**
   * 공고 거부 추적
   */
  trackJobReject(userId: string, jobId: string, reason?: string): void {
    this.trackBehavior({
      userId,
      jobId,
      action: 'job_reject',
      metadata: { reason },
    })
  }

  /**
   * 검색 추적
   */
  trackSearch(userId: string, query: string, filters?: Record<string, any>): void {
    this.trackBehavior({
      userId,
      action: 'search',
      metadata: { query, filters },
    })
  }

  /**
   * 필터 적용 추적
   */
  trackFilter(userId: string, filters: Record<string, any>): void {
    this.trackBehavior({
      userId,
      action: 'filter',
      metadata: { filters },
    })
  }

  /**
   * 사용자 행동 통계 조회
   */
  async getUserBehaviorStats(userId: string): Promise<{
    totalActions: number
    viewCount: number
    applyCount: number
    saveCount: number
    rejectCount: number
    searchCount: number
    lastActivity: string | null
  } | null> {
    try {
      const { data, error } = await (supabase
        .from('user_behavior_stats') as any)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      return {
        totalActions: data.total_actions,
        viewCount: data.view_count,
        applyCount: data.apply_count,
        saveCount: data.save_count,
        rejectCount: data.reject_count,
        searchCount: data.search_count,
        lastActivity: data.last_activity,
      }
    } catch (error) {
      console.error('Failed to get user behavior stats:', error)
      return null
    }
  }

  /**
   * 공고 행동 통계 조회
   */
  async getJobBehaviorStats(jobId: string): Promise<{
    totalInteractions: number
    viewCount: number
    applyCount: number
    saveCount: number
    rejectCount: number
    uniqueUsers: number
    conversionRate: number
  } | null> {
    try {
      const { data, error } = await (supabase
        .from('job_behavior_stats') as any)
        .select('*')
        .eq('job_id', jobId)
        .single()

      if (error) throw error

      return {
        totalInteractions: data.total_interactions,
        viewCount: data.view_count,
        applyCount: data.apply_count,
        saveCount: data.save_count,
        rejectCount: data.reject_count,
        uniqueUsers: data.unique_users,
        conversionRate: data.conversion_rate,
      }
    } catch (error) {
      console.error('Failed to get job behavior stats:', error)
      return null
    }
  }

  /**
   * 서비스 정리 (컴포넌트 언마운트 시)
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.syncPendingEvents() // 남은 이벤트 동기화
  }
}

/**
 * 편의 함수들
 */
export const trackPageView = (userId: string, page: string) => {
  BehaviorTrackingService.getInstance().trackPageView(userId, page)
}

export const trackJobView = (userId: string, jobId: string, jobTitle?: string, company?: string) => {
  BehaviorTrackingService.getInstance().trackJobView(userId, jobId, jobTitle, company)
}

export const trackJobApply = (userId: string, jobId: string, jobTitle?: string) => {
  BehaviorTrackingService.getInstance().trackJobApply(userId, jobId, jobTitle)
}

export const trackJobSave = (userId: string, jobId: string, jobTitle?: string) => {
  BehaviorTrackingService.getInstance().trackJobSave(userId, jobId, jobTitle)
}

export const trackJobReject = (userId: string, jobId: string, reason?: string) => {
  BehaviorTrackingService.getInstance().trackJobReject(userId, jobId, reason)
}

export const trackSearch = (userId: string, query: string, filters?: Record<string, any>) => {
  BehaviorTrackingService.getInstance().trackSearch(userId, query, filters)
}

export const trackFilter = (userId: string, filters: Record<string, any>) => {
  BehaviorTrackingService.getInstance().trackFilter(userId, filters)
}

export const syncPendingEvents = () => {
  BehaviorTrackingService.getInstance().syncPendingEvents()
}

export const getUserBehaviorStats = (userId: string) => {
  return BehaviorTrackingService.getInstance().getUserBehaviorStats(userId)
}

export const getJobBehaviorStats = (jobId: string) => {
  return BehaviorTrackingService.getInstance().getJobBehaviorStats(jobId)
}
