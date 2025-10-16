import { supabase } from './supabase'

// AI 매칭 알고리즘을 위한 타입 정의
interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  email: string
  skills: string[]
  career_years: number | null
  location: string | null
  bio: string | null
  desired_salary_min: number | null
  desired_salary_max: number | null
}

interface JobPosting {
  id: string
  title: string
  description: string
  requirements: string | null
  salary_min: number | null
  salary_max: number | null
  location: string | null
  experience_level: string | null
  skills_required: string[]
  company_profiles: {
    company_name: string
    description: string | null
  } | null
}

interface MatchScore {
  jobId: string
  userId: string
  totalScore: number
  skillsScore: number
  locationScore: number
  salaryScore: number
  experienceScore: number
  details: {
    matchedSkills: string[]
    missingSkills: string[]
    reasonsForMatch: string[]
  }
}

// 텍스트 유사도 계산 (간단한 키워드 매칭)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)

  const intersection = words1.filter(word => words2.includes(word))
  const union = [...new Set([...words1, ...words2])]

  return intersection.length / union.length
}

// 기술 스택 매칭 점수 계산
function calculateSkillsScore(userSkills: string[], requiredSkills: string[]): {
  score: number
  matchedSkills: string[]
  missingSkills: string[]
} {
  if (requiredSkills.length === 0) return { score: 0.5, matchedSkills: [], missingSkills: [] }

  const normalizedUserSkills = userSkills.map(skill => skill.toLowerCase().trim())
  const normalizedRequiredSkills = requiredSkills.map(skill => skill.toLowerCase().trim())

  const matchedSkills = normalizedRequiredSkills.filter(required =>
    normalizedUserSkills.some(user =>
      user.includes(required) || required.includes(user) ||
      calculateTextSimilarity(user, required) > 0.7
    )
  )

  const missingSkills = normalizedRequiredSkills.filter(required =>
    !matchedSkills.includes(required)
  )

  const score = matchedSkills.length / normalizedRequiredSkills.length

  return {
    score,
    matchedSkills: matchedSkills,
    missingSkills: missingSkills
  }
}

// 위치 매칭 점수 계산
function calculateLocationScore(userLocation: string | null, jobLocation: string | null): number {
  if (!userLocation || !jobLocation) return 0.5

  const userLoc = userLocation.toLowerCase().trim()
  const jobLoc = jobLocation.toLowerCase().trim()

  if (userLoc === jobLoc) return 1.0
  if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) return 0.8

  // 도시 이름 매칭 (서울, 부산, 대구 등)
  const cities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산']
  const userCity = cities.find(city => userLoc.includes(city))
  const jobCity = cities.find(city => jobLoc.includes(city))

  if (userCity && jobCity && userCity === jobCity) return 0.9
  if (userLoc.includes('원격') || jobLoc.includes('원격') ||
      userLoc.includes('재택') || jobLoc.includes('재택')) return 0.7

  return 0.3
}

// 급여 매칭 점수 계산
function calculateSalaryScore(
  userSalaryMin: number | null,
  userSalaryMax: number | null,
  jobSalaryMin: number | null,
  jobSalaryMax: number | null
): number {
  if (!userSalaryMin || !jobSalaryMin) return 0.5

  // 사용자 희망 급여와 채용공고 급여 범위 비교
  if (userSalaryMin <= (jobSalaryMax || jobSalaryMin) &&
      (userSalaryMax || userSalaryMin) >= jobSalaryMin) {
    // 범위가 겹치는 경우
    const overlap = Math.min(userSalaryMax || userSalaryMin, jobSalaryMax || jobSalaryMin) -
                   Math.max(userSalaryMin, jobSalaryMin)
    const userRange = (userSalaryMax || userSalaryMin) - userSalaryMin
    const overlapRatio = userRange > 0 ? overlap / userRange : 1
    return Math.max(0.6, Math.min(1.0, 0.6 + overlapRatio * 0.4))
  }

  // 범위가 겹치지 않는 경우
  const userMid = ((userSalaryMax || userSalaryMin) + userSalaryMin) / 2
  const jobMid = ((jobSalaryMax || jobSalaryMin) + jobSalaryMin) / 2
  const difference = Math.abs(userMid - jobMid) / Math.max(userMid, jobMid)

  return Math.max(0.1, 1 - difference)
}

