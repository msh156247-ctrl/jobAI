import type { TeamRecruitment, TeamApplication, TeamMatchResult } from '@/types'
import { getUserPreferences } from './userPreferences'

// Mock 팀 모집 데이터
export const mockTeams: TeamRecruitment[] = [
  {
    id: 'team_1',
    title: 'AI 기반 헬스케어 서비스 개발 팀원 모집',
    description: `AI와 헬스케어를 결합한 혁신적인 서비스를 만들고 있습니다.

**프로젝트 개요**
- 개인 맞춤형 건강 관리 AI 챗봇
- 건강 데이터 분석 및 시각화
- 의료 전문가 매칭 시스템

**우리 팀은**
- 열정적이고 책임감 있는 분들을 찾습니다
- 수평적인 문화와 자유로운 의견 교환
- 실제 런칭을 목표로 합니다`,
    leaderId: 'user_1',
    leaderName: '김팀장',
    teamType: 'startup',
    industry: 'IT/기술',
    techStack: ['React', 'Next.js', 'TypeScript', 'Python', 'TensorFlow', 'AWS'],
    companyLogo: 'https://via.placeholder.com/120x120?text=HealthAI',
    teamSize: 8,
    positions: [
      {
        id: 'pos_1',
        title: '프론트엔드 개발자',
        description: 'React/Next.js를 활용한 웹 개발',
        requiredCount: 2,
        filledCount: 1,
        requiredSkills: ['React', 'TypeScript', 'Next.js'],
        responsibilities: [
          'UI/UX 구현',
          '상태 관리 및 API 연동',
          '반응형 디자인 적용'
        ]
      },
      {
        id: 'pos_2',
        title: 'AI/ML 엔지니어',
        description: '헬스케어 데이터 분석 모델 개발',
        requiredCount: 1,
        filledCount: 0,
        requiredSkills: ['Python', 'TensorFlow', 'Machine Learning'],
        responsibilities: [
          '건강 데이터 분석 모델 개발',
          '챗봇 NLP 모델 구현',
          '모델 성능 최적화'
        ]
      }
    ],
    totalSlots: 5,
    filledSlots: 2,
    duration: '6개월',
    location: 'hybrid',
    locationDetail: '서울 강남구',
    schedule: '주 3회, 평일 저녁 7-10시',
    requiredSkills: ['협업 능력', '책임감', '적극적인 커뮤니케이션'],
    preferredSkills: ['헬스케어 도메인 지식', '스타트업 경험'],
    experienceLevel: 'intermediate',
    culture: {
      values: ['빠른 실험과 학습', '사용자 중심 개발', '코드 품질 중시'],
      workingStyle: ['Agile Sprint (2주)', 'Code Review 필수', '페어 프로그래밍 권장'],
      communicationStyle: '슬랙 메신저 + 주 3회 오프라인 미팅',
      meetingFrequency: '주 3회 (월/수/금 저녁 7시)'
    },
    currentProjects: [
      {
        id: 'proj_1',
        name: 'AI 챗봇 MVP 개발',
        description: '건강 상담 AI 챗봇 초기 버전',
        progress: 65,
        status: 'in-progress',
        startDate: '2025-10-01',
        endDate: '2025-12-31'
      },
      {
        id: 'proj_2',
        name: '데이터 수집 시스템',
        description: '사용자 건강 데이터 수집 및 전처리',
        progress: 80,
        status: 'in-progress',
        startDate: '2025-09-15',
        endDate: '2025-11-30'
      },
      {
        id: 'proj_3',
        name: '의료진 매칭 알고리즘',
        description: '증상 기반 의료진 추천 알고리즘',
        progress: 30,
        status: 'planning',
        startDate: '2025-12-01'
      }
    ],
    benefits: {
      salary: '협의 (스톡옵션 포함)',
      equity: true,
      workFromHome: true,
      flexibleHours: true,
      meals: false,
      education: true,
      equipment: true,
      vacation: '자율 휴가제',
      other: ['서적 구입비 지원', '컨퍼런스 참가비 지원', '팀 빌딩 월 1회']
    },
    views: 342,
    applicantsCount: 12,
    bookmarksCount: 28,
    status: 'recruiting',
    tags: ['AI', '헬스케어', '스타트업', '웹개발'],
    createdAt: '2025-11-10T09:00:00Z',
    deadline: '2025-11-30T23:59:59Z'
  },
  {
    id: 'team_2',
    title: '블록체인 기반 NFT 마켓플레이스 프로젝트',
    description: `블록체인 기술을 활용한 NFT 거래 플랫폼을 개발합니다.

**프로젝트 목표**
- Ethereum 기반 NFT 민팅 시스템
- 실시간 경매 및 거래 기능
- 아티스트 커뮤니티 플랫폼

**프로젝트 특징**
- 실제 메인넷 배포 예정
- 포트폴리오 및 창업 가능성
- 수익 분배 계약`,
    leaderId: 'user_2',
    leaderName: '이대표',
    teamType: 'project',
    industry: 'IT/기술',
    techStack: ['Solidity', 'Web3.js', 'React', 'Node.js', 'IPFS'],
    companyLogo: 'https://via.placeholder.com/120x120?text=NFT',
    teamSize: 10,
    positions: [
      {
        id: 'pos_3',
        title: '블록체인 개발자',
        description: '스마트 컨트랙트 개발',
        requiredCount: 2,
        filledCount: 1,
        requiredSkills: ['Solidity', 'Web3.js', 'Ethereum'],
        responsibilities: [
          'NFT 스마트 컨트랙트 개발',
          '경매 로직 구현',
          '보안 검토 및 테스트'
        ]
      },
      {
        id: 'pos_4',
        title: '풀스택 개발자',
        description: '프론트엔드 및 백엔드 개발',
        requiredCount: 2,
        filledCount: 0,
        requiredSkills: ['React', 'Node.js', 'MongoDB'],
        responsibilities: [
          '마켓플레이스 UI 개발',
          'API 서버 구축',
          'IPFS 연동'
        ]
      }
    ],
    totalSlots: 6,
    filledSlots: 3,
    duration: '4개월',
    location: 'online',
    schedule: '주 2-3회, 협의 가능',
    requiredSkills: ['블록체인 기본 지식', 'Git/GitHub'],
    preferredSkills: ['NFT 프로젝트 경험', 'DeFi 이해'],
    experienceLevel: 'intermediate',
    culture: {
      values: ['탈중앙화 철학', '투명한 협업', '커뮤니티 우선'],
      workingStyle: ['비동기 협업', 'GitHub Issues 기반 작업', '주간 스프린트'],
      communicationStyle: '디스코드 + 노션',
      meetingFrequency: '주 2회 (화/목 저녁 9시)'
    },
    currentProjects: [
      {
        id: 'proj_4',
        name: 'NFT 민팅 컨트랙트',
        description: 'ERC-721 기반 NFT 발행 스마트 컨트랙트',
        progress: 85,
        status: 'in-progress',
        startDate: '2025-10-15',
        endDate: '2025-11-25'
      },
      {
        id: 'proj_5',
        name: '마켓플레이스 UI',
        description: 'NFT 거래 플랫폼 프론트엔드',
        progress: 50,
        status: 'in-progress',
        startDate: '2025-10-20',
        endDate: '2025-12-10'
      },
      {
        id: 'proj_6',
        name: '경매 시스템',
        description: '실시간 입찰 및 경매 로직',
        progress: 20,
        status: 'planning',
        startDate: '2025-12-01',
        endDate: '2026-01-15'
      }
    ],
    benefits: {
      salary: '무급 (수익 분배 계약)',
      equity: true,
      workFromHome: true,
      flexibleHours: true,
      meals: false,
      education: false,
      equipment: false,
      vacation: '자율',
      other: ['프로젝트 수익 지분 배분', 'NFT 에어드랍', '포트폴리오 지원']
    },
    views: 589,
    applicantsCount: 23,
    bookmarksCount: 67,
    status: 'recruiting',
    tags: ['블록체인', 'NFT', 'Web3', 'Ethereum'],
    createdAt: '2025-11-08T14:30:00Z',
    deadline: '2025-11-25T23:59:59Z'
  },
  {
    id: 'team_3',
    title: '알고리즘 스터디 (코딩테스트 대비)',
    description: `대기업/외국계 코딩테스트를 함께 준비할 스터디원을 모집합니다.

**스터디 방식**
- 매주 정해진 문제 풀이 (10-15문제)
- 주 1회 온라인 모임 (문제 리뷰)
- 디스코드를 통한 질문/토론

**목표**
- 3개월 내 프로그래머스 Lv.3 이상
- 백준 골드 티어 달성
- 삼성/네이버/카카오 코테 합격

**참여 대상**
- 프로그래머스 Lv.2 이상
- 꾸준히 참여 가능한 분
- 적극적으로 질문하고 공유하는 분`,
    leaderId: 'user_3',
    leaderName: '박알고',
    teamType: 'study',
    industry: 'IT/기술',
    techStack: ['Python', 'Java', 'C++', 'JavaScript'],
    positions: [
      {
        id: 'pos_5',
        title: '스터디원',
        description: '함께 문제를 풀고 토론할 스터디원',
        requiredCount: 6,
        filledCount: 4,
        requiredSkills: ['기본 자료구조', '알고리즘 기초'],
        responsibilities: [
          '매주 문제 풀이',
          '코드 리뷰 참여',
          '질문 및 토론'
        ]
      }
    ],
    totalSlots: 6,
    filledSlots: 4,
    duration: '3개월',
    location: 'online',
    schedule: '매주 토요일 오후 2시',
    requiredSkills: ['기본 프로그래밍 능력', '꾸준함'],
    experienceLevel: 'intermediate',
    views: 892,
    applicantsCount: 34,
    bookmarksCount: 123,
    status: 'recruiting',
    tags: ['알고리즘', '코딩테스트', '스터디', '취업준비'],
    createdAt: '2025-11-07T19:00:00Z',
    deadline: '2025-11-20T23:59:59Z'
  },
  {
    id: 'team_4',
    title: '해커톤 대회 참가 팀 (JUNCTION ASIA 2025)',
    description: `JUNCTION ASIA 2025 해커톤 대회에 함께 참가할 팀원을 모집합니다!

**대회 정보**
- 일시: 2025년 12월 15-17일 (3일)
- 장소: 코엑스
- 주제: Open Innovation (자유 주제)

**우리 팀 아이디어**
- 환경 보호를 위한 AI 솔루션
- 쓰레기 분류 자동화 앱
- 리워드 시스템으로 참여 유도

**원하는 팀원**
- 빠른 프로토타입 개발 가능한 분
- 밤샘 코딩 가능한 체력
- 재미있게 대회 즐기실 분!`,
    leaderId: 'user_4',
    leaderName: '최해커',
    teamType: 'contest',
    industry: 'IT/기술',
    techStack: ['React Native', 'Firebase', 'Python', 'FastAPI'],
    teamSize: 4,
    positions: [
      {
        id: 'pos_6',
        title: '앱 개발자',
        description: 'React Native 모바일 앱 개발',
        requiredCount: 2,
        filledCount: 1,
        requiredSkills: ['React Native', 'JavaScript'],
        responsibilities: [
          '모바일 앱 UI 구현',
          '카메라/이미지 처리',
          'Firebase 연동'
        ]
      },
      {
        id: 'pos_7',
        title: '백엔드/AI 개발자',
        description: 'AI 모델 및 API 개발',
        requiredCount: 1,
        filledCount: 0,
        requiredSkills: ['Python', 'FastAPI', 'TensorFlow'],
        responsibilities: [
          '이미지 분류 AI 모델',
          'REST API 개발',
          '서버 배포'
        ]
      }
    ],
    totalSlots: 4,
    filledSlots: 2,
    duration: '3일 (해커톤)',
    location: 'offline',
    locationDetail: '코엑스, 서울 강남구',
    schedule: '12월 15-17일 풀타임',
    requiredSkills: ['빠른 개발 능력', '팀워크', '체력'],
    preferredSkills: ['해커톤 경험', '프로토타입 개발 경험'],
    experienceLevel: 'any',
    culture: {
      values: ['빠른 실행력', '창의적 문제 해결', '즐거운 협업'],
      workingStyle: ['해커톤 스타일', '빠른 의사결정', '프로토타입 우선'],
      communicationStyle: '오프라인 대면 + 카카오톡',
      meetingFrequency: '대회 기간 중 상시'
    },
    currentProjects: [
      {
        id: 'proj_7',
        name: '해커톤 아이디어 기획',
        description: '쓰레기 분류 AI 앱 컨셉 구체화',
        progress: 100,
        status: 'completed',
        startDate: '2025-11-01',
        endDate: '2025-11-10'
      },
      {
        id: 'proj_8',
        name: '프로토타입 개발',
        description: '해커톤 기간 중 MVP 개발',
        progress: 0,
        status: 'planning',
        startDate: '2025-12-15',
        endDate: '2025-12-17'
      }
    ],
    benefits: {
      salary: '무급',
      equity: false,
      workFromHome: false,
      flexibleHours: false,
      meals: true,
      education: false,
      equipment: false,
      vacation: '해당없음',
      other: ['대회 참가비 무료', '식사 제공', '네트워킹 기회', '수상시 상금 배분']
    },
    views: 456,
    applicantsCount: 18,
    bookmarksCount: 45,
    status: 'recruiting',
    tags: ['해커톤', 'JUNCTION', '대회', '환경'],
    createdAt: '2025-11-09T10:00:00Z',
    deadline: '2025-11-18T23:59:59Z'
  },
  {
    id: 'team_5',
    title: '오픈소스 프로젝트 기여자 모집 (React Admin Dashboard)',
    description: `React 기반 오픈소스 관리자 대시보드 라이브러리를 개발합니다.

**프로젝트 소개**
- GitHub 스타 500+ 목표
- MIT 라이선스
- 다양한 차트/테이블 컴포넌트 제공
- TypeScript 완벽 지원

**기여 방식**
- 새로운 컴포넌트 개발
- 버그 수정 및 테스트
- 문서화 작업
- 예제 프로젝트 제작

**장점**
- 실무 경력 대체 가능
- 포트폴리오 강화
- 오픈소스 기여 경험`,
    leaderId: 'user_5',
    leaderName: '오픈소',
    teamType: 'opensource',
    industry: 'IT/기술',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Storybook'],
    positions: [
      {
        id: 'pos_8',
        title: 'React 개발자',
        description: '컴포넌트 라이브러리 개발',
        requiredCount: 3,
        filledCount: 1,
        requiredSkills: ['React', 'TypeScript'],
        responsibilities: [
          '재사용 가능한 컴포넌트 개발',
          'Props 타입 정의',
          '단위 테스트 작성'
        ]
      },
      {
        id: 'pos_9',
        title: '문서 작성자',
        description: '사용 가이드 및 예제 작성',
        requiredCount: 1,
        filledCount: 0,
        requiredSkills: ['기술 문서 작성', 'Markdown'],
        responsibilities: [
          'API 문서화',
          '사용 예제 작성',
          'README 관리'
        ]
      }
    ],
    totalSlots: 5,
    filledSlots: 2,
    duration: '상시',
    location: 'online',
    schedule: '자율 (주 5-10시간)',
    requiredSkills: ['Git/GitHub', 'PR 작성 능력'],
    preferredSkills: ['오픈소스 기여 경험', 'Storybook 사용 경험'],
    experienceLevel: 'beginner',
    views: 234,
    applicantsCount: 15,
    bookmarksCount: 34,
    status: 'recruiting',
    tags: ['오픈소스', 'React', 'TypeScript', '라이브러리'],
    createdAt: '2025-11-06T08:00:00Z'
  }
]

