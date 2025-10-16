'use client'

import { useState, useEffect } from 'react'
import { EventFormData } from '@/lib/events'

interface EventFormProps {
  onSubmit: (eventData: EventFormData) => void
  onCancel: () => void
  initialData?: EventFormData
  submitting?: boolean
  isUpdate?: boolean
}

const EVENT_TYPES = [
  { value: 'job_fair', label: '채용 박람회' },
  { value: 'webinar', label: '웨비나' },
  { value: 'networking', label: '네트워킹 이벤트' },
  { value: 'workshop', label: '워크샵' },
  { value: 'conference', label: '컨퍼런스' },
  { value: 'interview_session', label: '면접 세션' }
]

const COMMON_TAGS = [
  'IT', '개발', '디자인', '마케팅', '영업', '인사', '재무', '법무',
  '스타트업', '대기업', '외국계', '신입', '경력', '인턴', '프리랜서',
  '리모트', '하이브리드', '풀타임', '파트타임'
]

export default function EventForm({
  onSubmit,
  onCancel,
  initialData,
  submitting = false,
  isUpdate = false
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(
    initialData || {
      title: '',
      description: '',
      event_type: 'webinar',
      start_date: '',
      end_date: '',
      timezone: 'Asia/Seoul',
      is_online: true,
      location_name: '',
      location_address: '',
      meeting_url: '',
      meeting_password: '',
      max_participants: undefined,
      registration_deadline: '',
      requires_approval: false,
      registration_fee: 0,
      tags: [],
      requirements: [],
      contact_email: '',
      contact_phone: '',
      image_url: '',
      external_url: ''
    }
  )

  const [tagInput, setTagInput] = useState('')
  const [requirementInput, setRequirementInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
    setTagInput('')
  }

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleRequirementAdd = (requirement: string) => {
    if (requirement.trim() && !formData.requirements.includes(requirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirement.trim()]
      }))
    }
    setRequirementInput('')
  }

  const handleRequirementRemove = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement)
    }))
  }

  // Auto-set end date when start date changes
  useEffect(() => {
    if (formData.start_date && !formData.end_date) {
      const startDate = new Date(formData.start_date)
      startDate.setHours(startDate.getHours() + 2) // Default 2-hour duration
      const endDate = startDate.toISOString().slice(0, 16)
      setFormData(prev => ({ ...prev, end_date: endDate }))
    }
  }, [formData.start_date])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이벤트 제목 *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="매력적인 이벤트 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이벤트 유형 *
          </label>
          <select
            required
            value={formData.event_type}
            onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_online}
              onChange={(e) => setFormData(prev => ({ ...prev, is_online: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">온라인 이벤트</span>
          </label>
        </div>
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이벤트 설명
        </label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="이벤트에 대한 자세한 설명을 작성하세요..."
        />
      </div>

      {/* 일시 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시작 일시 *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            종료 일시 *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 위치 정보 */}
      {formData.is_online ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회의 링크
            </label>
            <input
              type="url"
              value={formData.meeting_url}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://zoom.us/j/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회의 비밀번호
            </label>
            <input
              type="text"
              value={formData.meeting_password}
              onChange={(e) => setFormData(prev => ({ ...prev, meeting_password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="선택사항"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              장소명
            </label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 코엑스 컨벤션센터"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 주소
            </label>
            <input
              type="text"
              value={formData.location_address}
              onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="서울특별시 강남구..."
            />
          </div>
        </div>
      )}

      {/* 등록 설정 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최대 참가자 수
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_participants || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="제한 없음"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            등록 마감일
          </label>
          <input
            type="datetime-local"
            value={formData.registration_deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            참가비 (원)
          </label>
          <input
            type="number"
            min="0"
            value={formData.registration_fee}
            onChange={(e) => setFormData(prev => ({ ...prev, registration_fee: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requires_approval}
            onChange={(e) => setFormData(prev => ({ ...prev, requires_approval: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">등록 시 승인 필요</span>
        </label>
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          태그
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="태그를 입력하고 Enter를 누르세요"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleTagAdd(tagInput)
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleTagAdd(tagInput)}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200"
          >
            추가
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          <p className="text-sm text-gray-600 w-full mb-1">추천 태그:</p>
          {COMMON_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagAdd(tag)}
              disabled={formData.tags.includes(tag)}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 참가 요구사항 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          참가 요구사항
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.requirements.map(req => (
            <span
              key={req}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm flex items-center"
            >
              {req}
              <button
                type="button"
                onClick={() => handleRequirementRemove(req)}
                className="ml-2 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 포트폴리오 준비, 사전 질문 작성"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleRequirementAdd(requirementInput)
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleRequirementAdd(requirementInput)}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200"
          >
            추가
          </button>
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연락처 이메일
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="문의사항 접수용 이메일"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연락처 전화번호
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-1234-5678"
          />
        </div>
      </div>

      {/* 추가 링크 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이벤트 이미지 URL
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/event-image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            외부 링크
          </label>
          <input
            type="url"
            value={formData.external_url}
            onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="추가 정보 페이지 링크"
          />
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
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
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting
            ? (isUpdate ? '수정 중...' : '생성 중...')
            : (isUpdate ? '이벤트 수정' : '이벤트 생성')
          }
        </button>
      </div>
    </form>
  )
}