'use client'

/**
 * Team Creation Page
 *
 * Allows employers/team leaders to create new team opportunities.
 * Includes:
 * - Team basic information
 * - Required roles and positions
 * - Required skills
 * - Team preferences and requirements
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface TeamFormData {
  name: string
  description: string
  project_description: string
  team_size: number
  current_members: number
  work_type: 'remote' | 'hybrid' | 'onsite'
  location: string
  project_duration: string
  status: 'open' | 'closed'
}

interface RequiredRole {
  role: string
  count: number
}

interface RequiredSkill {
  skill_name: string
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  required: boolean
}

export default function CreateTeamPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    project_description: '',
    team_size: 5,
    current_members: 1,
    work_type: 'remote',
    location: '',
    project_duration: '3-6개월',
    status: 'open',
  })

  const [requiredRoles, setRequiredRoles] = useState<RequiredRole[]>([])
  const [newRole, setNewRole] = useState({ role: '', count: 1 })

  const [requiredSkills, setRequiredSkills] = useState<RequiredSkill[]>([])
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    proficiency_level: 'intermediate' as const,
    required: true,
  })

  // Check if user is authorized
  if (user?.role !== 'employer') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">접근 권한 없음</h2>
            <p className="text-yellow-700">
              팀을 생성하려면 고용주(Employer) 계정이 필요합니다.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Handle input change
  const handleInputChange = (field: keyof TeamFormData, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  // Add required role
  const handleAddRole = () => {
    if (!newRole.role.trim()) return

    setRequiredRoles([...requiredRoles, { ...newRole }])
    setNewRole({ role: '', count: 1 })
  }

  // Remove required role
  const handleRemoveRole = (index: number) => {
    setRequiredRoles(requiredRoles.filter((_, i) => i !== index))
  }

  // Add required skill
  const handleAddSkill = () => {
    if (!newSkill.skill_name.trim()) return

    setRequiredSkills([...requiredSkills, { ...newSkill }])
    setNewSkill({
      skill_name: '',
      proficiency_level: 'intermediate',
      required: true,
    })
  }

  // Remove required skill
  const handleRemoveSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    if (!formData.name.trim()) {
      setError('팀 이름을 입력해주세요.')
      return
    }

    if (!formData.description.trim()) {
      setError('팀 설명을 입력해주세요.')
      return
    }

    if (formData.team_size < formData.current_members) {
      setError('목표 팀 크기는 현재 멤버 수보다 크거나 같아야 합니다.')
      return
    }

    if (requiredRoles.length === 0) {
      setError('최소 1개 이상의 필요한 역할을 추가해주세요.')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          leader_id: user.id,
          name: formData.name,
          description: formData.description,
          project_description: formData.project_description,
          team_size: formData.team_size,
          current_members: formData.current_members,
          work_type: formData.work_type,
          location: formData.location,
          project_duration: formData.project_duration,
          status: formData.status,
        })
        .select()
        .single()

      if (teamError) throw teamError

      const teamId = teamData.id

      // Insert required roles
      if (requiredRoles.length > 0) {
        const { error: rolesError } = await supabase.from('team_required_roles').insert(
          requiredRoles.map((role) => ({
            team_id: teamId,
            role: role.role,
            count: role.count,
          }))
        )

        if (rolesError) throw rolesError
      }

      // Insert required skills
      if (requiredSkills.length > 0) {
        const { error: skillsError } = await supabase.from('team_required_skills').insert(
          requiredSkills.map((skill) => ({
            team_id: teamId,
            skill_name: skill.skill_name,
            proficiency_level: skill.proficiency_level,
            required: skill.required,
          }))
        )

        if (skillsError) throw skillsError
      }

      setSuccess(true)

      // Redirect to team detail page after 2 seconds
      setTimeout(() => {
        router.push(`/teams/${teamId}`)
      }, 2000)
    } catch (err: any) {
      console.error('Error creating team:', err)
      setError(err.message || '팀 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">팀이 생성되었습니다!</h2>
            <p className="text-green-700">팀 상세 페이지로 이동합니다...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">새 팀 만들기</h1>
          <p className="mt-2 text-sm text-gray-600">
            팀 정보를 입력하고 필요한 역할과 스킬을 정의하세요.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀 이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="예: AI 스타트업 개발팀"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀 설명 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  placeholder="팀의 목표와 비전을 간단히 설명해주세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 설명
                </label>
                <textarea
                  value={formData.project_description}
                  onChange={(e) => handleInputChange('project_description', e.target.value)}
                  rows={4}
                  placeholder="진행할 프로젝트에 대해 자세히 설명해주세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Team Size & Work Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">팀 구성 및 근무 조건</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목표 팀 크기 *
                </label>
                <input
                  type="number"
                  value={formData.team_size}
                  onChange={(e) => handleInputChange('team_size', parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 멤버 수
                </label>
                <input
                  type="number"
                  value={formData.current_members}
                  onChange={(e) =>
                    handleInputChange('current_members', parseInt(e.target.value) || 0)
                  }
                  min="0"
                  max={formData.team_size}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  근무 형태 *
                </label>
                <select
                  value={formData.work_type}
                  onChange={(e) =>
                    handleInputChange('work_type', e.target.value as TeamFormData['work_type'])
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="remote">원격 (Remote)</option>
                  <option value="hybrid">하이브리드 (Hybrid)</option>
                  <option value="onsite">현장 (Onsite)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">위치</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="예: 서울, 대한민국"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로젝트 기간
                </label>
                <select
                  value={formData.project_duration}
                  onChange={(e) => handleInputChange('project_duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1-3개월">1-3개월</option>
                  <option value="3-6개월">3-6개월</option>
                  <option value="6-12개월">6-12개월</option>
                  <option value="12개월 이상">12개월 이상</option>
                  <option value="장기 (기한 없음)">장기 (기한 없음)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모집 상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange('status', e.target.value as TeamFormData['status'])
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="open">모집 중 (Open)</option>
                  <option value="closed">모집 마감 (Closed)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Required Roles */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">필요한 역할 *</h2>

            {/* Role List */}
            <div className="mb-4 space-y-2">
              {requiredRoles.map((role, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900">{role.role}</span>
                    <span className="ml-2 text-sm text-gray-600">({role.count}명)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* Add Role Form */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newRole.role}
                onChange={(e) => setNewRole({ ...newRole, role: e.target.value })}
                placeholder="역할 (예: Frontend Developer, Designer)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                value={newRole.count}
                onChange={(e) => setNewRole({ ...newRole, count: parseInt(e.target.value) || 1 })}
                min="1"
                max="10"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                추가
              </button>
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">필요한 스킬</h2>

            {/* Skill List */}
            <div className="mb-4 space-y-2">
              {requiredSkills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
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
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {/* Add Skill Form */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill.skill_name}
                onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                placeholder="스킬 이름 (예: React, Python)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newSkill.proficiency_level}
                onChange={(e) =>
                  setNewSkill({
                    ...newSkill,
                    proficiency_level: e.target.value as RequiredSkill['proficiency_level'],
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg">
                <input
                  type="checkbox"
                  checked={newSkill.required}
                  onChange={(e) => setNewSkill({ ...newSkill, required: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">필수</span>
              </label>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                추가
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '팀 생성'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