// Mock 지원 데이터
export const mockApplications: TeamApplication[] = [
  {
    id: 'app_1',
    teamId: 'team_1',
    positionId: 'pos_1',
    applicantId: 'user_10',
    applicantName: '신입개발',
    motivation: 'AI와 헬스케어에 관심이 많아서 지원하게 되었습니다. 실제 서비스를 만들어보고 싶습니다.',
    experience: 'React 프로젝트 3개 경험, 포트폴리오 사이트 제작',
    availableTime: '평일 저녁 7-10시, 주말 오전',
    portfolioUrl: 'https://portfolio.example.com',
    githubUrl: 'https://github.com/example',
    matchScore: 85,
    status: 'pending',
    createdAt: '2025-11-11T10:30:00Z'
  }
]

// LocalStorage 키
const TEAMS_KEY = 'jobai:teams'
const APPLICATIONS_KEY = 'jobai:team:applications'
const BOOKMARKS_KEY = 'jobai:team:bookmarks'

/**
 * 팀 목록 가져오기
 */
export function getTeams(filters?: {
  teamType?: string
  industry?: string
  status?: string
  techStack?: string
  experienceLevel?: string
}): TeamRecruitment[] {
  const stored = localStorage.getItem(TEAMS_KEY)
  let teams = stored ? JSON.parse(stored) : mockTeams

  // 필터 적용
  if (filters) {
    if (filters.teamType && filters.teamType !== 'all') {
      teams = teams.filter((t: TeamRecruitment) => t.teamType === filters.teamType)
    }
    if (filters.industry && filters.industry !== 'all') {
      teams = teams.filter((t: TeamRecruitment) => t.industry === filters.industry)
    }
    if (filters.status && filters.status !== 'all') {
      teams = teams.filter((t: TeamRecruitment) => t.status === filters.status)
    }
    if (filters.techStack) {
      teams = teams.filter((t: TeamRecruitment) =>
        t.techStack.some(tech => tech.toLowerCase().includes(filters.techStack!.toLowerCase()))
      )
    }
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      teams = teams.filter((t: TeamRecruitment) =>
        t.experienceLevel === filters.experienceLevel || t.experienceLevel === 'any'
      )
    }
  }

  return teams.sort((a: TeamRecruitment, b: TeamRecruitment) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * 팀 상세 정보 가져오기
 */
export function getTeamById(id: string): TeamRecruitment | null {
  const teams = getTeams()
  return teams.find(team => team.id === id) || null
}

/**
 * 팀 조회수 증가
 */
export function incrementTeamViews(teamId: string): void {
  const stored = localStorage.getItem(TEAMS_KEY)
  const teams = stored ? JSON.parse(stored) : mockTeams
  const team = teams.find((t: TeamRecruitment) => t.id === teamId)

  if (team) {
    team.views += 1
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
  }
}

/**
 * 팀 지원하기
 */
export function applyToTeam(application: Omit<TeamApplication, 'id' | 'createdAt' | 'matchScore'>): TeamApplication {
  const stored = localStorage.getItem(APPLICATIONS_KEY)
  const applications = stored ? JSON.parse(stored) : mockApplications

  // 중복 지원 체크
  const existingApp = applications.find(
    (app: TeamApplication) =>
      app.teamId === application.teamId &&
      app.applicantId === application.applicantId &&
      app.positionId === application.positionId
  )

  if (existingApp) {
    throw new Error('이미 해당 포지션에 지원하셨습니다.')
  }

  // 매칭 점수 계산
  const matchScore = calculateMatchScore(application.teamId, application.applicantId)

  const newApplication: TeamApplication = {
    ...application,
    id: `app_${Date.now()}`,
    matchScore,
    createdAt: new Date().toISOString()
  }

  applications.push(newApplication)
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))

  // 팀 지원자 수 증가
  const teamsStored = localStorage.getItem(TEAMS_KEY)
  const teams = teamsStored ? JSON.parse(teamsStored) : mockTeams
  const team = teams.find((t: TeamRecruitment) => t.id === application.teamId)

  if (team) {
    team.applicantsCount += 1
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
  }

  return newApplication
}

