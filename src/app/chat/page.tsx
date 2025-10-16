'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getUserChatRooms, ChatRoomWithDetails } from '@/lib/chat'
import Link from 'next/link'

export default function ChatListPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoomWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && profile?.role) {
      loadChatRooms()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const loadChatRooms = async () => {
    if (!user || !profile?.role) return

    try {
      setLoading(true)
      const rooms = await getUserChatRooms(user.id, profile.role)
      setChatRooms(rooms)
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅룸을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getChatPartnerName = (room: ChatRoomWithDetails) => {
    if (!room.applications) return '알 수 없음'

    if (profile?.role === 'employer') {
      // 기업 입장에서는 지원자 이름
      return room.applications.profiles?.full_name || room.applications.profiles?.email || '지원자'
    } else {
      // 구직자 입장에서는 회사명
      return room.applications.jobs?.company_profiles?.company_name || '회사'
    }
  }

  const getJobTitle = (room: ChatRoomWithDetails) => {
    return room.applications?.jobs?.title || '채용공고'
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return '방금 전'
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}일 전`
    }
  }

  if (authLoading || loading) {
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
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xl font-semibold hover:text-blue-600"
              >
                JobAI
              </button>
              <nav className="flex space-x-8">
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
                  채용공고
                </Link>
                {profile?.role === 'employer' ? (
                  <Link href="/applications" className="text-gray-700 hover:text-blue-600">
                    지원자 관리
                  </Link>
                ) : (
                  <Link href="/my-applications" className="text-gray-700 hover:text-blue-600">
                    지원 현황
                  </Link>
                )}
                <Link href="/chat" className="text-blue-600 font-medium">
                  채팅
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  프로필
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {profile?.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">채팅</h1>
          <p className="mt-2 text-gray-600">
            {profile?.role === 'employer'
              ? '지원자와 대화를 나누세요.'
              : '관심있는 기업과 대화를 나누세요.'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {chatRooms.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-lg text-gray-500 mb-4">
                {profile?.role === 'employer'
                  ? '아직 채팅이 시작된 지원이 없습니다.'
                  : '아직 채팅을 시작한 지원이 없습니다.'
                }
              </p>
              <p className="text-sm text-gray-400 mb-6">
                {profile?.role === 'employer'
                  ? '지원자가 있을 때 채팅을 시작할 수 있습니다.'
                  : '지원 후 기업과 채팅을 시작할 수 있습니다.'
                }
              </p>
              <Link
                href={profile?.role === 'employer' ? '/applications' : '/jobs'}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                {profile?.role === 'employer' ? '지원자 확인하기' : '채용공고 보기'}
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {chatRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <span className="text-blue-600 text-lg">
                          {profile?.role === 'employer' ? '👤' : '🏢'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getChatPartnerName(room)}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {getJobTitle(room)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatLastActive(room.updated_at || room.created_at)}
                      </p>
                      <div className="mt-1">
                        <span className="inline-block w-3 h-3 bg-green-400 rounded-full"></span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 채팅 사용 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 채팅 사용 팁</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• 실시간으로 메시지를 주고받을 수 있습니다</li>
            <li>• 서로 정중하고 프로페셔널한 대화를 나누세요</li>
            <li>• 면접 일정이나 추가 질문 등을 논의해보세요</li>
            {profile?.role === 'employer' && (
              <li>• 지원자의 역량과 관심사를 더 자세히 알아보세요</li>
            )}
            {profile?.role === 'seeker' && (
              <li>• 회사 문화나 업무 환경에 대해 궁금한 점을 물어보세요</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}