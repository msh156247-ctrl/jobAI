'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamById, incrementTeamViews, applyToTeam, toggleTeamBookmark } from '@/lib/teamData'
import { getUserPreferences } from '@/lib/userPreferences'
import type { TeamRecruitment, TeamPosition } from '@/types'
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
  Send
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
    }
  }, [resolvedParams.id])

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
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-2">
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
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {team.title}
          </h1>

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
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {position.title}
                    </h3>
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
                  {team.status === 'recruiting' && position.filledCount < position.requiredCount && (
                    <button
                      onClick={() => handleApply(position)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      지원하기
                    </button>
                  )}
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
                      {position.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
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

        {/* 태그 */}
        {team.tags && team.tags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
