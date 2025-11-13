'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamById, getApplicationsByTeam, updateApplicationStatus } from '@/lib/teamData'
import type { TeamRecruitment, TeamApplication } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  ExternalLink,
  Filter,
  Search,
  TrendingUp
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ManageApplicationsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const router = useRouter()

  const [team, setTeam] = useState<TeamRecruitment | null>(null)
  const [applications, setApplications] = useState<TeamApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<TeamApplication[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<TeamApplication | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [reviewNote, setReviewNote] = useState('')

  useEffect(() => {
    const teamData = getTeamById(resolvedParams.id)
    if (teamData) {
      setTeam(teamData)

      // 팀장인지 확인
      if (!user || user.id !== teamData.leaderId) {
        alert('팀장만 접근할 수 있습니다.')
        router.push(`/teams/${resolvedParams.id}`)
        return
      }

      loadApplications()
    }
  }, [resolvedParams.id, user, router])

  useEffect(() => {
    filterApplications()
  }, [applications, selectedStatus, selectedPosition, searchQuery])

  const loadApplications = () => {
    const apps = getApplicationsByTeam(resolvedParams.id)
    setApplications(apps)
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus)
    }

    // 포지션 필터
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(app => app.positionId === selectedPosition)
    }

    // 검색
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.motivation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.experience.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredApplications(filtered)
  }

  const handleStatusChange = (applicationId: string, status: TeamApplication['status']) => {
    updateApplicationStatus(applicationId, status, reviewNote)
    loadApplications()
    setShowDetailModal(false)
    setReviewNote('')
    alert('지원 상태가 변경되었습니다.')

    // 팀 정보 다시 로드
    const updatedTeam = getTeamById(resolvedParams.id)
    if (updatedTeam) {
      setTeam(updatedTeam)
    }
  }

  const openDetailModal = (application: TeamApplication) => {
    setSelectedApplication(application)
    setReviewNote(application.reviewerNote || '')
    setShowDetailModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'reviewing':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'waitlisted':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'reviewing':
        return '검토중'
      case 'accepted':
        return '수락됨'
      case 'rejected':
        return '거절됨'
      case 'waitlisted':
        return '대기열'
      default:
        return status
    }
  }

  const getPositionName = (positionId: string) => {
    const position = team?.positions.find(p => p.id === positionId)
    return position?.title || '알 수 없음'
  }

  const getStatistics = () => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      waitlisted: applications.filter(a => a.status === 'waitlisted').length
    }
  }

  if (!team || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">로딩 중...</p>
        </main>
      </div>
    )
  }

  const stats = getStatistics()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 뒤로가기 */}
        <Link
          href={`/teams/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          팀 상세로
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">지원자 관리</h1>
          <p className="text-gray-600">{team.title}</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">전체</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 mb-1">대기중</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">검토중</p>
            <p className="text-2xl font-bold text-blue-700">{stats.reviewing}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">수락</p>
            <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 mb-1">거절</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-1">대기열</p>
            <p className="text-2xl font-bold text-purple-700">{stats.waitlisted}</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="지원자 이름, 지원 동기로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 상태 필터 */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기중</option>
                <option value="reviewing">검토중</option>
                <option value="accepted">수락됨</option>
                <option value="rejected">거절됨</option>
                <option value="waitlisted">대기열</option>
              </select>
            </div>

            {/* 포지션 필터 */}
            <div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 포지션</option>
                {team.positions.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 지원자 목록 */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">지원자가 없습니다.</p>
            </div>
          ) : (
            filteredApplications.map(application => (
              <div
                key={application.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.applicantName}
                      </h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                      </span>
                      {application.matchScore && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">{application.matchScore}% 매칭</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {getPositionName(application.positionId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(application.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">지원 동기</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {application.motivation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">관련 경험</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {application.experience}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>가능 시간: {application.availableTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {application.portfolioUrl && (
                      <a
                        href={application.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        포트폴리오
                      </a>
                    )}
                    {application.githubUrl && (
                      <a
                        href={application.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        GitHub
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(application.id, 'reviewing')}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          검토 시작
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openDetailModal(application)}
                      className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      상세보기
                    </button>
                  </div>
                </div>

                {application.reviewerNote && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      검토 메모
                    </p>
                    <p className="text-sm text-gray-600">{application.reviewerNote}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* 상세 모달 */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedApplication.applicantName} 지원서
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 매칭 점수 */}
              {selectedApplication.matchScore && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">매칭 점수</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {selectedApplication.matchScore}%
                    </span>
                  </div>
                </div>
              )}

              {/* 지원 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지원 포지션
                </label>
                <p className="text-gray-900">
                  {getPositionName(selectedApplication.positionId)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지원 동기
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedApplication.motivation}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관련 경험
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedApplication.experience}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동 가능 시간
                </label>
                <p className="text-gray-900">{selectedApplication.availableTime}</p>
              </div>

              {/* 링크 */}
              {(selectedApplication.portfolioUrl || selectedApplication.githubUrl) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    링크
                  </label>
                  <div className="space-y-2">
                    {selectedApplication.portfolioUrl && (
                      <a
                        href={selectedApplication.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedApplication.portfolioUrl}
                      </a>
                    )}
                    {selectedApplication.githubUrl && (
                      <a
                        href={selectedApplication.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {selectedApplication.githubUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 검토 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검토 메모 (선택)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="내부 메모를 작성하세요..."
                />
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedApplication.status !== 'accepted' && (
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'accepted')}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    수락
                  </button>
                )}
                {selectedApplication.status !== 'waitlisted' && selectedApplication.status !== 'accepted' && (
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'waitlisted')}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Clock className="w-5 h-5" />
                    대기열
                  </button>
                )}
                {selectedApplication.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    거절
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
