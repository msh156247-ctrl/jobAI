'use client'

import { Building2, TrendingUp, Calendar, ExternalLink } from 'lucide-react'
import type { CompanyNewsReport } from '@/lib/news/types'
import { calculateIssuePercentage } from '@/lib/news/analyzer'

interface CompanyReportProps {
  report: CompanyNewsReport
  onClick?: () => void
}

export default function CompanyReport({ report, onClick }: CompanyReportProps) {
  const issuePercentage = calculateIssuePercentage(report.issueDistribution)

  const getIssueColor = (issueType: string) => {
    switch (issueType) {
      case '채용':
        return 'bg-blue-500'
      case '투자':
        return 'bg-green-500'
      case '기술':
        return 'bg-purple-500'
      case '리스크':
        return 'bg-red-500'
      case '정책':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getIssueTextColor = (issueType: string) => {
    switch (issueType) {
      case '채용':
        return 'text-blue-700'
      case '투자':
        return 'text-green-700'
      case '기술':
        return 'text-purple-700'
      case '리스크':
        return 'text-red-700'
      case '정책':
        return 'text-orange-700'
      default:
        return 'text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div
      className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* 헤더: 기업명 + 기사 수 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{report.companyName}</h3>
            <p className="text-sm text-gray-500">기사 {report.totalArticles}건</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar size={12} />
            최근 기사
          </p>
          <p className="text-sm font-medium text-gray-700">
            {formatDate(report.latestArticleDate)}
          </p>
        </div>
      </div>

      {/* 이슈 분포 */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <TrendingUp size={16} />
          주요 이슈
        </p>

        {/* 이슈 비율 바 */}
        <div className="flex h-3 rounded-full overflow-hidden mb-3">
          {Object.entries(issuePercentage).map(([issue, percentage]) => (
            percentage > 0 && (
              <div
                key={issue}
                className={getIssueColor(issue)}
                style={{ width: `${percentage}%` }}
                title={`${issue}: ${percentage}%`}
              />
            )
          ))}
        </div>

        {/* 이슈 레전드 */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(report.issueDistribution).map(([issue, count]) => (
            count > 0 && (
              <div key={issue} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${getIssueColor(issue)}`} />
                <span className={`text-xs font-medium ${getIssueTextColor(issue)}`}>
                  {issue} ({count})
                </span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* 최근 기사 제목 */}
      {report.recentArticles.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">최근 기사</p>
          <ul className="space-y-2">
            {report.recentArticles.slice(0, 3).map((article, idx) => (
              <li key={article.id} className="flex items-start gap-2">
                <span className="text-xs text-gray-400 mt-1">•</span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-gray-700 hover:text-blue-600 line-clamp-1 flex-1 transition-colors"
                >
                  {article.title}
                </a>
                <ExternalLink size={12} className="text-gray-400 mt-1" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 키워드 */}
      {report.keywords && report.keywords.length > 0 && (
        <div className="pt-4 border-t border-gray-100 mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">주요 키워드</p>
          <div className="flex flex-wrap gap-2">
            {report.keywords.slice(0, 5).map((keyword, idx) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
