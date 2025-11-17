'use client'

/**
 * Applications Management Page (Team Leader)
 *
 * Allows team leaders to view and manage applications to their teams.
 * Features:
 * - View all applications to teams you lead
 * - Filter by team and status
 * - Approve/reject applications
 * - View applicant profiles
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface Application {
  id: string
  team_id: string
  applicant_id: string
  status: 'pending' | 'approved' | 'rejected'
  cover_letter: string | null
  created_at: string
  applicant: {
    id: string
    name: string
    email: string
  }
  team: {
    id: string
    name: string
    status: string
  }
}

interface Team {
  id: string
  name: string
  status: string
}

export default function ManageApplicationsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Load teams and applications
  useEffect(() => {
    if (user?.role === 'employer') {
      loadTeams()
      loadApplications()
    }
  }, [user])

  const loadTeams = async () => {
    if (!user) return

    try {
      const { data, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, status')
        .eq('leader_id', user.id)
        .order('created_at', { ascending: false })

      if (teamsError) throw teamsError

      setTeams(data || [])
    } catch (err: any) {
      console.error('Error loading teams:', err)
      setError('팀 목록을 불러오는 중 오류가 발생했습니다.')
    }
  }

  const loadApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Get all teams led by user
      const { data: userTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('leader_id', user.id)

      if (teamsError) throw teamsError

      const teamIds = userTeams?.map((t) => t.id) || []

      if (teamIds.length === 0) {
        setApplications([])
        setLoading(false)
        return
      }

      // Get applications for these teams
      const { data, error: appsError } = await supabase
        .from('applications')
        .select(
          `
          *,
          applicant:users!applicant_id(id, name, email),
          team:teams!team_id(id, name, status)
        `
        )
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })

      if (appsError) throw appsError

      setApplications((data as any) || [])
    } catch (err: any) {
      console.error('Error loading applications:', err)
      setError('지원서를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId)

      if (error) throw error

      // Reload applications
      await loadApplications()

      alert(
        newStatus === 'approved'
          ? '지원서가 승인되었습니다.'
          : '지원서가 거부되었습니다.'
      )
    } catch (err: any) {
      console.error('Error updating application:', err)
      alert(err.message || '지원서 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // Check if user is authorized
  if (user?.role !== 'employer') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">접근 권한 없음</h2>
            <p className="text-yellow-700">
              지원서를 관리하려면 고용주(Employer) 계정이 필요합니다.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    if (selectedTeam !== 'all' && app.team_id !== selectedTeam) return false
    if (selectedStatus !== 'all' && app.status !== selectedStatus) return false
    return true
  })

  // Group by status
  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const approvedCount = applications.filter((a) => a.status === 'approved').length
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">지원서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            팀에 지원한 후보자들을 검토하고 관리하세요.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">대기 중</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600"
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
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">거부됨</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">팀 선택</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체 팀</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기 중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거부됨</option>
              </select>
            </div>
          </div>
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
        ) : filteredApplications.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">지원서가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              아직 팀에 지원한 후보자가 없습니다.
            </p>
          </div>
        ) : (
          /* Applications List */
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.applicant.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          application.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : application.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {application.status === 'pending'
                          ? '대기 중'
                          : application.status === 'approved'
                          ? '승인됨'
                          : '거부됨'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{application.applicant.email}</p>
                    <p className="text-sm text-gray-600">
                      팀: <span className="font-medium">{application.team.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      지원일: {new Date(application.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  {/* Actions */}
                  {application.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(application.id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleStatusChange(application.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        거부
                      </button>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {application.cover_letter && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">자기소개서</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {application.cover_letter}
                    </p>
                  </div>
                )}

                {/* View Profile Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/users/${application.applicant_id}`)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    프로필 보기 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
