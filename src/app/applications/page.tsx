'use client'

/**
 * My Applications Page (Job Seeker)
 *
 * Allows job seekers to view their application history.
 * Features:
 * - View all applications submitted
 * - Filter by status
 * - See application status (pending, approved, rejected)
 * - Navigate to team details
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
  updated_at: string
  team: {
    id: string
    name: string
    description: string
    status: string
    work_type: string
    location: string | null
    leader: {
      name: string
    }
  }
}

export default function MyApplicationsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Load applications
  useEffect(() => {
    if (user?.role === 'seeker') {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      const { data, error: appsError } = await supabase
        .from('applications')
        .select(
          `
          *,
          team:teams!team_id(
            id,
            name,
            description,
            status,
            work_type,
            location,
            leader:users!leader_id(name)
          )
        `
        )
        .eq('applicant_id', user.id)
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

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('정말로 이 지원을 철회하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase.from('applications').delete().eq('id', applicationId)

      if (error) throw error

      alert('지원이 철회되었습니다.')
      await loadApplications()
    } catch (err: any) {
      console.error('Error withdrawing application:', err)
      alert(err.message || '지원 철회 중 오류가 발생했습니다.')
    }
  }

  // Check if user is authorized
  if (user?.role !== 'seeker') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">접근 권한 없음</h2>
            <p className="text-yellow-700">
              지원서를 확인하려면 구직자(Seeker) 계정이 필요합니다.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
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
          <h1 className="text-3xl font-bold text-gray-900">내 지원서</h1>
          <p className="mt-2 text-sm text-gray-600">
            지원한 팀 목록과 지원 상태를 확인하세요.
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

        {/* Filter */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">상태별 필터</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">전체</option>
              <option value="pending">대기 중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">거부됨</option>
            </select>
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
            <p className="mt-1 text-sm text-gray-500 mb-4">
              {selectedStatus === 'all'
                ? '아직 어떤 팀에도 지원하지 않았습니다.'
                : '해당 상태의 지원서가 없습니다.'}
            </p>
            <button
              onClick={() => router.push('/teams')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              팀 둘러보기
            </button>
          </div>
        ) : (
          /* Applications List */
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3
                        onClick={() => router.push(`/teams/${application.team_id}`)}
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {application.team.name}
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
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {application.team.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        {application.team.leader.name}
                      </span>
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
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
                        {application.team.work_type === 'remote'
                          ? '원격'
                          : application.team.work_type === 'hybrid'
                          ? '하이브리드'
                          : '현장'}
                      </span>
                      {application.team.location && (
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
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
                          </svg>
                          {application.team.location}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        지원일: {new Date(application.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      {application.status !== 'pending' && (
                        <span>
                          처리일: {new Date(application.updated_at).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => router.push(`/teams/${application.team_id}`)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium whitespace-nowrap"
                    >
                      팀 보기
                    </button>
                    {application.status === 'pending' && (
                      <button
                        onClick={() => handleWithdraw(application.id)}
                        className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 text-sm font-medium whitespace-nowrap"
                      >
                        지원 철회
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Message */}
                {application.status === 'approved' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      축하합니다! 지원이 승인되었습니다. 팀 리더가 곧 연락드릴 예정입니다.
                    </p>
                  </div>
                )}
                {application.status === 'rejected' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      아쉽게도 이번 지원은 승인되지 않았습니다. 다른 팀에도 도전해보세요!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
