'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  mockJobs,
  getInterviewSlots,
  bookInterviewSlot,
  generateICS,
  downloadICS,
  type InterviewSlot,
} from '@/lib/mockData'
import { Calendar, Clock, MapPin, Briefcase, Download } from 'lucide-react'
import { useToast } from '@/components/Toast'

function ScheduleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()

  const jobId = searchParams.get('jobId')
  const job = jobId ? mockJobs.find(j => j.id === jobId) : null

  const [slots, setSlots] = useState<InterviewSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push(`/login?next=/schedule${jobId ? `?jobId=${jobId}` : ''}`)
      return
    }

    if (!jobId || !job) {
      showToast('error', '채용 공고를 찾을 수 없습니다.')
      router.push('/search')
      return
    }

    // 면접 슬롯 로드
    try {
      const interviewSlots = getInterviewSlots(jobId)
      if (interviewSlots.length === 0) {
        showToast('warning', '예약 가능한 시간이 없습니다.')
      }
      setSlots(interviewSlots)
    } catch (err: any) {
      showToast('error', '면접 시간을 불러오는데 실패했습니다.')
    }
  }, [user, jobId, job, router, showToast])

  if (!user || !job) {
    return null
  }

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      showToast('warning', '시간을 선택해주세요.')
      return
    }

    setLoading(true)

    try {
      const slot = slots.find(s => s.id === selectedSlot)
      if (!slot) {
        throw new Error('슬롯을 찾을 수 없습니다.')
      }

      if (!slot.available) {
        showToast('error', '이미 예약된 시간입니다.')
        setLoading(false)
        return
      }

      // 예약
      bookInterviewSlot(selectedSlot)

      // ICS 파일 다운로드
      const icsContent = generateICS(slot.date, slot.time, job.company, job.title)
      downloadICS(`interview-${job.company}.ics`, icsContent)

      showToast('success', '면접 일정이 예약되었습니다.')
      setSuccess(true)

      // 2초 후 지원 현황으로 이동
      setTimeout(() => {
        router.push('/applications')
      }, 2000)
    } catch (err: any) {
      showToast('error', err.message || '예약에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">예약 완료!</h2>
          <p className="text-gray-600 mb-4">
            면접 일정이 예약되었습니다.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
            <Download size={16} className="mr-1" />
            캘린더 파일이 다운로드되었습니다.
          </div>
          <p className="text-sm text-gray-500">
            잠시 후 지원 현황 페이지로 이동합니다...
          </p>
        </div>
      </div>
    )
  }

  // 날짜별로 그룹화
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.date).toLocaleDateString('ko-KR')
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, InterviewSlot[]>)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">면접 시간 선택</h1>
          <p className="text-lg text-gray-700 font-medium mb-4">{job.company}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Briefcase size={16} className="mr-1" />
              {job.title}
            </span>
            <span className="flex items-center">
              <MapPin size={16} className="mr-1" />
              {job.location}
            </span>
          </div>
        </div>

        {/* 슬롯 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar size={20} className="mr-2" />
            예약 가능한 시간
          </h2>

          <div className="space-y-6">
            {Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-700 mb-3">{date}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dateSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.id
                    const isBooked = !slot.available

                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        disabled={isBooked}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          isBooked
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center text-sm font-medium text-gray-900">
                            <Clock size={16} className="mr-1" />
                            {slot.time}
                          </span>
                          {isBooked && (
                            <span className="text-xs text-gray-500">예약됨</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">안내사항</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>면접은 온라인 또는 오프라인으로 진행될 수 있습니다.</li>
            <li>예약 시 캘린더 파일(.ics)이 자동으로 다운로드됩니다.</li>
            <li>예약 변경이 필요한 경우 담당자에게 문의해주세요.</li>
          </ul>
        </div>

        {/* 제출 버튼 */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleBookSlot}
            disabled={!selectedSlot || loading}
            className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '예약 중...' : '예약하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ScheduleContent />
    </Suspense>
  )
}