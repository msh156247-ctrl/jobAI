'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamById, incrementTeamViews, applyToTeam, toggleTeamBookmark, getRecommendedTeams, getTeams } from '@/lib/teamData'
import { getUserPreferences } from '@/lib/userPreferences'
import type { TeamRecruitment, TeamPosition, TeamMatchResult } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Bookmark,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  TrendingUp,
  Target
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TeamDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const router = useRouter()

  const [team, setTeam] = useState<TeamRecruitment | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<TeamPosition | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [matchResult, setMatchResult] = useState<TeamMatchResult | null>(null)
  const [similarTeams, setSimilarTeams] = useState<TeamRecruitment[]>([])

  // 지원 폼 상태
  const [applyForm, setApplyForm] = useState({
    motivation: '',
    experience: '',
    availableTime: '',
    portfolioUrl: '',
    githubUrl: ''
  })

  useEffect(() => {
    const teamData = getTeamById(resolvedParams.id)
    if (teamData) {
      setTeam(teamData)
      incrementTeamViews(resolvedParams.id)

      // 로그인 사용자: 매칭 점수 계산
      if (user) {
        const recommendations = getRecommendedTeams(user.id, 10)
        const currentMatch = recommendations.find(r => r.teamId === resolvedParams.id)
        if (currentMatch) {
          setMatchResult(currentMatch)
        }

        // 유사한 팀 추천 (같은 업종 또는 기술 스택)
        const allTeams = getTeams({ status: 'recruiting' })
        const similar = allTeams
          .filter(t =>
            t.id !== resolvedParams.id &&
            (t.industry === teamData.industry ||
             t.techStack.some(tech => teamData.techStack.includes(tech)))
          )
          .slice(0, 3)
        setSimilarTeams(similar)
      }
    }
  }, [resolvedParams.id, user])

  const handleApply = (position: TeamPosition) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    if (position.filledCount >= position.requiredCount) {
      alert('해당 포지션은 모집이 완료되었습니다.')
      return
    }

    setSelectedPosition(position)
    setShowApplyModal(true)

    // 사용자 정보로 폼 미리 채우기
    const userPrefs = getUserPreferences()
    setApplyForm({
      motivation: '',
      experience: userPrefs.career.currentPosition || '',
      availableTime: '',
      portfolioUrl: '',
      githubUrl: ''
    })
  }

  const submitApplication = async () => {
    if (!user || !selectedPosition || !team) return

    // 유효성 검사
    if (!applyForm.motivation.trim()) {
      alert('지원 동기를 입력해주세요.')
      return
    }
    if (!applyForm.experience.trim()) {
      alert('관련 경험을 입력해주세요.')
      return
    }
    if (!applyForm.availableTime.trim()) {
      alert('가능한 시간을 입력해주세요.')
      return
    }

    try {
      await applyToTeam({
        teamId: team.id,
        positionId: selectedPosition.id,
        applicantId: user.id,
        applicantName: user.name,
        motivation: applyForm.motivation,
        experience: applyForm.experience,
        availableTime: applyForm.availableTime,
        portfolioUrl: applyForm.portfolioUrl,
        githubUrl: applyForm.githubUrl,
        status: 'pending'
      })

      alert('지원이 완료되었습니다!')
      setShowApplyModal(false)
      setApplyForm({
        motivation: '',
        experience: '',
        availableTime: '',
        portfolioUrl: '',
        githubUrl: ''
      })

      // 팀 정보 다시 로드
      const updatedTeam = getTeamById(resolvedParams.id)
      if (updatedTeam) {
        setTeam(updatedTeam)
      }
    } catch (error: any) {
      alert(error.message || '지원에 실패했습니다.')
    }
  }

  const handleBookmark = () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    if (!team) return

    const bookmarked = toggleTeamBookmark(team.id, user.id)
    setIsBookmarked(bookmarked)

    // 팀 정보 다시 로드
    const updatedTeam = getTeamById(resolvedParams.id)
    if (updatedTeam) {
      setTeam(updatedTeam)
    }
  }

  const getTeamTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      project: '프로젝트',
      study: '스터디',
      startup: '스타트업',
      contest: '대회/해커톤',
      opensource: '오픈소스'
    }
    return typeMap[type] || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'bg-green-100 text-green-700'
      case 'full':
        return 'bg-yellow-100 text-yellow-700'
      case 'closed':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'recruiting':
        return '모집중'
      case 'full':
        return '마감임박'
      case 'closed':
        return '모집마감'
      default:
        return status
    }
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">팀을 찾을 수 없습니다.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          팀 목록으로
        </Link>

        {/* 팀 헤더 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          {/* 상단 */}
          <div className="flex items-start gap-4 mb-4">
            {/* 로고 */}
            {team.companyLogo && (
              <div className="flex-shrink-0">
                <img
                  src={team.companyLogo}
                  alt={team.title}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}

            {/* 타이틀 및 태그 */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(team.status)}`}>
                    {getStatusLabel(team.status)}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium rounded bg-blue-100 text-blue-700">
                    {getTeamTypeLabel(team.teamType)}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium rounded bg-purple-100 text-purple-700">
                    {team.industry}
                  </span>
                </div>
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isBookmarked
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                {team.title}
              </h1>
            </div>
          </div>

          {/* 팀 멤버 시각화 */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">팀 구성원</p>
              {team.teamSize && (
                <p className="text-xs text-gray-600">전체 팀: {team.teamSize}명</p>
              )}
            </div>
            <div className="space-y-2">
              {team.positions.map(position => (
                <div key={position.id} className="flex items-center gap-3">
                  <p className="text-xs text-gray-600 w-24 truncate">{position.title}</p>
                  <div className="flex gap-1">
                    {Array.from({ length: position.requiredCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          idx < position.filledCount
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {idx < position.filledCount ? '●' : '○'}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {position.filledCount}/{position.requiredCount}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{team.filledSlots}/{team.totalSlots}명</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                {team.location === 'online' ? '온라인' : team.location === 'offline' ? '오프라인' : '혼합'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{team.duration}</span>
            </div>
            {team.deadline && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>마감: {new Date(team.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
            <span>조회 {team.views}</span>
            <span>지원자 {team.applicantsCount}</span>
            <span>북마크 {team.bookmarksCount}</span>
          </div>

          {/* 팀장 전용: 지원자 관리 버튼 */}
          {user && user.id === team.leaderId && (
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link
                href={`/teams/${team.id}/manage`}
                className="block w-full py-3 text-center bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                지원자 관리 ({team.applicantsCount})
              </Link>
            </div>
          )}
        </div>

        {/* 팀 설명 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">팀 소개</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {team.description}
          </div>

          {team.schedule && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>활동 일정:</strong> {team.schedule}
              </p>
            </div>
          )}
        </div>

        {/* 팀 문화 */}
        {team.culture && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">팀 문화</h2>
            <div className="space-y-4">
              {/* 팀 가치 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">핵심 가치</h3>
                <div className="flex flex-wrap gap-2">
                  {team.culture.values.map((value, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>

              {/* 일하는 방식 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">일하는 방식</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {team.culture.workingStyle.map((style, idx) => (
                    <li key={idx}>{style}</li>
                  ))}
                </ul>
              </div>

              {/* 커뮤니케이션 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">커뮤니케이션 방식</p>
                  <p className="text-sm text-gray-700">{team.culture.communicationStyle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">미팅 빈도</p>
                  <p className="text-sm text-gray-700">{team.culture.meetingFrequency}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 기술 스택 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">기술 스택</h2>
          <div className="flex flex-wrap gap-2">
            {team.techStack.map(tech => (
              <span
                key={tech}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* 진행 중인 프로젝트 */}
        {team.currentProjects && team.currentProjects.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">진행 중인 프로젝트</h2>
            <div className="space-y-4">
              {team.currentProjects.map(project => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status === 'completed' ? '완료' :
                       project.status === 'in-progress' ? '진행중' : '계획중'}
                    </span>
                  </div>

                  {/* 진행률 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>진행률</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          project.status === 'completed' ? 'bg-green-600' :
                          project.status === 'in-progress' ? 'bg-blue-600' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 기간 */}
                  {project.startDate && (
                    <div className="mt-2 text-xs text-gray-500">
                      {project.startDate} ~ {project.endDate || '진행중'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 모집 포지션 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">모집 포지션</h2>
          <div className="space-y-4">
            {team.positions.map(position => (
              <div
                key={position.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link href={`/teams/${team.id}/roles/${position.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                        {position.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">
                      {position.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded ${
                        position.filledCount >= position.requiredCount
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {position.filledCount}/{position.requiredCount}명
                      </span>
                      {position.filledCount >= position.requiredCount && (
                        <span className="text-gray-500">모집완료</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/teams/${team.id}/roles/${position.id}`}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      자세히
                    </Link>
                    {team.status === 'recruiting' && position.filledCount < position.requiredCount && (
                      <button
                        onClick={() => handleApply(position)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        지원하기
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">필요 스킬</p>
                    <div className="flex flex-wrap gap-1">
                      {position.requiredSkills.map(skill => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">담당 업무</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                      {position.responsibilities.slice(0, 2).map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                      {position.responsibilities.length > 2 && (
                        <li className="text-blue-600">
                          <Link href={`/teams/${team.id}/roles/${position.id}`}>
                            +{position.responsibilities.length - 2}개 더 보기
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 요구사항 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">요구사항</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                필수 역량
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {team.requiredSkills.map((skill, idx) => (
                  <li key={idx}>{skill}</li>
                ))}
              </ul>
            </div>

            {team.preferredSkills && team.preferredSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  우대 사항
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {team.preferredSkills.map((skill, idx) => (
                    <li key={idx}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <strong>경력:</strong>{' '}
                {team.experienceLevel === 'any' ? '경력 무관' :
                 team.experienceLevel === 'beginner' ? '초급 (0-2년)' :
                 team.experienceLevel === 'intermediate' ? '중급 (3-5년)' :
                 '고급 (5년+)'}
              </p>
            </div>
          </div>
        </div>

        {/* 복지 및 혜택 */}
        {team.benefits && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">복지 및 혜택</h2>
            <div className="space-y-4">
              {/* 급여 정보 */}
              {team.benefits.salary && (
                <div className="pb-3 border-b border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">급여</p>
                  <p className="text-base font-semibold text-gray-900">{team.benefits.salary}</p>
                </div>
              )}

              {/* 주요 혜택 그리드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {team.benefits.equity && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">스톡옵션</span>
                  </div>
                )}
                {team.benefits.workFromHome && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">재택근무</span>
                  </div>
                )}
                {team.benefits.flexibleHours && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">유연근무</span>
                  </div>
                )}
                {team.benefits.meals && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">식대지원</span>
                  </div>
                )}
                {team.benefits.education && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">교육지원</span>
                  </div>
                )}
                {team.benefits.equipment && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">장비지원</span>
                  </div>
                )}
              </div>

              {/* 휴가 정책 */}
              {team.benefits.vacation && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">휴가</p>
                  <p className="text-sm text-gray-900">{team.benefits.vacation}</p>
                </div>
              )}

              {/* 기타 복지 */}
              {team.benefits.other && team.benefits.other.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">기타 혜택</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {team.benefits.other.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 태그 */}
        {team.tags && team.tags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">태그</h2>
            <div className="flex flex-wrap gap-2">
              {team.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 매칭 점수 (로그인 사용자만) */}
        {user && matchResult && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">매칭 분석</h2>
            </div>

            {/* 전체 매칭 점수 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">전체 매칭도</span>
                <span className="text-2xl font-bold text-green-600">{matchResult.matchScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all"
                  style={{ width: `${matchResult.matchScore}%` }}
                />
              </div>
            </div>

            {/* 세부 매칭 점수 (7-factor breakdown) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">직무 일치</p>
                <p className="text-sm font-bold text-blue-600">
                  {matchResult.matchReasons.jobTitleMatch}/25
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.jobTitleMatch / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">필수 스킬</p>
                <p className="text-sm font-bold text-purple-600">
                  {matchResult.matchReasons.requiredSkillsMatch}/20
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.requiredSkillsMatch / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">우대 스킬</p>
                <p className="text-sm font-bold text-indigo-600">
                  {matchResult.matchReasons.preferredSkillsMatch}/10
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.preferredSkillsMatch / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">경력 적합성</p>
                <p className="text-sm font-bold text-green-600">
                  {matchResult.matchReasons.experienceMatch}/15
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.experienceMatch / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">근무 형태</p>
                <p className="text-sm font-bold text-teal-600">
                  {matchResult.matchReasons.locationMatch}/10
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.locationMatch / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">복지/문화</p>
                <p className="text-sm font-bold text-orange-600">
                  {matchResult.matchReasons.cultureMatch}/10
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-orange-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.cultureMatch / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">성향 매칭</p>
                <p className="text-sm font-bold text-pink-600">
                  {matchResult.matchReasons.personalityMatch}/10
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-pink-600 h-1.5 rounded-full"
                    style={{ width: `${(matchResult.matchReasons.personalityMatch / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 추천 이유 */}
            {matchResult.recommendations.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">추천 이유</p>
                <ul className="space-y-1">
                  {matchResult.recommendations.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 유사한 팀 추천 */}
        {similarTeams.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">이런 팀은 어때요?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarTeams.map(similarTeam => (
                <Link
                  key={similarTeam.id}
                  href={`/teams/${similarTeam.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                      {similarTeam.status === 'recruiting' ? '모집중' : '마감임박'}
                    </span>
                    {similarTeam.companyLogo && (
                      <img
                        src={similarTeam.companyLogo}
                        alt={similarTeam.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                    {similarTeam.title}
                  </h3>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {similarTeam.techStack.slice(0, 3).map(tech => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {similarTeam.techStack.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        +{similarTeam.techStack.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {similarTeam.filledSlots}/{similarTeam.totalSlots}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {similarTeam.duration}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 지원 모달 */}
      {showApplyModal && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPosition.title} 지원하기
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지원 동기 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={applyForm.motivation}
                  onChange={(e) => setApplyForm({ ...applyForm, motivation: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="이 팀에 지원하는 이유를 작성해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관련 경험 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={applyForm.experience}
                  onChange={(e) => setApplyForm({ ...applyForm, experience: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="관련 프로젝트나 경험을 작성해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동 가능 시간 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={applyForm.availableTime}
                  onChange={(e) => setApplyForm({ ...applyForm, availableTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 평일 저녁 7-10시, 주말 오전"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  포트폴리오 URL
                </label>
                <input
                  type="url"
                  value={applyForm.portfolioUrl}
                  onChange={(e) => setApplyForm({ ...applyForm, portfolioUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={applyForm.githubUrl}
                  onChange={(e) => setApplyForm({ ...applyForm, githubUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://github.com/"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    지원서 제출 후 팀장이 검토하여 연락드립니다. 진심을 담아 작성해주세요!
                  </span>
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                취소
              </button>
              <button
                onClick={submitApplication}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                지원하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
