'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  getEvents,
  getTrendingEvents,
  registerForEvent,
  type EventWithCompany
} from '@/lib/events'
import EventCard from '@/components/EventCard'
import Link from 'next/link'

export default function EventsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<EventWithCompany[]>([])
  const [trendingEvents, setTrendingEvents] = useState<EventWithCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [registering, setRegistering] = useState<string | null>(null)

  // 필터 상태
  const [filters, setFilters] = useState({
    event_type: '',
    is_online: undefined as boolean | undefined,
    tags: [] as string[],
    date_from: '',
    date_to: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    loadTrendingEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await getEvents({
        ...filters,
        limit: 20
      })
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '이벤트를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadTrendingEvents = async () => {
    try {
      const data = await getTrendingEvents(6)
      setTrendingEvents(data)
    } catch (err) {
      console.error('Failed to load trending events:', err instanceof Error ? err.message : err)
    }
  }

  const handleRegister = async (eventId: string) => {
    if (!user) return

    setRegistering(eventId)
    try {
      await registerForEvent(eventId, user.id)
      setSuccess('이벤트 등록이 완료되었습니다!')
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : '이벤트 등록에 실패했습니다.')
    } finally {
      setRegistering(null)
    }
  }

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      event_type: '',
      is_online: undefined,
      tags: [],
      date_from: '',
      date_to: ''
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || !profile) return null

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
                {profile.role === 'seeker' && (
                  <>
                    <Link href="/my-applications" className="text-gray-700 hover:text-blue-600">
                      지원 현황
                    </Link>
                    <Link href="/matches" className="text-gray-700 hover:text-blue-600">
                      추천 매칭
                    </Link>
                  </>
                )}
                <Link href="/events" className="text-blue-600 font-medium">
                  이벤트
                </Link>
                <Link href="/reviews" className="text-gray-700 hover:text-blue-600">
                  리뷰
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  프로필
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {profile.role === 'employer' && (
                <Link
                  href="/events/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  이벤트 생성
                </Link>
              )}
              <span className="text-sm text-gray-700">
                {profile.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">이벤트</h1>
          <p className="text-gray-600">
            채용 박람회, 웨비나, 네트워킹 이벤트에 참여하여 새로운 기회를 찾아보세요.
          </p>
        </div>

        {/* 알림 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* 인기 이벤트 */}
        {trendingEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔥 인기 이벤트</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={registering === event.id ? undefined : () => handleRegister(event.id)}
                  showActions={profile.role === 'seeker'}
                />
              ))}
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">이벤트 필터</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이벤트 유형
              </label>
              <select
                value={filters.event_type}
                onChange={(e) => handleFilterChange('event_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="job_fair">채용 박람회</option>
                <option value="webinar">웨비나</option>
                <option value="networking">네트워킹</option>
                <option value="workshop">워크샵</option>
                <option value="conference">컨퍼런스</option>
                <option value="interview_session">면접 세션</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                형태
              </label>
              <select
                value={filters.is_online === undefined ? '' : filters.is_online.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  handleFilterChange('is_online', value === '' ? undefined : value === 'true')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="true">온라인</option>
                <option value="false">오프라인</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 (이후)
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 (이전)
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 이벤트 목록 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              전체 이벤트 ({events.length})
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-lg text-gray-500 mb-4">등록된 이벤트가 없습니다.</p>
              {profile.role === 'employer' && (
                <Link
                  href="/events/create"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  첫 이벤트 만들기
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={registering === event.id ? undefined : () => handleRegister(event.id)}
                  showActions={profile.role === 'seeker'}
                />
              ))}
            </div>
          )}
        </div>

        {/* 로딩 표시 */}
        {registering && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
            이벤트 등록 중...
          </div>
        )}
      </main>
    </div>
  )
}