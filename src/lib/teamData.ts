import type { TeamRecruitment, TeamApplication, TeamMatchResult, WaitlistEntry, WaitlistPriority } from '@/types'
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
 * 매칭 점수 계산 (100점 만점, 7요소)
 * 설계 문서 기준 7-factor matching algorithm
 */
export function calculateMatchScore(teamId: string, applicantId: string): number {
  const team = getTeamById(teamId)
  const userPrefs = getUserPreferences()

  if (!team) return 0

  let totalScore = 0

  // === 1. 직무 일치 매칭 (25점) ===
  const jobTitleScore = calculateJobTitleMatch(team, userPrefs)
  totalScore += jobTitleScore

  // === 2. 필수 스킬 매칭 (20점) ===
  const requiredSkillsScore = calculateRequiredSkillsMatch(team, userPrefs)
  totalScore += requiredSkillsScore

  // === 3. 우대 스킬 매칭 (10점) ===
  const preferredSkillsScore = calculatePreferredSkillsMatch(team, userPrefs)
  totalScore += preferredSkillsScore

  // === 4. 경력 범위 적합성 (15점) ===
  const experienceScore = calculateExperienceMatch(team, userPrefs)
  totalScore += experienceScore

  // === 5. 지역/근무 형태 선호 (10점) ===
  const locationScore = calculateLocationMatch(team, userPrefs)
  totalScore += locationScore

  // === 6. 복지/문화 적합성 (10점) ===
  const cultureScore = calculateCultureMatch(team, userPrefs)
  totalScore += cultureScore

  // === 7. 인성/성향 매칭 (10점) ===
  const personalityScore = calculatePersonalityMatch(team, userPrefs)
  totalScore += personalityScore

  return Math.min(100, Math.round(totalScore))
}

/**
 * 1. 직무 일치 매칭 (25점)
 */
function calculateJobTitleMatch(team: TeamRecruitment, userPrefs: any): number {
  const userPosition = userPrefs.career.currentPosition?.toLowerCase() || ''
  const userDesiredPositions = userPrefs.interests.positions.map((p: string) => p.toLowerCase())

  // 팀의 모든 포지션과 비교
  for (const position of team.positions) {
    const positionTitle = position.title.toLowerCase()

    // Exact match
    if (
      positionTitle === userPosition ||
      userDesiredPositions.some((desired: string) => desired === positionTitle)
    ) {
      return 25
    }

    // Function match (키워드 포함)
    const keywords = ['frontend', 'backend', 'fullstack', 'designer', 'pm', 'ai', 'ml', 'blockchain', 'devops']
    for (const keyword of keywords) {
      if (
        positionTitle.includes(keyword) &&
        (userPosition.includes(keyword) || userDesiredPositions.some((d: string) => d.includes(keyword)))
      ) {
        return 15
      }
    }

    // Keyword partial match
    if (
      userPosition &&
      (positionTitle.includes(userPosition) || userPosition.includes(positionTitle))
    ) {
      return 8
    }
  }

  return 0
}

/**
 * 2. 필수 스킬 매칭 (20점)
 */
function calculateRequiredSkillsMatch(team: TeamRecruitment, userPrefs: any): number {
  const userSkills = userPrefs.interests.skills.map((s: string) => s.toLowerCase())
  const requiredSkills = team.requiredSkills.map((s: string) => s.toLowerCase())
  const techStack = team.techStack.map((s: string) => s.toLowerCase())

  const allRequiredSkills = [...new Set([...requiredSkills, ...techStack])]

  if (allRequiredSkills.length === 0) return 20 // 요구사항 없으면 만점

  const matchedCount = allRequiredSkills.filter(skill =>
    userSkills.some((userSkill: string) => userSkill.includes(skill) || skill.includes(userSkill))
  ).length

  const matchRatio = matchedCount / allRequiredSkills.length
  return Math.round(matchRatio * 20)
}

/**
 * 3. 우대 스킬 매칭 (10점)
 */
function calculatePreferredSkillsMatch(team: TeamRecruitment, userPrefs: any): number {
  if (!team.preferredSkills || team.preferredSkills.length === 0) return 10 // 우대사항 없으면 만점

  const userSkills = userPrefs.interests.skills.map((s: string) => s.toLowerCase())
  const preferredSkills = team.preferredSkills.map((s: string) => s.toLowerCase())

  const matchedCount = preferredSkills.filter(skill =>
    userSkills.some((userSkill: string) => userSkill.includes(skill) || skill.includes(userSkill))
  ).length

  return Math.min(10, matchedCount * 5)
}

/**
 * 4. 경력 범위 적합성 (15점)
 */
