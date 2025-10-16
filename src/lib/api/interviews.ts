import { apiClient, ApiResponse } from './client'

export interface InterviewSlot {
  id: string
  jobId: string
  datetime: string
  duration: number
  location?: string
  type: 'online' | 'offline'
  meetingUrl?: string
  isBooked: boolean
  bookedBy?: string
}

export interface Interview {
  id: string
  applicationId: string
  slotId: string
  jobId: string
  userId: string
  datetime: string
  duration: number
  location?: string
  type: 'online' | 'offline'
  meetingUrl?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InterviewWithDetails extends Interview {
  job: {
    id: string
    title: string
    companyName: string
  }
  applicant?: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export interface InterviewSlotsResponse {
  slots: InterviewSlot[]
  total: number
}

export interface InterviewListResponse {
  interviews: InterviewWithDetails[]
  total: number
  page: number
  totalPages: number
}

// 면접 관련 API
export const interviewsApi = {
  // 면접 가능 시간 조회
  async getInterviewSlots(jobId: string): Promise<ApiResponse<InterviewSlotsResponse>> {
    return apiClient.get<InterviewSlotsResponse>(`/jobs/${jobId}/interview-slots`)
  },

  // 면접 시간 예약
  async bookInterviewSlot(slotId: string): Promise<ApiResponse<Interview>> {
    return apiClient.post<Interview>(`/interview-slots/${slotId}/book`)
  },

  // 내 면접 일정 조회 (구직자용)
  async getMyInterviews(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<ApiResponse<InterviewListResponse>> {
    return apiClient.get<InterviewListResponse>('/interviews/my', params)
  },

  // 면접 상세 조회
  async getInterview(interviewId: string): Promise<ApiResponse<InterviewWithDetails>> {
    return apiClient.get<InterviewWithDetails>(`/interviews/${interviewId}`)
  },

  // 면접 취소 (구직자용)
  async cancelInterview(interviewId: string, reason?: string): Promise<ApiResponse<Interview>> {
    return apiClient.patch<Interview>(`/interviews/${interviewId}/cancel`, { reason })
  },

  // 면접 슬롯 생성 (기업용)
  async createInterviewSlot(jobId: string, slotData: {
    datetime: string
    duration: number
    location?: string
    type: 'online' | 'offline'
    meetingUrl?: string
  }): Promise<ApiResponse<InterviewSlot>> {
    return apiClient.post<InterviewSlot>(`/jobs/${jobId}/interview-slots`, slotData)
  },

  // 면접 슬롯 수정 (기업용)
  async updateInterviewSlot(slotId: string, slotData: Partial<InterviewSlot>): Promise<ApiResponse<InterviewSlot>> {
    return apiClient.put<InterviewSlot>(`/interview-slots/${slotId}`, slotData)
  },

  // 면접 슬롯 삭제 (기업용)
  async deleteInterviewSlot(slotId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/interview-slots/${slotId}`)
  },

  // 기업의 면접 일정 조회 (기업용)
  async getCompanyInterviews(params?: {
    page?: number
    limit?: number
    jobId?: string
    status?: string
  }): Promise<ApiResponse<InterviewListResponse>> {
    return apiClient.get<InterviewListResponse>('/interviews/company', params)
  },

  // 면접 상태 변경 (기업용)
  async updateInterviewStatus(
    interviewId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show',
    notes?: string
  ): Promise<ApiResponse<Interview>> {
    return apiClient.patch<Interview>(`/interviews/${interviewId}/status`, { status, notes })
  },

  // ICS 파일 다운로드
  async downloadICS(interviewId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/interviews/${interviewId}/ics`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('ICS 파일 다운로드에 실패했습니다.')
    }

    return response.blob()
  },
}
