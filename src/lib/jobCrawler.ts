/**
 * 한국 주요 구직 사이트 크롤링 서비스
 * 사람인, 잡코리아, 원티드 등에서 채용 공고 수집
 */

export interface CrawledJob {
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
  workType: 'onsite' | 'remote' | 'dispatch'
  description: string
  requirements: string[]
  skills: string[]
  keywords?: string[]
  industry: string
  postedAt: string
  deadline: string
  source: 'saramin' | 'jobkorea' | 'wanted' | 'incruit' | 'jobplanet'
  sourceUrl: string
  crawledAt: string
}

export interface CrawlMetadata {
  lastCrawl: string
  nextCrawl: string
  totalJobs: number
  sourceStats: {
    [key: string]: number
  }
}

const STORAGE_KEY_JOBS = 'jobai_crawled_jobs'
const STORAGE_KEY_METADATA = 'jobai_crawl_metadata'
const CRAWL_INTERVAL_DAYS = 14 // 2주마다 업데이트

// 업종별 직무 데이터
const jobsByIndustry: Record<string, string[]> = {
  'IT/소프트웨어': [
    '프론트엔드 개발자', '백엔드 개발자', '풀스택 개발자', 'DevOps 엔지니어',
    'iOS 개발자', 'Android 개발자', 'React 개발자', 'Node.js 개발자',
    'Python 개발자', 'Java 개발자', 'QA 엔지니어', '데이터 사이언티스트',
    '머신러닝 엔지니어', 'AI 연구원', '시스템 엔지니어'
  ],
  '디자인': [
    'UI/UX 디자이너', '웹 디자이너', '그래픽 디자이너', '제품 디자이너',
    '영상 디자이너', '모션 그래픽 디자이너', '3D 디자이너', '브랜드 디자이너'
  ],
  '기획/PM': [
    '서비스 기획자', '프로젝트 매니저', '제품 매니저', '데이터 분석가',
    '상품 기획자', '전략 기획자', 'PO (Product Owner)'
  ],
  '마케팅': [
    '디지털 마케터', '콘텐츠 마케터', '브랜드 마케터', '퍼포먼스 마케터',
    'SNS 마케터', '그로스 해커', 'SEO 전문가'
  ],
  '영업/제휴': [
    'B2B 영업', 'B2C 영업', '해외 영업', '제휴 담당자',
    '영업 관리자', '기술 영업', '솔루션 영업'
  ],
  '경영지원': [
    '인사 담당자', '총무 담당자', '재무 담당자', '회계 담당자',
    '법무 담당자', 'IR 담당자', '경영 지원'
  ],
  '제조/생산': [
    '생산 관리자', '품질 관리자', '공정 관리자', '설비 관리자',
    '안전 관리자', '생산 기술자', '제조 엔지니어'
  ],
  '교육': [
    '강사', '교육 기획자', '교육 운영자', '콘텐츠 개발자',
    '커리큘럼 개발자', '온라인 강사', '교육 컨설턴트'
  ],
  '의료/바이오': [
    '임상 연구원', '바이오 연구원', '제약 연구원', '의료 기기 연구원',
    '간호사', '의료 코디네이터', 'CRA (임상연구관리자)'
  ],
  '금융': [
    '자산 관리사', '재무 설계사', '금융 상품 개발자', '리스크 매니저',
    '투자 분석가', '회계사', '세무사', '애널리스트'
  ]
}

