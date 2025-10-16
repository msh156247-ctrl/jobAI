/**
 * Recommendation Service
 * GraphQL과 기존 알고리즘을 통합하는 서비스 레이어
 */

import { apolloClient, USE_GRAPHQL } from '@/lib/graphql/client'
import {
  GET_USER_PROFILE,
  GET_JOBS_FOR_RECOMMENDATION,
  GET_USER_BEHAVIORS,
  GET_SIMILAR_USERS_BEHAVIORS,
  GET_JOBS_EXCLUDING_VIEWED,
} from '@/lib/graphql/queries/recommendations'
import { HybridRecommender } from '@/lib/algorithms/hybrid-recommender'
import { CollaborativeFilter, BehaviorUtils } from '@/lib/algorithms/collaborative-filter'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  type?: string
  industry?: string
  skills?: string[]
  experienceLevel?: string
  [key: string]: any
}

interface UserProfile {
  id: string
  industry?: string
  skills?: Array<{ name: string; level: string }>
  preferredLocations?: string[]
  careerType?: string
  careerYears?: number
  workTypes?: string[]
  salaryMin?: number
  salaryMax?: number
  [key: string]: any
}

/**
 * 추천 서비스 클래스
 */
export class RecommendationService {
  private static instance: RecommendationService

  private constructor() {}

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService()
    }
    return RecommendationService.instance
  }

  /**
   * GraphQL을 사용한 사용자 프로필 조회
   */
  private async fetchUserProfileGraphQL(userId: string): Promise<UserProfile | null> {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_PROFILE,
        variables: { userId },
      }) as any

      const profile = data?.seeker_profiles?.[0]
      if (!profile) return null

      return {
        id: profile.user_id,
        industry: profile.industry,
        skills: profile.skills || [],
        preferredLocations: profile.preferred_locations || [],
        careerType: profile.career_type,
        careerYears: profile.career_years,
        workTypes: profile.work_types || [],
        salaryMin: profile.salary_min,
        salaryMax: profile.salary_max,
      }
    } catch (error) {
      console.error('Failed to fetch user profile via GraphQL:', error)
      return null
    }
  }

  /**
   * GraphQL을 사용한 공고 목록 조회
   */
  private async fetchJobsGraphQL(
    limit: number = 100,
    filters?: {
      industries?: string[]
      locations?: string[]
      types?: string[]
      salaryMin?: number
    }
  ): Promise<Job[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_JOBS_FOR_RECOMMENDATION,
        variables: {
          limit,
          offset: 0,
          ...filters,
        },
      }) as any

      const jobs = data?.job_postings || []
      return jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company_profiles?.company_name || '회사명 없음',
        location: job.location,
        salary: job.salary_min && job.salary_max
          ? `${job.salary_min}만원 - ${job.salary_max}만원`
          : undefined,
        type: job.type,
        industry: job.industry,
        skills: job.skills || [],
        experienceLevel: job.experience_level,
        description: job.description,
        requirements: job.requirements,
        viewCount: job.view_count,
        applicationCount: job.application_count,
      }))
    } catch (error) {
      console.error('Failed to fetch jobs via GraphQL:', error)
      return []
    }
  }

  /**
   * GraphQL을 사용한 사용자 행동 데이터 조회
   */
  private async fetchUserBehaviorsGraphQL(userId: string): Promise<any[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_BEHAVIORS,
        variables: { userId, limit: 100 },
      }) as any

      return data?.user_behaviors || []
    } catch (error) {
      console.error('Failed to fetch user behaviors via GraphQL:', error)
      return []
    }
  }

  /**
   * GraphQL을 사용한 협업 필터링 데이터 구축
   */
  private async buildCollaborativeFilterGraphQL(userId: string): Promise<CollaborativeFilter> {
    const filter = new CollaborativeFilter()

    try {
      // 사용자 행동 데이터 가져오기
      const behaviors = await this.fetchUserBehaviorsGraphQL(userId)

      // 행동 데이터를 필터에 추가
      behaviors.forEach((behavior: any) => {
        if (behavior.job_id) {
          filter.addBehavior({
            userId: behavior.user_id,
            jobId: behavior.job_id,
            action: behavior.action,
            timestamp: new Date(behavior.timestamp).getTime(),
            score: BehaviorUtils.getScoreForAction(behavior.action),
          })
        }
      })

      // TODO: 유사 사용자의 행동 데이터도 가져와서 추가
      // 현재는 단순화를 위해 본인 데이터만 사용
    } catch (error) {
      console.error('Failed to build collaborative filter:', error)
    }

    return filter
  }

  /**
   * 하이브리드 추천 생성 (GraphQL + 알고리즘)
   */
  async getRecommendations(
    userId: string,
    limit: number = 20,
    useGraphQL: boolean = USE_GRAPHQL
  ): Promise<Job[]> {
    if (useGraphQL) {
      return this.getRecommendationsWithGraphQL(userId, limit)
    } else {
      return this.getRecommendationsWithLocalStorage(userId, limit)
    }
  }

  /**
   * GraphQL 기반 추천
   */
  private async getRecommendationsWithGraphQL(
    userId: string,
    limit: number
  ): Promise<Job[]> {
    try {
      // 1. 사용자 프로필 가져오기
      const profile = await this.fetchUserProfileGraphQL(userId)
      if (!profile) {
        console.warn('User profile not found')
        return []
      }

      // 2. 협업 필터링 데이터 구축
      const collabFilter = await this.buildCollaborativeFilterGraphQL(userId)

      // 3. 사용자 선호도 기반 공고 필터링
      const jobs = await this.fetchJobsGraphQL(100, {
        locations: profile.preferredLocations,
        types: profile.workTypes,
        industries: profile.industry ? [profile.industry] : undefined,
      })

      // 4. 하이브리드 추천 시스템 적용
      const recommender = new HybridRecommender(collabFilter)
      const recommendations = recommender.getDiversifiedRecommendations(
        jobs,
        profile,
        limit,
        3 // 회사당 최대 3개
      )

      return recommendations
    } catch (error) {
      console.error('Failed to get recommendations with GraphQL:', error)
      return []
    }
  }

  /**
   * LocalStorage 기반 추천 (기존 방식)
   */
  private async getRecommendationsWithLocalStorage(
    userId: string,
    limit: number
  ): Promise<Job[]> {
    // 기존 로직 유지 (LocalStorage 기반)
    const collabFilter = CollaborativeFilter.loadFromLocalStorage(userId)
    // ... 기존 추천 로직
    return []
  }

  /**
   * 본 공고 제외하고 추천
   */
  async getRecommendationsExcludingViewed(
    userId: string,
    limit: number = 20
  ): Promise<Job[]> {
    if (!USE_GRAPHQL) {
      return this.getRecommendations(userId, limit, false)
    }

    try {
      const { data } = await apolloClient.query({
        query: GET_JOBS_EXCLUDING_VIEWED,
        variables: { userId, limit },
      }) as any

      const jobs = data?.job_postings || []
      return jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company_profiles?.company_name || '회사명 없음',
        location: job.location,
        type: job.type,
        industry: job.industry,
        skills: job.skills || [],
        salary: job.salary_min && job.salary_max
          ? `${job.salary_min}만원 - ${job.salary_max}만원`
          : undefined,
      }))
    } catch (error) {
      console.error('Failed to get jobs excluding viewed:', error)
      return []
    }
  }

  /**
   * 협업 필터링만 사용한 추천
   */
  async getCollaborativeRecommendations(
    userId: string,
    allJobIds: string[],
    limit: number = 10
  ): Promise<string[]> {
    if (USE_GRAPHQL) {
      const collabFilter = await this.buildCollaborativeFilterGraphQL(userId)
      return collabFilter.getRecommendations(userId, allJobIds, limit)
    } else {
      const collabFilter = CollaborativeFilter.loadFromLocalStorage(userId)
      return collabFilter.getRecommendations(userId, allJobIds, limit)
    }
  }
}

/**
 * 편의 함수
 */
export const getRecommendations = async (userId: string, limit: number = 20) => {
  return RecommendationService.getInstance().getRecommendations(userId, limit)
}

export const getRecommendationsExcludingViewed = async (
  userId: string,
  limit: number = 20
) => {
  return RecommendationService.getInstance().getRecommendationsExcludingViewed(userId, limit)
}

export const getCollaborativeRecommendations = async (
  userId: string,
  allJobIds: string[],
  limit: number = 10
) => {
  return RecommendationService.getInstance().getCollaborativeRecommendations(
    userId,
    allJobIds,
    limit
  )
}
