'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  getEvent,
  registerForEvent,
  formatEventDate,
  getEventTypeLabel,
  type EventWithDetails
} from '@/lib/events'
import Link from 'next/link'

interface EventDetailPageProps {
  params: {
    id: string
  }
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const data = await getEvent(params.id, user?.id)
      if (!data) {
        setError('이벤트를 찾을 수 없습니다.')
        return
      }
      setEvent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '이벤트를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!user || !event) return

    setRegistering(true)
    try {
      await registerForEvent(event.id, user.id)
      setSuccess('이벤트 등록이 완료되었습니다!')
      await loadEvent() // 등록 상태 업데이트
    } catch (err) {
      setError(err instanceof Error ? err.message : '이벤트 등록에 실패했습니다.')
    } finally {
      setRegistering(false)
    }
  }

  const isUpcoming = event && new Date(event.start_date) > new Date()
  const isPast = event && new Date(event.end_date) < new Date()
  const isOngoing = event && !isUpcoming && !isPast

  const canRegister = () => {
    if (!event || !user || isPast || isOngoing) return false
    if (event.user_registration) return false
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) return false
    if (event.max_participants && (event.registration_count || 0) >= event.max_participants) return false
    return true
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || !profile) return null

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error || '이벤트를 불러올 수 없습니다.'}</p>
          <Link
            href="/events"
            className="text-blue-600 hover:text-blue-800"
          >
            이벤트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
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
                <Link href="/events" className="text-blue-600 font-medium">
                  이벤트
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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

        {/* 이벤트 헤더 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="relative">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      isPast ? 'text-gray-500 bg-gray-100' :
                      isOngoing ? 'text-green-700 bg-green-100' :
                      'text-blue-700 bg-blue-100'
                    }`}>
                      {isPast ? '종료' : isOngoing ? '진행 중' : '예정'}
                    </span>
                    {event.is_online ? (
                      <span className="text-green-600 text-sm">🌐 온라인</span>
                    ) : (
                      <span className="text-blue-600 text-sm">📍 오프라인</span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {event.title}
                  </h1>

                  <p className="text-lg text-gray-600 mb-4">
                    {event.company_profiles?.company_name}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      <span>{formatEventDate(event.start_date, event.end_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">👥</span>
                      <span>
                        {event.registration_count || 0}명 등록
                        {event.max_participants && ` / ${event.max_participants}명`}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 등록 버튼 */}
                {profile.role === 'seeker' && (
                  <div className="ml-6">
                    {event.user_registration ? (
                      <div className="text-center">
                        <span className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium">
                          등록 완료
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          상태: {event.user_registration.status === 'pending' ? '승인 대기' :
                                 event.user_registration.status === 'approved' ? '승인됨' :
                                 event.user_registration.status === 'rejected' ? '거절됨' :
                                 event.user_registration.status}
                        </p>
                      </div>
                    ) : canRegister() ? (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                      >
                        {registering ? '등록 중...' : '등록하기'}
                      </button>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-6 py-3 rounded-lg font-medium">
                        등록 불가
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 등록 마감 경고 */}
              {event.registration_deadline && isUpcoming && (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded">
                  ⏰ 등록 마감: {new Date(event.registration_deadline).toLocaleDateString('ko-KR')} {new Date(event.registration_deadline).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 이벤트 상세 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 설명 */}
            {event.description && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">이벤트 소개</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{event.description}</p>
                </div>
              </div>
            )}

            {/* 세션 정보 */}
            {event.event_sessions && event.event_sessions.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">세션 일정</h2>
                <div className="space-y-4">
                  {event.event_sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{session.title}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(session.start_time).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(session.end_time).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-gray-700 text-sm mb-2">{session.description}</p>
                      )}
                      {session.speaker_name && (
                        <p className="text-gray-600 text-sm">
                          발표자: {session.speaker_name}
                          {session.speaker_company && ` (${session.speaker_company})`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 이벤트 정보 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">이벤트 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">일시</span>
                  <span className="text-gray-900">{formatEventDate(event.start_date, event.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">형태</span>
                  <span className="text-gray-900">{event.is_online ? '온라인' : '오프라인'}</span>
                </div>
                {event.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">장소</span>
                    <span className="text-gray-900">{event.location}</span>
                  </div>
                )}
                {event.online_link && (
                  <div>
                    <span className="text-gray-500 block mb-1">온라인 링크</span>
                    <a href={event.online_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline break-all">{event.online_link}</a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">정원</span>
                  <span className="text-gray-900">
                    {event.max_participants || '제한 없음'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">상태</span>
                  <span className="text-gray-900">{event.status === 'upcoming' ? '예정' : event.status === 'ongoing' ? '진행중' : event.status === 'completed' ? '종료' : '취소됨'}</span>
                </div>
              </div>
            </div>

            {/* 주최 회사 정보 */}
            {event.company_profiles && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주최 회사</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-900 font-medium">{event.company_profiles.company_name}</span>
                  </div>
                  {event.company_profiles.location && (
                    <div>
                      <span className="text-gray-500">위치: {event.company_profiles.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/events"
            className="text-blue-600 hover:text-blue-800"
          >
            ← 이벤트 목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  )
}