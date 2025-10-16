// Mock data for testing

export interface Job {
  id: string
  title: string
  company: string
  companyId: string
  location: string
  salary: { min: number; max: number }
  workType: 'onsite' | 'dispatch' | 'remote'
  description: string
  requirements: string[]
  skills: string[]
  industry: string
  postedAt: string
  deadline: string
}

export interface Company {
  id: string
  name: string
  businessNumber: string
  address: string
  website?: string
  description: string
  logoUrl?: string
}

export interface Application {
  id: string
  jobId: string
  userId: string
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
  appliedAt: string
  coverLetter: string
}

export interface InterviewSlot {
  id: string
  date: string
  time: string
  available: boolean
}

// Generate 60+ fake jobs
function generateMockJobs(): Job[] {
  const jobTitles = [
    '프론트엔드 개발자', '백엔드 개발자', '풀스택 개발자', 'DevOps 엔지니어',
    'iOS 개발자', 'Android 개발자', 'React 개발자', 'Node.js 개발자',
    'Python 개발자', 'Java 개발자', 'C++ 개발자', 'QA 엔지니어',
    '데이터 사이언티스트', '머신러닝 엔지니어', 'AI 연구원', '시스템 엔지니어',
    '네트워크 엔지니어', '보안 엔지니어', 'DBA', '클라우드 엔지니어',
    'UI/UX 디자이너', '웹 디자이너', '그래픽 디자이너', '제품 매니저',
    '프로젝트 매니저', '서비스 기획자', '마케팅 매니저', '영업 담당자',
    '경영 지원', '인사 담당자', '재무 담당자', '회계 담당자',
    '법무 담당자', '고객 지원', '콘텐츠 작가', '기술 영업',
    '솔루션 아키텍트', '테크니컬 라이터', '블록체인 개발자', '게임 개발자'
  ]

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

  const industries = [
    'IT/소프트웨어', '금융/은행', '제조/생산', '유통/물류', '교육',
    '의료/헬스케어', '미디어/광고', '게임', '전자상거래', '통신'
  ]

  const skillsByIndustry: Record<string, string[]> = {
    'IT/소프트웨어': ['JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Python', 'Java', 'Spring', 'Docker', 'Kubernetes'],
    '금융/은행': ['금융 지식', '리스크 관리', 'Excel', 'SQL', '재무 분석', '회계', '법규 준수', 'VBA'],
    '제조/생산': ['품질 관리', '공정 관리', 'CAD', 'Six Sigma', 'Lean', '제조 공정', '안전 관리'],
    '유통/물류': ['물류 관리', '재고 관리', 'SCM', 'ERP', 'WMS', '운송 관리', '유통 전략'],
    '교육': ['강의 스킬', '커리큘럼 개발', '교수법', '평가 방법', '교육 콘텐츠 제작', 'LMS'],
    '의료/헬스케어': ['의료 지식', '환자 관리', 'EMR', '의료 법규', '임상 경험', '간호'],
    '미디어/광고': ['Adobe Creative Suite', '영상 편집', 'Premiere Pro', 'After Effects', 'Photoshop', '마케팅'],
    '게임': ['Unity', 'Unreal Engine', 'C#', 'C++', '게임 디자인', '3D 모델링', 'Blender'],
    '전자상거래': ['온라인 마케팅', 'SEO', 'SNS 마케팅', 'Google Analytics', '고객 분석', 'MD'],
    '통신': ['네트워크', '통신 프로토콜', '5G', 'LTE', '무선 통신', '통신 장비']
  }

  const workTypes: Array<'onsite' | 'dispatch' | 'remote'> = ['onsite', 'dispatch', 'remote']

  const jobs: Job[] = []

  for (let i = 0; i < 65; i++) {
    const company = companies[i % companies.length]
    const industry = industries[i % industries.length]
    const skills = skillsByIndustry[industry] || []
    const selectedSkills = skills.slice(0, 3 + (i % 3))
    const title = jobTitles[i % jobTitles.length]
    const location = locations[i % locations.length]
    const workType = workTypes[i % workTypes.length]

    const salaryBase = 3000 + (i % 10) * 500
    const salaryMin = salaryBase + (i % 5) * 100
    const salaryMax = salaryMin + 1000 + (i % 8) * 200

    const daysAgo = i % 30
    const postedDate = new Date()
    postedDate.setDate(postedDate.getDate() - daysAgo)

    const deadlineDate = new Date()
    deadlineDate.setDate(deadlineDate.getDate() + 30 - daysAgo)

    const idNum = (i + 1).toString().padStart(3, '0')

    jobs.push({
      id: `job-${idNum}`,
      title: title,
      company: company.name,
      companyId: company.id,
      location: location,
      salary: { min: salaryMin, max: salaryMax },
      workType: workType,
      description: `${company.name}에서 ${title}을(를) 모집합니다. ${industry} 분야에서 함께 성장할 인재를 찾습니다. 우리 회사는 최고의 복지와 성장 기회를 제공합니다.`,
      requirements: [
        `${industry} 분야 ${i % 5}년 이상 경력`,
        `${selectedSkills[0] || '관련 기술'} 활용 능력`,
        '우수한 커뮤니케이션 능력',
        '팀워크 및 협업 능력',
        i % 3 === 0 ? '영어 능통자 우대' : '빠른 학습 능력'
      ],
      skills: selectedSkills,
      industry: industry,
      postedAt: postedDate.toISOString(),
      deadline: deadlineDate.toISOString()
    })
  }

  return jobs
}

