'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, MapPin, Briefcase, Clock, Building, BookmarkCheck, Bookmark, ExternalLink } from 'lucide-react'
import type { Job } from '@/lib/mockData'
import { getCompanyById } from '@/lib/mockData'
import { isExternalJob, isChatAvailable } from '@/services/crawler'
import Link from 'next/link'

interface JobDetailModalProps {
  job: Job
  isOpen: boolean
  onClose: () => void
  isSaved: boolean
  onToggleSave: () => void
}

export default function JobDetailModal({
  job,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
}: JobDetailModalProps) {
  const router = useRouter()
  const company = getCompanyById(job.companyId)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // URL 업데이트
  useEffect(() => {
    if (isOpen) {
      window.history.pushState(null, '', `/jobs/${job.id}`)
    } else {
      window.history.pushState(null, '', '/')
    }
  }, [isOpen, job.id])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* 모달 컨텐츠 */}
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-scale-in">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1">{job.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSave}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                isSaved
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
              }`}
              aria-label={isSaved ? '저장 해제' : '저장'}
            >
              {isSaved ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* 회사 정보 */}
          <div className="flex items-start gap-4">
            {company?.logoUrl && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border overflow-hidden flex-shrink-0 bg-white">
                <Image
                  src={company.logoUrl}
                  alt={job.company}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            )}
            <div className="flex-1">
              <Link
                href={`/company/${job.companyId}`}
                className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {job.company}
              </Link>
              {company?.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{company.description}</p>
              )}
            </div>
          </div>

          {/* 주요 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={20} className="text-blue-600" />
              <div>
                <div className="text-xs text-gray-500">근무지</div>
                <div className="font-medium">{job.location}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-2xl font-bold text-green-600">₩</span>
              <div>
                <div className="text-xs text-gray-500">연봉</div>
                <div className="font-medium">
                  {job.salary.min.toLocaleString()}만 - {job.salary.max.toLocaleString()}만원
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase size={20} className="text-purple-600" />
              <div>
                <div className="text-xs text-gray-500">근무 형태</div>
                <div className="font-medium">
                  {job.workType === 'remote' ? '원격' : job.workType === 'dispatch' ? '파견' : '상주'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={20} className="text-orange-600" />
              <div>
                <div className="text-xs text-gray-500">마감일</div>
                <div className="font-medium">{new Date(job.deadline).toLocaleDateString('ko-KR')}</div>
              </div>
            </div>
          </div>

          {/* 직무 설명 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">직무 설명</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>

          {/* 자격 요건 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">자격 요건</h3>
            <ul className="space-y-2">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 요구 스킬 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">요구 스킬</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* 업종 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">업종</h3>
            <div className="flex items-center gap-2">
              <Building size={20} className="text-gray-600" />
              <span className="text-gray-700">{job.industry}</span>
            </div>
          </div>

          {/* 등록일 */}
          <div className="pt-4 border-t">
            <div className="text-sm text-gray-500">
              등록일: {new Date(job.postedAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 외부 공고 표시 */}
        {isExternalJob(job as any) && (
          <div className="px-4 sm:px-6 py-3 bg-amber-50 border-t border-amber-200">
            <div className="flex items-start gap-2">
              <ExternalLink size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-900 font-medium">외부 채용 공고</p>
                <p className="text-amber-700 mt-1">
                  이 공고는 <span className="font-semibold">{(job as any).source}</span>에서 가져온 정보입니다.
                  채팅 상담은 불가하며, 외부 링크로 연결됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 푸터 - 액션 버튼 */}
        <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
          {isExternalJob(job as any) ? (
            // 외부 공고 - 외부 링크로 이동
            <a
              href={(job as any).externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>원본 공고 보기</span>
              <ExternalLink size={20} />
            </a>
          ) : (
            // 내부 공고 - 지원하기만
            <Link
              href={`/apply/${job.id}`}
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-blue-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              지원하기
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
