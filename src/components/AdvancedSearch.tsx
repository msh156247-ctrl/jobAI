'use client'

import { useState } from 'react'
import { SearchFilters } from '@/lib/matching'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
  loading?: boolean
}

const JOB_TYPES = [
  { value: 'full-time', label: '정규직' },
  { value: 'part-time', label: '파트타임' },
  { value: 'contract', label: '계약직' },
  { value: 'internship', label: '인턴십' }
]

const CAREER_LEVELS = [
  { value: 'entry', label: '신입 (0-1년)' },
  { value: 'junior', label: '주니어 (1-3년)' },
  { value: 'mid', label: '미드레벨 (3-7년)' },
  { value: 'senior', label: '시니어 (7년+)' },
  { value: 'executive', label: '임원급' }
]

const SORT_OPTIONS = [
  { value: 'relevance', label: '관련도순' },
  { value: 'date', label: '최신순' },
  { value: 'salary', label: '급여순' }
]

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
  'Node.js', 'Python', 'Java', 'Spring', 'Django',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'AWS', 'Docker', 'Kubernetes', 'Git',
  'HTML/CSS', 'Figma', 'Photoshop'
]

export default function AdvancedSearch({ onSearch, initialFilters, loading }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleSkillAdd = (skill: string) => {
    if (!skill.trim()) return

    const currentSkills = filters.skills || []
    if (!currentSkills.includes(skill.trim())) {
      handleFilterChange('skills', [...currentSkills, skill.trim()])
    }
    setSkillInput('')
  }

  const handleSkillRemove = (skill: string) => {
    const currentSkills = filters.skills || []
    handleFilterChange('skills', currentSkills.filter(s => s !== skill))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters({})
    onSearch({})
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 검색 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            키워드 검색
          </label>
          <input
            type="text"
            value={filters.keywords || ''}
            onChange={(e) => handleFilterChange('keywords', e.target.value)}
            placeholder="직무명, 회사명, 기술스택 등"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 위치 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              근무지
            </label>
            <input
              type="text"
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="서울, 부산, 원격근무 등"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬
            </label>
            <select
              value={filters.sort_by || 'date'}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 고급 검색 토글 */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAdvanced ? '▼ 고급 검색 숨기기' : '▶ 고급 검색 옵션'}
          </button>
        </div>

        {/* 고급 검색 옵션 */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            {/* 급여 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연봉 범위 (만원)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.salary_min || ''}
                  onChange={(e) => handleFilterChange('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="최소 연봉"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={filters.salary_max || ''}
                  onChange={(e) => handleFilterChange('salary_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="최대 연봉"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 고용 형태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고용 형태
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(type => (
                  <label key={type.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.job_types?.includes(type.value) || false}
                      onChange={(e) => {
                        const currentTypes = filters.job_types || []
                        if (e.target.checked) {
                          handleFilterChange('job_types', [...currentTypes, type.value])
                        } else {
                          handleFilterChange('job_types', currentTypes.filter(t => t !== type.value))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 경력 수준 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경력 수준
              </label>
              <select
                value={filters.career_level || ''}
                onChange={(e) => handleFilterChange('career_level', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {CAREER_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 기술 스택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기술 스택
              </label>

              {/* 선택된 스킬 */}
              {filters.skills && filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.skills.map(skill => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillRemove(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 스킬 입력 */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="기술 스택을 입력하세요"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSkillAdd(skillInput)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSkillAdd(skillInput)}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200"
                >
                  추가
                </button>
              </div>

              {/* 인기 스킬 */}
              <div>
                <p className="text-sm text-gray-600 mb-2">인기 기술:</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillAdd(skill)}
                      disabled={filters.skills?.includes(skill)}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 검색 버튼 */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            초기화
          </button>
        </div>
      </form>
    </div>
  )
}