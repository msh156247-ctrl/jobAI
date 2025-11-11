'use client'

interface CrawlProgressBarProps {
  site: string
  progress: number
  isActive: boolean
  totalJobs?: number
}

export default function CrawlProgressBar({ site, progress, isActive, totalJobs }: CrawlProgressBarProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-900">
          {site}에서 공고 가져오는 중...
        </span>
        <span className="text-sm font-bold text-blue-700">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {progress === 100 && totalJobs !== undefined && (
        <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
          <span className="text-green-600">✓</span> 완료! {totalJobs}개의 공고를 확인하세요.
        </p>
      )}
    </div>
  )
}
