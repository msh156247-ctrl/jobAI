'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import NotificationDropdown from '@/components/NotificationDropdown'

export default function DashboardPage() {
  const { user, loading, signOut: contextSignOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await contextSignOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">JobAI</h1>
              <nav className="flex space-x-8">
                <Link
                  href="/jobs"
                  className="text-gray-700 hover:text-blue-600"
                >
                  채용공고
                </Link>
                {user?.role === 'employer' ? (
                  <Link
                    href="/applications"
                    className="text-gray-700 hover:text-blue-600"
                  >
                    지원자 관리
                  </Link>
                ) : (
                  <Link
                    href="/my-applications"
                    className="text-gray-700 hover:text-blue-600"
                  >
                    지원 현황
                  </Link>
                )}
                <Link
                  href="/chat"
                  className="text-gray-700 hover:text-blue-600"
                >
                  채팅
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-blue-600"
                >
                  프로필
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <span className="text-sm text-gray-700">
                {user.name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                환영합니다, {user?.role === 'employer' ? '기업' : '구직자'}님!
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                {user?.role === 'employer'
                  ? '채용 공고를 등록하고 지원자를 관리해보세요.'
                  : '관심있는 채용 공고를 찾아보세요.'
                }
              </p>

              <div className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user?.role === 'employer' ? (
                    <>
                      <Link
                        href="/jobs/create"
                        className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">📝</div>
                        <h3 className="text-lg font-semibold mb-2">채용 공고 등록</h3>
                        <p className="text-sm opacity-90">새로운 채용 공고를 등록하세요</p>
                      </Link>
                      <Link
                        href="/applications"
                        className="bg-gray-600 text-white p-6 rounded-lg hover:bg-gray-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">📊</div>
                        <h3 className="text-lg font-semibold mb-2">지원자 관리</h3>
                        <p className="text-sm opacity-90">지원자 현황을 관리하세요</p>
                      </Link>
                      <Link
                        href="/candidates"
                        className="bg-indigo-600 text-white p-6 rounded-lg hover:bg-indigo-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">🤖</div>
                        <h3 className="text-lg font-semibold mb-2">AI 인재추천</h3>
                        <p className="text-sm opacity-90">AI가 추천하는 맞춤 인재</p>
                      </Link>
                      <Link
                        href="/chat"
                        className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">💬</div>
                        <h3 className="text-lg font-semibold mb-2">채팅</h3>
                        <p className="text-sm opacity-90">지원자와 소통하세요</p>
                      </Link>
                      <Link
                        href="/profile"
                        className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">🏢</div>
                        <h3 className="text-lg font-semibold mb-2">기업 프로필</h3>
                        <p className="text-sm opacity-90">기업 정보를 관리하세요</p>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/search"
                        className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">🔍</div>
                        <h3 className="text-lg font-semibold mb-2">채용 공고 찾기</h3>
                        <p className="text-sm opacity-90">원하는 일자리를 찾아보세요</p>
                      </Link>
                      <Link
                        href="/my-applications"
                        className="bg-orange-600 text-white p-6 rounded-lg hover:bg-orange-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">📋</div>
                        <h3 className="text-lg font-semibold mb-2">지원 현황</h3>
                        <p className="text-sm opacity-90">내 지원 현황을 확인하세요</p>
                      </Link>
                      <Link
                        href="/chat"
                        className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">💬</div>
                        <h3 className="text-lg font-semibold mb-2">채팅</h3>
                        <p className="text-sm opacity-90">기업과 소통하세요</p>
                      </Link>
                      <Link
                        href="/profile"
                        className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        <div className="text-3xl mb-2">👤</div>
                        <h3 className="text-lg font-semibold mb-2">내 프로필</h3>
                        <p className="text-sm opacity-90">프로필을 관리하세요</p>
                      </Link>
                    </>
                  )}
                </div>

                {/* 최근 활동 섹션 */}
                <div className="mt-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {user?.role === 'employer' ? '최근 등록한 공고' : '최근 활동'}
                  </h3>
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <p className="text-gray-600">
                      {user?.role === 'employer'
                        ? '등록된 채용 공고가 없습니다. 첫 번째 공고를 등록해보세요!'
                        : '아직 지원한 공고가 없습니다. 관심있는 공고에 지원해보세요!'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}