const skillsByIndustry: Record<string, string[]> = {
  'IT/소프트웨어': ['JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Python', 'Java', 'Spring', 'Docker', 'Kubernetes'],
  '디자인': ['Figma', 'Sketch', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro', '3D Max', 'Blender'],
  '기획/PM': ['기획력', '프로젝트관리', 'SQL', 'Excel', '데이터분석', 'JIRA', 'Confluence'],
  '마케팅': ['Google Analytics', 'SEO', 'SNS마케팅', '콘텐츠제작', '광고운영', '마케팅전략'],
  '영업/제휴': ['영업전략', '제안서작성', 'B2B영업', '계약협상', '고객관리', 'CRM'],
  '경영지원': ['인사관리', '노무관리', '재무회계', '법무지식', '총무', 'ERP'],
  '제조/생산': ['품질관리', '공정관리', 'CAD', 'Six Sigma', 'Lean', '안전관리'],
  '교육': ['강의스킬', '커리큘럼개발', '교수법', '평가방법', '콘텐츠제작', 'LMS'],
  '의료/바이오': ['임상지식', '연구개발', 'GMP', '의료법규', '임상시험', '환자관리'],
  '금융': ['금융지식', '리스크관리', 'Excel', 'SQL', '재무분석', '회계', 'VBA']
}

const companies = [
  { name: '네이버', id: 'naver' },
  { name: '카카오', id: 'kakao' },
  { name: '쿠팡', id: 'coupang' },
  { name: '토스', id: 'toss' },
  { name: '배달의민족', id: 'baemin' },
  { name: '라인', id: 'line' },
  { name: '당근마켓', id: 'daangn' },
  { name: 'SK텔레콤', id: 'skt' },
  { name: 'KT', id: 'kt' },
  { name: 'LG유플러스', id: 'lgu' },
  { name: '삼성전자', id: 'samsung' },
  { name: 'LG전자', id: 'lg' },
  { name: '현대자동차', id: 'hyundai' },
  { name: '기아', id: 'kia' },
  { name: 'KB국민은행', id: 'kb' },
  { name: '신한은행', id: 'shinhan' },
  { name: 'NH농협은행', id: 'nh' },
  { name: '우리은행', id: 'woori' },
  { name: '하나은행', id: 'hana' },
  { name: 'IBK기업은행', id: 'ibk' }
]

const locations = [
  '서울 강남구', '서울 서초구', '서울 송파구', '서울 영등포구', '서울 마포구',
  '서울 종로구', '서울 중구', '서울 성동구', '서울 용산구', '서울 강서구',
  '경기 성남시', '경기 수원시', '경기 안양시', '경기 고양시', '경기 부천시',
  '인천 연수구', '인천 남동구', '부산 해운대구', '대전 유성구', '대구 수성구'
]

const keywords = [
  ['연봉협상가능', '워라벨', '유연근무', '복지우수'],
  ['재택근무', '연차자유', '스톡옵션', '성과급'],
  ['식대지원', '4대보험', '퇴직금', '인센티브'],
  ['자기계발비', '도서구입비', '커피무료', '간식제공']
]

// 공고 생성 헬퍼 함수
function generateJob(
  id: string,
  source: 'saramin' | 'jobkorea' | 'wanted' | 'incruit' | 'jobplanet',
  industry: string,
  index: number
): CrawledJob {
  const company = companies[index % companies.length]
  const jobs = jobsByIndustry[industry] || ['일반 직원']
  const title = jobs[index % jobs.length]
  const skills = skillsByIndustry[industry] || []
  const selectedSkills = skills.slice(0, 3 + (index % 3))
  const location = locations[index % locations.length]
  const workTypes: ('onsite' | 'remote' | 'dispatch')[] = ['onsite', 'remote', 'dispatch']
  const workType = workTypes[index % workTypes.length]

  const salaryBase = 3000 + (index % 10) * 500
  const salaryMin = salaryBase + (index % 5) * 100
  const salaryMax = salaryMin + 1000 + (index % 8) * 200

  const expMin = index % 6
  const expMax = expMin + (index % 3) + 2

  const selectedKeywords = keywords[index % keywords.length]

  const daysAgo = index % 20
  const postedDate = new Date()
  postedDate.setDate(postedDate.getDate() - daysAgo)

  const deadlineDate = new Date()
  deadlineDate.setDate(deadlineDate.getDate() + 30 - daysAgo)

  // 실제 구직 사이트 URL 형식으로 생성
  const jobIdNumber = 10000000 + parseInt(id.split('-')[1] || '1') * 1000 + index
  const sourceUrls: Record<string, string> = {
    saramin: `https://www.saramin.co.kr/zf_user/jobs/relay/view?isMypage=no&rec_idx=${jobIdNumber}&view_type=list`,
    jobkorea: `https://www.jobkorea.co.kr/Recruit/GI_Read/${jobIdNumber}?sc=501`,
    wanted: `https://www.wanted.co.kr/wd/${jobIdNumber}`,
    incruit: `https://www.incruit.com/job/${jobIdNumber}`,
    jobplanet: `https://www.jobplanet.co.kr/job/${jobIdNumber}`
  }

  return {
    id,
    title,
    company: company.name,
    companyId: company.id,
    location,
    salary: { min: salaryMin, max: salaryMax },
    experience: { min: expMin, max: expMax },
    workType,
    description: `${company.name}에서 ${title}을(를) 모집합니다. ${industry} 분야에서 함께 성장할 인재를 찾습니다.`,
    requirements: [
      `${industry} 분야 ${expMin}년 이상 경력`,
      `${selectedSkills[0] || '관련 기술'} 활용 능력`,
      '우수한 커뮤니케이션 능력'
    ],
    skills: selectedSkills,
    keywords: selectedKeywords,
    industry,
    postedAt: postedDate.toISOString(),
    deadline: deadlineDate.toISOString(),
    source,
    sourceUrl: sourceUrls[source],
    crawledAt: new Date().toISOString()
  }
}

/**
 * 크롤링된 데이터 가져오기
 */
export function getCrawledJobs(): CrawledJob[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY_JOBS)
    if (!stored) return []

    const jobs = JSON.parse(stored)

    // 만료된 데이터 확인 (2주 이상 지난 데이터)
    const metadata = getCrawlMetadata()
    if (metadata && shouldCrawl(metadata)) {
      console.log('크롤링 데이터가 만료되었습니다. 새로운 데이터를 가져와야 합니다.')
    }

    return jobs
  } catch (error) {
    console.error('Failed to load crawled jobs:', error)
    return []
  }
}

