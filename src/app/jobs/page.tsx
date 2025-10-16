'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { mockJobs, getCompanyById } from '@/lib/mockData'
import { useJobSave } from '@/hooks/useJobSave'
import { INDUSTRIES, REGIONS } from '@/lib/constants'
import { Search, MapPin, DollarSign, Bookmark, BookmarkCheck, Briefcase, Building2, Filter, X } from 'lucide-react'

export default function JobsPage() {
  const { user } = useAuth()
  const { isSaved, toggleSave } = useJobSave()

  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'salary'>('latest')
  const [showFilters, setShowFilters] = useState(false)

  // 필터 상태
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedWorkType, setSelectedWorkType] = useState('')
  const [minSalary, setMinSalary] = useState('')
  const [maxSalary, setMaxSalary] = useState('')

  // 필터 초기화
  const clearFilters = () => {
    setSelectedIndustry('')
    setSelectedLocation('')
    setSelectedWorkType('')
    setMinSalary('')
    setMaxSalary('')
    setKeyword('')
  }

  // 필터링 및 정렬
  const filteredJobs = useMemo(() => {
    let results = [...mockJobs]

    // 키워드 검색
    if (keyword) {
      results = results.filter(
        job =>
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase()) ||
          job.company.toLowerCase().includes(keyword.toLowerCase()) ||
          job.skills.some(s => s.toLowerCase().includes(keyword.toLowerCase()))
      )
    }

    // 업종 필터
    if (selectedIndustry) {
      results = results.filter(job => job.industry === selectedIndustry)
    }

    // 지역 필터
    if (selectedLocation) {
      results = results.filter(job => job.location.includes(selectedLocation))
    }

    // 근무형태 필터
    if (selectedWorkType) {
      results = results.filter(job => job.workType === selectedWorkType)
    }

    // 연봉 필터
    if (minSalary) {
      results = results.filter(job => job.salary.max >= parseInt(minSalary))
    }
    if (maxSalary) {
      results = results.filter(job => job.salary.min <= parseInt(maxSalary))
    }

    // 정렬
    if (sortBy === 'latest') {
      results.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    } else if (sortBy === 'salary') {
      results.sort((a, b) => b.salary.max - a.salary.max)
    }

    return results
  }, [keyword, sortBy, selectedIndustry, selectedLocation, selectedWorkType, minSalary, maxSalary])


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">채용공고</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="직무, 회사, 기술 검색..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter size={18} />
              <span>필터</span>
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'salary')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="latest">최신순</option>
              <option value="salary">연봉순</option>
            </select>
          </div>

          {/* 필터 패널 */}
          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업종
                  </label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지역
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    근무형태
                  </label>
                  <select
                    value={selectedWorkType}
                    onChange={(e) => setSelectedWorkType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">전체</option>
                    <option value="onsite">사무실</option>
                    <option value="dispatch">파견</option>
                    <option value="remote">원격</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연봉 (만원)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      placeholder="최소"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="number"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      placeholder="최대"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <X size={16} />
                <span>필터 초기화</span>
              </button>
            </div>
          )}

          {/* 활성 필터 뱃지 */}
          {(selectedIndustry || selectedLocation || selectedWorkType || minSalary || maxSalary || keyword) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {keyword && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
                  <span>검색: {keyword}</span>
                  <button onClick={() => setKeyword('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedIndustry && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
                  <span>{selectedIndustry}</span>
                  <button onClick={() => setSelectedIndustry('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedLocation && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
                  <span>{selectedLocation}</span>
                  <button onClick={() => setSelectedLocation('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {selectedWorkType && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
                  <span>
                    {selectedWorkType === 'onsite' && '사무실'}
                    {selectedWorkType === 'dispatch' && '파견'}
                    {selectedWorkType === 'remote' && '원격'}
                  </span>
                  <button onClick={() => setSelectedWorkType('')} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {(minSalary || maxSalary) && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
                  <span>
                    연봉: {minSalary || '0'}~{maxSalary || '∞'}만원
                  </span>
                  <button onClick={() => { setMinSalary(''); setMaxSalary('') }} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600 mt-4">
            {filteredJobs.length}개의 공고
          </p>
        </div>

        {/* 결과 목록 */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const company = getCompanyById(job.companyId)
              return (
              <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between">
                  {/* 회사 로고 */}
                  <div className="mr-4">
                    {company?.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={job.company}
                        className="w-16 h-16 rounded-lg object-contain border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-300">
                        <Building2 size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link href={`/jobs/${job.id}`}>
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                          {job.title}
                        </h3>
                      </Link>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          job.workType === 'remote'
                            ? 'bg-green-100 text-green-800'
                            : job.workType === 'dispatch'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.workType === 'remote' && '원격'}
                        {job.workType === 'dispatch' && '파견'}
                        {job.workType === 'onsite' && '사무실'}
                      </span>
                    </div>

                    <Link href={`/company/${job.companyId}`}>
                      <p className="text-gray-700 font-medium mb-1 hover:text-blue-600">
                        {job.company}
                      </p>
                    </Link>

                    {/* 회사 주소 */}
                    {company?.address && (
                      <p className="text-sm text-gray-500 mb-2 flex items-center">
                        <Building2 size={14} className="mr-1" />
                        {company.address}
                      </p>
                    )}

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <MapPin size={16} className="mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <DollarSign size={16} className="mr-1" />
                        {job.salary.min}~{job.salary.max}만원
                      </span>
                      <span className="flex items-center">
                        <Briefcase size={16} className="mr-1" />
                        {job.workType === 'remote' && '원격근무'}
                        {job.workType === 'dispatch' && '파견'}
                        {job.workType === 'onsite' && '사무실'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          +{job.skills.length - 5}개
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    {user && (
                      <button
                        onClick={() => toggleSave(job.id)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title={isSaved(job.id) ? '저장 취소' : '저장'}
                      >
                        {isSaved(job.id) ? (
                          <BookmarkCheck size={20} className="text-blue-600" />
                        ) : (
                          <Bookmark size={20} className="text-gray-400" />
                        )}
                      </button>
                    )}

                    <Link
                      href={`/apply/${job.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 text-center whitespace-nowrap"
                    >
                      지원하기
                    </Link>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 text-center whitespace-nowrap"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}