import { apiClient, ApiResponse } from './client'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  userType: 'jobseeker' | 'employer'
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface SignupData {
  email: string
  password: string
  name: string
  phone: string
  userType: 'jobseeker' | 'employer'
  verificationCode?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface VerifyCodeData {
  target: string
  code: string
  type: 'email' | 'phone'
}

// 인증 관련 API
export const authApi = {
  // 회원가입
  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/signup', data)
  },

  // 로그인
  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/login', data)
  },

  // 로그아웃
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout')
  },

  // 이메일 인증 코드 발송
  async sendEmailVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/verify/email/send', { email })
  },

  // 전화번호 인증 코드 발송
  async sendPhoneVerification(phone: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/verify/phone/send', { phone })
  },

  // 인증 코드 확인
  async verifyCode(data: VerifyCodeData): Promise<ApiResponse<{ verified: boolean }>> {
    return apiClient.post<{ verified: boolean }>('/auth/verify/check', data)
  },

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me')
  },

  // 비밀번호 재설정 요청
  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/password/reset', { email })
  },

  // 비밀번호 재설정
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/password/reset/confirm', {
      token,
      password: newPassword,
    })
  },
}