/**
 * 크롤링 메타데이터 가져오기
 */
export function getCrawlMetadata(): CrawlMetadata | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY_METADATA)
    if (!stored) return null

    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load crawl metadata:', error)
    return null
  }
}

/**
 * 크롤링이 필요한지 확인
 */
export function shouldCrawl(metadata: CrawlMetadata | null): boolean {
  if (!metadata) return true

  const now = new Date()
  const nextCrawl = new Date(metadata.nextCrawl)

  return now >= nextCrawl
}

/**
 * 크롤링 데이터 저장
 */
export function saveCrawledJobs(jobs: CrawledJob[]): void {
  if (typeof window === 'undefined') return

  try {
    const now = new Date()
    const nextCrawl = new Date(now)
    nextCrawl.setDate(nextCrawl.getDate() + CRAWL_INTERVAL_DAYS)

    const sourceStats: { [key: string]: number } = {}
    jobs.forEach(job => {
      sourceStats[job.source] = (sourceStats[job.source] || 0) + 1
    })

    const metadata: CrawlMetadata = {
      lastCrawl: now.toISOString(),
      nextCrawl: nextCrawl.toISOString(),
      totalJobs: jobs.length,
      sourceStats
    }

    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs))
    localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(metadata))
  } catch (error) {
    console.error('Failed to save crawled jobs:', error)
  }
}

/**
 * 사람인 크롤링 (시뮬레이션)
 * 실제 환경에서는 백엔드 API를 통해 크롤링해야 합니다
 */
async function crawlSaramin(): Promise<CrawledJob[]> {
  // 실제로는 백엔드 API 호출
  // const response = await fetch('/api/crawl/saramin')
  // return await response.json()

  const jobs: CrawledJob[] = []
  const industries = Object.keys(jobsByIndustry)

  // 각 업종별로 15개씩 공고 생성 (총 150개)
  industries.forEach((industry, industryIdx) => {
    for (let i = 0; i < 15; i++) {
      const id = `saramin-${String(industryIdx * 15 + i + 1).padStart(4, '0')}`
      jobs.push(generateJob(id, 'saramin', industry, industryIdx * 15 + i))
    }
  })

  return jobs
}

/**
 * 잡코리아 크롤링 (시뮬레이션)
 */
async function crawlJobkorea(): Promise<CrawledJob[]> {
  const jobs: CrawledJob[] = []
  const industries = Object.keys(jobsByIndustry)

  industries.forEach((industry, industryIdx) => {
    for (let i = 0; i < 15; i++) {
      const id = `jobkorea-${String(industryIdx * 15 + i + 1).padStart(4, '0')}`
      jobs.push(generateJob(id, 'jobkorea', industry, industryIdx * 15 + i + 150))
    }
  })

  return jobs
}

/**
 * 원티드 크롤링 (시뮬레이션)
 */
async function crawlWanted(): Promise<CrawledJob[]> {
  const jobs: CrawledJob[] = []
  const industries = Object.keys(jobsByIndustry)

  industries.forEach((industry, industryIdx) => {
    for (let i = 0; i < 15; i++) {
      const id = `wanted-${String(industryIdx * 15 + i + 1).padStart(4, '0')}`
      jobs.push(generateJob(id, 'wanted', industry, industryIdx * 15 + i + 300))
    }
  })

  return jobs
}

/**
 * 인크루트 크롤링 (시뮬레이션)
 */
async function crawlIncruit(): Promise<CrawledJob[]> {
  const jobs: CrawledJob[] = []
  const industries = Object.keys(jobsByIndustry)

  industries.forEach((industry, industryIdx) => {
    for (let i = 0; i < 15; i++) {
      const id = `incruit-${String(industryIdx * 15 + i + 1).padStart(4, '0')}`
      jobs.push(generateJob(id, 'incruit', industry, industryIdx * 15 + i + 450))
    }
  })

  return jobs
}

/**
 * 잡플래닛 크롤링 (시뮬레이션)
 */
