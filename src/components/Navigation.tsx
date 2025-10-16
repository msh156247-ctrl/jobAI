'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import NotificationDropdown from './NotificationDropdown'

interface NavigationProps {
  title?: string
  showSignOut?: boolean
}

export default function Navigation({ title = 'JobAI', showSignOut = true }: NavigationProps) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const isCurrentPage = (path: string) => pathname === path

  const getLinkClassName = (path: string) => {
    return isCurrentPage(path)
      ? 'text-blue-600 font-medium'
      : 'text-gray-700 hover:text-blue-600'
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-semibold hover:text-blue-600"
            >
              {title}
            </button>
            <nav className="flex space-x-8">
              <Link href="/jobs" className={getLinkClassName('/jobs')}>
                채용공고
              </Link>

              {profile?.role === 'employer' ? (
                <>
                  <Link href="/applications" className={getLinkClassName('/applications')}>
                    지원자 관리
                  </Link>
                  <Link href="/candidates" className={getLinkClassName('/candidates')}>
                    🤖 AI 인재추천
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/recommendations" className={getLinkClassName('/recommendations')}>
                    🤖 AI 추천
                  </Link>
                  <Link href="/my-applications" className={getLinkClassName('/my-applications')}>
                    지원 현황
                  </Link>
                </>
              )}

              <Link href="/chat" className={getLinkClassName('/chat')}>
                채팅
              </Link>
              <Link href="/profile" className={getLinkClassName('/profile')}>
                프로필
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && <NotificationDropdown />}
            <span className="text-sm text-gray-700">
              {user?.name || user?.email}
            </span>
            {showSignOut && user && (
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}