// 스킬 타입
export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  description?: string
}

// 경력 사항
export interface CareerHistory {
  company: string
  position: string
  startDate: string
  endDate?: string
  description?: string
}

// 학력 사항
export interface Education {
  level: 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate'
  schoolName: string
  major?: string
  startYear: string
  endYear: string
}

// 자격증
export interface Certification {
  name: string
  score?: string
  date: string
}

// 어학 점수
export interface LanguageScore {
  name: string
  score: string
  date: string
}

// 우선순위 항목
export interface PriorityItem {
  id: string
  label: string
  field: string
  weight: number
  enabled: boolean
}

// 구직자 프로필 타입
export interface SeekerProfile {
  // 회원 정보
  name: string
  email: string
  phone?: string

  // 프로필 이미지 및 소개
  profileImageUrl?: string
  introduction?: string

  // 개인 정보
  location?: string
  educations: Education[]
  certifications: Certification[]
  languageScores: LanguageScore[]

  // 구직 정보
  industry?: string
  subIndustry?: string
  jobDescription?: string
  tools?: string[]
  careerType: 'newcomer' | 'experienced'
  careerYears: number
  careerHistories?: CareerHistory[]
  preferredLocations: string[]
  bio?: string
  skills: Skill[]
  personalities: string[]
  workTypes: Array<'onsite' | 'dispatch' | 'remote'>
  salaryMin?: number
  salaryMax?: number

  // 우선순위 설정
  priorities?: PriorityItem[]

  // 인증 정보
  isVerified?: boolean
  verifiedAt?: string
  verificationMethod?: 'phone' | 'email'
}

// 기업 담당자 메타 정보
export interface CompanyMeta {
  businessNumber: string
  companyName: string
  address: string
  website?: string
  description?: string
  logoUrl?: string
  industry?: string
  history?: string
  requiredPositions?: {
    position: string
    requiredSkills: string[]
    preferredSkills: string[]
  }[]

  // 우선순위 설정
  priorities?: PriorityItem[]

  // 인증 정보
  isVerified?: boolean
  verifiedAt?: string
  dartCorpCode?: string // DART 기업 고유 코드
}

// 채용 공고 타입
export interface Job {
  id: string
  companyId: string
  companyName: string
  title: string
  position: string
  location: string
  salary?: string
  salaryMin?: number
  salaryMax?: number
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience: string
  education: string
  skills: string[]
  description: string
  requirements?: string[]
  benefits?: string[]
  imageUrl?: string
  postedDate: string
  deadline?: string
  viewCount?: number
  applicationCount?: number

  // 외부 데이터 구분
  isExternal?: boolean
  externalUrl?: string
  source?: 'internal' | 'saramin' | 'jobkorea' | 'wanted' | 'linkedin'
}

// 추천 공고 타입 (점수 정보 포함)
export interface RecommendedJob extends Job {
  matchScore: number
  matchReasons: string[]
}

// 사용자 타입
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'seeker' | 'employer'
}

// 지원 정보 타입
export interface Application {
  id: string
  jobId: string
  userId: string
  userName: string
  userEmail: string
  appliedDate: string
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
  coverLetter?: string
  resumeUrl?: string
}

// 알림 타입
export interface Notification {
  id: string
  userId: string
  type: 'application' | 'message' | 'match' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  message: string
  timestamp: string
  read: boolean
}

// 이벤트 타입
export interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  imageUrl?: string
  organizerId: string
  attendees: string[]
  maxAttendees?: number
}

// 리뷰 타입
export interface Review {
  id: string
  companyId: string
  userId: string
  userName: string
  rating: number
  title: string
  pros?: string
  cons?: string
  content: string
  createdAt: string
  helpful: number
}

// 인증 관련 타입
export interface VerificationRequest {
  type: 'phone' | 'business'
  phoneNumber?: string
  businessNumber?: string
  name: string
}

export interface VerificationResponse {
  success: boolean
  message: string
  verificationId?: string
  expiresAt?: string
}

export interface PhoneVerification {
  id: string
  phoneNumber: string
  code: string
  verified: boolean
  expiresAt: string
}

// DART API 응답 타입
export interface DartCompanyInfo {
  corpCode: string
  corpName: string
  stockCode?: string
  ceoName?: string
  corpCls?: string
  jurirNo?: string
  biznNo?: string
  address?: string
  homePage?: string
  irUrl?: string
  phoneNumber?: string
  faxNumber?: string
  indutyCode?: string
  estDate?: string
}

