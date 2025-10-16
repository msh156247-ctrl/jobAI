'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { mockJobs, type Job } from '@/lib/mockData'
import { getJobs } from '@/lib/jobsApi'
import { useJobSave } from '@/hooks/useJobSave'
import { Search, MapPin, Bookmark, BookmarkCheck } from 'lucide-react'
import Header from '@/components/Header'
import JobDetailModal from '@/components/JobDetailModal'
import { trackPageView, trackSearch, trackJobView } from '@/lib/services/behavior-tracking-service'

// USE_API 환경 변수 확인
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true'

export default function SearchPage() {
  const { user } = useAuth()
  const { savedJobs, isSaved, toggleSave } = useJobSave()

  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [minSalary, setMinSalary] = useState('')
  const [remoteType, setRemoteType] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'salary'>('latest')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)

  // 페이지 조회 추적
  useEffect(() => {
    if (user?.id) {
      trackPageView(user.id, '/search')
    }
  }, [user])

  // 검색 추적
  useEffect(() => {
    if (user?.id && (keyword || location || minSalary || remoteType !== 'all')) {
      trackSearch(user.id, keyword, {
        location,
        minSalary: minSalary ? parseInt(minSalary) : undefined,
        remoteType: remoteType !== 'all' ? remoteType : undefined
      })
    }
  }, [user, keyword, location, minSalary, remoteType])

  // 데이터 가져오기
  useEffect(() => {
    const fetchJobs = async () => {
      if (!USE_API) {
        // Mock 데이터 사용 - 클라이언트 측 필터링
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

        // 지역 필터
        if (location) {
          results = results.filter(job =>
            job.location.toLowerCase().includes(location.toLowerCase())
          )
        }

        // 최소 연봉 필터
        if (minSalary) {
          const min = parseInt(minSalary)
          results = results.filter(job => job.salary.min >= min)
        }

        // 근무 형태 필터
        if (remoteType !== 'all') {
          results = results.filter(job => job.workType === remoteType)
        }

        // 정렬
        if (sortBy === 'latest') {
          results.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
        } else if (sortBy === 'salary') {
          results.sort((a, b) => b.salary.max - a.salary.max)
        }

        setJobs(results)
        return
      }

      // 실제 API 사용
      setLoading(true)
      try {
        const filters: any = {}

        if (location) filters.location = location
        if (keyword) filters.search = keyword
        if (minSalary) filters.salaryMin = parseInt(minSalary)
        if (remoteType !== 'all') filters.type = remoteType

        const data = await getJobs(filters) as any

        // API 데이터를 Mock 형식으로 변환
        const transformedJobs: Job[] = (data || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company_profiles?.company_name || '회사명 없음',
          companyId: job.company_id,
          location: job.location,
          salary: {
            min: job.salary_min || 0,
            max: job.salary_max || 0
          },
          workType: job.type || 'onsite',
          description: job.description || '',
          requirements: job.requirements || [],
          skills: job.skills_required || [],
          industry: job.industry || '기타',
          postedAt: job.created_at,
          deadline: job.deadline
        }))

        // 정렬 적용
        if (sortBy === 'latest') {
          transformedJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
        } else if (sortBy === 'salary') {
          transformedJobs.sort((a, b) => b.salary.max - a.salary.max)
        }

        setJobs(transformedJobs)
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
        // 에러 시 Mock 데이터 폴백
        setJobs(mockJobs)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [keyword, location, minSalary, remoteType, sortBy])

  const filteredJobs = jobs

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      setSelectedJob(null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 필터 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 animate-fade-in-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* 키워드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                키워드
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="직무, 회사, 기술"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 focus:scale-[1.01]"
                />
              </div>
            </div>

            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지역
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="서울, 경기..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 focus:scale-[1.01]"
                />
              </div>
            </div>

            {/* 최소 연봉 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최소 연봉 (만원)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₩</span>
                <input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="3000"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 focus:scale-[1.01]"
                />
              </div>
            </div>

            {/* 근무 형태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                근무 형태
              </label>
              <select
                value={remoteType}
                onChange={(e) => setRemoteType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">전체</option>
                <option value="remote">원격</option>
                <option value="hybrid">하이브리드</option>
                <option value="onsite">사무실</option>
              </select>
            </div>
          </div>

          {/* 정렬 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredJobs.length}개의 공고
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="latest">최신순</option>
              <option value="salary">연봉순</option>
            </select>
          </div>
        </div>

        {/* 결과 목록 */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">검색 중...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center animate-fade-in">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-6 animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  setSelectedJob(job)
                  // 공고 조회 추적
                  if (user?.id) {
                    trackJobView(user.id, job.id, job.title, job.company)
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                        {job.title}
                      </h3>
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

                    <p className="text-gray-700 font-medium mb-2">
                      {job.company}
                    </p>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <MapPin size={16} className="mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1 font-semibold">₩</span>
                        {job.salary.min}~{job.salary.max}만원
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
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSave(job.id)
                        }}
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
            ))
          )}
        </div>

        {/* 하단 안내 */}
        {!user && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 mb-2">
              로그인하면 공고를 저장하고 지원할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              로그인하기
            </Link>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          isSaved={isSaved(selectedJob.id)}
          onToggleSave={() => toggleSave(selectedJob.id)}
        />
      )}
    </div>
  )
}