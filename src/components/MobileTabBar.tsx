'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, FileText, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function MobileTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // 로그인 페이지, 회원가입 페이지에서는 탭바 숨김
  if (!user || pathname === '/login' || pathname === '/signup') {
    return null
  }

  const tabs = [
    { name: '홈', href: '/', icon: Home },
    { name: '검색', href: '/search', icon: Search },
    { name: '채팅', href: '/chat', icon: MessageCircle },
    { name: '지원현황', href: '/applications', icon: FileText },
    { name: '마이', href: '/profile', icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}