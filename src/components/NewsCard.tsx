'use client'

import { ExternalLink, Calendar, Building2, Tag } from 'lucide-react'
import type { NewsArticle } from '@/lib/news/types'

interface NewsCardProps {
  article: NewsArticle
  index?: number
}

export default function NewsCard({ article, index = 0 }: NewsCardProps) {
  const getIssueTypeBadgeColor = (issueType: string) => {
    switch (issueType) {
      case '채용':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case '투자':
        return 'bg-green-100 text-green-700 border-green-200'
      case '기술':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case '리스크':
        return 'bg-red-100 text-red-700 border-red-200'
      case '정책':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case '혁신':
        return 'bg-pink-100 text-pink-700 border-pink-200'
      case '글로벌':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case '규제':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case '환경':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case '사회적가치':
        return 'bg-teal-100 text-teal-700 border-teal-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'ZDNet':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case '서울경제':
        return 'bg-teal-100 text-teal-700 border-teal-200'
      case '전자신문':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins}분 전`
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`
    } else {
      return date.toLocaleDateString('ko-KR')
    }
  }

  return (
    <div
      className="bg-white shadow rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => window.open(article.url, '_blank')}
    >
      {/* 헤더: 출처 + 기업명 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded border ${getSourceBadgeColor(article.source)}`}>
          {article.source}
        </span>
        {article.company && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Building2 size={12} />
            {article.company}
          </span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* 본문 요약 */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-3">
        {article.content}
      </p>

      {/* 이슈 타입 태그 */}
      {article.issueType && article.issueType.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {article.issueType.map((issue, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-1 rounded border ${getIssueTypeBadgeColor(issue)}`}
            >
              <Tag size={12} className="inline mr-1" />
              {issue}
            </span>
          ))}
        </div>
      )}

      {/* 하단: 날짜 + 링크 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar size={12} />
          {formatDate(article.publishedAt)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.open(article.url, '_blank')
          }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ExternalLink size={14} />
          기사 보기
        </button>
      </div>
    </div>
  )
}