export const mockJobs = generateMockJobs()

export const mockCompanies: Company[] = [
  {
    id: 'naver',
    name: '네이버',
    businessNumber: '220-81-62517',
    address: '경기도 성남시 분당구 정자일로 95',
    website: 'https://www.navercorp.com',
    description: '네이버는 검색, 커머스, 콘텐츠, 핀테크 등 다양한 온라인 플랫폼을 제공하는 글로벌 ICT 기업입니다.',
    logoUrl: 'https://via.placeholder.com/100x100/00C73C/FFFFFF?text=N'
  },
  {
    id: 'kakao',
    name: '카카오',
    businessNumber: '120-81-47521',
    address: '제주특별자치도 제주시 첨단로 242',
    website: 'https://www.kakaocorp.com',
    description: '카카오는 카카오톡을 기반으로 다양한 서비스를 제공하는 플랫폼 기업입니다.',
    logoUrl: 'https://via.placeholder.com/100x100/FFE812/000000?text=K'
  },
  {
    id: 'coupang',
    name: '쿠팡',
    businessNumber: '120-88-00767',
    address: '서울특별시 송파구 송파대로 570',
    website: 'https://www.coupang.com',
    description: '쿠팡은 고객 만족을 최우선으로 하는 이커머스 플랫폼입니다.',
    logoUrl: 'https://via.placeholder.com/100x100/461E9B/FFFFFF?text=C'
  },
  {
    id: 'toss',
    name: '토스',
    businessNumber: '220-87-00096',
    address: '서울특별시 강남구 테헤란로 131',
    website: 'https://toss.im',
    description: '토스는 금융을 쉽고 간편하게 만드는 핀테크 기업입니다.',
    logoUrl: 'https://via.placeholder.com/100x100/0064FF/FFFFFF?text=T'
  },
  {
    id: 'baemin',
    name: '배달의민족',
    businessNumber: '211-88-69852',
    address: '서울특별시 송파구 위례성대로 2',
    website: 'https://www.woowahan.com',
    description: '배달의민족은 대한민국 1위 배달 앱 서비스를 제공합니다.',
    logoUrl: 'https://via.placeholder.com/100x100/2AC1BC/FFFFFF?text=B'
  }
]

// 회사 정보 조회 헬퍼 함수
export function getCompanyById(companyId: string): Company | undefined {
  return mockCompanies.find(c => c.id === companyId)
}

// Helper functions
const SAVED_JOBS_KEY = 'jobai:savedJobs'

export function saveJob(userId: string, jobId: string): void {
  const saved = getSavedJobs(userId)
  if (!saved.includes(jobId)) {
    saved.push(jobId)
    localStorage.setItem(`${SAVED_JOBS_KEY}:${userId}`, JSON.stringify(saved))
  }
}

export function unsaveJob(userId: string, jobId: string): void {
  const saved = getSavedJobs(userId)
  const filtered = saved.filter(id => id !== jobId)
  localStorage.setItem(`${SAVED_JOBS_KEY}:${userId}`, JSON.stringify(filtered))
}

export function getSavedJobs(userId: string): string[] {
  const stored = localStorage.getItem(`${SAVED_JOBS_KEY}:${userId}`)
  return stored ? JSON.parse(stored) : []
}

export function isJobSaved(userId: string, jobId: string): boolean {
  return getSavedJobs(userId).includes(jobId)
}

export function createApplication(application: Omit<Application, 'id' | 'appliedAt'>): Application {
  const newApp: Application = {
    ...application,
    id: `app-${Date.now()}`,
    appliedAt: new Date().toISOString()
  }

  const apps = getApplications(application.userId)
  apps.push(newApp)
  localStorage.setItem(`jobai:applications:${application.userId}`, JSON.stringify(apps))

  return newApp
}

export function getApplications(userId: string): Application[] {
  const stored = localStorage.getItem(`jobai:applications:${userId}`)
  return stored ? JSON.parse(stored) : []
}

export function getInterviewSlots(jobId: string): InterviewSlot[] {
  const slots: InterviewSlot[] = []
  const today = new Date()

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
    times.forEach((time, idx) => {
      slots.push({
        id: `slot-${jobId}-${i}-${idx}`,
        date: dateStr,
        time: time,
        available: Math.random() > 0.3
      })
    })
  }

  return slots
}

export function bookInterviewSlot(slotId: string): boolean {
  // Mock implementation - in real app, this would update the database
  return true
}

export function generateICS(date: string, time: string, company: string, jobTitle: string): string {
  const startDateTime = new Date(`${date}T${time}:00`)
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//JobAI//Interview Scheduler//EN
BEGIN:VEVENT
UID:${Date.now()}@jobai.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDateTime)}
DTEND:${formatDate(endDateTime)}
SUMMARY:${company} - ${jobTitle} 면접
DESCRIPTION:${company}의 ${jobTitle} 포지션 면접입니다.
LOCATION:온라인
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`
}

export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}