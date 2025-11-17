'use client'

/**
 * Waitlist Page (Job Seeker)
 *
 * Shows teams where the user is on the waiting list.
 * Features:
 * - View active waitlist entries
 * - See position in queue
 * - Remove from waitlist
 * - Navigate to team details
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface WaitlistEntry {
  id: string
  team_id: string
  applicant_id: string
  position: number
  status: 'active' | 'notified' | 'expired'
  created_at: string
  team: {
    id: string
    name: string
    description: string
    team_size: number
    current_members: number
    work_type: string
    location: string | null
    status: string
    leader: {
      name: string
    }
  }
}

export default function WaitlistPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load waitlist entries
  useEffect(() => {
    if (user?.role === 'seeker') {
      loadWaitlist()
    }
  }, [user])

  const loadWaitlist = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      const { data, error: waitlistError } = await supabase
        .from('waitlist')
        .select(
          `
          *,
          team:teams!team_id(
            id,
            name,
            description,
            team_size,
            current_members,
            work_type,
            location,
            status,
            leader:users!leader_id(name)
          )
        `
        )
        .eq('applicant_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (waitlistError) throw waitlistError

      setWaitlistEntries((data as any) || [])
    } catch (err: any) {
      console.error('Error loading waitlist:', err)
      setError('대기열을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWaitlist = async (entryId: string) => {
    if (!confirm('정말로 대기열에서 제거하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status: 'expired' })
        .eq('id', entryId)

      if (error) throw error

      alert('대기열에서 제거되었습니다.')
      await loadWaitlist()
    } catch (err: any) {
      console.error('Error removing from waitlist:', err)
      alert(err.message || '대기열 제거 중 오류가 발생했습니다.')
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
              대기열을 확인하려면 구직자(Seeker) 계정이 필요합니다.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대기열</h1>
          <p className="mt-2 text-sm text-gray-600">
            팀 정원이 다 찬 경우 대기열에 등록되어 자리가 나면 알림을 받습니다.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-blue-600 mr-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">대기열 시스템 안내</h3>
              <p className="text-sm text-blue-800">
                팀 정원이 모두 찼을 때 대기열에 등록하면, 팀원이 탈퇴하거나 자리가 생길 때
                대기 순서대로 자동으로 통지됩니다. 대기열 순서는 등록 시간 순입니다.
              </p>
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
        ) : waitlistEntries.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">대기 중인 팀이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              현재 대기열에 등록된 팀이 없습니다.
            </p>
            <button
              onClick={() => router.push('/teams')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              팀 둘러보기
            </button>
          </div>
        ) : (
          /* Waitlist Entries */
          <div className="space-y-4">
            {waitlistEntries.map((entry) => (
              <div key={entry.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3
                        onClick={() => router.push(`/teams/${entry.team_id}`)}
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {entry.team.name}
                      </h3>
                      <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        대기 순서: {entry.position}번
                      </span>
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          entry.team.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entry.team.status === 'open' ? '모집 중' : '모집 마감'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {entry.team.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
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
                        {entry.team.leader.name}
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        {entry.team.current_members}/{entry.team.team_size}명
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
                        {entry.team.work_type === 'remote'
                          ? '원격'
                          : entry.team.work_type === 'hybrid'
                          ? '하이브리드'
                          : '현장'}
                      </span>
                      {entry.team.location && (
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
                          {entry.team.location}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      대기열 등록일: {new Date(entry.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => router.push(`/teams/${entry.team_id}`)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium whitespace-nowrap"
                    >
                      팀 보기
                    </button>
                    <button
                      onClick={() => handleRemoveFromWaitlist(entry.id)}
                      className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 text-sm font-medium whitespace-nowrap"
                    >
                      대기 취소
                    </button>
                  </div>
                </div>

                {/* Team Full Progress */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">팀 정원</p>
                    <p className="text-sm text-gray-600">
                      {entry.team.current_members}/{entry.team.team_size}명
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        entry.team.current_members >= entry.team.team_size
                          ? 'bg-red-600'
                          : 'bg-green-600'
                      }`}
                      style={{
                        width: `${(entry.team.current_members / entry.team.team_size) * 100}%`,
                      }}
                    />
                  </div>
                  {entry.team.current_members >= entry.team.team_size && (
                    <p className="text-xs text-red-600 mt-2">
                      현재 팀이 가득 찼습니다. 자리가 나면 대기 순서대로 알림을 받습니다.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
