import { supabase } from './supabase'
import { JobWithCompany } from './jobs'
import { UserProfile } from './profiles'
import { CachedQueries } from './cache'

export interface MatchResult {
  job: JobWithCompany
  score: number
  reasons: string[]
}

export interface MatchingCriteria {
  skills: string[]
  career_years: number
  location?: string
  preferred_salary_min?: number
  preferred_salary_max?: number
  job_types?: string[]
}

export interface SearchFilters {
  keywords?: string
  skills?: string[]
  location?: string
  salary_min?: number
  salary_max?: number
  career_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
  job_types?: string[]
  company_size?: string
  sort_by?: 'relevance' | 'date' | 'salary' | 'location'
  sort_order?: 'asc' | 'desc'
}

// 스킬 매칭 점수 계산
function calculateSkillMatch(userSkills: string[], jobRequirements: string[]): { score: number; matched: string[]; missing: string[] } {
  if (!userSkills.length || !jobRequirements.length) {
    return { score: 0, matched: [], missing: jobRequirements }
  }

  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim())
  const jobRequirementsLower = jobRequirements.map(s => s.toLowerCase().trim())

  const matched = jobRequirementsLower.filter(req =>
    userSkillsLower.some(skill =>
      skill.includes(req) || req.includes(skill) || skill === req
    )
  )

  const missing = jobRequirementsLower.filter(req => !matched.includes(req))
  const score = matched.length / jobRequirementsLower.length

  return { score, matched, missing }
}

// 경력 매칭 점수 계산
function calculateExperienceMatch(userExperience: number, jobRequirements: string[]): number {
  // 요구사항에서 경력 키워드 찾기
  const experienceKeywords = [
    { keywords: ['신입', 'entry', '0년'], min: 0, max: 1 },
    { keywords: ['주니어', 'junior', '1년', '2년'], min: 1, max: 3 },
    { keywords: ['미드', 'mid', '3년', '4년', '5년'], min: 3, max: 7 },
    { keywords: ['시니어', 'senior', '7년', '8년'], min: 7, max: 15 },
    { keywords: ['리드', 'lead', '매니저', 'manager'], min: 5, max: 20 }
  ]

  const jobText = jobRequirements.join(' ').toLowerCase()

  for (const level of experienceKeywords) {
    const hasKeyword = level.keywords.some(keyword => jobText.includes(keyword))
    if (hasKeyword) {
      if (userExperience >= level.min && userExperience <= level.max) {
        return 1.0 // 완벽한 매치
      } else if (userExperience >= level.min * 0.8 && userExperience <= level.max * 1.2) {
        return 0.8 // 근접한 매치
      } else {
        return 0.3 // 경력이 맞지 않음
      }
    }
  }

  return 0.5 // 경력 요구사항을 명시하지 않은 경우
}

// 위치 매칭 점수 계산
function calculateLocationMatch(userLocation: string | null, jobLocation: string | null): number {
  if (!userLocation || !jobLocation) return 0.5

  const userLoc = userLocation.toLowerCase().trim()
  const jobLoc = jobLocation.toLowerCase().trim()

  if (userLoc === jobLoc) return 1.0
  if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) return 0.8

  // 같은 도시/광역시인지 확인
  const userCity = userLoc.split(' ')[0]
  const jobCity = jobLoc.split(' ')[0]
  if (userCity === jobCity) return 0.6

  return 0.2 // 다른 지역
}

// 급여 매칭 점수 계산
function calculateSalaryMatch(
  userPreferredMin: number | undefined,
  userPreferredMax: number | undefined,
  jobSalaryMin: number | null,
  jobSalaryMax: number | null
): number {
  if (!userPreferredMin && !userPreferredMax) return 0.5
  if (!jobSalaryMin && !jobSalaryMax) return 0.5

  const userMin = userPreferredMin || 0
  const userMax = userPreferredMax || Infinity
  const jobMin = jobSalaryMin || 0
  const jobMax = jobSalaryMax || Infinity

  // 범위가 겹치는지 확인
  const overlapMin = Math.max(userMin, jobMin)
  const overlapMax = Math.min(userMax, jobMax)

  if (overlapMax >= overlapMin) {
    const overlapRange = overlapMax - overlapMin
    const userRange = userMax - userMin
    const jobRange = jobMax - jobMin
    const avgRange = (userRange + jobRange) / 2

    return Math.min(1.0, overlapRange / avgRange)
  }

  return 0.1 // 범위가 겹치지 않음
}

// 구직자를 위한 채용공고 추천 (최적화 버전)
export async function getJobRecommendations(
  userId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 캐싱된 결과 사용

  try {
    // 최적화된 RPC 함수 사용
    const { data: matches, error } = await supabase
      .rpc('get_job_matches_optimized', {
        user_uuid: userId,
        limit_count: limit
      } as any)

    if (error) throw error
    if (!matches) return []

    // RPC 결과를 MatchResult 형태로 변환
    const results: MatchResult[] = await Promise.all(
      (matches as any).map(async (match: any) => {
        // 상세 job 정보 조회 (캐시 사용)
        const { data: job } = await supabase
          .from('jobs')
          .select(`
            *,
            company_profiles (
              company_name,
              location,
              industry
            )
          `)
          .eq('id', match.job_id)
          .single()

        if (!job) return null

        return {
          job,
          score: parseFloat(match.match_score),
          reasons: [
            ...(match.skill_matches && match.skill_matches.length > 0
              ? [`${match.skill_matches.length}개 필수 스킬 보유`]
              : []),
            ...(parseFloat(match.match_score) > 0.7 ? ['높은 매치 점수'] : []),
            '최적화된 추천'
          ]
        }
      })
    )

    return results.filter((r): r is MatchResult => r !== null)
  } catch (error) {
    console.error('Optimized recommendation failed, falling back to original method:', error)

    // 폴백: 기존 방식
    return getJobRecommendationsLegacy(userId, limit)
  }
}

