'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, getUser, signOut as authSignOut } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  profile: User | null  // User.role을 profile.role로 접근하기 위해 추가
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = () => {
    const currentUser = getUser()
    setUser(currentUser)
  }

  useEffect(() => {
    // 초기 로드 시 사용자 확인
    refreshUser()
    setLoading(false)

    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 감지)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jobai:user') {
        refreshUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const signOut = async () => {
    await authSignOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}