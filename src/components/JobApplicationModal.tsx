'use client'

import { useState, useEffect } from 'react'
// import { getUserFiles, formatFileSize, getFileIcon, type StoredFile } from '@/lib/files'
import { applyToJob } from '@/lib/jobs'

interface JobApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  companyName: string
  userId: string
  onApplicationSuccess: () => void
  onApplicationError: (error: string) => void
}

export default function JobApplicationModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  userId,
  onApplicationSuccess,
  onApplicationError
}: JobApplicationModalProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    try {
      await applyToJob(
        jobId,
        userId,
        coverLetter.trim() || undefined
      )
      onApplicationSuccess()
      handleClose()
    } catch (error: any) {
      onApplicationError(error.message || '지원서 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setCoverLetter('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">지원서 작성</h2>
              <p className="text-gray-600 mt-1">
                {jobTitle} - {companyName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 자기소개서 텍스트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자기소개서 (선택사항)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="지원 동기와 자기소개를 작성해주세요..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {coverLetter.length} / 1000자
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  지원서 제출 안내
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• 자기소개서는 선택사항입니다.</p>
                  <p>• 지원 후에는 기업에서 연락을 드릴 예정입니다.</p>
                  <p>• 지원 현황은 '내 지원 현황' 페이지에서 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
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
              {submitting ? '제출 중...' : '지원하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}