function calculateExperienceMatch(team: TeamRecruitment, userPrefs: any): number {
  const userYears = userPrefs.career.years || 0

  if (team.experienceLevel === 'any') {
    return 15
  }

  // 경력 범위 정의
  const experienceRanges: Record<string, { min: number; max: number }> = {
    beginner: { min: 0, max: 2 },
    intermediate: { min: 2, max: 5 },
    advanced: { min: 5, max: 100 }
  }

  const range = experienceRanges[team.experienceLevel]
  if (!range) return 0

  // 범위 내에 있으면 만점
  if (userYears >= range.min && userYears <= range.max) {
    return 15
  }

  // 범위보다 적으면 감점
  if (userYears < range.min) {
    return 7
  }

  // 범위보다 많으면 (과경력) 중간 점수
  return 10
}

/**
 * 5. 지역/근무 형태 선호 (10점)
 */
function calculateLocationMatch(team: TeamRecruitment, userPrefs: any): number {
  let score = 0

  // 근무 형태 매칭
  const userWorkTypes = userPrefs.workPreferences?.workTypes || []
  const teamLocation = team.location // 'online', 'offline', 'hybrid'

  const workTypeMapping: Record<string, string[]> = {
    online: ['remote'],
    offline: ['onsite'],
    hybrid: ['remote', 'onsite', 'hybrid']
  }

  const teamWorkTypes = workTypeMapping[teamLocation] || []

  if (
    userWorkTypes.length === 0 ||
    userWorkTypes.some((type: string) => teamWorkTypes.includes(type))
  ) {
    score += 5
  }

  // 지역 매칭
  const userLocations = userPrefs.workPreferences?.preferredLocations || []
  if (teamLocation === 'online' || userLocations.length === 0) {
    score += 5 // 온라인이거나 선호 지역 없으면 만점
  } else if (team.locationDetail) {
    const teamLocationDetail = team.locationDetail.toLowerCase()
    if (userLocations.some((loc: string) => teamLocationDetail.includes(loc.toLowerCase()))) {
      score += 5
    }
  }

  return score
}

/**
 * 6. 복지/문화 적합성 (10점)
 */
function calculateCultureMatch(team: TeamRecruitment, userPrefs: any): number {
  let score = 0

  if (!team.benefits && !team.culture) return 10 // 정보 없으면 만점

  // 복지 매칭
  if (team.benefits) {
    const userBenefitPrefs = {
      remote: userPrefs.workPreferences?.workTypes?.includes('remote'),
      flexible: userPrefs.workPreferences?.flexibleHours,
      education: userPrefs.interests?.skills?.length > 3 // 스킬 많으면 교육 관심 있다고 가정
    }

    let benefitMatches = 0
    let totalChecks = 0

    if (userBenefitPrefs.remote !== undefined) {
      totalChecks++
      if (team.benefits.workFromHome && userBenefitPrefs.remote) benefitMatches++
    }

    if (userBenefitPrefs.flexible !== undefined) {
      totalChecks++
      if (team.benefits.flexibleHours && userBenefitPrefs.flexible) benefitMatches++
    }

    if (userBenefitPrefs.education !== undefined) {
      totalChecks++
      if (team.benefits.education && userBenefitPrefs.education) benefitMatches++
    }

    if (totalChecks > 0) {
      score += Math.round((benefitMatches / totalChecks) * 5)
    } else {
      score += 5
    }
  } else {
    score += 5
  }

  // 문화 매칭 (간단 버전)
  if (team.culture) {
    score += 5 // 문화 정보 있으면 기본 점수
  } else {
    score += 5
  }

  return score
}

/**
 * 7. 인성/성향 매칭 (10점)
 */
function calculatePersonalityMatch(team: TeamRecruitment, userPrefs: any): number {
  // 현재는 personalities 데이터가 제한적이므로 기본 점수 부여
  // 추후 personality test 결과 연동 가능

  const userPersonalities = userPrefs.personalities || []

  if (userPersonalities.length === 0) {
    return 10 // 데이터 없으면 만점
  }

  // 팀 문화와 사용자 성향 간단 매칭
  if (team.culture) {
    const cultureValues = team.culture.values.map((v: string) => v.toLowerCase())

    // 긍정적 매칭 키워드
    const matchKeywords = ['협업', '소통', '학습', '성장', '창의', '책임']

    let matches = 0
    for (const personality of userPersonalities) {
      const p = personality.toLowerCase()
      for (const keyword of matchKeywords) {
        if (p.includes(keyword)) {
          matches++
          break
        }
      }
    }

    return Math.min(10, matches * 3)
  }

  return 10
}

/**
 * 스마트 매칭 - 사용자에게 추천 팀 제공 (7-factor algorithm)
 */
