/**
 * 하이브리드 추천 시스템
 * 콘텐츠 기반 필터링 + 협업 필터링을 결합
 */

import { CollaborativeFilter } from './collaborative-filter'

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

interface RecommendationScore {
  jobId: string
  contentScore: number
  collaborativeScore: number
  finalScore: number
  breakdown: {
    industry: number
    skills: number
    location: number
    salary: number
    type: number
    experience: number
  }
}

/**
 * 하이브리드 추천 엔진
 */
export class HybridRecommender {
  private collaborativeFilter: CollaborativeFilter
  private contentWeight: number = 0.6 // 콘텐츠 기반 가중치
  private collaborativeWeight: number = 0.4 // 협업 필터링 가중치

  constructor(collaborativeFilter?: CollaborativeFilter) {
    this.collaborativeFilter = collaborativeFilter || new CollaborativeFilter()
  }

  /**
   * 가중치 설정
   */
  setWeights(contentWeight: number, collaborativeWeight: number): void {
    // 가중치 합이 1이 되도록 정규화
    const total = contentWeight + collaborativeWeight
    this.contentWeight = contentWeight / total
    this.collaborativeWeight = collaborativeWeight / total
  }

  /**
   * 콘텐츠 기반 점수 계산 (기존 알고리즘 개선)
   */
  private calculateContentScore(job: Job, profile: UserProfile): RecommendationScore {
    const breakdown = {
      industry: 0,
      skills: 0,
      location: 0,
      salary: 0,
      type: 0,
      experience: 0,
    }

    // 1. 업종 매칭 (가중치: 30%)
    if (profile.industry && job.industry) {
      if (profile.industry.toLowerCase() === job.industry.toLowerCase()) {
        breakdown.industry = 30
      } else {
        // 부분 매칭 (키워드 포함 여부)
        const profileKeywords = profile.industry.toLowerCase().split(' ')
        const jobKeywords = job.industry.toLowerCase().split(' ')
        const matchCount = profileKeywords.filter((kw) =>
          jobKeywords.some((jkw) => jkw.includes(kw) || kw.includes(jkw))
        ).length
        breakdown.industry = (matchCount / Math.max(profileKeywords.length, 1)) * 30
      }
    }

    // 2. 스킬 매칭 (가중치: 25%)
    if (profile.skills && profile.skills.length > 0 && job.skills && job.skills.length > 0) {
      const profileSkills = profile.skills.map((s) => s.name.toLowerCase())
      const jobSkills = job.skills.map((s) => s.toLowerCase())

      let skillMatchScore = 0
      let totalWeight = 0

      profileSkills.forEach((profileSkill) => {
        const skill = profile.skills!.find((s) => s.name.toLowerCase() === profileSkill)
        const levelWeight = skill?.level === 'advanced' ? 1.5 : skill?.level === 'intermediate' ? 1.2 : 1.0

        if (jobSkills.some((js) => js.includes(profileSkill) || profileSkill.includes(js))) {
          skillMatchScore += levelWeight
        }
        totalWeight += levelWeight
      })

      breakdown.skills = totalWeight > 0 ? (skillMatchScore / totalWeight) * 25 : 0
    }

    // 3. 지역 매칭 (가중치: 15%)
    if (profile.preferredLocations && profile.preferredLocations.length > 0 && job.location) {
      const locationMatch = profile.preferredLocations.some((loc) =>
        job.location.includes(loc) || loc.includes(job.location)
      )
      if (locationMatch) {
        breakdown.location = 15
      } else {
        // 부분 매칭 (예: "서울" vs "서울 강남구")
        const partialMatch = profile.preferredLocations.some((loc) => {
          const locWords = loc.split(' ')
          return locWords.some((word) => job.location.includes(word))
        })
        breakdown.location = partialMatch ? 10 : 0
      }
    }

    // 4. 연봉 매칭 (가중치: 15%)
    if (profile.salaryMin || profile.salaryMax) {
      const jobSalary = this.parseSalary(job.salary)
      if (jobSalary) {
        const salaryMin = profile.salaryMin || 0
        const salaryMax = profile.salaryMax || Infinity

        if (jobSalary >= salaryMin && jobSalary <= salaryMax) {
          breakdown.salary = 15
        } else {
          // 범위 밖이지만 가까운 경우
          const distance = Math.min(
            Math.abs(jobSalary - salaryMin),
            Math.abs(jobSalary - salaryMax)
          )
          const maxDistance = (salaryMax - salaryMin) * 0.5
          breakdown.salary = Math.max(0, 15 - (distance / maxDistance) * 15)
        }
      }
    }

    // 5. 근무 형태 매칭 (가중치: 10%)
    if (profile.workTypes && profile.workTypes.length > 0 && job.type) {
      const typeMap: Record<string, string[]> = {
        remote: ['remote', '재택'],
        hybrid: ['hybrid', '하이브리드', 'dispatch'],
        onsite: ['onsite', '사무실', '출근'],
      }

      const profileTypes = profile.workTypes.flatMap((wt) => typeMap[wt] || [wt])
      const jobTypeMatch = profileTypes.some((pt) =>
        job.type?.toLowerCase().includes(pt.toLowerCase())
      )

      breakdown.type = jobTypeMatch ? 10 : 0
    }

    // 6. 경력 매칭 (가중치: 5%)
    if (profile.careerYears !== undefined && job.experienceLevel) {
      const experienceMatch = this.matchExperienceLevel(profile.careerYears, job.experienceLevel)
      breakdown.experience = experienceMatch ? 5 : 0
    }

    const contentScore =
      breakdown.industry +
      breakdown.skills +
      breakdown.location +
      breakdown.salary +
      breakdown.type +
      breakdown.experience

    return {
      jobId: job.id,
      contentScore,
      collaborativeScore: 0,
      finalScore: contentScore,
      breakdown,
    }
  }

