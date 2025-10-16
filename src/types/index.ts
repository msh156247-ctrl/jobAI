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
