'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import { getNotificationIcon, getNotificationColor } from '@/lib/notifications'
import Link from 'next/link'

export default function NotificationsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getNotificationAction = (notification: any) => {
    const metadata = notification.metadata

    switch (notification.type) {
      case 'new_message':
        return (
          <Link
            href="/chat"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            채팅 확인 →
          </Link>
        )
      case 'application_reviewed':
      case 'interview_scheduled':
      case 'application_accepted':
      case 'application_rejected':
        return (
          <Link
            href="/my-applications"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            지원 현황 확인 →
          </Link>
        )
      case 'new_application':
        return (
          <Link
            href="/applications"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            지원자 확인 →
          </Link>
        )
      default:
        return null
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user) return null

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
                <Link href="/chat" className="text-gray-700 hover:text-blue-600">
                  채팅
                </Link>
                <Link href="/notifications" className="text-blue-600 font-medium">
                  알림
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
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                모두 읽음 표시
              </button>
            )}
          </div>

          {/* 필터 탭 */}
          <div className="flex space-x-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              전체 ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              읽지 않음 ({unreadCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 알림 목록 */}
        <div className="bg-white shadow rounded-lg">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">
                {filter === 'unread' ? '✅' : '🔔'}
              </div>
              <p className="text-lg text-gray-500 mb-2">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
              </p>
              <p className="text-sm text-gray-400">
                {filter === 'unread'
                  ? '모든 알림을 확인하셨습니다!'
                  : '새로운 알림이 있을 때 여기에 표시됩니다.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const { date, time } = formatDateTime(notification.created_at)

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <span className={`text-2xl ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`text-lg font-semibold ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>

                          <p className="text-gray-700 mb-3 leading-relaxed">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>📅 {date}</span>
                              <span>🕐 {time}</span>
                            </div>

                            {getNotificationAction(notification)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 알림 설정 안내 */}
        {notifications.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 알림 기능 안내</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• 지원 상태가 변경되면 실시간으로 알림을 받습니다</li>
              <li>• 새로운 메시지가 도착하면 즉시 알림됩니다</li>
              <li>• 브라우저 알림을 허용하면 JobAI를 사용하지 않을 때도 알림을 받을 수 있습니다</li>
              {profile?.role === 'employer' && (
                <li>• 새로운 지원자가 있을 때 즉시 알림을 받습니다</li>
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}