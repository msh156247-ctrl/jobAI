import { apiClient, ApiResponse } from './client'

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface Experience {
  company: string
  position: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
}

export interface Education {
  school: string
  major: string
  degree: string
  startDate: string
  endDate?: string
  current: boolean
}

export interface JobSeekerProfile {
  userId: string
  name: string
  email: string
  phone: string
  bio?: string
  location?: string
  skills: Skill[]
  experiences: Experience[]
  education: Education[]
  preferredIndustry?: string
  preferredWorkType?: 'onsite' | 'dispatch' | 'remote'
  preferredSalaryMin?: number
  preferredSalaryMax?: number
  resumeUrl?: string
  portfolioUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CompanyProfile {
  userId: string
  companyName: string
  businessNumber: string
  industry: string
  address: string
  website?: string
  description?: string
  logoUrl?: string
  employeeCount?: number
  foundedYear?: number
  createdAt: string
  updatedAt: string
}

export type Profile = JobSeekerProfile | CompanyProfile

// 프로필 관련 API
export const profilesApi = {
  // 구직자 프로필 조회
  async getJobSeekerProfile(): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.get<JobSeekerProfile>('/profiles/jobseeker')
  },

  // 구직자 프로필 생성
  async createJobSeekerProfile(data: Partial<JobSeekerProfile>): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.post<JobSeekerProfile>('/profiles/jobseeker', data)
  },

  // 구직자 프로필 수정
  async updateJobSeekerProfile(data: Partial<JobSeekerProfile>): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.put<JobSeekerProfile>('/profiles/jobseeker', data)
  },

  // 기업 프로필 조회
  async getCompanyProfile(): Promise<ApiResponse<CompanyProfile>> {
    return apiClient.get<CompanyProfile>('/profiles/company')
  },

  // 기업 프로필 생성
  async createCompanyProfile(data: Partial<CompanyProfile>): Promise<ApiResponse<CompanyProfile>> {
    return apiClient.post<CompanyProfile>('/profiles/company', data)
  },

  // 기업 프로필 수정
  async updateCompanyProfile(data: Partial<CompanyProfile>): Promise<ApiResponse<CompanyProfile>> {
    return apiClient.put<CompanyProfile>('/profiles/company', data)
  },

  // 프로필 이미지 업로드
  async uploadProfileImage(file: File, type: 'avatar' | 'logo'): Promise<ApiResponse<{ url: string }>> {
    return apiClient.upload<{ url: string }>(`/profiles/upload/${type}`, file)
  },

  // 이력서 파일 업로드
  async uploadResume(file: File): Promise<ApiResponse<{ url: string }>> {
    return apiClient.upload<{ url: string }>('/profiles/upload/resume', file)
  },

  // 스킬 추가
  async addSkill(skill: Skill): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.post<JobSeekerProfile>('/profiles/jobseeker/skills', skill)
  },

  // 스킬 삭제
  async removeSkill(skillName: string): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.delete<JobSeekerProfile>(`/profiles/jobseeker/skills/${encodeURIComponent(skillName)}`)
  },

  // 경력 추가
  async addExperience(experience: Experience): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.post<JobSeekerProfile>('/profiles/jobseeker/experiences', experience)
  },

  // 경력 수정
  async updateExperience(index: number, experience: Experience): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.put<JobSeekerProfile>(`/profiles/jobseeker/experiences/${index}`, experience)
  },

  // 경력 삭제
  async removeExperience(index: number): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.delete<JobSeekerProfile>(`/profiles/jobseeker/experiences/${index}`)
  },

  // 학력 추가
  async addEducation(education: Education): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.post<JobSeekerProfile>('/profiles/jobseeker/education', education)
  },

  // 학력 수정
  async updateEducation(index: number, education: Education): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.put<JobSeekerProfile>(`/profiles/jobseeker/education/${index}`, education)
  },

  // 학력 삭제
  async removeEducation(index: number): Promise<ApiResponse<JobSeekerProfile>> {
    return apiClient.delete<JobSeekerProfile>(`/profiles/jobseeker/education/${index}`)
  },
}