/**
 * 팀의 지원자 목록 가져오기
 */
export function getApplicationsByTeam(teamId: string): TeamApplication[] {
  const stored = localStorage.getItem(APPLICATIONS_KEY)
  const applications = stored ? JSON.parse(stored) : mockApplications

  return applications
    .filter((app: TeamApplication) => app.teamId === teamId)
    .sort((a: TeamApplication, b: TeamApplication) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

/**
 * 지원 상태 업데이트
 */
export function updateApplicationStatus(
  applicationId: string,
  status: TeamApplication['status'],
  reviewerNote?: string
): void {
  const stored = localStorage.getItem(APPLICATIONS_KEY)
  const applications = stored ? JSON.parse(stored) : mockApplications
  const application = applications.find((app: TeamApplication) => app.id === applicationId)

  if (application) {
    application.status = status
    application.reviewedAt = new Date().toISOString()
    if (reviewerNote) {
      application.reviewerNote = reviewerNote
    }

    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))

    // 수락된 경우 팀 정원 업데이트
    if (status === 'accepted') {
      updateTeamSlots(application.teamId, application.positionId, 1)
    }
  }
}

/**
 * 팀 정원 업데이트
 */
function updateTeamSlots(teamId: string, positionId: string, increment: number): void {
  const stored = localStorage.getItem(TEAMS_KEY)
  const teams = stored ? JSON.parse(stored) : mockTeams
  const team = teams.find((t: TeamRecruitment) => t.id === teamId)

  if (team) {
    const position = team.positions.find((p: any) => p.id === positionId)
    if (position) {
      position.filledCount += increment
      team.filledSlots += increment

      // 만석 체크
      if (team.filledSlots >= team.totalSlots) {
        team.status = 'full'
      }

      localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
    }
  }
}

