// AI-powered resume analysis and job matching utilities
import { supabase } from './supabase'
import { UserProfile } from './profiles'
import { JobWithCompany } from './jobs'

export interface ResumeAnalysis {
  skills: string[]
  experience: {
    years: number
    level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
    companies: string[]
    positions: string[]
  }
  education: {
    degree?: string
    field?: string
    university?: string
  }
  languages: string[]
  certifications: string[]
  keywords: string[]
  summary: string
  strengths: string[]
  improvementAreas: string[]
  marketability: number // 0-100 점수
}

export interface JobMatchScore {
  overall: number
  skillMatch: number
  experienceMatch: number
  locationMatch: number
  salaryMatch: number
  industryMatch: number
  jobTypeMatch: number
  details: {
    matchedSkills: string[]
    missingSkills: string[]
    experienceGap: number
    recommendations: string[]
  }
}

export interface AIInterviewQuestion {
  question: string
  type: 'technical' | 'behavioral' | 'situational' | 'company_culture'
  difficulty: 'easy' | 'medium' | 'hard'
  expectedAnswer?: string
  tips: string[]
}

// Resume parsing and analysis
export class ResumeAnalyzer {
  private static readonly API_ENDPOINT = process.env.NEXT_PUBLIC_AI_API_URL || '/api/ai'

  // Extract text from uploaded resume file
  static async extractResumeText(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${this.API_ENDPOINT}/extract-text`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to extract text from resume')
      }

      const { text } = await response.json()
      return text
    } catch (error) {
      console.error('Resume text extraction failed:', error)
      throw error
    }
  }

  // Analyze resume content using AI
  static async analyzeResume(resumeText: string, userId?: string): Promise<ResumeAnalysis> {
    try {
      const response = await fetch(`${this.API_ENDPOINT}/analyze-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: resumeText,
          userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze resume')
      }

      const analysis: ResumeAnalysis = await response.json()

      // Save analysis to database if userId provided
      if (userId) {
        await this.saveResumeAnalysis(userId, analysis, resumeText)
      }

      return analysis
    } catch (error) {
      console.error('Resume analysis failed:', error)

      // Fallback: basic analysis using keyword matching
      return this.basicResumeAnalysis(resumeText)
    }
  }

  // Fallback basic analysis without AI API
  private static basicResumeAnalysis(text: string): ResumeAnalysis {
    const lowerText = text.toLowerCase()

    // Basic skill extraction
    const skillKeywords = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python', 'java',
      'spring', 'django', 'flask', 'mysql', 'postgresql', 'mongodb', 'redis', 'docker',
      'kubernetes', 'aws', 'azure', 'gcp', 'git', 'jenkins', 'ci/cd', 'rest api', 'graphql',
      'html', 'css', 'sass', 'webpack', 'next.js', 'express', 'fastapi', 'microservices'
    ]

    const foundSkills = skillKeywords.filter(skill =>
      lowerText.includes(skill.toLowerCase())
    )

    // Extract years of experience
    const experienceMatches = text.match(/(\d+)\s*(?:년|year)/gi) || []
    const experienceYears = Math.max(...experienceMatches.map(match =>
      parseInt(match.match(/\d+/)?.[0] || '0')
    ), 0)

    // Determine experience level
    let level: ResumeAnalysis['experience']['level'] = 'entry'
    if (experienceYears >= 10) level = 'executive'
    else if (experienceYears >= 7) level = 'senior'
    else if (experienceYears >= 3) level = 'mid'
    else if (experienceYears >= 1) level = 'junior'

    // Basic company extraction (common company name patterns)
    const companyPatterns = /(?:주식회사|㈜|회사|corporation|corp|inc|ltd|기업|그룹)\s*([가-힣a-zA-Z0-9\s]+)/gi
    const companies = Array.from(text.matchAll(companyPatterns))
      .map(match => match[1].trim())
      .filter(company => company.length > 1 && company.length < 30)
      .slice(0, 5)

    return {
      skills: foundSkills,
      experience: {
        years: experienceYears,
        level,
        companies,
        positions: []
      },
      education: {},
      languages: lowerText.includes('english') ? ['English'] : [],
      certifications: [],
      keywords: foundSkills,
      summary: `${experienceYears}년 경력의 ${level} 레벨 개발자`,
      strengths: foundSkills.slice(0, 3),
      improvementAreas: ['포트폴리오 보강', '기술 스택 다양화', '프로젝트 경험 확장'],
      marketability: Math.min(95, Math.max(30, foundSkills.length * 8 + experienceYears * 5))
    }
  }

  // Save resume analysis to database
  private static async saveResumeAnalysis(userId: string, analysis: ResumeAnalysis, resumeText: string) {
    try {
      await supabase
        .from('resume_analyses')
        .upsert([{
          user_id: userId,
          analysis: analysis,
          resume_text: resumeText,
          analyzed_at: new Date().toISOString(),
          version: 1
        }] as any)
    } catch (error) {
      console.error('Failed to save resume analysis:', error)
    }
  }

  // Get saved resume analysis
  static async getResumeAnalysis(userId: string): Promise<ResumeAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null

      return (data as any).analysis
    } catch (error) {
      console.error('Failed to get resume analysis:', error)
      return null
    }
  }
}

