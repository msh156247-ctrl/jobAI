/**
 * 협업 필터링 추천 알고리즘
 * 사용자 행동 데이터를 기반으로 유사한 사용자가 선호하는 공고를 추천
 */

interface UserBehavior {
  userId: string
  jobId: string
  action: 'view' | 'apply' | 'save' | 'reject'
  timestamp: number
  score: number // view: 1, save: 2, apply: 3, reject: -2
}

interface UserSimilarity {
  userId: string
  similarity: number
}

/**
 * 협업 필터링 엔진
 */
export class CollaborativeFilter {
  private userBehaviors: Map<string, UserBehavior[]> = new Map()
  private jobScores: Map<string, Map<string, number>> = new Map() // userId -> jobId -> score

  /**
   * 사용자 행동 데이터 추가
   */
  addBehavior(behavior: UserBehavior): void {
    // 사용자별 행동 저장
    const behaviors = this.userBehaviors.get(behavior.userId) || []
    behaviors.push(behavior)
    this.userBehaviors.set(behavior.userId, behaviors)

    // 점수 계산 및 저장
    const userScores = this.jobScores.get(behavior.userId) || new Map()
    const currentScore = userScores.get(behavior.jobId) || 0
    userScores.set(behavior.jobId, currentScore + behavior.score)
    this.jobScores.set(behavior.userId, userScores)
  }

  /**
   * 사용자 간 유사도 계산 (코사인 유사도)
   */
  private calculateSimilarity(userId1: string, userId2: string): number {
    const scores1 = this.jobScores.get(userId1)
    const scores2 = this.jobScores.get(userId2)

    if (!scores1 || !scores2) return 0

    // 공통 항목 찾기
    const commonJobs: string[] = []
    scores1.forEach((_, jobId) => {
      if (scores2.has(jobId)) {
        commonJobs.push(jobId)
      }
    })

    if (commonJobs.length === 0) return 0

    // 코사인 유사도 계산
    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0

    commonJobs.forEach((jobId) => {
      const score1 = scores1.get(jobId) || 0
      const score2 = scores2.get(jobId) || 0
      dotProduct += score1 * score2
      magnitude1 += score1 * score1
      magnitude2 += score2 * score2
    })

    if (magnitude1 === 0 || magnitude2 === 0) return 0

    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
  }

  /**
   * 유사한 사용자 찾기
   */
  findSimilarUsers(userId: string, limit: number = 10): UserSimilarity[] {
    const similarities: UserSimilarity[] = []

    this.jobScores.forEach((_, otherUserId) => {
      if (otherUserId !== userId) {
        const similarity = this.calculateSimilarity(userId, otherUserId)
        if (similarity > 0) {
          similarities.push({ userId: otherUserId, similarity })
        }
      }
    })

    // 유사도 내림차순 정렬
    similarities.sort((a, b) => b.similarity - a.similarity)

    return similarities.slice(0, limit)
  }

  /**
   * 협업 필터링 기반 추천 점수 계산
   */
  getCollaborativeScore(userId: string, jobId: string): number {
    // 이미 본 공고인지 확인
    const userScores = this.jobScores.get(userId)
    if (userScores && userScores.has(jobId)) {
      // 이미 본 공고는 점수를 낮춤
      return 0
    }

    // 유사한 사용자 찾기
    const similarUsers = this.findSimilarUsers(userId, 5)

    if (similarUsers.length === 0) return 0

    // 유사한 사용자들의 점수 가중 평균
    let weightedScore = 0
    let totalWeight = 0

    similarUsers.forEach(({ userId: similarUserId, similarity }) => {
      const scores = this.jobScores.get(similarUserId)
      if (scores && scores.has(jobId)) {
        const score = scores.get(jobId) || 0
        weightedScore += score * similarity
        totalWeight += similarity
      }
    })

    return totalWeight > 0 ? weightedScore / totalWeight : 0
  }

  /**
   * 사용자를 위한 추천 공고 ID 목록 생성
   */
  getRecommendations(userId: string, allJobIds: string[], limit: number = 10): string[] {
    const jobScores: { jobId: string; score: number }[] = []

    allJobIds.forEach((jobId) => {
      const score = this.getCollaborativeScore(userId, jobId)
      if (score > 0) {
        jobScores.push({ jobId, score })
      }
    })

    // 점수 내림차순 정렬
    jobScores.sort((a, b) => b.score - a.score)

    return jobScores.slice(0, limit).map((item) => item.jobId)
  }

  /**
   * 사용자의 행동 데이터 로드 (LocalStorage에서)
   */
  static loadFromLocalStorage(userId: string): CollaborativeFilter {
    const filter = new CollaborativeFilter()

    try {
      const stored = localStorage.getItem(`cf_behaviors_${userId}`)
      if (stored) {
        const behaviors: UserBehavior[] = JSON.parse(stored)
        behaviors.forEach((behavior) => filter.addBehavior(behavior))
      }
    } catch (error) {
      console.error('Failed to load collaborative filter data:', error)
    }

    return filter
  }

  /**
   * 사용자의 행동 데이터 저장 (LocalStorage에)
   */
  saveToLocalStorage(userId: string): void {
    try {
      const behaviors = this.userBehaviors.get(userId) || []
      // 최근 100개만 저장 (용량 제한)
      const recentBehaviors = behaviors.slice(-100)
      localStorage.setItem(`cf_behaviors_${userId}`, JSON.stringify(recentBehaviors))
    } catch (error) {
      console.error('Failed to save collaborative filter data:', error)
    }
  }
}

/**
 * 행동 유틸리티 함수
 */
export const BehaviorUtils = {
  /**
   * 행동에 따른 점수 매핑
   */
  getScoreForAction(action: UserBehavior['action']): number {
    const scores = {
      view: 1,
      save: 2,
      apply: 3,
      reject: -2,
    }
    return scores[action]
  },

  /**
   * 행동 기록 생성
   */
  createBehavior(
    userId: string,
    jobId: string,
    action: UserBehavior['action']
  ): UserBehavior {
    return {
      userId,
      jobId,
      action,
      timestamp: Date.now(),
      score: this.getScoreForAction(action),
    }
  },

  /**
   * 행동 기록 및 저장
   */
  trackBehavior(
    userId: string,
    jobId: string,
    action: UserBehavior['action']
  ): void {
    const filter = CollaborativeFilter.loadFromLocalStorage(userId)
    const behavior = this.createBehavior(userId, jobId, action)
    filter.addBehavior(behavior)
    filter.saveToLocalStorage(userId)
  },
}
