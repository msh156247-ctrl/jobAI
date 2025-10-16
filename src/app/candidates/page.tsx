'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getRecommendedCandidatesForJob, getMatchScoreLabel, getMatchScoreColor } from '@/lib/ai-matching'
import { getCompanyProfile } from '@/lib/profiles'
import { getCompanyJobs } from '@/lib/jobs'
import { getUser } from '@/lib/auth'
import { getOrCreateChatRoom } from '@/lib/chat'
import Link from 'next/link'

interface RecommendedCandidate {
  userId: string
  name: string | null
  email: string
  skills: string[]
  career_years: number | null
  location: string | null
  bio: string | null
  matchScore: number
  skillsScore: number
  reasonsForMatch: string[]
  matchedSkills: string[]
  missingSkills: string[]
}

interface Job {
  id: string
  title: string
}

export default function CandidatesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [candidates, setCandidates] = useState<RecommendedCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'employer')) {
      router.push('/dashboard')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (user && profile?.role === 'employer') {
      loadJobs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const loadJobs = async () => {
    if (!user) return

    try {
      setLoading(true)

      const companyProfile = await getCompanyProfile(user.id)
      if (!companyProfile) {
        setError('기업 프로필을 찾을 수 없습니다.')
        return
      }

      const companyJobs = await getCompanyJobs(companyProfile.id)
      setJobs(companyJobs)

      if (companyJobs.length > 0) {
        setSelectedJobId(companyJobs[0].id)
        loadCandidates(companyJobs[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loadCandidates = async (jobId: string) => {
    try {
      setLoadingCandidates(true)

      // AI 매칭 시스템으로 추천 지원자 가져오기
      const matchScores = await getRecommendedCandidatesForJob(jobId, 20)

      // 각 매칭 결과에 대해 사용자 프로필 정보 조회
      const recommendedCandidates = await Promise.all(
        matchScores.map(async (match) => {
          // TODO: 실제로는 getUserById(match.userId) 같은 함수가 필요
          return {
            userId: match.userId,
            name: match.userId, // 임시: userId를 이름으로 사용
            email: `${match.userId}@example.com`, // 임시: 이메일 생성
            skills: [],
            career_years: null,
            location: null,
            bio: null,
            matchScore: match.totalScore,
            skillsScore: match.skillsScore,
            reasonsForMatch: match.details.reasonsForMatch,
            matchedSkills: match.details.matchedSkills,
            missingSkills: match.details.missingSkills
          }
        })
      )

      setCandidates(recommendedCandidates)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoadingCandidates(false)
    }
  }

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId)
    loadCandidates(jobId)
  }

  const handleStartChat = async (candidateId: string) => {
    if (!user) return

    try {
      const chatRoom = await getOrCreateChatRoom(user.id, candidateId)
      router.push(`/chat/${chatRoom.id}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      alert('채팅방 생성 중 오류가 발생했습니다: ' + errorMsg)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">AI가 맞춤 인재를 분석 중...</div>
      </div>
    )
  }

  if (!user || profile?.role !== 'employer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">기업 계정만 접근할 수 있습니다.</p>
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
                <Link href="/applications" className="text-gray-700 hover:text-blue-600">
                  지원자 관리
                </Link>
                <Link href="/candidates" className="text-blue-600 font-medium">
                  AI 인재추천
                </Link>
                <Link href="/chat" className="text-gray-700 hover:text-blue-600">
                  채팅
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI 맞춤 인재 추천</h1>
          <p className="text-gray-600">
            채용공고를 분석하여 가장 적합한 인재를 추천합니다
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 채용공고 선택 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">채용공고 선택</h3>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">등록된 채용공고가 없습니다.</p>
              <Link
                href="/jobs"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                채용공고 등록하기
              </Link>
            </div>
          ) : (
            <select
              value={selectedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 추천 지원자 목록 */}
        {selectedJobId && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium">추천 인재</h3>
              {loadingCandidates && (
                <p className="text-sm text-gray-500 mt-1">AI가 분석 중...</p>
              )}
            </div>

            {loadingCandidates ? (
              <div className="p-8 text-center">
                <div className="text-lg">분석 중...</div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg text-gray-500 mb-4">
                  현재 조건에 맞는 추천 인재가 없습니다
                </p>
                <p className="text-sm text-gray-400">
                  더 많은 지원자가 등록되면 추천을 제공해드리겠습니다
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {candidates.map((candidate) => (
                  <div key={candidate.userId} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {candidate.name || candidate.email}
                          </h4>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getMatchScoreColor(candidate.matchScore)}`}>
                            매칭도: {getMatchScoreLabel(candidate.matchScore)} ({Math.round(candidate.matchScore * 100)}%)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">이메일</p>
                            <p className="text-gray-900">{candidate.email}</p>
                          </div>
                          {candidate.career_years !== null && (
                            <div>
                              <p className="text-sm text-gray-500">경력</p>
                              <p className="text-gray-900">{candidate.career_years}년</p>
                            </div>
                          )}
                          {candidate.location && (
                            <div>
                              <p className="text-sm text-gray-500">위치</p>
                              <p className="text-gray-900">{candidate.location}</p>
                            </div>
                          )}
                        </div>

                        {/* 추천 이유 */}
                        {candidate.reasonsForMatch.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">✨ 추천 이유:</p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.reasonsForMatch.map((reason, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 보유 기술 스택 */}
                        {candidate.skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🛠 보유 기술:</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 rounded text-xs ${
                                    candidate.matchedSkills.includes(skill.toLowerCase())
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {skill}
                                  {candidate.matchedSkills.includes(skill.toLowerCase()) && ' ✓'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {candidate.bio && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">자기소개</p>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                              {candidate.bio}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => handleStartChat(candidate.userId)}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          채팅 시작
                        </button>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">매칭 상세</div>
                          <div className="text-xs text-gray-400">
                            기술: {Math.round(candidate.skillsScore * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI 추천 설명 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🧠 AI 인재 매칭 시스템</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800 text-sm">
            <div>
              <p className="font-medium mb-2">매칭 기준:</p>
              <ul className="space-y-1">
                <li>• 필요 기술 스택 보유도 (40%)</li>
                <li>• 근무 가능 지역 (20%)</li>
                <li>• 급여 조건 부합도 (20%)</li>
                <li>• 적합한 경력 수준 (20%)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">추천 특징:</p>
              <ul className="space-y-1">
                <li>• 이미 지원한 지원자 제외</li>
                <li>• 실시간 프로필 분석</li>
                <li>• 기술 스택 정확도 우선</li>
                <li>• 경력-직무 레벨 매칭</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}