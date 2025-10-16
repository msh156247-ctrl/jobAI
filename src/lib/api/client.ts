// API 클라이언트 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    const user = localStorage.getItem('user')
    if (!user) return null
    try {
      const userData = JSON.parse(user)
      return userData.token || null
    } catch {
      return null
    }
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders }
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders(options.headers as Record<string, string>)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      let data
      if (isJson) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || data?.error || 'API 요청 실패',
          response.status,
          data
        )
      }

      return isJson ? data : { data }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      })
    }

    const token = this.getAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    })
  }
}

export const apiClient = new ApiClient()
