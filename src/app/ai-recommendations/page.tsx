'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useJobSave } from '@/hooks/useJobSave'
import { AIJobMatcher, JobMatchScore } from '@/lib/ai'
import { JobWithCompany } from '@/lib/jobs'
import JobMatchCard from '@/components/JobMatchCard'
import ResumeAnalyzerComponent from '@/components/ResumeAnalyzer'
import { Brain, TrendingUp, RefreshCw, Filter, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface JobRecommendation {
  job: JobWithCompany
  matchScore: JobMatchScore
}

export default function AIRecommendationsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toggleSave } = useJobSave()

  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [filterMinScore, setFilterMinScore] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'salary'>('match')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && profile?.role === 'seeker') {
      loadRecommendations()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const loadRecommendations = async (refresh = false) => {
    if (!user) return

    if (refresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const jobRecommendations = await AIJobMatcher.getSmartJobRecommendations(user.id, 20)
      setRecommendations(jobRecommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 추천을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadRecommendations(true)
  }

  const handleApply = (jobId: string) => {
    router.push(`/jobs/${jobId}?action=apply`)
  }

  const handleSaveJob = (jobId: string) => {
    toggleSave(jobId)
  }

  const filteredAndSortedRecommendations = recommendations
    .filter(rec => rec.matchScore.overall >= filterMinScore)
    .sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return b.matchScore.overall - a.matchScore.overall
        case 'date':
          return new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime()
        case 'salary':
          const aSalary = a.job.salary_max || a.job.salary_min || 0
          const bSalary = b.job.salary_max || b.job.salary_min || 0
          return bSalary - aSalary
        default:
          return 0
      }
    })

  const getScoreDistribution = () => {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
    recommendations.forEach(rec => {
      const score = rec.matchScore.overall
      if (score >= 80) distribution.excellent++
      else if (score >= 60) distribution.good++
      else if (score >= 40) distribution.fair++
      else distribution.poor++
    })
    return distribution
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || !profile) return null

  if (profile.role !== 'seeker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">이 기능은 구직자만 이용할 수 있습니다.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const scoreDistribution = getScoreDistribution()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xl font-semibold hover:text-blue-600"
              >
                JobAI
              </button>
              <nav className="flex space-x-8">
                <Link href="/jobs" className="text-gray-600 hover:text-blue-600">
                  채용공고
                </Link>
                <Link href="/ai-recommendations" className="text-blue-600 font-medium">
                  AI 추천
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Brain className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">AI 맞춤 채용 추천</h1>
              </div>
              <p className="text-gray-600">당신에게 최적화된 채용공고를 AI가 분석해서 추천해드립니다.</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '새로고침 중...' : '새로고침'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Resume Analysis Section */}
        <div className="mb-8">
          <ResumeAnalyzerComponent onAnalysisComplete={() => loadRecommendations()} />
        </div>

        {recommendations.length > 0 && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">우수한 매치</p>
                    <p className="text-xl font-semibold text-gray-900">{scoreDistribution.excellent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">좋은 매치</p>
                    <p className="text-xl font-semibold text-gray-900">{scoreDistribution.good}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">보통 매치</p>
                    <p className="text-xl font-semibold text-gray-900">{scoreDistribution.fair}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded">
                    <TrendingUp className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">전체</p>
                    <p className="text-xl font-semibold text-gray-900">{recommendations.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">필터 및 정렬</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        최소 매치 점수: {filterMinScore}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={filterMinScore}
                        onChange={(e) => setFilterMinScore(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        정렬 기준
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'match' | 'date' | 'salary')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="match">매치 점수 높은 순</option>
                        <option value="date">최신 등록순</option>
                        <option value="salary">급여 높은 순</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <span className="text-sm text-gray-600">
                        {filteredAndSortedRecommendations.length}개 결과
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Recommendations */}
            <div className="space-y-6">
              {filteredAndSortedRecommendations.length > 0 ? (
                filteredAndSortedRecommendations.map((recommendation) => (
                  <JobMatchCard
                    key={recommendation.job.id}
                    job={recommendation.job}
                    matchScore={recommendation.matchScore}
                    onApply={handleApply}
                    onSaveJob={handleSaveJob}
                    showDetailedMatch={true}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    필터 조건에 맞는 추천이 없습니다
                  </h3>
                  <p className="text-gray-500 mb-4">
                    필터 조건을 조정하거나 이력서를 업데이트해보세요.
                  </p>
                  <button
                    onClick={() => setFilterMinScore(0)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    모든 추천 보기
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {recommendations.length === 0 && !loading && (
          <div className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 AI 추천을 생성할 준비가 되지 않았습니다
            </h3>
            <p className="text-gray-500 mb-6">
              프로필을 완성하고 이력서를 분석하면 맞춤형 채용 추천을 받을 수 있습니다.
            </p>
            <div className="space-x-4">
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                프로필 완성하기
              </Link>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}