/**
 * 매칭 점수 계산
 */
function calculateMatchScore(teamId: string, applicantId: string): number {
  const team = getTeamById(teamId)
  const userPrefs = getUserPreferences()

  if (!team) return 0

  let score = 50 // 기본 점수

  // 스킬 매칭 (40점)
  const userSkills = userPrefs.interests.skills.map(s => s.toLowerCase())
  const requiredSkills = team.requiredSkills.map(s => s.toLowerCase())
  const techStack = team.techStack.map(s => s.toLowerCase())

  const skillMatch = [...requiredSkills, ...techStack].filter(skill =>
    userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
  ).length

  score += Math.min(40, skillMatch * 8)

  // 경력 매칭 (10점)
  if (team.experienceLevel === 'any') {
    score += 10
  } else if (userPrefs.career.years) {
    const years = userPrefs.career.years
    if (
      (team.experienceLevel === 'beginner' && years <= 2) ||
      (team.experienceLevel === 'intermediate' && years >= 2 && years <= 5) ||
      (team.experienceLevel === 'advanced' && years >= 5)
    ) {
      score += 10
    }
  }

  return Math.min(100, score)
}

/**
 * 스마트 매칭 - 사용자에게 추천 팀 제공
 */
export function getRecommendedTeams(userId: string, limit: number = 5): TeamMatchResult[] {
  const teams = getTeams({ status: 'recruiting' })
  const userPrefs = getUserPreferences()

  const results: TeamMatchResult[] = teams.map(team => {
    const matchScore = calculateMatchScore(team.id, userId)

    // 상세 매칭 점수
    const userSkills = userPrefs.interests.skills.map(s => s.toLowerCase())
    const teamSkills = [...team.requiredSkills, ...team.techStack].map(s => s.toLowerCase())

    const skillMatch = Math.min(100, teamSkills.filter(skill =>
      userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    ).length * 15)

    const experienceMatch = team.experienceLevel === 'any' ? 100 :
      (userPrefs.career.years || 0) >= 2 ? 80 : 60

    const availabilityMatch = team.location === 'online' ? 100 : 70
    const locationMatch = team.location === 'online' ? 100 : 50

    const recommendations: string[] = []
    if (skillMatch > 70) recommendations.push('보유 스킬이 팀 요구사항과 잘 맞습니다')
    if (team.experienceLevel === 'any') recommendations.push('경력 무관으로 누구나 참여 가능합니다')
    if (team.location === 'online') recommendations.push('온라인으로 진행되어 시간/장소 제약이 없습니다')
    if (team.teamType === 'study') recommendations.push('스터디 형태로 부담없이 시작할 수 있습니다')

    return {
      teamId: team.id,
      applicantId: userId,
      matchScore,
      matchReasons: {
        skillMatch,
        experienceMatch,
        availabilityMatch,
        locationMatch
      },
      recommendations
    }
  })

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)
}

