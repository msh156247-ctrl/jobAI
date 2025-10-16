'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getJobRecommendations, MatchResult } from '@/lib/matching'
import { applyToJob } from '@/lib/jobs'
import Link from 'next/link'

export default function MatchesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'seeker')) {
      router.push('/dashboard')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (user && profile?.role === 'seeker') {
      loadMatches()
    }
  }, [user, profile])

  const loadMatches = async () => {
    if (!user) return

    try {
      setLoading(true)
      const recommendations = await getJobRecommendations(user.id, 20)
      setMatches(recommendations)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (jobId: string) => {
    if (!user || applying) return

    setApplying(jobId)
    try {
      await applyToJob(jobId, user.id)
      alert('지원이 완료되었습니다!')
      // 해당 매치를 목록에서 제거
      setMatches(prev => prev.filter(match => match.job.id !== jobId))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setApplying(null)
    }
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return '급여 협의'
    if (min && max) return `${min.toLocaleString()}만원 - ${max.toLocaleString()}만원`
    if (min) return `${min.toLocaleString()}만원 이상`
    if (max) return `${max.toLocaleString()}만원 이하`
    return '급여 협의'
  }

  const getJobTypeLabel = (type: string) => {
    const types = {
      'full-time': '정규직',
      'part-time': '파트타임',
      'contract': '계약직',
      'internship': '인턴십'
    }
    return types[type as keyof typeof types] || type
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-blue-600'
    if (score >= 0.4) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return '매우 높음'
    if (score >= 0.6) return '높음'
    if (score >= 0.4) return '보통'
    return '낮음'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || profile?.role !== 'seeker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">구직자 계정만 접근할 수 있습니다.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
                  채용공고
                </Link>
                <Link href="/matches" className="text-blue-600 font-medium">
                  추천 매칭
                </Link>
                <Link href="/my-applications" className="text-gray-700 hover:text-blue-600">
                  지원 현황
                </Link>
                <Link href="/chat" className="text-gray-700 hover:text-blue-600">
                  채팅
                </Link>
                <Link href="/reviews" className="text-gray-700 hover:text-blue-600">
                  리뷰
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  프로필
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {profile?.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 추천 매칭</h1>
          <p className="text-gray-600">
            당신의 프로필과 경험을 바탕으로 최적의 채용공고를 추천합니다.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 매칭 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
            <div className="text-sm text-gray-600">추천 공고</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.score >= 0.8).length}
            </div>
            <div className="text-sm text-gray-600">높은 일치도</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {matches.filter(m => m.score >= 0.6 && m.score < 0.8).length}
            </div>
            <div className="text-sm text-gray-600">보통 일치도</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(matches.map(m => m.job.company_profiles?.company_name)).size}
            </div>
            <div className="text-sm text-gray-600">관련 기업</div>
          </div>
        </div>

        {/* 매칭 결과 */}
        {matches.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              추천 매칭을 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              더 나은 추천을 받으려면 프로필을 완성하고 기술 스택을 추가해보세요.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/profile"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                프로필 완성하기
              </Link>
              <Link
                href="/jobs"
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                전체 공고 보기
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match.job.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {match.job.title}
                          </h2>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {getJobTypeLabel(match.job.type)}
                          </span>
                        </div>
                        <p className="text-gray-600">{match.job.company_profiles?.company_name}</p>
                      </div>

                      {/* 매칭 점수 */}
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
                          {Math.round(match.score * 100)}%
                        </div>
                        <div className={`text-sm ${getScoreColor(match.score)}`}>
                          {getScoreLabel(match.score)}
                        </div>
                      </div>
                    </div>

                    {/* 매칭 이유 */}
                    {match.reasons.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">매칭 이유:</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.reasons.map((reason, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 기본 정보 */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      {match.job.location && (
                        <span>📍 {match.job.location}</span>
                      )}
                      <span>💰 {formatSalary(match.job.salary_min, match.job.salary_max)}</span>
                      <span>📅 {new Date(match.job.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* 설명 */}
                    <p className="text-gray-700 line-clamp-3 mb-4">
                      {match.job.description}
                    </p>

                    {/* 요구사항 */}
                    {match.job.requirements && match.job.requirements.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {match.job.requirements.slice(0, 6).map((req, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                            >
                              {req}
                            </span>
                          ))}
                          {match.job.requirements.length > 6 && (
                            <span className="text-gray-500 text-xs px-2 py-1">
                              +{match.job.requirements.length - 6}개 더
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      href={`/jobs/${match.job.id}`}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-center hover:bg-gray-200"
                    >
                      상세보기
                    </Link>
                    <button
                      onClick={() => handleApply(match.job.id)}
                      disabled={applying === match.job.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {applying === match.job.id ? '지원 중...' : '지원하기'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 도움말 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 매칭 점수는 어떻게 계산되나요?</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• <strong>기술 스택 매치 (50%)</strong>: 보유 기술과 공고 요구사항 일치도</li>
            <li>• <strong>경력 수준 (30%)</strong>: 요구 경력과 현재 경력의 적합성</li>
            <li>• <strong>근무지 선호도 (20%)</strong>: 희망 근무지와 공고 위치 일치도</li>
          </ul>
          <p className="text-blue-700 text-sm mt-4">
            더 정확한 추천을 받으려면 프로필에서 기술 스택, 경력, 희망 근무지 정보를 자세히 입력해주세요.
          </p>
        </div>
      </main>
    </div>
  )
}