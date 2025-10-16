import { apiClient, ApiResponse } from './client'
import { Application } from '../mockData'

export interface ApplicationData {
  jobId: string
  coverLetter: string
  resumeFile?: File
  portfolioUrl?: string
}

export interface ApplicationDetail extends Application {
  job: {
    id: string
    title: string
    companyName: string
    location: string
  }
  user?: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export interface ApplicationListResponse {
  applications: ApplicationDetail[]
  total: number
  page: number
  totalPages: number
}

export interface ApplicationStatsResponse {
  total: number
  pending: number
  reviewing: number
  interview: number
  accepted: number
  rejected: number
}

// 지원 관련 API
export const applicationsApi = {
  // 지원서 제출
  async submitApplication(data: ApplicationData): Promise<ApiResponse<Application>> {
    if (data.resumeFile) {
      const formData = {
        jobId: data.jobId,
        coverLetter: data.coverLetter,
        portfolioUrl: data.portfolioUrl,
      }
      return apiClient.upload<Application>('/applications', data.resumeFile, formData)
    }

    return apiClient.post<Application>('/applications', {
      jobId: data.jobId,
      coverLetter: data.coverLetter,
      portfolioUrl: data.portfolioUrl,
    })
  },

  // 내 지원 내역 조회 (구직자용)
  async getMyApplications(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<ApiResponse<ApplicationListResponse>> {
    return apiClient.get<ApplicationListResponse>('/applications/my', params)
  },

  // 지원서 상세 조회
  async getApplication(applicationId: string): Promise<ApiResponse<ApplicationDetail>> {
    return apiClient.get<ApplicationDetail>(`/applications/${applicationId}`)
  },

  // 지원 취소
  async cancelApplication(applicationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/applications/${applicationId}`)
  },

  // 지원자 목록 조회 (기업용)
  async getJobApplications(
    jobId: string,
    params?: { page?: number; limit?: number; status?: string }
  ): Promise<ApiResponse<ApplicationListResponse>> {
    return apiClient.get<ApplicationListResponse>(`/jobs/${jobId}/applications`, params)
  },

  // 모든 지원자 조회 (기업용)
  async getAllApplications(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<ApiResponse<ApplicationListResponse>> {
    return apiClient.get<ApplicationListResponse>('/applications', params)
  },

  // 지원 상태 변경 (기업용)
  async updateApplicationStatus(
    applicationId: string,
    status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
  ): Promise<ApiResponse<Application>> {
    return apiClient.patch<Application>(`/applications/${applicationId}/status`, { status })
  },

  // 지원 통계 조회 (기업용)
  async getApplicationStats(jobId?: string): Promise<ApiResponse<ApplicationStatsResponse>> {
    const endpoint = jobId ? `/jobs/${jobId}/applications/stats` : '/applications/stats'
    return apiClient.get<ApplicationStatsResponse>(endpoint)
  },

  // 이력서 다운로드
  async downloadResume(applicationId: string): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/applications/${applicationId}/resume`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('이력서 다운로드에 실패했습니다.')
    }

    return response.blob()
  },
}
