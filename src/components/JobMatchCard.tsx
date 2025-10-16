'use client'

import { useState } from 'react'
import { JobWithCompany } from '@/lib/jobs'
import { JobMatchScore } from '@/lib/ai'
import { TrendingUp, MapPin, Calendar, DollarSign, ChevronDown, ChevronUp, ExternalLink, Heart } from 'lucide-react'
import Link from 'next/link'
import InsightTag from './InsightTag'

interface JobMatchCardProps {
  job: JobWithCompany
  matchScore: JobMatchScore
  onApply?: (jobId: string) => void
  onSaveJob?: (jobId: string) => void
  isSaved?: boolean
  showDetailedMatch?: boolean
}

export default function JobMatchCard({
  job,
  matchScore,
  onApply,
  onSaveJob,
  isSaved = false,
  showDetailedMatch = true
}: JobMatchCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return '급여 정보 없음'
    if (min && max) return `${min.toLocaleString()}만 - ${max.toLocaleString()}만원`
    if (min) return `${min.toLocaleString()}만원 이상`
    return `${max?.toLocaleString()}만원 이하`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '1일 전'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200">
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                <Link href={`/jobs/${job.id}`}>
                  {job.title}
                </Link>
              </h3>
              <button
                onClick={() => onSaveJob?.(job.id)}
                className={`p-2 rounded-full transition-colors ${
                  isSaved
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center text-gray-600 mb-2">
              <span className="font-medium">{job.company_profiles?.company_name}</span>
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(job.created_at)}</span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {job.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{job.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{formatSalary(job.salary_min, job.salary_max)}</span>
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="ml-4 flex flex-col items-center">
            <div className={`px-3 py-1 rounded-full ${getScoreColor(matchScore.overall)}`}>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-semibold">{Math.round(matchScore.overall)}%</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1">매치</span>
          </div>
        </div>

        {/* Job Type and Tags */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {job.type || '정규직'}
          </span>
          {job.requirements && job.requirements.slice(0, 3).map((req, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
            >
              {req}
            </span>
          ))}
          {job.requirements && job.requirements.length > 3 && (
            <span className="text-xs text-gray-500">+{job.requirements.length - 3}</span>
          )}
        </div>

        {/* Job Description Preview */}
        {job.description && (
          <p className="text-gray-700 text-sm line-clamp-2 mb-4">
            {job.description}
          </p>
        )}

        {/* AI Recommendations */}
        {matchScore.details.recommendations.length > 0 && (
          <div className="mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">AI 추천 사유</h4>
              <ul className="space-y-1">
                {matchScore.details.recommendations.slice(0, 2).map((reason, index) => (
                  <li key={index} className="text-xs text-blue-700 flex items-start">
                    <span className="text-blue-500 mr-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Match Information */}
      {showDetailedMatch && (
        <div className="border-t border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <span>상세 매치 정보</span>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDetails && (
            <div className="px-6 pb-4 space-y-3">
              {/* Score Breakdown */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">스킬 매치</span>
                    <span className="text-xs font-medium">{Math.round(matchScore.skillMatch)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(matchScore.skillMatch)}`}
                      style={{ width: `${matchScore.skillMatch}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">경력 매치</span>
                    <span className="text-xs font-medium">{Math.round(matchScore.experienceMatch)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(matchScore.experienceMatch)}`}
                      style={{ width: `${matchScore.experienceMatch}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">업종 매치</span>
                    <span className="text-xs font-medium">{Math.round(matchScore.industryMatch)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(matchScore.industryMatch)}`}
                      style={{ width: `${matchScore.industryMatch}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">직종 매치</span>
                    <span className="text-xs font-medium">{Math.round(matchScore.jobTypeMatch)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(matchScore.jobTypeMatch)}`}
                      style={{ width: `${matchScore.jobTypeMatch}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">위치 매치</span>
                    <span className="text-xs font-medium">{Math.round(matchScore.locationMatch)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(matchScore.locationMatch)}`}
                      style={{ width: `${matchScore.locationMatch}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">급여 매치</span>
                    <span className="text-xs font-medium">{Math.round(matchScore.salaryMatch)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(matchScore.salaryMatch)}`}
                      style={{ width: `${matchScore.salaryMatch}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Matched and Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchScore.details.matchedSkills.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-green-700 mb-2">보유 스킬</h5>
                    <div className="flex flex-wrap gap-1">
                      {matchScore.details.matchedSkills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {matchScore.details.matchedSkills.length > 4 && (
                        <span className="text-xs text-gray-500">+{matchScore.details.matchedSkills.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}

                {matchScore.details.missingSkills.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-orange-700 mb-2">부족한 스킬</h5>
                    <div className="flex flex-wrap gap-1">
                      {matchScore.details.missingSkills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {matchScore.details.missingSkills.length > 4 && (
                        <span className="text-xs text-gray-500">+{matchScore.details.missingSkills.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Experience Gap */}
              {matchScore.details.experienceGap > 0 && (
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-xs text-orange-700">
                    💡 약 {matchScore.details.experienceGap}년의 추가 경력이 있으면 더 좋은 매치가 될 수 있습니다.
                  </p>
                </div>
              )}

              {/* AI Insight Tag */}
              <InsightTag
                jobId={job.id}
                jobTitle={job.title}
                company={job.company_profiles?.company_name || ''}
                requiredSkills={job.requirements || []}
                userSkills={matchScore.details.matchedSkills}
                matchScore={matchScore.overall}
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <button
            onClick={() => onApply?.(job.id)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            지원하기
          </button>
          <Link
            href={`/jobs/${job.id}`}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            상세보기
          </Link>
        </div>
      </div>
    </div>
  )
}