// 레거시 방식 (폴백용)
async function getJobRecommendationsLegacy(
  userId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 사용자 프로필 조회
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userProfile) {
    throw new Error('사용자 프로필을 찾을 수 없습니다.')
  }

  // 활성 채용공고 조회 (제한된 수량)
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        location,
        industry
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50) // 성능 최적화: 50개로 제한

  if (!jobs) return []

  // 병렬 처리로 성능 향상
  const matches: MatchResult[] = (jobs as any).map((job: any) => {
    const skillMatch = calculateSkillMatch((userProfile as any).skills || [], job.requirements || [])
    const experienceMatch = calculateExperienceMatch((userProfile as any).career_years || 0, job.requirements || [])
    const locationMatch = calculateLocationMatch((userProfile as any).location, job.location)

    // 가중평균으로 종합 점수 계산
    const totalScore = (
      skillMatch.score * 0.5 +          // 스킬 매칭 50%
      experienceMatch * 0.3 +           // 경력 매칭 30%
      locationMatch * 0.2               // 위치 매칭 20%
    )

    // 매칭 이유 생성
    const reasons: string[] = []
    if (skillMatch.score > 0.7) reasons.push(`${Math.round(skillMatch.score * 100)}% 스킬 매치`)
    if (skillMatch.matched.length > 0) reasons.push(`${skillMatch.matched.length}개 필수 스킬 보유`)
    if (experienceMatch > 0.8) reasons.push('경력 요구사항 충족')
    if (locationMatch > 0.8) reasons.push('근무지 선호도 일치')

    return {
      job,
      score: totalScore,
      reasons
    }
  })

  // 점수 순으로 정렬하고 상위 결과만 반환
  return matches
    .filter(match => match.score > 0.1) // 최소 점수 필터링
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// 기업을 위한 지원자 추천
export async function getCandidateRecommendations(
  jobId: string,
  limit: number = 10
): Promise<{ profile: UserProfile & { profiles: any }, score: number, reasons: string[] }[]> {
  // 채용공고 정보 조회
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) {
    throw new Error('채용공고를 찾을 수 없습니다.')
  }

  // 구직자 프로필 조회 (이미 지원한 사람 제외)
  const { data: candidates } = await supabase
    .from('user_profiles')
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .not('user_id', 'in', `(
      select user_id from applications where job_id = '${jobId}'
    )`)
    .limit(50)

  if (!candidates) return []

  // 각 후보자에 대해 매칭 점수 계산
  const matches = (candidates as any).map((candidate: any) => {
    const skillMatch = calculateSkillMatch(candidate.skills || [], (job as any).requirements || [])
    const experienceMatch = calculateExperienceMatch(candidate.career_years || 0, (job as any).requirements || [])
    const locationMatch = calculateLocationMatch(candidate.location, (job as any).location)

    const totalScore = (
      skillMatch.score * 0.5 +
      experienceMatch * 0.3 +
      locationMatch * 0.2
    )

    const reasons: string[] = []
    if (skillMatch.score > 0.7) reasons.push(`${Math.round(skillMatch.score * 100)}% 스킬 매치`)
    if (experienceMatch > 0.8) reasons.push('적합한 경력 수준')
    if (locationMatch > 0.8) reasons.push('근무지 접근성 좋음')

    return {
      profile: candidate,
      score: totalScore,
      reasons
    }
  })

  return matches
    .filter((match: any) => match.score > 0.2)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit)
}

// 고급 검색 함수
export async function advancedJobSearch(filters: SearchFilters): Promise<JobWithCompany[]> {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        location,
        industry,
        description
      )
    `)
    .eq('status', 'active')

  // 키워드 검색
  if (filters.keywords) {
    const keywords = filters.keywords.toLowerCase()
    query = query.or(`title.ilike.%${keywords}%,description.ilike.%${keywords}%`)
  }

  // 위치 필터
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  // 급여 범위 필터
  if (filters.salary_min) {
    query = query.gte('salary_min', filters.salary_min)
  }
  if (filters.salary_max) {
    query = query.lte('salary_max', filters.salary_max)
  }

  // 고용 형태 필터
  if (filters.job_types && filters.job_types.length > 0) {
    query = query.in('type', filters.job_types)
  }

  // 정렬
  const sortBy = filters.sort_by || 'date'
  const sortOrder = filters.sort_order || 'desc'

  switch (sortBy) {
    case 'date':
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
      break
    case 'salary':
      query = query.order('salary_max', { ascending: sortOrder === 'asc' })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(50)

  if (error) throw error

  // 스킬 필터링 (클라이언트 사이드)
  let results = data || []

  if (filters.skills && filters.skills.length > 0) {
    results = (results as any).filter((job: any) => {
      if (!job.requirements) return false

      const jobSkills = job.requirements.map((req: any) => req.toLowerCase())
      const userSkills = filters.skills!.map(skill => skill.toLowerCase())

      return userSkills.some(skill =>
        jobSkills.some((jobSkill: any) =>
          jobSkill.includes(skill) || skill.includes(jobSkill)
        )
      )
    })
  }

  return results
}

// 저장된 검색 관리
export async function saveSearch(
  userId: string,
  name: string,
  filters: SearchFilters
): Promise<void> {
  await supabase
    .from('saved_searches')
    .insert([
      {
        user_id: userId,
        name: name.trim(),
        filters,
        created_at: new Date().toISOString()
      }
    ] as any)
}

export async function getSavedSearches(userId: string) {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}