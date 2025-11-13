'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamById, calculateMatchScore, addToWaitlist, getWaitlist, sortWaitlistByPriority } from '@/lib/teamData'
import type { TeamRecruitment, TeamPosition, WaitlistEntry } from '@/types'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  Award,
  AlertCircle,
  TrendingUp,
  UserPlus
} from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
    roleId: string
  }>
}

export default function RoleDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [team, setTeam] = useState<TeamRecruitment | null>(null)
  const [position, setPosition] = useState<TeamPosition | null>(null)
  const [matchScore, setMatchScore] = useState<number>(0)
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [isApplying, setIsApplying] = useState(false)
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string; roleId: string } | null>(null)

  useEffect(() => {
    params.then(p => setUnwrappedParams(p))
  }, [params])

  useEffect(() => {
    if (!unwrappedParams) return

    const teamData = getTeamById(unwrappedParams.id)
    if (teamData) {
      setTeam(teamData)
      const pos = teamData.positions.find(p => p.id === unwrappedParams.roleId)
      setPosition(pos || null)

      if (user && pos) {
        // Calculate match score for this specific role
        const score = calculateMatchScore(unwrappedParams.id, user.id)
        setMatchScore(score)
      }

      // Load waitlist
      if (pos) {
        const waitlistData = getWaitlist(unwrappedParams.id, pos.id)
        setWaitlist(waitlistData)
      }
    }
  }, [unwrappedParams, user])

  if (!unwrappedParams || !team || !position) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const isPositionFull = position.filledCount >= position.requiredCount
  const fillPercentage = (position.filledCount / position.requiredCount) * 100
  const sortedWaitlist = sortWaitlistByPriority(waitlist)

  const handleApply = () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    setIsApplying(true)

    if (isPositionFull) {
      // Add to waitlist
      const entry = addToWaitlist(
        team.id,
        position.id,
        user.id,
        user.name,
        matchScore
      )

      alert(`대기열에 등록되었습니다!\n\n매칭 점수: ${matchScore}점\n우선순위: ${sortedWaitlist.length + 1}번째`)

      // Reload waitlist
      const updatedWaitlist = getWaitlist(team.id, position.id)
      setWaitlist(updatedWaitlist)
    } else {
      // Direct application (would normally navigate to application form)
      alert('지원이 완료되었습니다!')
      router.push(`/teams/${team.id}`)
    }

    setIsApplying(false)
  }

  const userWaitlistPosition = user
    ? sortedWaitlist.findIndex(w => w.entry.applicantId === user.id) + 1
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/teams/${team.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            팀 상세로 돌아가기
          </Link>
        </div>

        {/* Role Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{position.title}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    isPositionFull
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {isPositionFull ? '정원 마감' : '모집중'}
                </span>
              </div>
              <Link href={`/teams/${team.id}`} className="text-sm text-gray-600 hover:text-blue-600">
                {team.title}
              </Link>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{position.description}</p>

          {/* Position Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">모집 인원</p>
                <p className="text-sm font-semibold text-gray-900">
                  {position.filledCount}/{position.requiredCount}명
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">근무 형태</p>
                <p className="text-sm font-semibold text-gray-900">
                  {team.location === 'online' ? '온라인' : team.location === 'offline' ? '오프라인' : '혼합'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">활동 기간</p>
                <p className="text-sm font-semibold text-gray-900">{team.duration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Score (if logged in) */}
        {user && matchScore > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">AI 매칭 점수</h2>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <div className="text-4xl font-bold text-blue-600">{matchScore}점</div>
              <div className="flex-1">
                <div className="w-full bg-white rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
                    style={{ width: `${matchScore}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              {matchScore >= 80
                ? '🎉 매우 적합합니다! 지금 바로 지원해보세요.'
                : matchScore >= 60
                ? '👍 적합한 포지션입니다. 도전해보세요!'
                : '💡 관심이 있다면 지원해보세요.'}
            </p>
          </div>
        )}

        {/* Waitlist Info (if position is full) */}
        {isPositionFull && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">현재 정원이 마감되었습니다</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  대기열에 등록하시면 공석 발생 시 우선순위에 따라 자동으로 안내드립니다.
                </p>
                {waitlist.length > 0 && (
                  <p className="text-sm text-yellow-700">
                    현재 대기 인원: <span className="font-semibold">{waitlist.length}명</span>
                    {userWaitlistPosition > 0 && ` (내 순위: ${userWaitlistPosition}번째)`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Required Skills */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">필수 역량</h2>
          <div className="flex flex-wrap gap-2">
            {position.requiredSkills.map(skill => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">담당 업무</h2>
          <ul className="space-y-2">
            {position.responsibilities.map((resp, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-700">
                <Award className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Apply/Waitlist Button */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={handleApply}
            disabled={!!(isApplying || (user && userWaitlistPosition > 0))}
            className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors ${
              user && userWaitlistPosition > 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : isPositionFull
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <UserPlus className="w-6 h-6" />
            {user && userWaitlistPosition > 0
              ? `대기열 등록 완료 (${userWaitlistPosition}번째)`
              : isPositionFull
              ? '대기열 등록'
              : '지원하기'}
          </button>

          {!user && (
            <p className="text-sm text-gray-600 text-center mt-3">
              지원하려면 <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>이 필요합니다.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
