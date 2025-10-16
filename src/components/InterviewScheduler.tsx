'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createInterviewSchedule,
  suggestAvailableSlots,
  generateInterviewQuestions,
  CreateInterviewData,
  InterviewSchedule
} from '@/lib/interview'
import { Calendar, Clock, MapPin, Users, Brain, X, Check } from 'lucide-react'

interface InterviewSchedulerProps {
  applicationId: string
  jobTitle: string
  candidateName: string
  candidateEmail: string
  onScheduleComplete?: (interview: InterviewSchedule) => void
  onCancel?: () => void
}

export default function InterviewScheduler({
  applicationId,
  jobTitle,
  candidateName,
  candidateEmail,
  onScheduleComplete,
  onCancel
}: InterviewSchedulerProps) {
  const { user } = useAuth()

  const [formData, setFormData] = useState<Omit<CreateInterviewData, 'application_id'>>({
    interview_type: 'technical',
    scheduled_date: '',
    duration_minutes: 60,
    location: '',
    is_online: true,
    generate_ai_questions: false
  })

  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState('')
  const [showQuestionPreview, setShowQuestionPreview] = useState(false)

  const interviewTypes = [
    { value: 'phone_screening', label: '전화 스크리닝', duration: 30 },
    { value: 'technical', label: '기술 면접', duration: 60 },
    { value: 'behavioral', label: '인성 면접', duration: 45 },
    { value: 'final', label: '최종 면접', duration: 60 },
    { value: 'group', label: '그룹 면접', duration: 90 }
  ] as const

  useEffect(() => {
    // Set minimum date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().slice(0, 16)

    if (!formData.scheduled_date) {
      setFormData(prev => ({ ...prev, scheduled_date: minDate }))
    }
  }, [])

  useEffect(() => {
    // Update duration when interview type changes
    const selectedType = interviewTypes.find(type => type.value === formData.interview_type)
    if (selectedType) {
      setFormData(prev => ({ ...prev, duration_minutes: selectedType.duration }))
    }
  }, [formData.interview_type])

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const loadSuggestedSlots = async () => {
    if (!user || !formData.scheduled_date) return

    setLoadingSlots(true)
    try {
      const slots = await suggestAvailableSlots(
        user.id,
        formData.scheduled_date,
        formData.duration_minutes,
        5
      )
      setSuggestedSlots(slots)
    } catch (err: any) {
      console.error('Failed to load suggested slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (date: string) => {
    handleInputChange('scheduled_date', date)
    if (date) {
      loadSuggestedSlots()
    }
  }

  const selectSuggestedSlot = (slot: string) => {
    handleInputChange('scheduled_date', slot)
  }

  const previewQuestions = async () => {
    setShowQuestionPreview(true)
    // TODO: Load and display sample questions
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!formData.scheduled_date) {
      setError('면접 일시를 선택해주세요.')
      return
    }

    if (formData.is_online && !formData.location) {
      setError('온라인 면접의 경우 화상회의 링크를 입력해주세요.')
      return
    }

    if (!formData.is_online && !formData.location) {
      setError('오프라인 면접의 경우 장소를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const interviewData: CreateInterviewData = {
        application_id: applicationId,
        interviewer_id: user.id,
        ...formData
      }

      const interview = await createInterviewSchedule(interviewData)
      onScheduleComplete?.(interview)
    } catch (err: any) {
      setError(err.message || '면접 일정 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatSlotTime = (slot: string) => {
    const date = new Date(slot)
    return date.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">면접 일정 등록</h3>
            <p className="text-sm text-gray-600 mt-1">
              {candidateName} ({candidateEmail}) - {jobTitle}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Interview Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            면접 유형
          </label>
          <select
            value={formData.interview_type}
            onChange={(e) => handleInputChange('interview_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {interviewTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.duration}분)
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              면접 일시
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_date ? formData.scheduled_date.slice(0, 16) : ''}
              onChange={(e) => handleDateChange(e.target.value + ':00.000Z')}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              소요 시간 (분)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
              min="15"
              max="180"
              step="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Suggested Time Slots */}
        {suggestedSlots.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추천 시간대
            </label>
            <div className="space-y-2">
              {suggestedSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestedSlot(slot)}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {formatSlotTime(slot)}
                </button>
              ))}
            </div>
            {loadingSlots && (
              <div className="text-sm text-gray-500 mt-2">
                추천 시간대를 찾는 중...
              </div>
            )}
          </div>
        )}

        {/* Location/Online */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            면접 방식
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.is_online}
                onChange={() => handleInputChange('is_online', true)}
                className="mr-2"
              />
              <span>온라인 면접</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.is_online}
                onChange={() => handleInputChange('is_online', false)}
                className="mr-2"
              />
              <span>오프라인 면접</span>
            </label>
          </div>
        </div>

        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            {formData.is_online ? '화상회의 링크' : '면접 장소'}
          </label>
          <input
            type={formData.is_online ? 'url' : 'text'}
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder={
              formData.is_online
                ? 'https://zoom.us/j/... 또는 Google Meet 링크'
                : '면접을 진행할 장소 주소'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* AI Questions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Brain className="h-4 w-4 mr-2" />
              AI 면접 질문 생성
            </label>
            {formData.generate_ai_questions && (
              <button
                type="button"
                onClick={previewQuestions}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                미리보기
              </button>
            )}
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.generate_ai_questions}
              onChange={(e) => handleInputChange('generate_ai_questions', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">
              지원자와 직무에 맞는 AI 면접 질문을 자동으로 생성합니다.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                등록 중...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                면접 일정 등록
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <Users className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">면접 진행 안내</p>
              <ul className="space-y-1 text-xs">
                <li>• 면접 일정이 등록되면 지원자에게 자동으로 알림이 발송됩니다.</li>
                <li>• 면접 1시간 전에 리마인더 알림이 전송됩니다.</li>
                <li>• 온라인 면접의 경우 화상회의 링크를 정확히 입력해주세요.</li>
                <li>• 일정 변경이 필요한 경우 미리 연락해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>

      {/* Question Preview Modal */}
      {showQuestionPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">AI 면접 질문 미리보기</h4>
              <button
                onClick={() => setShowQuestionPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                선택한 면접 유형에 따른 샘플 질문들입니다:
              </p>
              <ul className="text-sm space-y-2">
                <li>• 자기소개를 해주세요.</li>
                <li>• 이 직무에 지원한 이유는 무엇인가요?</li>
                <li>• 가장 어려웠던 프로젝트에 대해 설명해주세요.</li>
                <li>• 팀 내 갈등 상황을 어떻게 해결하셨나요?</li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                실제 질문은 지원자의 이력서와 직무 요구사항을 분석하여 개인화됩니다.
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowQuestionPreview(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}