// API 통합 엔트리 포인트
export { apiClient, ApiError, type ApiResponse } from './client'
export { authApi, type User, type AuthResponse, type SignupData, type LoginData } from './auth'
export { jobsApi, type JobListParams, type JobListResponse, type RecommendedJob } from './jobs'
export { applicationsApi, type ApplicationData, type ApplicationDetail } from './applications'
export { profilesApi, type JobSeekerProfile, type CompanyProfile, type Skill, type Experience, type Education } from './profiles'
export { interviewsApi, type InterviewSlot, type Interview, type InterviewWithDetails } from './interviews'

// 환경 변수 설정 가이드
export const API_CONFIG = {
  // .env.local 파일에 다음 환경 변수를 설정하세요:
  // NEXT_PUBLIC_API_URL=http://localhost:8000/api
  // 또는 프로덕션: NEXT_PUBLIC_API_URL=https://api.yourdomain.com

  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',

  // API 통합 모드 (개발 중에는 false로 설정하여 mockData 사용)
  enabled: process.env.NEXT_PUBLIC_USE_API === 'true',
}

// Mock 데이터와 실제 API 전환을 위한 헬퍼
export const shouldUseApi = () => {
  return API_CONFIG.enabled && typeof window !== 'undefined'
}
