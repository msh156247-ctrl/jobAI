'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface RequireAuthProps {
  children: ReactNode
  redirectTo?: string
}

export default function RequireAuth({ children, redirectTo }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      const destination = redirectTo || `/login?next=${encodeURIComponent(pathname)}`
      router.push(destination)
    }
  }, [user, loading, router, pathname, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
