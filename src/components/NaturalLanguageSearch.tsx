'use client'

import { useState } from 'react'
import { Search, Sparkles, X } from 'lucide-react'

interface ParsedFilters {
  skills?: string[]
  location?: string
  workType?: string
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  keywords?: string[]
}

interface NaturalLanguageSearchProps {
  onSearch: (query: string, filters: ParsedFilters) => void
  aiMode: boolean
  onToggleAiMode: () => void
}

export default function NaturalLanguageSearch({ onSearch, aiMode, onToggleAiMode }: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const exampleQueries = [
    '신입 백엔드 개발자 리모트 가능한 곳',
    '3년차 프론트엔드 React 서울',
    '파이썬 데이터 분석가 경력 5년 이상',
    '원격근무 가능한 풀스택 개발자',
    '연봉 5000만원 이상 DevOps 엔지니어'
  ]

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch('/api/parse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (!response.ok) throw new Error('Failed to parse search query')

      const data = await response.json()
      setParsedFilters(data.filters)
      onSearch(query, data.filters)
    } catch (error) {
      console.error('Search parsing error:', error)
      onSearch(query, {})
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)

    if (value.trim().length > 2) {
      const matchedSuggestions = exampleQueries.filter(q =>
        q.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(matchedSuggestions)
      setShowSuggestions(matchedSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearch()
  }

  const clearFilter = (filterKey: keyof ParsedFilters) => {
    if (!parsedFilters) return
    const newFilters = { ...parsedFilters }
    delete newFilters[filterKey]
    setParsedFilters(newFilters)
    onSearch(query, newFilters)
  }

  const clearAllFilters = () => {
    setParsedFilters(null)
    setQuery('')
    onSearch('', {})
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">채용 공고 검색</h3>
        <button
          onClick={onToggleAiMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            aiMode
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
              : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
          }`}
        >
          <Sparkles size={16} className={aiMode ? 'animate-pulse' : ''} />
          <span className="text-sm font-medium">AI 추천 모드</span>
        </button>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="예: 신입 백엔드 개발자 리모트 가능한 곳"
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {query && (
              <button
                onClick={clearAllFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Search size={20} />
            {isLoading ? '검색 중...' : '검색'}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <span className="text-sm text-gray-700">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {parsedFilters && Object.keys(parsedFilters).length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">적용된 필터:</span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              모두 지우기
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsedFilters.skills && parsedFilters.skills.map((skill, idx) => (
              <span
                key={`skill-${idx}`}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                기술: {skill}
                <button
                  onClick={() => {
                    const newFilters = { ...parsedFilters }
                    newFilters.skills = newFilters.skills?.filter((_, i) => i !== idx)
                    if (newFilters.skills?.length === 0) delete newFilters.skills
                    setParsedFilters(newFilters)
                    onSearch(query, newFilters)
                  }}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {parsedFilters.location && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                위치: {parsedFilters.location}
                <button onClick={() => clearFilter('location')} className="hover:text-green-900">
                  <X size={14} />
                </button>
              </span>
            )}
            {parsedFilters.workType && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                근무형태: {parsedFilters.workType}
                <button onClick={() => clearFilter('workType')} className="hover:text-purple-900">
                  <X size={14} />
                </button>
              </span>
            )}
            {parsedFilters.experienceMin !== undefined && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                경력: {parsedFilters.experienceMin}년 이상
                <button onClick={() => clearFilter('experienceMin')} className="hover:text-orange-900">
                  <X size={14} />
                </button>
              </span>
            )}
            {parsedFilters.salaryMin !== undefined && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                연봉: {parsedFilters.salaryMin}만원 이상
                <button onClick={() => clearFilter('salaryMin')} className="hover:text-red-900">
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">예시 검색어:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(example)
                handleSearch()
              }}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
