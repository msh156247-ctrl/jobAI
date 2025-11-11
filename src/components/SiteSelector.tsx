'use client'

import { RefreshCw } from 'lucide-react'

interface SiteSelectorProps {
  onCrawl: (siteName: string) => void
  isDisabled: boolean
  activeSite?: string
}

const SITES = [
  { name: '사람인', color: 'bg-blue-600 hover:bg-blue-700' },
  { name: '잡코리아', color: 'bg-green-600 hover:bg-green-700' },
  { name: '원티드', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { name: '인크루트', color: 'bg-purple-600 hover:bg-purple-700' },
  { name: '잡플래닛', color: 'bg-orange-600 hover:bg-orange-700' }
]

export default function SiteSelector({ onCrawl, isDisabled, activeSite }: SiteSelectorProps) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">채용 공고 가져오기</h3>
      <p className="text-sm text-gray-600 mb-4">구직 사이트에서 최신 채용 공고를 가져옵니다</p>

      <div className="flex flex-wrap gap-3">
        {SITES.map((site) => (
          <button
            key={site.name}
            onClick={() => onCrawl(site.name)}
            disabled={isDisabled}
            className={`px-4 py-2 ${site.color} text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            <RefreshCw
              size={16}
              className={activeSite === site.name && isDisabled ? 'animate-spin' : ''}
            />
            {site.name}
          </button>
        ))}
      </div>
    </div>
  )
}
