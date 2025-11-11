/**
 * 웹 스크레이핑 타입 정의
 *
 * 이 파일은 타입만 포함하며, Puppeteer 관련 코드를 포함하지 않습니다.
 * 클라이언트 컴포넌트에서 안전하게 import할 수 있습니다.
 */

export interface ScraperParams {
  keyword?: string
  industry?: string
  subIndustry?: string
  location?: string
  minSalary?: number
  maxSalary?: number
  minExperience?: number
  maxExperience?: number
  employmentType?: string
  techStack?: string
  benefits?: string
  limit?: number // 크롤링할 최대 공고 수
}

export interface ScrapedJob {
  id: string
  title: string
  company: string
  companyId: string
  location: string
  salary: {
    min: number
    max: number
  }
  experience?: {
    min: number
    max: number
  }
  education?: string
  employmentType?: string
  workType: 'onsite' | 'remote' | 'dispatch'
  description: string
  requirements: string[]
  skills: string[]
  keywords?: string[]
  industry: string
  deadline: string
  postedAt: string
  sourceUrl: string
  source: string
  companyLogo?: string
}
