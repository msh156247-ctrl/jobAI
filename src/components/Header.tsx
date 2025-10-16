'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, LogOut, User, Menu, X, MessageCircle } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 & 데스크탑 네비게이션 */}
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link href="/" className="text-xl font-semibold text-blue-600 transition-colors hover:text-blue-700">
              JobAI
            </Link>

            {/* 데스크탑 메뉴 */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link
                href="/"
                className={`transition-colors ${
                  isActive('/') && pathname === '/'
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                추천
              </Link>
              <Link
                href="/search"
                className={`transition-colors ${
                  isActive('/search')
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                검색
              </Link>
              <Link
                href="/community"
                className={`transition-colors ${
                  isActive('/community')
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                커뮤니티
              </Link>
              <Link
                href="/chat"
                className={`transition-colors ${
                  isActive('/chat')
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                채팅
              </Link>
              <Link
                href="/applications"
                className={`transition-colors ${
                  isActive('/applications')
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                지원 현황
              </Link>
            </div>
          </div>

          {/* 데스크탑 우측 메뉴 */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <button
              className="p-2 text-gray-700 hover:text-blue-600 relative transition-colors rounded-lg hover:bg-gray-100"
              aria-label="알림"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" aria-hidden="true"></span>
            </button>
            <Link
              href="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="프로필"
            >
              <User size={20} />
              <span className="text-sm hidden lg:inline">{user?.name || user?.email}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="로그아웃"
            >
              <LogOut size={20} />
              <span className="text-sm hidden lg:inline">로그아웃</span>
            </button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              aria-label="메뉴"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in-down">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/') && pathname === '/'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                추천
              </Link>
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/search')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                검색
              </Link>
              <Link
                href="/community"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/community')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                커뮤니티
              </Link>
              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/chat')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                채팅
              </Link>
              <Link
                href="/applications"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive('/applications')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                지원 현황
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
              >
                <User size={20} />
                <span>{user?.name || user?.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-md text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors text-left"
              >
                <LogOut size={20} />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
