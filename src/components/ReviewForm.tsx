'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import { ReviewFormData } from '@/lib/reviews'

interface ReviewFormProps {
  onSubmit: (reviewData: ReviewFormData) => void
  onCancel: () => void
  initialData?: ReviewFormData
  submitting?: boolean
  isUpdate?: boolean
  targetName: string
  targetType: 'seeker' | 'employer'
}

const REVIEW_TEMPLATES = {
  seeker: {
    positive: [
      '전문성이 뛰어난 인재입니다',
      '책임감 있고 성실한 지원자입니다',
      '커뮤니케이션 능력이 우수합니다',
      '협업 능력이 뛰어납니다',
      '문제 해결 능력이 탁월합니다'
    ],
    negative: [
      '아쉬운 부분이 있었습니다',
      '기대에 미치지 못했습니다',
      '개선이 필요한 부분이 있습니다'
    ]
  },
  employer: {
    positive: [
      '좋은 근무 환경을 제공합니다',
      '직원을 배려하는 기업입니다',
      '성장 기회를 많이 제공합니다',
      '공정한 채용 과정이었습니다',
      '전문적인 면접 과정이었습니다'
    ],
    negative: [
      '채용 과정에서 아쉬운 점이 있었습니다',
      '기대했던 것과 달랐습니다',
      '소통에서 개선이 필요합니다'
    ]
  }
}

export default function ReviewForm({
  onSubmit,
  onCancel,
  initialData,
  submitting = false,
  isUpdate = false,
  targetName,
  targetType
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>(
    initialData || {
      rating: 0,
      title: '',
      comment: '',
      isAnonymous: false
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleTitleTemplate = (template: string) => {
    setFormData(prev => ({ ...prev, title: template }))
  }

  const templates = REVIEW_TEMPLATES[targetType]
  const isPositive = formData.rating >= 4
  const availableTemplates = isPositive ? templates.positive : templates.negative

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 평점 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          평점을 선택해주세요 *
        </label>
        <StarRating
          rating={formData.rating}
          onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
          size="lg"
          className="justify-center"
        />
        {formData.rating === 0 && (
          <p className="text-red-500 text-sm mt-2">평점을 선택해주세요.</p>
        )}
      </div>

      {/* 리뷰 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          리뷰 제목 *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={`${targetName}에 대한 리뷰 제목을 입력하세요`}
        />

        {/* 템플릿 제안 */}
        {formData.rating > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-2">추천 제목:</p>
            <div className="flex flex-wrap gap-1">
              {availableTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTitleTemplate(template)}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리뷰 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          상세 리뷰 (선택사항)
        </label>
        <textarea
          rows={5}
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={`${targetName}과의 경험을 자세히 설명해주세요...`}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.comment.length} / 1000자
        </p>
      </div>

      {/* 익명 옵션 */}
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">익명으로 작성하기</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          익명으로 작성하면 다른 사용자들에게 공개되지 않지만, 평점은 반영됩니다.
        </p>
      </div>

      {/* 가이드라인 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📝 리뷰 작성 가이드라인</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 사실에 기반한 객관적인 평가를 작성해주세요</li>
          <li>• 구체적인 경험과 근거를 포함해주세요</li>
          <li>• 개인적인 공격이나 비방은 피해주세요</li>
          <li>• 건설적인 피드백을 제공해주세요</li>
        </ul>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || formData.rating === 0 || !formData.title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting
            ? (isUpdate ? '수정 중...' : '등록 중...')
            : (isUpdate ? '리뷰 수정' : '리뷰 등록')
          }
        </button>
      </div>
    </form>
  )
}