// 커뮤니티 게시글 타입
export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorRole: 'seeker' | 'employer'
  category: 'qna' | 'career' | 'interview' | 'salary' | 'company' | 'education' | 'conference' | 'study' | 'free'
  title: string
  content: string
  images?: string[]
  tags?: string[]
  views: number
  likes: number
  commentsCount: number
  createdAt: string
  updatedAt?: string
}

// 커뮤니티 댓글 타입
export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorRole: 'seeker' | 'employer'
  content: string
  likes: number
  createdAt: string
  updatedAt?: string
  parentId?: string // 대댓글용
}

// 팀 프로젝트
export interface TeamProject {
  id: string
  name: string
  description: string
  progress: number // 0-100
  status: 'planning' | 'in-progress' | 'completed'
  startDate?: string
  endDate?: string
}

// 팀 문화
export interface TeamCulture {
  values: string[] // 팀 가치 (예: "코드 품질 중시", "빠른 실험")
  workingStyle: string[] // 일하는 방식 (예: "Agile Sprint", "Code Review 필수")
  communicationStyle: string // 커뮤니케이션 스타일
  meetingFrequency: string // 미팅 빈도
}

// 복지/혜택
export interface Benefits {
  salary?: string // 연봉 범위
  equity?: boolean // 스톡옵션
  workFromHome?: boolean // 재택 가능
  flexibleHours?: boolean // 유연근무
  meals?: boolean // 식대 제공
  education?: boolean // 교육비 지원
  equipment?: boolean // 장비 지원
  vacation?: string // 휴가 정책
  other?: string[] // 기타 복지
}

// 팀 모집 타입
export interface TeamRecruitment {
  id: string
  title: string
  description: string
  leaderId: string
  leaderName: string

  // 팀 정보
  teamType: 'project' | 'study' | 'startup' | 'contest' | 'opensource'
  industry: string // IT/기술, 금융, 의료, 교육, 마케팅, 디자인 등
  techStack: string[] // 기술 스택
  companyLogo?: string // 회사 로고 URL
  teamSize?: number // 팀 전체 크기

  // 모집 정보
  positions: TeamPosition[] // 모집 포지션
  totalSlots: number // 전체 정원
  filledSlots: number // 현재 인원

  // 활동 정보
  duration: string // 활동 기간 (예: "3개월", "6개월", "상시")
  location: 'online' | 'offline' | 'hybrid'
  locationDetail?: string // 오프라인 시 상세 위치
  schedule?: string // 활동 일정 (예: "주 2회, 평일 저녁")

  // 매칭 관련
  requiredSkills: string[] // 필수 스킬
  preferredSkills?: string[] // 우대 스킬
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'any'

  // 팀 문화 & 프로젝트 (NEW)
  culture?: TeamCulture // 팀 문화
  currentProjects?: TeamProject[] // 현재 진행 중인 프로젝트
  benefits?: Benefits // 복지/혜택

  // 통계
  views: number
  applicantsCount: number
  bookmarksCount: number

  // 상태
  status: 'recruiting' | 'full' | 'closed'
  tags?: string[]

  createdAt: string
  updatedAt?: string
  deadline?: string // 마감일
}

// 팀 포지션
export interface TeamPosition {
  id: string
  title: string // 포지션명 (예: "프론트엔드 개발자", "백엔드 개발자", "디자이너")
  description: string
  requiredCount: number // 필요 인원
  filledCount: number // 현재 인원
  requiredSkills: string[]
  responsibilities: string[] // 담당 업무
}

// 팀 지원
export interface TeamApplication {
  id: string
  teamId: string
  positionId: string

  // 지원자 정보
  applicantId: string
  applicantName: string

  // 지원 내용
  motivation: string // 지원 동기
  experience: string // 관련 경험
  availableTime: string // 가능한 시간
  portfolioUrl?: string
  githubUrl?: string

  // 매칭 점수
  matchScore?: number // 0-100

  // 상태
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'waitlisted'

  createdAt: string
  reviewedAt?: string
  reviewerNote?: string // 팀장 메모
}

// 팀 매칭 결과
export interface TeamMatchResult {
  teamId: string
  applicantId: string
  matchScore: number // 0-100
  matchReasons: {
    skillMatch: number // 스킬 매칭 점수
    experienceMatch: number // 경력 매칭 점수
    availabilityMatch: number // 활동 가능 시간 매칭 점수
    locationMatch: number // 위치 매칭 점수
  }
  recommendations: string[] // 추천 이유
  concerns?: string[] // 우려사항
}