  /**
   * 연봉 문자열 파싱
   */
  private parseSalary(salary?: string): number | null {
    if (!salary) return null

    // "3000만원 - 5000만원" -> 평균값
    const numbers = salary.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      const values = numbers.map(Number)
      return values.reduce((a, b) => a + b, 0) / values.length
    }

    return null
  }

  /**
   * 경력 수준 매칭
   */
  private matchExperienceLevel(careerYears: number, experienceLevel: string): boolean {
    const level = experienceLevel.toLowerCase()

    if (careerYears === 0 || level.includes('junior') || level.includes('신입')) {
      return careerYears <= 2
    } else if (level.includes('mid') || level.includes('중급')) {
      return careerYears >= 2 && careerYears <= 5
    } else if (level.includes('senior') || level.includes('고급') || level.includes('시니어')) {
      return careerYears >= 5
    } else if (level.includes('any') || level.includes('전체')) {
      return true
    }

    return false
  }

  /**
   * 하이브리드 추천 점수 계산
   */
  calculateHybridScore(
    job: Job,
    profile: UserProfile,
    includeCollaborative: boolean = true
  ): RecommendationScore {
    // 콘텐츠 기반 점수
    const result = this.calculateContentScore(job, profile)

    // 협업 필터링 점수
    if (includeCollaborative) {
      const collaborativeScore = this.collaborativeFilter.getCollaborativeScore(
        profile.id,
        job.id
      )
      result.collaborativeScore = collaborativeScore

      // 최종 점수 = 가중 평균
      result.finalScore =
        result.contentScore * this.contentWeight +
        collaborativeScore * this.collaborativeWeight
    }

    return result
  }

  /**
   * 추천 공고 목록 생성
   */
  getRecommendations(
    jobs: Job[],
    profile: UserProfile,
    includeCollaborative: boolean = true
  ): Job[] {
    const scores: RecommendationScore[] = jobs.map((job) =>
      this.calculateHybridScore(job, profile, includeCollaborative)
    )

    // 점수 내림차순 정렬
    scores.sort((a, b) => b.finalScore - a.finalScore)

    // 점수가 일정 수준 이상인 공고만 추천
    const threshold = 20 // 최소 20점 이상
    const recommendedScores = scores.filter((s) => s.finalScore >= threshold)

    // Job 객체 배열로 변환
    return recommendedScores.map((score) => {
      const job = jobs.find((j) => j.id === score.jobId)!
      return {
        ...job,
        _recommendationScore: score.finalScore,
        _scoreBreakdown: score.breakdown,
      }
    })
  }

  /**
   * 다양성을 고려한 추천 (같은 회사의 공고가 너무 많이 나오지 않도록)
   */
  getDiversifiedRecommendations(
    jobs: Job[],
    profile: UserProfile,
    limit: number = 20,
    maxPerCompany: number = 3
  ): Job[] {
    const recommendations = this.getRecommendations(jobs, profile, true)
    const companyCount: Map<string, number> = new Map()
    const diversified: Job[] = []

    for (const job of recommendations) {
      const count = companyCount.get(job.company) || 0

      if (count < maxPerCompany) {
        diversified.push(job)
        companyCount.set(job.company, count + 1)
      }

      if (diversified.length >= limit) break
    }

    return diversified
  }
}
