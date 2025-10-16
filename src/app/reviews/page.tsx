'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  getReviewableApplications,
  getUserReviews,
  getReviewsByUser,
  getUserRatingSummary,
  createReview,
  updateReview,
  deleteReview,
  canUserReviewApplication,
  type ReviewWithProfiles,
  type UserRatingSummary,
  type ReviewFormData
} from '@/lib/reviews'
import ReviewCard from '@/components/ReviewCard'
import ReviewForm from '@/components/ReviewForm'
import RatingsSummary from '@/components/RatingsSummary'
import Link from 'next/link'

export default function ReviewsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'to_review' | 'received' | 'written'>('to_review')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data states
  const [reviewableApps, setReviewableApps] = useState<any[]>([])
  const [receivedReviews, setReceivedReviews] = useState<ReviewWithProfiles[]>([])
  const [writtenReviews, setWrittenReviews] = useState<ReviewWithProfiles[]>([])
  const [ratingSummary, setRatingSummary] = useState<UserRatingSummary[]>([])

  // Modal states
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [currentApplication, setCurrentApplication] = useState<any>(null)
  const [editingReview, setEditingReview] = useState<ReviewWithProfiles | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && profile) {
      loadAllData()
    }
  }, [user, profile])

  const loadAllData = async () => {
    if (!user || !profile) return

    try {
      setLoading(true)
      const [
        reviewableData,
        receivedData,
        writtenData,
        summaryData
      ] = await Promise.all([
        getReviewableApplications(user.id, profile.role as 'seeker' | 'employer'),
        getUserReviews(user.id),
        getReviewsByUser(user.id),
        getUserRatingSummary(user.id)
      ])

      setReviewableApps(reviewableData)
      setReceivedReviews(receivedData)
      setWrittenReviews(writtenData)
      setRatingSummary(summaryData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartReview = async (application: any) => {
    if (!user || !profile) return

    try {
      const canReview = await canUserReviewApplication(
        application.id,
        user.id,
        profile.role as 'seeker' | 'employer'
      )

      if (!canReview) {
        setError('이 지원서에 대해 리뷰를 작성할 수 없습니다.')
        return
      }

      setCurrentApplication(application)
      setEditingReview(null)
      setShowReviewForm(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEditReview = (review: ReviewWithProfiles) => {
    setEditingReview(review)
    setCurrentApplication(null)
    setShowReviewForm(true)
  }

  const handleSubmitReview = async (reviewData: ReviewFormData) => {
    if (!user || !profile) return

    setSubmitting(true)
    try {
      if (editingReview) {
        // Update existing review
        await updateReview(editingReview.id, reviewData)
        setSuccess('리뷰가 수정되었습니다.')
      } else if (currentApplication) {
        // Create new review
        const revieweeId = profile.role === 'seeker'
          ? currentApplication.jobs?.company_profiles?.user_id
          : currentApplication.user_id

        await createReview(
          currentApplication.id,
          user.id,
          revieweeId,
          profile.role as 'seeker' | 'employer',
          reviewData
        )
        setSuccess('리뷰가 등록되었습니다.')
      }

      setShowReviewForm(false)
      setCurrentApplication(null)
      setEditingReview(null)
      await loadAllData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return

    try {
      await deleteReview(reviewId)
      setSuccess('리뷰가 삭제되었습니다.')
      await loadAllData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getTargetName = () => {
    if (editingReview) {
      return editingReview.reviewee_profile?.full_name ||
             editingReview.reviewee_profile?.email ||
             '알 수 없음'
    }
    if (currentApplication) {
      return profile?.role === 'seeker'
        ? currentApplication.jobs?.company_profiles?.company_name || '회사'
        : currentApplication.profiles?.full_name ||
          currentApplication.profiles?.email || '지원자'
    }
    return ''
  }

  const getTargetType = (): 'seeker' | 'employer' => {
    return profile?.role === 'seeker' ? 'employer' : 'seeker'
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
                  <Link href="/my-applications" className="text-gray-700 hover:text-blue-600">
                    지원 현황
                  </Link>
                )}
                <Link href="/reviews" className="text-blue-600 font-medium">
                  리뷰 관리
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  프로필
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {profile.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 관리</h1>
          <p className="text-gray-600">
            {profile.role === 'seeker' ? '기업에 대한 리뷰를 작성하고 관리하세요.' : '지원자에 대한 리뷰를 작성하고 관리하세요.'}
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

        {/* 평점 요약 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">나의 평점</h2>
          <RatingsSummary ratingSummary={ratingSummary} />
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('to_review')}
                className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                  activeTab === 'to_review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                리뷰 작성 ({reviewableApps.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                받은 리뷰 ({receivedReviews.length})
              </button>
              <button
                onClick={() => setActiveTab('written')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'written'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                작성한 리뷰 ({writtenReviews.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 리뷰 작성 탭 */}
            {activeTab === 'to_review' && (
              <div>
                {reviewableApps.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-lg text-gray-500 mb-4">
                      리뷰 작성 가능한 지원서가 없습니다.
                    </p>
                    <p className="text-gray-400 text-sm">
                      완료된 지원서(합격/불합격)에 대해 리뷰를 작성할 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewableApps.map((application) => (
                      <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {profile.role === 'seeker'
                                  ? application.jobs?.title
                                  : `${application.profiles?.name || application.profiles?.email}의 지원`
                                }
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                application.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {application.status === 'accepted' ? '합격' : '불합격'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">
                              {profile.role === 'seeker'
                                ? application.jobs?.company_profiles?.company_name
                                : application.jobs?.title
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              지원일: {new Date(application.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleStartReview(application)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            리뷰 작성
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 받은 리뷰 탭 */}
            {activeTab === 'received' && (
              <div>
                {receivedReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⭐</div>
                    <p className="text-lg text-gray-500">아직 받은 리뷰가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {receivedReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        showReviewer={true}
                        showReviewee={false}
                        showApplication={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 작성한 리뷰 탭 */}
            {activeTab === 'written' && (
              <div>
                {writtenReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✍️</div>
                    <p className="text-lg text-gray-500">아직 작성한 리뷰가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {writtenReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        showReviewer={false}
                        showReviewee={true}
                        showApplication={true}
                        onEdit={() => handleEditReview(review)}
                        onDelete={() => handleDeleteReview(review.id)}
                        canManage={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 리뷰 작성/수정 모달 */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingReview ? '리뷰 수정' : '리뷰 작성'}
              </h2>
              <p className="text-gray-600 mt-1">
                {getTargetName()}에 대한 리뷰
              </p>
            </div>
            <div className="p-6">
              <ReviewForm
                onSubmit={handleSubmitReview}
                onCancel={() => {
                  setShowReviewForm(false)
                  setCurrentApplication(null)
                  setEditingReview(null)
                }}
                initialData={editingReview ? {
                  rating: editingReview.rating,
                  title: editingReview.title,
                  comment: editingReview.comment || '',
                  isAnonymous: editingReview.is_anonymous
                } : undefined}
                submitting={submitting}
                isUpdate={!!editingReview}
                targetName={getTargetName()}
                targetType={getTargetType()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}