export function getRecommendedTeams(userId: string, limit: number = 5): TeamMatchResult[] {
  const teams = getTeams({ status: 'recruiting' })
  const userPrefs = getUserPreferences()

  const results: TeamMatchResult[] = teams.map(team => {
    const matchScore = calculateMatchScore(team.id, userId)

    // === 7가지 세부 매칭 점수 계산 ===
    const jobTitleMatch = calculateJobTitleMatch(team, userPrefs)
    const requiredSkillsMatch = calculateRequiredSkillsMatch(team, userPrefs)
    const preferredSkillsMatch = calculatePreferredSkillsMatch(team, userPrefs)
    const experienceMatch = calculateExperienceMatch(team, userPrefs)
    const locationMatch = calculateLocationMatch(team, userPrefs)
    const cultureMatch = calculateCultureMatch(team, userPrefs)
    const personalityMatch = calculatePersonalityMatch(team, userPrefs)

    // === 추천 이유 생성 (점수 기반) ===
    const recommendations: string[] = []

    if (jobTitleMatch >= 15) {
      recommendations.push('직무가 귀하의 경력 및 관심사와 매우 잘 맞습니다')
    }

    if (requiredSkillsMatch >= 15) {
      recommendations.push('보유하신 필수 스킬이 팀 요구사항과 높은 일치도를 보입니다')
    }

    if (preferredSkillsMatch >= 7) {
      recommendations.push('우대 스킬을 다수 보유하고 계십니다')
    }

    if (experienceMatch >= 12) {
      recommendations.push('경력 수준이 팀의 요구사항에 적합합니다')
    } else if (team.experienceLevel === 'any') {
      recommendations.push('경력 무관으로 누구나 참여 가능합니다')
    }

    if (locationMatch >= 8) {
      recommendations.push('선호하는 근무 형태 및 지역과 잘 맞습니다')
    } else if (team.location === 'online') {
      recommendations.push('온라인으로 진행되어 시간/장소 제약이 없습니다')
    }

    if (cultureMatch >= 8) {
      recommendations.push('팀 문화와 복지가 귀하의 가치관과 부합합니다')
    }

    if (personalityMatch >= 7) {
      recommendations.push('팀의 성향과 귀하의 인성이 잘 어울립니다')
    }

    if (team.teamType === 'study') {
      recommendations.push('스터디 형태로 부담없이 시작할 수 있습니다')
    }

    // 최소 1개 추천 이유 보장
    if (recommendations.length === 0) {
      recommendations.push('새로운 경험과 네트워킹 기회를 제공합니다')
    }

    return {
      teamId: team.id,
      applicantId: userId,
      matchScore,
      matchReasons: {
        jobTitleMatch,
        requiredSkillsMatch,
        preferredSkillsMatch,
        experienceMatch,
        locationMatch,
        cultureMatch,
        personalityMatch
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

// ============================================
// WAITLIST / QUEUE MANAGEMENT SYSTEM
// ============================================

const WAITLIST_KEY = 'jobai_team_waitlist'

/**
 * 대기열에 지원자 추가
 * 팀이 정원 마감 시 대기열로 전환
 */
export function addToWaitlist(
  teamId: string,
  positionId: string,
  applicantId: string,
  applicantName: string,
  matchScore: number
): WaitlistEntry {
  const now = new Date().toISOString()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30) // 30일 후 만료

  const entry: WaitlistEntry = {
    id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    teamId,
    positionId,
    applicantId,
    applicantName,
    matchScore,
    appliedAt: now,
    status: 'active',
    lastActivityAt: now,
    createdAt: now,
    expiresAt: expiryDate.toISOString(),
    notified: false
  }

  const stored = localStorage.getItem(WAITLIST_KEY)
  const waitlist: WaitlistEntry[] = stored ? JSON.parse(stored) : []

  waitlist.push(entry)
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist))

  return entry
}

/**
 * 특정 팀/포지션의 대기열 조회
 */
export function getWaitlist(teamId: string, positionId?: string): WaitlistEntry[] {
  const stored = localStorage.getItem(WAITLIST_KEY)
  if (!stored) return []

  const waitlist: WaitlistEntry[] = JSON.parse(stored)

  // 만료/비활성 상태 업데이트
  updateWaitlistStatuses()

  const filtered = waitlist.filter(entry => {
    if (entry.teamId !== teamId) return false
    if (positionId && entry.positionId !== positionId) return false
    if (entry.status === 'expired' || entry.status === 'converted') return false
    return true
  })

  return filtered
}

/**
 * 대기열 우선순위 정렬
 * 1순위: 매칭 점수 (높을수록 우선)
 * 2순위: 지원 시각 (빠를수록 우선)
 * 3순위: 팀 우선순위 (낮을수록 우선)
 */
export function sortWaitlistByPriority(entries: WaitlistEntry[]): WaitlistPriority[] {
  const prioritized = entries.map(entry => {
    // 우선순위 계산 (낮을수록 높은 우선순위)
    // 매칭 점수: 100점 만점을 역순으로 (100 - score)
    // 지원 시각: 타임스탬프 (빠를수록 작은 값)
    // 팀 우선순위: 직접 값 사용
    const matchScorePriority = 100 - entry.matchScore
    const timePriority = new Date(entry.appliedAt).getTime() / 1000000 // normalize to smaller number
    const teamPriorityValue = entry.teamPriority || 999

    const priority = matchScorePriority + timePriority + teamPriorityValue

    let reason = `매칭점수 ${entry.matchScore}점`
    if (entry.teamPriority !== undefined) {
      reason += `, 팀 우선순위 ${entry.teamPriority}`
    }

    return {
      entry,
      priority,
      reason
    }
  })

  // 낮은 priority 값이 먼저 오도록 정렬
  return prioritized.sort((a, b) => a.priority - b.priority)
}

/**
 * 공석 발생 시 대기열에서 자동 승격
 * 우선순위가 가장 높은 지원자를 자동으로 수락
 */
export function processWaitlistOnVacancy(
  teamId: string,
  positionId: string,
  vacancyCount: number = 1
): WaitlistEntry[] {
  const waitlist = getWaitlist(teamId, positionId)
  const sorted = sortWaitlistByPriority(waitlist)

  const converted: WaitlistEntry[] = []

  for (let i = 0; i < Math.min(vacancyCount, sorted.length); i++) {
    const { entry } = sorted[i]

    // 대기열 항목을 '전환됨' 상태로 변경
    updateWaitlistEntryStatus(entry.id, 'converted')

    // 알림 발송 표시
    markWaitlistNotified(entry.id)

    converted.push(entry)
  }

  return converted
}

/**
 * 대기열 항목 상태 업데이트
 */
export function updateWaitlistEntryStatus(
  entryId: string,
  status: 'active' | 'dormant' | 'expired' | 'converted'
): boolean {
  const stored = localStorage.getItem(WAITLIST_KEY)
  if (!stored) return false

  const waitlist: WaitlistEntry[] = JSON.parse(stored)
  const entry = waitlist.find(e => e.id === entryId)

  if (!entry) return false

  entry.status = status
  entry.lastActivityAt = new Date().toISOString()

  localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist))
  return true
}