// AI-powered job matching
export class AIJobMatcher {
  // Calculate AI-enhanced job match score
  static async calculateJobMatchScore(
    userProfile: UserProfile,
    job: JobWithCompany,
    resumeAnalysis?: ResumeAnalysis
  ): Promise<JobMatchScore> {
    try {
      const response = await fetch(`${ResumeAnalyzer['API_ENDPOINT']}/job-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userProfile,
          job,
          resumeAnalysis
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate job match score')
      }

      return await response.json()
    } catch (error) {
      console.error('AI job matching failed, using fallback:', error)

      // Fallback to basic matching
      return this.basicJobMatch(userProfile, job, resumeAnalysis)
    }
  }

  // Fallback basic job matching
  private static basicJobMatch(
    userProfile: UserProfile,
    job: JobWithCompany,
    resumeAnalysis?: ResumeAnalysis
  ): JobMatchScore {
    const userSkills = resumeAnalysis?.skills || userProfile.skills || []
    const jobRequirements = job.requirements || []

    // Skill matching
    const matchedSkills = jobRequirements.filter(req =>
      userSkills.some(skill =>
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )
    )

    const missingSkills = jobRequirements.filter(req =>
      !matchedSkills.includes(req)
    )

    const skillMatch = jobRequirements.length > 0
      ? matchedSkills.length / jobRequirements.length * 100
      : 50

    // Experience matching
    const userExperience = resumeAnalysis?.experience.years || userProfile.career_years || 0
    const experienceMatch = this.calculateExperienceMatch(userExperience, job)

    // Location matching
    const locationMatch = this.calculateLocationMatch(
      userProfile.location,
      job.location
    )

    // Salary matching
    const salaryMatch = this.calculateSalaryMatch(
      (userProfile as any).preferred_salary_min,
      (userProfile as any).preferred_salary_max,
      job.salary_min,
      job.salary_max
    )

    // Industry matching
    const industryMatch = this.calculateIndustryMatch(userProfile, job)

    // Job type matching
    const jobTypeMatch = this.calculateJobTypeMatch(userProfile, job)

    // Overall score (enhanced weighted average including industry/job type)
    const overall = (
      skillMatch * 0.35 +
      experienceMatch * 0.25 +
      locationMatch * 0.15 +
      salaryMatch * 0.10 +
      industryMatch * 0.10 +
      jobTypeMatch * 0.05
    )

    const recommendations = []
    if (missingSkills.length > 0) {
      recommendations.push(`다음 스킬을 보강하면 더 좋은 매치가 될 수 있습니다: ${missingSkills.slice(0, 3).join(', ')}`)
    }
    if (experienceMatch < 70) {
      recommendations.push('경력이 부족할 수 있습니다. 관련 프로젝트나 교육을 통해 보완하세요.')
    }
    if (industryMatch < 60) {
      recommendations.push('다른 업종의 포지션이지만 전환 가능한 기회일 수 있습니다.')
    }
    if (jobTypeMatch < 60) {
      recommendations.push('직종이 다르지만 유사한 스킬을 활용할 수 있는 포지션입니다.')
    }
    if (overall > 80) {
      recommendations.push('매우 좋은 매치입니다! 적극적으로 지원해보세요.')
    } else if (overall > 65) {
      recommendations.push('좋은 매치입니다. 지원을 고려해보세요.')
    }

    return {
      overall: Math.round(overall),
      skillMatch: Math.round(skillMatch),
      experienceMatch: Math.round(experienceMatch),
      locationMatch: Math.round(locationMatch),
      salaryMatch: Math.round(salaryMatch),
      industryMatch: Math.round(industryMatch),
      jobTypeMatch: Math.round(jobTypeMatch),
      details: {
        matchedSkills,
        missingSkills,
        experienceGap: Math.max(0, this.extractRequiredExperience(job) - userExperience),
        recommendations
      }
    }
  }

  private static calculateExperienceMatch(userYears: number, job: JobWithCompany): number {
    const requiredYears = this.extractRequiredExperience(job)
    if (requiredYears === 0) return 80 // No specific requirement

    if (userYears >= requiredYears) return 100
    if (userYears >= requiredYears * 0.8) return 85
    if (userYears >= requiredYears * 0.6) return 70
    return 40
  }

  private static extractRequiredExperience(job: JobWithCompany): number {
    const description = (job.description || '').toLowerCase()
    const requirements = (job.requirements || []).join(' ').toLowerCase()
    const text = `${description} ${requirements}`

    const patterns = [
      /(\d+)\s*년\s*이상/,
      /(\d+)\+\s*years/,
      /(\d+)\s*years?\s*experience/
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return parseInt(match[1])
    }

    // Default experience levels
    if (text.includes('신입') || text.includes('entry')) return 0
    if (text.includes('주니어') || text.includes('junior')) return 2
    if (text.includes('시니어') || text.includes('senior')) return 7

    return 3 // Default mid-level
  }

  private static calculateLocationMatch(userLocation: string | null, jobLocation: string | null): number {
    if (!userLocation || !jobLocation) return 50

    const userLoc = userLocation.toLowerCase()
    const jobLoc = jobLocation.toLowerCase()

    if (userLoc === jobLoc) return 100
    if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) return 85

    // Same city/province
    const userCity = userLoc.split(' ')[0]
    const jobCity = jobLoc.split(' ')[0]
    if (userCity === jobCity) return 70

    return 30
  }

  private static calculateSalaryMatch(
    userMin?: number,
    userMax?: number,
    jobMin?: number | null,
    jobMax?: number | null
  ): number {
    if (!userMin && !userMax) return 50
    if (!jobMin && !jobMax) return 50

    const userMinSal = userMin || 0
    const userMaxSal = userMax || Infinity
    const jobMinSal = jobMin || 0
    const jobMaxSal = jobMax || Infinity

    // Check overlap
    const overlapMin = Math.max(userMinSal, jobMinSal)
    const overlapMax = Math.min(userMaxSal, jobMaxSal)

    if (overlapMax >= overlapMin) {
      return 100 // Ranges overlap
    }

    // Calculate distance between ranges
    const distance = Math.min(
      Math.abs(userMinSal - jobMaxSal),
      Math.abs(jobMinSal - userMaxSal)
    )

    // Convert distance to match percentage
    const avgSalary = (userMinSal + userMaxSal) / 2
    const distanceRatio = distance / avgSalary

    return Math.max(10, 100 - distanceRatio * 100)
  }

  // Calculate industry matching score
  private static calculateIndustryMatch(userProfile: UserProfile, job: JobWithCompany): number {
    const userIndustry = (userProfile as any).industry?.toLowerCase()
    const jobIndustry = (job.company_profiles as any)?.industry?.toLowerCase() || (job as any).industry?.toLowerCase()

    if (!userIndustry || !jobIndustry) return 50

    // Direct match
    if (userIndustry === jobIndustry) return 100

    // Partial match or related industries
    const industryMap: Record<string, string[]> = {
      'it/소프트웨어': ['기술', 'tech', 'software', 'it', '소프트웨어', '테크'],
      '금융/은행': ['금융', 'finance', 'bank', '은행', 'fintech', '핀테크'],
      '제조업': ['제조', 'manufacturing', '생산', '공장'],
      '건설/부동산': ['건설', 'construction', '부동산', 'real estate'],
      '유통/소매': ['유통', 'retail', '소매', '쇼핑', 'commerce'],
      '의료/제약': ['의료', 'healthcare', '제약', 'pharma', '병원'],
      '교육': ['교육', 'education', '학교', '학원', 'edtech'],
      '미디어/엔터테인먼트': ['미디어', 'media', '엔터테인먼트', 'entertainment', '방송'],
      '스타트업': ['스타트업', 'startup', '벤처', 'venture'],
      '컨설팅': ['컨설팅', 'consulting', '자문', 'advisory']
    }

    for (const [category, keywords] of Object.entries(industryMap)) {
      if (userIndustry === category.toLowerCase()) {
        if (keywords.some(keyword => jobIndustry.includes(keyword))) {
          return 85
        }
      }
    }

    return 30
  }

  // Calculate job type matching score
  private static calculateJobTypeMatch(userProfile: UserProfile, job: JobWithCompany): number {
    const userJobType = (userProfile as any).job_type?.toLowerCase()
    const jobTitle = job.title?.toLowerCase()
    const jobDescription = job.description?.toLowerCase() || ''

    if (!userJobType || !jobTitle) return 50

    // Direct match in title
    if (jobTitle.includes(userJobType)) return 100

    // Job type keyword mapping
    const jobTypeMap: Record<string, string[]> = {
      'frontend 개발자': ['frontend', 'front-end', 'react', 'vue', 'angular', 'ui', 'web'],
      'backend 개발자': ['backend', 'back-end', 'server', 'api', 'node', 'java', 'python'],
      'full stack 개발자': ['fullstack', 'full-stack', 'full stack', '풀스택'],
      'devops 엔지니어': ['devops', 'infra', 'infrastructure', 'aws', 'cloud', 'kubernetes'],
      'qa 엔지니어': ['qa', 'quality', 'test', '테스트', '품질'],
      'ui/ux 디자이너': ['ui', 'ux', 'design', 'designer', '디자인'],
      'product manager': ['product', 'pm', 'manager', '기획'],
      'data scientist': ['data', 'analyst', 'science', '데이터', '분석'],
      'ai/ml 엔지니어': ['ai', 'ml', 'machine learning', 'artificial intelligence'],
      'mobile 개발자': ['mobile', 'ios', 'android', 'app', '모바일'],
      '시스템 관리자': ['system', 'admin', 'administrator', '시스템'],
      '보안 전문가': ['security', 'cyber', '보안', 'security engineer']
    }

    for (const [jobType, keywords] of Object.entries(jobTypeMap)) {
      if (userJobType === jobType.toLowerCase()) {
        if (keywords.some(keyword =>
          jobTitle.includes(keyword) || jobDescription.includes(keyword)
        )) {
          return 90
        }
      }
    }

    // Partial match
    const userJobWords = userJobType.split(' ')
    const titleWords = jobTitle.split(' ')
    const commonWords = userJobWords.filter((word: string) =>
      titleWords.some((titleWord: string) => titleWord.includes(word) || word.includes(titleWord))
    )

    if (commonWords.length > 0) {
      return Math.min(80, commonWords.length * 30)
    }

    return 25
  }

  // Get AI-powered job recommendations
  static async getSmartJobRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Array<{ job: JobWithCompany; matchScore: JobMatchScore }>> {
    try {
      // Get user profile and resume analysis
      const userProfileResponse: any = await supabase.from('user_profiles').select('*').eq('user_id', userId).single()
      const resumeAnalysis = await ResumeAnalyzer.getResumeAnalysis(userId)

      if (!userProfileResponse.data) {
        throw new Error('User profile not found')
      }

      const userProfile = userProfileResponse.data as unknown as UserProfile

      // Get active jobs
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
        .limit(50)

      if (!jobs) return []

      // Calculate match scores for each job
      const jobsWithScores = await Promise.all(
        jobs.map(async (job: any) => {
          const matchScore = await this.calculateJobMatchScore(
            userProfile,
            job,
            resumeAnalysis || undefined
          )

          return {
            job,
            matchScore
          }
        })
      )

      // Sort by overall match score and return top results
      return jobsWithScores
        .sort((a, b) => b.matchScore.overall - a.matchScore.overall)
        .slice(0, limit)

    } catch (error) {
      console.error('Smart job recommendations failed:', error)
      return []
    }
  }
}

// AI Interview Assistant
export class AIInterviewAssistant {
  // Generate interview questions based on job and candidate profile
  static async generateInterviewQuestions(
    jobId: string,
    userId?: string,
    questionCount: number = 10
  ): Promise<AIInterviewQuestion[]> {
    try {
      const response = await fetch(`${ResumeAnalyzer['API_ENDPOINT']}/interview-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          userId,
          questionCount
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate interview questions')
      }

      return await response.json()
    } catch (error) {
      console.error('AI interview questions failed, using fallback:', error)

      // Fallback: predefined questions
      return this.getDefaultInterviewQuestions(questionCount)
    }
  }

