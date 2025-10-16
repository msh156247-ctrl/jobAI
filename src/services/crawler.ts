import type { Job } from '@/types'

// 크롤링된 채용 데이터 타입
export interface CrawledJobData {
  title: string
  companyName: string
  location: string
  salary?: string
  experience: string
  education: string
  skills: string[]
  description: string
  externalUrl: string
  source: 'saramin' | 'jobkorea' | 'wanted' | 'linkedin'
  postedDate: string
  deadline?: string
}

// Mock 크롤링 데이터
const mockCrawledJobs: CrawledJobData[] = [
  {
    title: '프론트엔드 개발자 (React/Next.js)',
    companyName: '네이버',
    location: '경기 성남시 분당구',
    salary: '회사내규에 따름',
    experience: '경력 3년↑',
    education: '대학교 졸업 (4년)',
    skills: ['React', 'Next.js', 'TypeScript', 'JavaScript'],
    description: 'React 및 Next.js를 활용한 웹 서비스 개발 담당',
    externalUrl: 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=12345',
    source: 'saramin',
    postedDate: '2025-09-28',
    deadline: '2025-10-28'
  },
  {
    title: '백엔드 개발자 (Java/Spring)',
    companyName: '쿠팡',
    location: '서울 송파구',
    salary: '5,000~8,000만원',
    experience: '경력 5년↑',
    education: '대학교 졸업 (4년)',
    skills: ['Java', 'Spring Boot', 'MySQL', 'AWS'],
    description: 'MSA 기반 백엔드 시스템 설계 및 개발',
    externalUrl: 'https://www.jobkorea.co.kr/Recruit/GI_Read/45678',
    source: 'jobkorea',
    postedDate: '2025-09-27',
    deadline: '2025-10-27'
  },
  {
    title: 'AI/ML 엔지니어',
    companyName: '토스',
    location: '서울 강남구',
    salary: '7,000~10,000만원',
    experience: '경력 4년↑',
    education: '석사 이상',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'ML', 'Deep Learning'],
    description: '금융 AI 모델 개발 및 서비스 적용',
    externalUrl: 'https://www.wanted.co.kr/wd/78910',
    source: 'wanted',
    postedDate: '2025-09-26',
    deadline: '2025-11-26'
  },
  {
    title: 'DevOps 엔지니어',
    companyName: '배달의민족',
    location: '서울 송파구',
    salary: '6,000~9,000만원',
    experience: '경력 3년↑',
    education: '대학교 졸업 (4년)',
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
    description: 'MSA 인프라 구축 및 운영 자동화',
    externalUrl: 'https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=23456',
    source: 'saramin',
    postedDate: '2025-09-25',
    deadline: '2025-10-25'
  },
  {
    title: '풀스택 개발자',
    companyName: '당근마켓',
    location: '서울 구로구',
    salary: '5,000~7,500만원',
    experience: '경력 2년↑',
    education: '학력무관',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    description: '커머스 플랫폼 프론트엔드/백엔드 개발',
    externalUrl: 'https://www.wanted.co.kr/wd/34567',
    source: 'wanted',
    postedDate: '2025-09-24'
  }
]

// 크롤링 데이터를 Job 타입으로 변환
function convertCrawledJobToJob(crawled: CrawledJobData, index: number): Job {
  return {
    id: `external_${crawled.source}_${index}_${Date.now()}`,
    companyId: `external_company_${crawled.companyName.replace(/\s/g, '_')}`,
    companyName: crawled.companyName,
    title: crawled.title,
    position: crawled.title,
    location: crawled.location,
    salary: crawled.salary,
    employmentType: 'full-time',
    experience: crawled.experience,
    education: crawled.education,
    skills: crawled.skills,
    description: crawled.description,
    postedDate: crawled.postedDate,
    deadline: crawled.deadline,

    // 외부 데이터 플래그
    isExternal: true,
    externalUrl: crawled.externalUrl,
    source: crawled.source
  }
}

// 사람인 크롤링 (Mock)
export async function crawlSaramin(): Promise<Job[]> {
  try {
    // TODO: 실제 크롤링 로직
    // - Puppeteer 또는 Playwright 사용
    // - robots.txt 준수
    // - Rate limiting 적용

    // Mock 데이터 반환
    const saraminJobs = mockCrawledJobs
      .filter(job => job.source === 'saramin')
      .map((job, index) => convertCrawledJobToJob(job, index))

    return saraminJobs
  } catch (error) {
    console.error('Saramin crawling failed:', error)
    return []
  }
}

// 잡코리아 크롤링 (Mock)
export async function crawlJobKorea(): Promise<Job[]> {
  try {
    const jobkoreaJobs = mockCrawledJobs
      .filter(job => job.source === 'jobkorea')
      .map((job, index) => convertCrawledJobToJob(job, index))

    return jobkoreaJobs
  } catch (error) {
    console.error('JobKorea crawling failed:', error)
    return []
  }
}

// 원티드 크롤링 (Mock)
export async function crawlWanted(): Promise<Job[]> {
  try {
    const wantedJobs = mockCrawledJobs
      .filter(job => job.source === 'wanted')
      .map((job, index) => convertCrawledJobToJob(job, index))

    return wantedJobs
  } catch (error) {
    console.error('Wanted crawling failed:', error)
    return []
  }
}

// 모든 소스에서 크롤링
export async function crawlAllSources(): Promise<Job[]> {
  try {
    const [saraminJobs, jobkoreaJobs, wantedJobs] = await Promise.all([
      crawlSaramin(),
      crawlJobKorea(),
      crawlWanted()
    ])

    return [...saraminJobs, ...jobkoreaJobs, ...wantedJobs]
  } catch (error) {
    console.error('Crawling all sources failed:', error)
    return []
  }
}

// 크롤링 데이터 캐싱 (1시간)
let cachedCrawledJobs: Job[] = []
let lastCrawlTime: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1시간

// 캐시를 활용한 크롤링 데이터 가져오기
export async function getCrawledJobs(forceRefresh: boolean = false): Promise<Job[]> {
  const now = Date.now()

  if (!forceRefresh && cachedCrawledJobs.length > 0 && now - lastCrawlTime < CACHE_DURATION) {
    return cachedCrawledJobs
  }

  const jobs = await crawlAllSources()
  cachedCrawledJobs = jobs
  lastCrawlTime = now

  return jobs
}

// 외부 공고인지 확인
export function isExternalJob(job: Job): boolean {
  return job.isExternal === true
}

// 채팅 상담 가능 여부 확인
export function isChatAvailable(job: Job): boolean {
  return !isExternalJob(job)
}
