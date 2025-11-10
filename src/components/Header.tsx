'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
                href="/community"
                className={`transition-colors ${
                  isActive('/community')
                    ? 'text-blue-600 font-medium border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                커뮤니티
              </Link>
            </div>
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
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
