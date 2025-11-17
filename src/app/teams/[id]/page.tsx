'use client'

/**
 * Team Detail Page
 *
 * Shows detailed information about a specific team.
 * Features:
 * - Team information display
 * - Required roles and skills
 * - Apply functionality (for seekers)
 * - Edit/Delete functionality (for team leader)
 * - View applications (for team leader)
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface TeamDetail {
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
  leader_id: string
  leader: {
    id: string
    name: string
    email: string
  }
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

export default function TeamDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const teamId = params?.id as string

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  // Load team details
  useEffect(() => {
    if (teamId) {
      loadTeamDetails()
      if (user?.role === 'seeker') {
        checkApplicationStatus()
      }
    }
  }, [teamId, user])

  const loadTeamDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('teams')
        .select(
          `
          *,
          leader:users!leader_id(id, name, email),
          required_roles:team_required_roles(role, count),
          required_skills:team_required_skills(skill_name, proficiency_level, required)
        `
        )
        .eq('id', teamId)
        .single()

      if (fetchError) throw fetchError

      setTeam(data as any)
    } catch (err: any) {
      console.error('Error loading team:', err)
      setError('팀 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const checkApplicationStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('team_id', teamId)
        .eq('applicant_id', user.id)
        .maybeSingle()

      if (error) throw error

      setHasApplied(!!data)
    } catch (err: any) {
      console.error('Error checking application status:', err)
    }
  }

  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (user.role !== 'seeker') {
      alert('구직자만 지원할 수 있습니다.')
      return
    }

    try {
      setApplying(true)

      // Create application
      const { error: applicationError } = await supabase.from('applications').insert({
        team_id: teamId,
        applicant_id: user.id,
        status: 'pending',
        cover_letter: '', // Can be extended to include a cover letter form
      })

      if (applicationError) throw applicationError

      setHasApplied(true)
      alert('지원이 완료되었습니다!')
    } catch (err: any) {
      console.error('Error applying:', err)
      alert(err.message || '지원 중 오류가 발생했습니다.')
    } finally {
      setApplying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 팀을 삭제하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId)

      if (error) throw error

      alert('팀이 삭제되었습니다.')
      router.push('/teams')
    } catch (err: any) {
      console.error('Error deleting team:', err)
      alert(err.message || '팀 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !team) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || '팀을 찾을 수 없습니다.'}</p>
            <button
              onClick={() => router.push('/teams')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              팀 목록으로 돌아가기
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const isTeamLeader = user?.id === team.leader_id

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/teams')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          팀 목록으로
        </button>

        {/* Team Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    team.status === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {team.status === 'open' ? '모집 중' : '모집 마감'}
                </span>
              </div>
              <p className="text-gray-600">
                팀 리더: <span className="font-medium">{team.leader.name}</span>
              </p>
            </div>

            {/* Action Buttons */}
            {isTeamLeader ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/teams/${teamId}/edit`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            ) : user?.role === 'seeker' ? (
              <button
                onClick={handleApply}
                disabled={applying || hasApplied || team.status === 'closed'}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasApplied ? '지원 완료' : applying ? '지원 중...' : '지원하기'}
              </button>
            ) : null}
          </div>

          <p className="text-lg text-gray-700">{team.description}</p>
        </div>

        {/* Project Description */}
        {team.project_description && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">프로젝트 설명</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{team.project_description}</p>
          </div>
        )}

        {/* Team Details */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">팀 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">근무 형태</p>
              <p className="text-gray-900 font-medium">
                {team.work_type === 'remote'
                  ? '원격'
                  : team.work_type === 'hybrid'
                  ? '하이브리드'
                  : '현장'}
              </p>
            </div>

            {team.location && (
              <div>
                <p className="text-sm text-gray-600 mb-1">위치</p>
                <p className="text-gray-900 font-medium">{team.location}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-1">팀 크기</p>
              <p className="text-gray-900 font-medium">
                {team.current_members}/{team.team_size}명
              </p>
            </div>

            {team.project_duration && (
              <div>
                <p className="text-sm text-gray-600 mb-1">프로젝트 기간</p>
                <p className="text-gray-900 font-medium">{team.project_duration}</p>
              </div>
            )}
          </div>
        </div>

        {/* Required Roles */}
        {team.required_roles && team.required_roles.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">필요한 역할</h2>
            <div className="space-y-3">
              {team.required_roles.map((role, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{role.role}</span>
                  <span className="text-sm text-gray-600">{role.count}명</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Skills */}
        {team.required_skills && team.required_skills.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">필요한 스킬</h2>
            <div className="space-y-2">
              {team.required_skills.map((skill, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{skill.skill_name}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      skill.proficiency_level === 'expert'
                        ? 'bg-purple-100 text-purple-800'
                        : skill.proficiency_level === 'advanced'
                        ? 'bg-blue-100 text-blue-800'
                        : skill.proficiency_level === 'intermediate'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {skill.proficiency_level}
                  </span>
                  {skill.required && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      필수
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information (for applicants) */}
        {hasApplied && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">지원 완료</h3>
            <p className="text-blue-800 mb-2">
              팀 리더가 귀하의 지원서를 검토 중입니다. 결과는 이메일로 전달될 예정입니다.
            </p>
            <p className="text-sm text-blue-700">
              문의사항이 있으시면 {team.leader.email}로 연락해주세요.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
