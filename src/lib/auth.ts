// LocalStorage 기반 인증 시스템

const STORAGE_KEYS = {
  USER: 'jobai:user',
  USERS: 'jobai:users',
} as const

export type Role = 'seeker' | 'employer'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone?: string
  createdAt: string
}

export interface StoredUser extends User {
  password: string
}

// LocalStorage 헬퍼 함수들
function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  return data ? JSON.parse(data) : []
}

function saveUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(STORAGE_KEYS.USER)
  return data ? JSON.parse(data) : null
}

function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
}

// 회원가입
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: Role,
  phone?: string
): Promise<{ user: User }> {
  const users = getUsers()

  // 이메일 중복 체크
  if (users.some(u => u.email === email)) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    email,
    password,
    name,
    role,
    phone,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  // 비밀번호 제외하고 반환
  const { password: _, ...userWithoutPassword } = newUser
  setCurrentUser(userWithoutPassword)

  return { user: userWithoutPassword }
}

// 로그인
export async function signIn(email: string, password: string): Promise<{ user: User }> {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.password === password)

  if (!user) {
    throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.')
  }

  const { password: _, ...userWithoutPassword } = user
  setCurrentUser(userWithoutPassword)

  return { user: userWithoutPassword }
}

// 소셜 로그인 (임시 사용자 생성)
export async function socialSignIn(
  provider: 'google' | 'kakao' | 'naver',
  email: string,
  name: string
): Promise<{ user: User; isNewUser: boolean }> {
  const users = getUsers()
  const existingUser = users.find(u => u.email === email)

  if (existingUser) {
    const { password: _, ...userWithoutPassword } = existingUser
    setCurrentUser(userWithoutPassword)
    return { user: userWithoutPassword, isNewUser: false }
  }

  // 새 사용자 - 추가 정보 입력 필요
  const tempUser: User = {
    id: `user-${Date.now()}`,
    email,
    name,
    role: 'seeker', // 기본값, 나중에 변경 가능
    createdAt: new Date().toISOString(),
  }

  return { user: tempUser, isNewUser: true }
}

// 로그아웃
export async function signOut(): Promise<void> {
  setCurrentUser(null)
}

// 현재 사용자 가져오기
export function getUser(): User | null {
  return getCurrentUser()
}

// 사용자 정보 업데이트
export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const users = getUsers()
  const userIndex = users.findIndex(u => u.id === userId)

  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const updatedUser = { ...users[userIndex], ...updates }
  users[userIndex] = updatedUser
  saveUsers(users)

  const { password: _, ...userWithoutPassword } = updatedUser
  setCurrentUser(userWithoutPassword)

  return userWithoutPassword
}

// 이메일 중복 확인
export function isEmailExists(email: string): boolean {
  const users = getUsers()
  return users.some(u => u.email === email)
}