/**
 * 대기열 알림 발송 표시
 */
export function markWaitlistNotified(entryId: string): boolean {
  const stored = localStorage.getItem(WAITLIST_KEY)
  if (!stored) return false

  const waitlist: WaitlistEntry[] = JSON.parse(stored)
  const entry = waitlist.find(e => e.id === entryId)

  if (!entry) return false

  entry.notified = true
  entry.notifiedAt = new Date().toISOString()

  localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist))
  return true
}

/**
 * 만료 및 비활성 정책 처리
 * - 30일 경과: expired
 * - 14일 동안 활동 없음: dormant
 */
export function updateWaitlistStatuses(): void {
  const stored = localStorage.getItem(WAITLIST_KEY)
  if (!stored) return

  const waitlist: WaitlistEntry[] = JSON.parse(stored)
  const now = new Date()

  let updated = false

  waitlist.forEach(entry => {
    // 이미 만료되었거나 전환된 항목은 스킵
    if (entry.status === 'expired' || entry.status === 'converted') return

    const expiryDate = new Date(entry.expiresAt)
    const lastActivity = new Date(entry.lastActivityAt)
    const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)

    // 30일 경과 시 만료
    if (now >= expiryDate) {
      entry.status = 'expired'
      updated = true
    }
    // 14일 동안 활동 없으면 비활성
    else if (daysSinceActivity >= 14 && entry.status === 'active') {
      entry.status = 'dormant'
      updated = true
    }
  })

  if (updated) {
    localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist))
  }
}

/**
 * 대기열에서 제거
 */
export function removeFromWaitlist(entryId: string): boolean {
  const stored = localStorage.getItem(WAITLIST_KEY)
  if (!stored) return false

  const waitlist: WaitlistEntry[] = JSON.parse(stored)
  const index = waitlist.findIndex(e => e.id === entryId)

  if (index === -1) return false

  waitlist.splice(index, 1)
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist))

  return true
}

/**
 * 사용자별 대기열 목록 조회
 */
export function getUserWaitlist(applicantId: string): WaitlistEntry[] {
  const stored = localStorage.getItem(WAITLIST_KEY)
  if (!stored) return []

  const waitlist: WaitlistEntry[] = JSON.parse(stored)

  // 상태 업데이트
  updateWaitlistStatuses()

  return waitlist.filter(entry =>
    entry.applicantId === applicantId &&
    entry.status !== 'expired' &&
    entry.status !== 'converted'
  )
}
