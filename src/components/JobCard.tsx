'use client'

import { Bookmark, BookmarkCheck, MapPin, Briefcase, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: { min: number; max: number }
  experience?: { min: number; max: number }
  workType: string
  description: string
  skills: string[]
  keywords?: string[]
  postedAt: string
  deadline: string
  sourceUrl?: string
  matchScore?: number
  matchReasons?: string[]
}

interface JobCardProps {
  job: Job
  isSaved: boolean
  onToggleSave: (jobId: string, sourceUrl?: string) => void
  onApply: (jobId: string, source: string) => void
  showPreferences: boolean
  index?: number
}

export default function JobCard({ job, isSaved, onToggleSave, onApply, showPreferences, index = 0 }: JobCardProps) {
  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'onsite': return '사무실'
      case 'dispatch': return '파견'
      case 'remote': return '원격'
      default: return type
    }
  }

  const getSourceSiteName = (sourceUrl?: string) => {
    if (!sourceUrl) return null
    if (sourceUrl.includes('saramin.co.kr')) return '사람인'
    if (sourceUrl.includes('jobkorea.co.kr')) return '잡코리아'
    if (sourceUrl.includes('wanted.co.kr')) return '원티드'
    if (sourceUrl.includes('incruit.com')) return '인크루트'
    if (sourceUrl.includes('jobplanet.co.kr')) return '잡플래닛'
    return null
  }

  const getSourceSiteBadgeColor = (siteName: string | null) => {
    switch (siteName) {
      case '사람인': return 'bg-blue-100 text-blue-700 border-blue-200'
      case '잡코리아': return 'bg-green-100 text-green-700 border-green-200'
      case '원티드': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case '인크루트': return 'bg-purple-100 text-purple-700 border-purple-200'
      case '잡플래닛': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const sourceSiteName = getSourceSiteName(job.sourceUrl)

  return (
    <div
      className="bg-white shadow rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => {
        if (job.sourceUrl) {
          const source = sourceSiteName || 'unknown'
          onApply(job.id, source)
          window.open(job.sourceUrl, '_blank')
        }
      }}
    >
      {sourceSiteName && (
        <div className="flex items-center mb-2">
          <span className={`text-xs px-2 py-1 rounded border ${getSourceSiteBadgeColor(sourceSiteName)}`}>
            {sourceSiteName}
          </span>
        </div>
      )}

      <p className="text-gray-600 hover:text-blue-600 mb-1 font-medium">
        {job.company}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {job.title}
            </h3>
            {showPreferences && job.matchScore !== undefined && (
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${
                job.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                job.matchScore >= 60 ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                매칭도 {job.matchScore}%
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{job.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              작성일: {new Date(job.postedAt).toLocaleDateString('ko-KR')}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <Calendar size={12} />
              마감일: {new Date(job.deadline).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={16} />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <span className="font-semibold">₩</span>
          {job.salary.min.toLocaleString()}만 - {job.salary.max.toLocaleString()}만원
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={16} />
          {getWorkTypeLabel(job.workType)}
        </span>
        {job.experience && (
          <span className="flex items-center gap-1 text-orange-600 font-medium">
            경력 {job.experience.min === 0 ? '신입' : `${job.experience.min}년`} ~ {job.experience.max}년
          </span>
        )}
      </div>

      {showPreferences && job.matchReasons && job.matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {job.matchReasons.map((reason, idx) => (
            <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
              ✓ {reason}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        {job.skills.slice(0, 5).map((skill, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
            {skill}
          </span>
        ))}
      </div>

      {job.keywords && job.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.keywords.map((keyword, idx) => (
            <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave(job.id, job.sourceUrl)
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex-1 ${
            isSaved ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
          }`}
          title={isSaved ? '즐겨찾기 해제' : '즐겨찾기'}
        >
          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          <span className="text-sm font-medium">{isSaved ? '저장됨' : '즐겨찾기'}</span>
        </button>
        {job.sourceUrl ? (
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation()
              const source = sourceSiteName || 'unknown'
              onApply(job.id, source)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex-1 flex items-center justify-center"
          >
            지원하기
          </a>
        ) : (
          <Link
            href={`/apply/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex-1 flex items-center justify-center"
          >
            지원하기
          </Link>
        )}
      </div>
    </div>
  )
}