/**
 * 팀 북마크
 */
export function toggleTeamBookmark(teamId: string, userId: string): boolean {
  const bookmarksKey = `${BOOKMARKS_KEY}:${userId}`
  const stored = localStorage.getItem(bookmarksKey)
  const bookmarks = stored ? JSON.parse(stored) : []

  const index = bookmarks.indexOf(teamId)
  let isBookmarked = false

  if (index > -1) {
    bookmarks.splice(index, 1)
  } else {
    bookmarks.push(teamId)
    isBookmarked = true
  }

  localStorage.setItem(bookmarksKey, JSON.stringify(bookmarks))

  // 팀 북마크 수 업데이트
  const teamsStored = localStorage.getItem(TEAMS_KEY)
  const teams = teamsStored ? JSON.parse(teamsStored) : mockTeams
  const team = teams.find((t: TeamRecruitment) => t.id === teamId)

  if (team) {
    team.bookmarksCount += isBookmarked ? 1 : -1
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
  }

  return isBookmarked
}

/**
 * 사용자의 북마크한 팀 목록
 */
export function getBookmarkedTeams(userId: string): TeamRecruitment[] {
  const bookmarksKey = `${BOOKMARKS_KEY}:${userId}`
  const stored = localStorage.getItem(bookmarksKey)
  const bookmarkIds = stored ? JSON.parse(stored) : []

  const teams = getTeams()
  return teams.filter(team => bookmarkIds.includes(team.id))
}

/**
 * 팀 타입 목록
 */
export const teamTypes = [
  { value: 'all', label: '전체' },
  { value: 'project', label: '프로젝트' },
  { value: 'study', label: '스터디' },
  { value: 'startup', label: '스타트업' },
  { value: 'contest', label: '대회/해커톤' },
  { value: 'opensource', label: '오픈소스' }
]

/**
 * 업종 목록
 */
export const industries = [
  { value: 'all', label: '전체' },
  { value: 'IT/기술', label: 'IT/기술' },
  { value: '금융', label: '금융' },
  { value: '의료/헬스케어', label: '의료/헬스케어' },
  { value: '교육', label: '교육' },
  { value: '마케팅', label: '마케팅' },
  { value: '디자인', label: '디자인' },
  { value: '게임', label: '게임' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: '블록체인', label: '블록체인' },
  { value: '기타', label: '기타' }
]

/**
 * 경력 레벨 목록
 */
export const experienceLevels = [
  { value: 'all', label: '전체' },
  { value: 'beginner', label: '초급 (0-2년)' },
  { value: 'intermediate', label: '중급 (3-5년)' },
  { value: 'advanced', label: '고급 (5년+)' },
  { value: 'any', label: '경력 무관' }
]