  // Fallback default interview questions
  private static getDefaultInterviewQuestions(count: number): AIInterviewQuestion[] {
    const defaultQuestions: AIInterviewQuestion[] = [
      {
        question: "자기소개를 해주세요.",
        type: "behavioral",
        difficulty: "easy",
        tips: ["경력과 강점을 중심으로 간결하게 답변", "지원하는 포지션과 연관지어 설명"]
      },
      {
        question: "이 회사에 지원한 이유는 무엇인가요?",
        type: "company_culture",
        difficulty: "easy",
        tips: ["회사의 비전과 본인의 목표가 일치함을 강조", "구체적인 조사 내용 언급"]
      },
      {
        question: "가장 어려웠던 프로젝트와 그것을 어떻게 해결했는지 설명해주세요.",
        type: "situational",
        difficulty: "medium",
        tips: ["STAR 기법 활용 (Situation, Task, Action, Result)", "구체적인 수치나 결과 제시"]
      },
      {
        question: "팀 내에서 갈등이 있었던 경험과 해결 방법을 말씀해주세요.",
        type: "behavioral",
        difficulty: "medium",
        tips: ["소통과 협업 능력 강조", "건설적인 해결 과정 설명"]
      },
      {
        question: "5년 후 자신의 모습은 어떨 것 같나요?",
        type: "behavioral",
        difficulty: "easy",
        tips: ["회사의 성장과 연관지어 답변", "현실적이면서도 도전적인 목표 제시"]
      },
      {
        question: "새로운 기술을 배우는 방법과 최근에 배운 기술에 대해 설명해주세요.",
        type: "technical",
        difficulty: "medium",
        tips: ["지속적인 학습 의지 보여주기", "실제 적용 경험 언급"]
      },
      {
        question: "동료들이 당신을 어떤 사람이라고 평가할 것 같나요?",
        type: "behavioral",
        difficulty: "medium",
        tips: ["객관적인 시각으로 답변", "업무와 관련된 긍정적 특성 강조"]
      },
      {
        question: "실패했던 경험과 그로부터 배운 점을 말씀해주세요.",
        type: "situational",
        difficulty: "medium",
        tips: ["실패를 통한 성장 스토리", "개선된 점과 학습 내용 구체적으로 설명"]
      },
      {
        question: "스트레스를 받는 상황에서 어떻게 대처하시나요?",
        type: "behavioral",
        difficulty: "easy",
        tips: ["건강한 스트레스 관리 방법", "업무 효율성 유지 방안"]
      },
      {
        question: "우리 회사에서 어떤 기여를 할 수 있다고 생각하시나요?",
        type: "company_culture",
        difficulty: "medium",
        tips: ["본인의 강점과 회사의 니즈 연결", "구체적인 기여 방안 제시"]
      }
    ]

    return defaultQuestions.slice(0, count)
  }

  // Evaluate interview answer
  static async evaluateAnswer(
    question: string,
    answer: string,
    jobContext?: any
  ): Promise<{
    score: number
    feedback: string[]
    suggestions: string[]
  }> {
    try {
      const response = await fetch(`${ResumeAnalyzer['API_ENDPOINT']}/evaluate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          answer,
          jobContext
        })
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate answer')
      }

      return await response.json()
    } catch (error) {
      console.error('Answer evaluation failed:', error)

      // Basic evaluation
      const wordCount = answer.trim().split(/\s+/).length
      let score = 50

      if (wordCount > 20) score += 20
      if (wordCount > 50) score += 10
      if (answer.includes('경험') || answer.includes('프로젝트')) score += 10
      if (answer.includes('결과') || answer.includes('성과')) score += 10

      return {
        score: Math.min(100, score),
        feedback: [`${wordCount}개 단어로 답변하셨습니다.`],
        suggestions: ['구체적인 경험과 결과를 포함해보세요.', 'STAR 기법을 활용해보세요.']
      }
    }
  }
}