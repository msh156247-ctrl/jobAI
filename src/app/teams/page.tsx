'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTeams, teamTypes, industries, experienceLevels, getRecommendedTeams, toggleTeamBookmark } from '@/lib/teamData'
import type { TeamRecruitment, TeamMatchResult } from '@/types'
import Link from 'next/link'
import Header from '@/components/Header'
import { Search, Users, MapPin, Clock, Bookmark, TrendingUp, Filter, X } from 'lucide-react'

export default function TeamsPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<TeamRecruitment[]>([])
  const [recommended, setRecommended] = useState<TeamMatchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // 필터 상태
  const [filters, setFilters] = useState({
    teamType: 'all',
    industry: 'all',
    status: 'recruiting',
    techStack: '',
    experienceLevel: 'all'
  })

  useEffect(() => {
    loadTeams()
    if (user) {
      loadRecommendations()
    }
  }, [filters, user])

  const loadTeams = () => {
    const allTeams = getTeams(filters)
    setTeams(allTeams)
  }

  const loadRecommendations = () => {
    if (user) {
      const recommendations = getRecommendedTeams(user.id, 3)
      setRecommended(recommendations)
    }
  }

  const filteredTeams = teams.filter(team =>
    team.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.techStack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase())) ||
    team.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleBookmark = (teamId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    toggleTeamBookmark(teamId, user.id)
    loadTeams()
  }

  const resetFilters = () => {
    setFilters({
      teamType: 'all',
      industry: 'all',
      status: 'recruiting',
      techStack: '',
      experienceLevel: 'all'
    })
    setSearchQuery('')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 모집</h1>
          <p className="text-gray-600">함께 성장할 팀원을 찾아보세요</p>
        </div>

        {/* 추천 팀 (로그인 시에만) */}
        {user && recommended.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">당신에게 추천하는 팀</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommended.map(rec => {
                const team = teams.find(t => t.id === rec.teamId)
                if (!team) return null

                return (
                  <Link
                    key={rec.teamId}
                    href={`/teams/${rec.teamId}`}
                    className="bg-white p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(team.status)}`}>
                        {getStatusLabel(team.status)}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {rec.matchScore}% 매칭
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {team.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {team.techStack.slice(0, 3).map(tech => (
                        <span key={tech} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600">
                      {rec.recommendations[0]}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          {/* 검색바 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="팀 이름, 기술 스택, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              필터
            </button>
          </div>

          {/* 필터 패널 */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">상세 필터</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  초기화
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 팀 타입 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    팀 타입
                  </label>
                  <select
                    value={filters.teamType}
                    onChange={(e) => setFilters({ ...filters, teamType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {teamTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 업종 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업종
                  </label>
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {industries.map(ind => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 경력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    경력
                  </label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 기술 스택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기술 스택
                  </label>
                  <input
                    type="text"
                    placeholder="예: React, Python"
                    value={filters.techStack}
                    onChange={(e) => setFilters({ ...filters, techStack: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 결과 통계 */}
        <div className="mb-4 text-sm text-gray-600">
          총 <span className="font-semibold text-gray-900">{filteredTeams.length}</span>개의 팀
        </div>

        {/* 팀 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <div
              key={team.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* 카드 헤더 */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(team.status)}`}>
                      {getStatusLabel(team.status)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                      {getTeamTypeLabel(team.teamType)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBookmark(team.id)}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>

                <Link href={`/teams/${team.id}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2">
                    {team.title}
                  </h3>
                </Link>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {team.description}
                </p>

                {/* 기술 스택 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {team.techStack.slice(0, 4).map(tech => (
                    <span key={tech} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {tech}
                    </span>
                  ))}
                  {team.techStack.length > 4 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{team.techStack.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* 카드 바디 */}
              <div className="p-5 space-y-3">
                {/* 정원 정보 */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {team.filledSlots}/{team.totalSlots}명
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(team.filledSlots / team.totalSlots) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 위치 */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {team.location === 'online' ? '온라인' : team.location === 'offline' ? '오프라인' : '혼합'}
                    {team.locationDetail && ` · ${team.locationDetail}`}
                  </span>
                </div>

                {/* 기간 */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{team.duration}</span>
                </div>

                {/* 통계 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>조회 {team.views}</span>
                  <span>지원 {team.applicantsCount}</span>
                  <span>북마크 {team.bookmarksCount}</span>
                </div>
              </div>

              {/* 카드 푸터 */}
              <div className="px-5 pb-5">
                <Link
                  href={`/teams/${team.id}`}
                  className="block w-full py-2 text-center bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  자세히 보기
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredTeams.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              다른 검색어나 필터를 시도해보세요
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              필터 초기화
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
