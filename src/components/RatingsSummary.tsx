'use client'

import StarRating from './StarRating'
import { UserRatingSummary } from '@/lib/reviews'

interface RatingsSummaryProps {
  ratingSummary: UserRatingSummary[]
  compact?: boolean
  className?: string
}

export default function RatingsSummary({
  ratingSummary,
  compact = false,
  className = ''
}: RatingsSummaryProps) {
  if (!ratingSummary.length) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="text-gray-400 mb-2">⭐</div>
        <p className="text-gray-500 text-sm">아직 받은 리뷰가 없습니다</p>
      </div>
    )
  }

  const companyReviews = ratingSummary.find(r => r.reviewer_type === 'company')
  const userReviews = ratingSummary.find(r => r.reviewer_type === 'user')

  if (compact) {
    const mainRating = companyReviews || userReviews
    if (!mainRating) return null

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <StarRating
          rating={mainRating.average_rating}
          readonly
          size="sm"
          showText={false}
        />
        <span className="text-sm font-medium text-gray-900">
          {mainRating.average_rating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          ({mainRating.review_count}개 리뷰)
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 전체 평점 요약 */}
      <div className="text-center">
        <div className="mb-2">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {ratingSummary.length > 0
              ? (ratingSummary.reduce((sum, r) => sum + r.average_rating * r.review_count, 0) /
                 ratingSummary.reduce((sum, r) => sum + r.review_count, 0)).toFixed(1)
              : '0.0'
            }
          </div>
          <StarRating
            rating={ratingSummary.length > 0
              ? ratingSummary.reduce((sum, r) => sum + r.average_rating * r.review_count, 0) /
                ratingSummary.reduce((sum, r) => sum + r.review_count, 0)
              : 0
            }
            readonly
            size="lg"
            showText={false}
            className="justify-center"
          />
        </div>
        <p className="text-gray-600">
          총 {ratingSummary.reduce((sum, r) => sum + r.review_count, 0)}개의 리뷰
        </p>
      </div>

      {/* 리뷰어 타입별 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 기업 리뷰 */}
        {companyReviews && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-blue-600 font-medium">🏢 기업 평가</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <StarRating
                rating={companyReviews.average_rating}
                readonly
                size="sm"
                showText={false}
              />
              <span className="font-semibold text-gray-900">
                {companyReviews.average_rating.toFixed(1)}점
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {companyReviews.review_count}개 리뷰
            </p>

            {/* 별점 분포 */}
            <div className="space-y-1 text-xs">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = rating === 5 ? companyReviews.five_star_count :
                            rating === 4 ? companyReviews.four_star_count :
                            rating === 3 ? companyReviews.three_star_count :
                            rating === 2 ? companyReviews.two_star_count :
                            companyReviews.one_star_count
                const percentage = companyReviews.review_count > 0 ? (count / companyReviews.review_count) * 100 : 0

                return (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="w-4 text-gray-600">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 구직자 리뷰 */}
        {userReviews && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-green-600 font-medium">👤 구직자 평가</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <StarRating
                rating={userReviews.average_rating}
                readonly
                size="sm"
                showText={false}
              />
              <span className="font-semibold text-gray-900">
                {userReviews.average_rating.toFixed(1)}점
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {userReviews.review_count}개 리뷰
            </p>

            {/* 별점 분포 */}
            <div className="space-y-1 text-xs">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = rating === 5 ? userReviews.five_star_count :
                            rating === 4 ? userReviews.four_star_count :
                            rating === 3 ? userReviews.three_star_count :
                            rating === 2 ? userReviews.two_star_count :
                            userReviews.one_star_count
                const percentage = userReviews.review_count > 0 ? (count / userReviews.review_count) * 100 : 0

                return (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="w-4 text-gray-600">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 최근 리뷰 날짜 */}
      {ratingSummary.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            최근 리뷰: {new Date(
              Math.max(...ratingSummary.map(r => new Date(r.latest_review_date).getTime()))
            ).toLocaleDateString('ko-KR')}
          </p>
        </div>
      )}
    </div>
  )
}