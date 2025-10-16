import { apiClient, ApiResponse } from './client'
import { Job } from '../mockData'

export interface JobListParams {
  page?: number
  limit?: number
  search?: string
  industry?: string
  location?: string
  workType?: 'onsite' | 'dispatch' | 'remote'
  salaryMin?: number
  salaryMax?: number
  skills?: string[]
}

export interface JobListResponse {
  jobs: Job[]
  total: number
  page: number
  totalPages: number
}

export interface SavedJobsResponse {
  jobs: Job[]
  total: number
}

export interface RecommendedJob extends Job {
  matchScore: number
  matchReasons: string[]
}

export interface RecommendedJobsResponse {
  jobs: RecommendedJob[]
  total: number
}

// 채용공고 관련 API
export const jobsApi = {
  // 채용공고 목록 조회
  async getJobs(params?: JobListParams): Promise<ApiResponse<JobListResponse>> {
    return apiClient.get<JobListResponse>('/jobs', params)
  },

  // 채용공고 상세 조회
  async getJob(jobId: string): Promise<ApiResponse<Job>> {
    return apiClient.get<Job>(`/jobs/${jobId}`)
  },

  // 추천 채용공고 조회
  async getRecommendedJobs(params?: { page?: number; limit?: number }): Promise<ApiResponse<RecommendedJobsResponse>> {
    return apiClient.get<RecommendedJobsResponse>('/jobs/recommended', params)
  },

  // 채용공고 검색
  async searchJobs(query: string, filters?: JobListParams): Promise<ApiResponse<JobListResponse>> {
    return apiClient.get<JobListResponse>('/jobs/search', { search: query, ...filters })
  },

  // 채용공고 저장
  async saveJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/jobs/${jobId}/save`)
  },

  // 채용공고 저장 취소
  async unsaveJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/jobs/${jobId}/save`)
  },

  // 저장한 채용공고 목록 조회
  async getSavedJobs(params?: { page?: number; limit?: number }): Promise<ApiResponse<SavedJobsResponse>> {
    return apiClient.get<SavedJobsResponse>('/jobs/saved', params)
  },

  // 채용공고 등록 (기업용)
  async createJob(jobData: Partial<Job>): Promise<ApiResponse<Job>> {
    return apiClient.post<Job>('/jobs', jobData)
  },

  // 채용공고 수정 (기업용)
  async updateJob(jobId: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> {
    return apiClient.put<Job>(`/jobs/${jobId}`, jobData)
  },

  // 채용공고 삭제 (기업용)
  async deleteJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/jobs/${jobId}`)
  },

  // 기업의 채용공고 목록 조회
  async getCompanyJobs(params?: { page?: number; limit?: number }): Promise<ApiResponse<JobListResponse>> {
    return apiClient.get<JobListResponse>('/jobs/my-jobs', params)
  },
}
