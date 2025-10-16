// LocalStorage 유틸리티

// 안전하게 데이터 저장
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error)
  }
}

// 안전하게 데이터 가져오기
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Failed to read from localStorage: ${key}`, error)
    return defaultValue
  }
}

// 데이터 삭제
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error)
  }
}

// 모든 데이터 삭제
export function clearStorage(): void {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Failed to clear localStorage', error)
  }
}

// 특정 prefix로 시작하는 키들 가져오기
export function getStorageKeys(prefix?: string): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key)
      }
    }
    return keys
  } catch (error) {
    console.error('Failed to get localStorage keys', error)
    return []
  }
}