async function crawlJobplanet(): Promise<CrawledJob[]> {
  const jobs: CrawledJob[] = []
  const industries = Object.keys(jobsByIndustry)

  industries.forEach((industry, industryIdx) => {
    for (let i = 0; i < 15; i++) {
      const id = `jobplanet-${String(industryIdx * 15 + i + 1).padStart(4, '0')}`
      jobs.push(generateJob(id, 'jobplanet', industry, industryIdx * 15 + i + 600))
    }
  })

  return jobs
}

/**
 * 특정 사이트만 크롤링
 */
export async function crawlSingleSite(siteName: string): Promise<CrawledJob[]> {
  console.log(`${siteName} 크롤링 시작...`)

  try {
    let newJobs: CrawledJob[] = []

    switch (siteName) {
      case '사람인':
        newJobs = await crawlSaramin()
        break
      case '잡코리아':
        newJobs = await crawlJobkorea()
        break
      case '원티드':
        newJobs = await crawlWanted()
        break
      case '인크루트':
        newJobs = await crawlIncruit()
        break
      case '잡플래닛':
        newJobs = await crawlJobplanet()
        break
      default:
        console.error(`알 수 없는 사이트: ${siteName}`)
        return []
    }

    // 기존 크롤링 데이터 가져오기
    const existingJobs = getCrawledJobs()

    // 기존 사이트의 데이터는 제거하고 새 데이터 추가
    const sourceMap: Record<string, string> = {
      '사람인': 'saramin',
      '잡코리아': 'jobkorea',
      '원티드': 'wanted',
      '인크루트': 'incruit',
      '잡플래닛': 'jobplanet'
    }
    const source = sourceMap[siteName]
    const filteredExisting = existingJobs.filter(job => job.source !== source)
    const updatedJobs = [...filteredExisting, ...newJobs]

    // 저장
    saveCrawledJobs(updatedJobs)

    console.log(`${siteName} 크롤링 완료: ${newJobs.length}개 공고`)
    return updatedJobs
  } catch (error) {
    console.error(`${siteName} 크롤링 실패:`, error)
    return []
  }
}

/**
 * 모든 크롤링 데이터 삭제
 */
export function clearAllCrawledData() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY_JOBS)
    localStorage.removeItem(STORAGE_KEY_METADATA)
    console.log('모든 크롤링 데이터가 삭제되었습니다.')
  } catch (error) {
    console.error('크롤링 데이터 삭제 실패:', error)
  }
}

/**
 * 모든 사이트 크롤링 실행
 */
export async function crawlAllSites(): Promise<CrawledJob[]> {
  console.log('크롤링 시작...')

  try {
    const results = await Promise.all([
      crawlSaramin(),
      crawlJobkorea(),
      crawlWanted(),
      crawlIncruit(),
      crawlJobplanet()
    ])

    const allJobs = results.flat()
    console.log(`총 ${allJobs.length}개 공고 크롤링 완료`)

    // 크롤링된 데이터 저장
    saveCrawledJobs(allJobs)

    return allJobs
  } catch (error) {
    console.error('크롤링 실패:', error)
    return []
  }
}

/**
 * 자동 크롤링 초기화
 * 앱 시작 시 호출하여 자동 업데이트 설정
 */
export function initAutoCrawl(): void {
  if (typeof window === 'undefined') return

  const metadata = getCrawlMetadata()

  // 첫 실행이거나 크롤링이 필요한 경우
  if (shouldCrawl(metadata)) {
    console.log('자동 크롤링 실행 중...')
    crawlAllSites()
  } else if (metadata) {
    console.log(`다음 크롤링 예정: ${metadata.nextCrawl}`)
  }

  // 주기적으로 크롤링 필요 여부 확인 (1시간마다)
  setInterval(() => {
    const currentMetadata = getCrawlMetadata()
    if (shouldCrawl(currentMetadata)) {
      console.log('예정된 크롤링 실행 중...')
      crawlAllSites()
    }
  }, 60 * 60 * 1000) // 1시간
}

/**
 * 크롤링 데이터와 Mock 데이터 통합
 */
export function getMergedJobs(mockJobs: any[]): any[] {
  const crawledJobs = getCrawledJobs()

  // crawledJobs를 mockJobs 형식으로 변환
  const convertedCrawledJobs = crawledJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    companyId: job.companyId,
    location: job.location,
    salary: job.salary,
    experience: job.experience,
    workType: job.workType,
    description: job.description,
    requirements: job.requirements,
    skills: job.skills,
    keywords: job.keywords,
    industry: job.industry,
    postedAt: job.postedAt,
    deadline: job.deadline,
    sourceUrl: job.sourceUrl
  }))

  // Mock 데이터와 크롤링 데이터 통합
  return [...convertedCrawledJobs, ...mockJobs]
}
