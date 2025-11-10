/**
 * localStorage 기반 사용자 설정 관리
 * DB 없이 브라우저에서만 설정 저장
 */

export interface UserPreferences {
  // 개인 정보
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    birthYear?: number
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  }

  // 학력
  education: {
    level: 'high-school' | 'associate' | 'bachelor' | 'master' | 'phd' | 'other'
    major?: string
    school?: string
    graduationYear?: number
  }

  // 경력
  career: {
    level: 'all' | 'newcomer' | 'junior' | 'senior' | 'lead' // 경력 수준
    years?: number
    currentCompany?: string
    currentPosition?: string
  }

  // 관심 분야
  interests: {
    skills: string[] // 관심 기술 스택
    positions: string[] // 관심 직무
    industries: string[] // 관심 산업
    locations: string[] // 선호 지역
  }

  // 근무 조건
  workConditions: {
    types: string[] // 근무 형태 (재택, 사무실, 하이브리드)
    salaryMin?: number
    salaryMax?: number
    benefits?: string[] // 희망 복지 (건강보험, 연금, 식대, 교통비 등)
  }

  // 검색 기록
  searchHistory: {
    keywords: string[]
    filters: any[]
  }
}

const STORAGE_KEY = 'jobai_user_preferences'

// 기본 설정
const DEFAULT_PREFERENCES: UserPreferences = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    gender: 'prefer-not-to-say'
  },
  education: {
    level: 'bachelor',
    major: '',
    school: ''
  },
  career: {
    level: 'all',
    years: 0
  },
  interests: {
    skills: [],
    positions: [],
    industries: [],
    locations: []
  },
  workConditions: {
    types: [],
    benefits: []
  },
  searchHistory: {
    keywords: [],
    filters: []
  }
}

/**
 * 사용자 설정 가져오기
 */
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFERENCES

    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load user preferences:', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * 사용자 설정 저장
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return

  try {
    const current = getUserPreferences()
    const updated = {
      ...current,
      ...preferences,
      personalInfo: { ...current.personalInfo, ...preferences.personalInfo },
      education: { ...current.education, ...preferences.education },
      interests: { ...current.interests, ...preferences.interests },
      workConditions: { ...current.workConditions, ...preferences.workConditions },
      career: { ...current.career, ...preferences.career },
      searchHistory: { ...current.searchHistory, ...preferences.searchHistory }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save user preferences:', error)
  }
}

/**
 * 검색 키워드 추가
 */
export function addSearchKeyword(keyword: string): void {
  const prefs = getUserPreferences()
  const keywords = prefs.searchHistory.keywords.filter(k => k !== keyword)
  keywords.unshift(keyword) // 최신 검색어를 앞에 추가

  // 최대 20개까지만 저장
  if (keywords.length > 20) {
    keywords.pop()
  }

  saveUserPreferences({
    searchHistory: {
      ...prefs.searchHistory,
      keywords
    }
  })
}

/**
 * 검색 필터 저장
 */
export function saveSearchFilter(filter: any): void {
  const prefs = getUserPreferences()
  const filters = [filter, ...prefs.searchHistory.filters]

  // 최대 10개까지만 저장
  if (filters.length > 10) {
    filters.pop()
  }

  saveUserPreferences({
    searchHistory: {
      ...prefs.searchHistory,
      filters
    }
  })
}

/**
 * 관심 기술 스택 추가
 */
export function addSkill(skill: string): void {
  const prefs = getUserPreferences()
  if (!prefs.interests.skills.includes(skill)) {
    saveUserPreferences({
      interests: {
        ...prefs.interests,
        skills: [...prefs.interests.skills, skill]
      }
    })
  }
}

/**
 * 관심 기술 스택 제거
 */
export function removeSkill(skill: string): void {
  const prefs = getUserPreferences()
  saveUserPreferences({
    interests: {
      ...prefs.interests,
      skills: prefs.interests.skills.filter(s => s !== skill)
    }
  })
}

/**
 * 모든 설정 초기화
 */
export function resetUserPreferences(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 설정 완료 여부 확인
 */
export function hasPreferences(): boolean {
  const prefs = getUserPreferences()
  return (
    prefs.interests.skills.length > 0 ||
    prefs.interests.positions.length > 0 ||
    prefs.interests.locations.length > 0
  )
}
