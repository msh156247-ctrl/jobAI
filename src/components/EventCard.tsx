'use client'

import Link from 'next/link'
import { EventWithCompany, formatEventDate, getEventTypeLabel } from '@/lib/events'

interface EventCardProps {
  event: EventWithCompany
  showActions?: boolean
  onRegister?: () => void
  onEdit?: () => void
  onDelete?: () => void
  canManage?: boolean
  className?: string
}

export default function EventCard({
  event,
  showActions = true,
  onRegister,
  onEdit,
  onDelete,
  canManage = false,
  className = ''
}: EventCardProps) {
  const isUpcoming = new Date(event.start_date) > new Date()
  const isPast = new Date(event.end_date) < new Date()
  const isOngoing = !isUpcoming && !isPast

  const getStatusColor = () => {
    if (isPast) return 'text-gray-500 bg-gray-100'
    if (isOngoing) return 'text-green-700 bg-green-100'
    return 'text-blue-700 bg-blue-100'
  }

  const getStatusLabel = () => {
    if (isPast) return '종료'
    if (isOngoing) return '진행 중'
    return '예정'
  }

  const isRegistrationOpen = () => {
    if (isPast || isOngoing) return false
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) return false
    if (event.max_participants && (event.registration_count || 0) >= event.max_participants) return false
    return true
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
              {event.title}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {getEventTypeLabel(event.event_type)}
            </span>
            <span>{event.company_profiles?.company_name}</span>
            {event.is_online ? (
              <span className="flex items-center text-green-600">
                🌐 온라인
              </span>
            ) : (
              <span className="flex items-center text-blue-600">
                📍 {event.location || '오프라인'}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 mb-3">
            📅 {formatEventDate(event.start_date, event.end_date)}
          </div>

          {event.description && (
            <p className="text-gray-700 text-sm line-clamp-2 mb-3">
              {event.description}
            </p>
          )}


          {/* 등록 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                👥 {event.registration_count || 0}명 등록
                {event.max_participants && ` / ${event.max_participants}명`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 액션 버튼 */}
      {showActions && (
        <div className="flex justify-between items-center pt-4 border-t">
          <Link
            href={`/events/${event.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            자세히 보기 →
          </Link>

          <div className="flex space-x-2">
            {canManage ? (
              // 관리자 액션
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-200"
                  >
                    삭제
                  </button>
                )}
              </>
            ) : (
              // 사용자 액션
              <>
                {event.user_registration ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded text-sm font-medium">
                    등록됨
                  </span>
                ) : isRegistrationOpen() && onRegister ? (
                  <button
                    onClick={onRegister}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    등록하기
                  </button>
                ) : !isRegistrationOpen() && !isPast ? (
                  <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded text-sm">
                    등록 마감
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded text-sm">
                    등록 불가
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 등록 마감 경고 */}
      {event.registration_deadline && isUpcoming && (
        <div className="mt-3 text-xs text-orange-600">
          ⏰ 등록 마감: {new Date(event.registration_deadline).toLocaleDateString('ko-KR')} {new Date(event.registration_deadline).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  )
}