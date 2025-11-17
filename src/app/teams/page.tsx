'use client'

/**
 * Teams Browse/List Page
 *
 * Allows job seekers to browse and search for team opportunities.
 * Features:
 * - Team cards with basic information
 * - Search functionality
 * - Filters (work type, location, status)
 * - Pagination
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface Team {
  id: string
  name: string
  description: string
  project_description: string | null
  team_size: number
  current_members: number
  work_type: 'remote' | 'hybrid' | 'onsite'
  location: string | null
  project_duration: string | null
  status: 'open' | 'closed'
  created_at: string
  leader: {
    name: string
  }
}

interface TeamWithRoles extends Team {
  required_roles: Array<{
    role: string
    count: number
  }>
  required_skills: Array<{
    skill_name: string
    proficiency_level: string
    required: boolean
  }>
}

export default function TeamsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [teams, setTeams] = useState<TeamWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('open')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 12

  // Load teams
  useEffect(() => {
    loadTeams()
  }, [currentPage, workTypeFilter, statusFilter, searchQuery])

  const loadTeams = async () => {
    try {
      setLoading(true)
      setError('')

      // Build query
      let query = supabase
        .from('teams')
        .select(
          `
          *,
          leader:users!leader_id(name),
          required_roles:team_required_roles(role, count),
          required_skills:team_required_skills(skill_name, proficiency_level, required)
        `,
          { count: 'exact' }
        )

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (workTypeFilter !== 'all') {
        query = query.eq('work_type', workTypeFilter)
      }

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,project_description.ilike.%${searchQuery}%`
        )
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error: fetchError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      setTeams((data as any) || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      console.error('Error loading teams:', err)
      setError('팀 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleFilterChange = (filterType: 'workType' | 'status', value: string) => {
    if (filterType === 'workType') {
      setWorkTypeFilter(value)
    } else {
      setStatusFilter(value)
    }
    setCurrentPage(1) // Reset to first page on filter change
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">팀 탐색</h1>
          <p className="mt-2 text-sm text-gray-600">
            다양한 팀 기회를 찾아보고 지원하세요.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="팀 이름, 설명으로 검색..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Work Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">근무 형태</label>
              <select
                value={workTypeFilter}
                onChange={(e) => handleFilterChange('workType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="remote">원격</option>
                <option value="hybrid">하이브리드</option>
                <option value="onsite">현장</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모집 상태</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="open">모집 중</option>
                <option value="closed">모집 마감</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{totalCount}</span>개의 팀
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : teams.length === 0 ? (
          /* Empty State */
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">팀이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              검색 조건을 변경하거나 필터를 조정해보세요.
            </p>
          </div>
        ) : (
          /* Team Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => router.push(`/teams/${team.id}`)}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* Team Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {team.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          team.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {team.status === 'open' ? '모집 중' : '모집 마감'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{team.description}</p>
                  </div>

                  {/* Team Leader */}
                  <div className="mb-3 flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{team.leader.name}</span>
                  </div>

                  {/* Required Roles */}
                  {team.required_roles && team.required_roles.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">필요한 역할:</p>
                      <div className="flex flex-wrap gap-1">
                        {team.required_roles.slice(0, 3).map((role, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded"
                          >
                            {role.role} ({role.count})
                          </span>
                        ))}
                        {team.required_roles.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{team.required_roles.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Team Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {team.work_type === 'remote'
                          ? '원격'
                          : team.work_type === 'hybrid'
                          ? '하이브리드'
                          : '현장'}
                      </span>
                    </div>

                    {team.location && (
                      <div className="flex items-center text-gray-600">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{team.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>
                        {team.current_members}/{team.team_size}명
                      </span>
                    </div>

                    {team.project_duration && (
                      <div className="flex items-center text-gray-600">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{team.project_duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