// 경력 매칭 점수 계산
function calculateExperienceScore(
  userExperience: number | null,
  jobExperienceLevel: string | null
): number {
  if (!userExperience || !jobExperienceLevel) return 0.5

  const experience = userExperience
  const level = jobExperienceLevel.toLowerCase()

  if (level.includes('신입') || level.includes('entry')) {
    return experience <= 2 ? 1.0 : Math.max(0.3, 1 - (experience - 2) * 0.1)
  }

  if (level.includes('주니어') || level.includes('junior')) {
    return experience >= 1 && experience <= 4 ? 1.0 :
           experience < 1 ? 0.6 : Math.max(0.4, 1 - (experience - 4) * 0.1)
  }

  if (level.includes('시니어') || level.includes('senior')) {
    return experience >= 5 ? 1.0 : Math.max(0.2, experience / 5)
  }

  if (level.includes('리드') || level.includes('lead')) {
    return experience >= 7 ? 1.0 : Math.max(0.1, experience / 7)
  }

  return 0.5
}

// 지원자에게 맞는 채용공고 추천
export async function getRecommendedJobsForUser(userId: string, limit: number = 10): Promise<MatchScore[]> {
  try {
    // 사용자 프로필 조회
    const { data: userProfileData, error: userError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('user_id', userId)
      .single()

    if (userError || !userProfileData) {
      throw new Error('사용자 프로필을 찾을 수 없습니다.')
    }

    const userProfile = userProfileData as unknown as UserProfile

    // 모든 활성 채용공고 조회
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        *,
        company_profiles (
          company_name,
          description
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (jobsError) throw jobsError

    if (!jobsData || jobsData.length === 0) {
      return []
    }

    const jobs = jobsData as unknown as JobPosting[]

    // 각 채용공고에 대해 매칭 점수 계산
    const matchScores: MatchScore[] = jobs.map(job => {
      const skillsResult = calculateSkillsScore(
        userProfile.skills || [],
        job.skills_required || []
      )

      const locationScore = calculateLocationScore(
        userProfile.location,
        job.location
      )

      const salaryScore = calculateSalaryScore(
        userProfile.desired_salary_min,
        userProfile.desired_salary_max,
        job.salary_min,
        job.salary_max
      )

      const experienceScore = calculateExperienceScore(
        userProfile.career_years,
        job.experience_level
      )

      // 가중 평균으로 총점 계산
      const totalScore = (
        skillsResult.score * 0.4 +      // 기술 스택 40%
        locationScore * 0.2 +           // 위치 20%
        salaryScore * 0.2 +             // 급여 20%
        experienceScore * 0.2           // 경력 20%
      )

      // 매칭 이유 생성
      const reasonsForMatch: string[] = []

      if (skillsResult.score > 0.7) {
        reasonsForMatch.push(`기술 스택 ${Math.round(skillsResult.score * 100)}% 매칭`)
      }
      if (locationScore > 0.8) {
        reasonsForMatch.push('근무 지역이 일치함')
      }
      if (salaryScore > 0.7) {
        reasonsForMatch.push('희망 급여 범위와 부합')
      }
      if (experienceScore > 0.8) {
        reasonsForMatch.push('경력 수준이 적합함')
      }

      return {
        jobId: job.id,
        userId: userId,
        totalScore,
        skillsScore: skillsResult.score,
        locationScore,
        salaryScore,
        experienceScore,
        details: {
          matchedSkills: skillsResult.matchedSkills,
          missingSkills: skillsResult.missingSkills,
          reasonsForMatch
        }
      }
    })

    // 점수순으로 정렬하고 상위 결과 반환
    return matchScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)

  } catch (error) {
    console.error('Error in getRecommendedJobsForUser:', error)
    throw error
  }
}

// 기업에게 맞는 지원자 추천
export async function getRecommendedCandidatesForJob(jobId: string, limit: number = 10): Promise<MatchScore[]> {
  try {
    // 채용공고 정보 조회
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        company_profiles (
          company_name,
          description
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !jobData) {
      throw new Error('채용공고를 찾을 수 없습니다.')
    }

    const job = jobData as unknown as JobPosting

    // 모든 구직자 프로필 조회 (이미 지원한 사람 제외)
    const { data: appliedUsers } = await supabase
      .from('applications')
      .select('user_id')
      .eq('job_id', jobId)

    const appliedUserIds = (appliedUsers as any)?.map((app: any) => app.user_id) || []

    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `)

    if (appliedUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${appliedUserIds.join(',')})`)
    }

    const { data: candidatesData, error: candidatesError } = await query

    if (candidatesError) throw candidatesError

    if (!candidatesData || candidatesData.length === 0) {
      return []
    }

    const candidates = candidatesData as unknown as UserProfile[]

    // 각 지원자에 대해 매칭 점수 계산
    const matchScores: MatchScore[] = candidates.map(candidate => {
      const skillsResult = calculateSkillsScore(
        candidate.skills || [],
        job.skills_required || []
      )

      const locationScore = calculateLocationScore(
        candidate.location,
        job.location
      )

      const salaryScore = calculateSalaryScore(
        candidate.desired_salary_min,
        candidate.desired_salary_max,
        job.salary_min,
        job.salary_max
      )

      const experienceScore = calculateExperienceScore(
        candidate.career_years,
        job.experience_level
      )

      // 가중 평균으로 총점 계산
      const totalScore = (
        skillsResult.score * 0.4 +      // 기술 스택 40%
        locationScore * 0.2 +           // 위치 20%
        salaryScore * 0.2 +             // 급여 20%
        experienceScore * 0.2           // 경력 20%
      )

      // 매칭 이유 생성
      const reasonsForMatch: string[] = []

      if (skillsResult.score > 0.7) {
        reasonsForMatch.push(`필요 기술의 ${Math.round(skillsResult.score * 100)}% 보유`)
      }
      if (locationScore > 0.8) {
        reasonsForMatch.push('근무 가능 지역 일치')
      }
      if (salaryScore > 0.7) {
        reasonsForMatch.push('급여 조건 부합')
      }
      if (experienceScore > 0.8) {
        reasonsForMatch.push('적합한 경력 수준')
      }

      return {
        jobId: jobId,
        userId: candidate.user_id,
        totalScore,
        skillsScore: skillsResult.score,
        locationScore,
        salaryScore,
        experienceScore,
        details: {
          matchedSkills: skillsResult.matchedSkills,
          missingSkills: skillsResult.missingSkills,
          reasonsForMatch
        }
      }
    })

    // 점수순으로 정렬하고 상위 결과 반환
    return matchScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)

  } catch (error) {
    console.error('Error in getRecommendedCandidatesForJob:', error)
    throw error
  }
}

// 매칭 점수를 텍스트로 변환
export function getMatchScoreLabel(score: number): string {
  if (score >= 0.9) return '매우 높음'
  if (score >= 0.7) return '높음'
  if (score >= 0.5) return '보통'
  if (score >= 0.3) return '낮음'
  return '매우 낮음'
}

// 매칭 점수에 따른 색상 클래스 반환
export function getMatchScoreColor(score: number): string {
  if (score >= 0.9) return 'text-green-600 bg-green-100'
  if (score >= 0.7) return 'text-blue-600 bg-blue-100'
  if (score >= 0.5) return 'text-yellow-600 bg-yellow-100'
  if (score >= 0.3) return 'text-orange-600 bg-orange-100'
  return 'text-red-600 bg-red-100'
}