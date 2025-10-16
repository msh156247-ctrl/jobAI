'use client'

import StarRating from './StarRating'
import { ReviewWithProfiles } from '@/lib/reviews'

interface ReviewCardProps {
  review: ReviewWithProfiles
  showReviewer?: boolean
  showReviewee?: boolean
  showApplication?: boolean
  onEdit?: () => void
  onDelete?: () => void
  canManage?: boolean
}

export default function ReviewCard({
  review,
  showReviewer = true,
  showReviewee = false,
  showApplication = true,
  onEdit,
  onDelete,
  canManage = false
}: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReviewerTypeLabel = (type: string) => {
    return type === 'company' ? '기업' : '구직자'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <StarRating
              rating={review.rating}
              readonly
              size="sm"
              showText={false}
            />
            <span className="font-medium text-gray-900">
              {review.rating.toFixed(1)}점
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {getReviewerTypeLabel(review.reviewer_type)} 리뷰
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {review.title}
          </h3>
        </div>

        {canManage && (
          <div className="flex space-x-2 ml-4">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="수정"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 p-1"
                title="삭제"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 리뷰 내용 */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {review.comment}
          </p>
        </div>
      )}

      {/* 메타 정보 */}
      <div className="space-y-2 text-sm text-gray-500">
        {/* 작성자 정보 */}
        {showReviewer && (
          <div className="flex items-center space-x-2">
            <span>✍️</span>
            <span>
              {review.is_anonymous
                ? '익명'
                : review.reviewer_profile?.full_name || review.reviewer_profile?.email || '알 수 없음'
              }
            </span>
            {!review.is_anonymous && (
              <span className="text-gray-400">•</span>
            )}
            <span>{formatDate(review.created_at)}</span>
          </div>
        )}

        {/* 리뷰 대상 정보 */}
        {showReviewee && (
          <div className="flex items-center space-x-2">
            <span>👤</span>
            <span>
              대상: {review.reviewee_profile?.full_name || review.reviewee_profile?.email || '알 수 없음'}
            </span>
          </div>
        )}

        {/* 관련 지원 정보 */}
        {showApplication && review.application && (
          <div className="flex items-center space-x-2">
            <span>💼</span>
            <span>
              {review.application.jobs?.title} - {review.application.jobs?.company_profiles?.company_name}
            </span>
          </div>
        )}

        {/* 수정됨 표시 */}
        {review.updated_at !== review.created_at && (
          <div className="flex items-center space-x-2 text-xs">
            <span>✏️</span>
            <span>
              {formatDate(review.updated_at)}에 수정됨
            </span>
          </div>
        )}
      </div>

      {/* 익명 표시 */}
      {review.is_anonymous && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
          🔒 익명 리뷰
        </div>
      )}
    </div>
  )
}