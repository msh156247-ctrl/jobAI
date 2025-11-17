'use client'

/**
 * Profile Settings Page
 *
 * Allows users to manage their profile information including:
 * - Personal details (name, email, location)
 * - Career information (title, experience, bio)
 * - Skills and proficiency levels
 * - Work preferences
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface ProfileFormData {
  name: string
  email: string
  location: string
  job_title: string
  experience_years: number
  bio: string
  github_url: string
  linkedin_url: string
  portfolio_url: string
}

interface Skill {
  id?: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

interface Preference {
  work_types: string[]
  preferred_locations: string[]
  min_team_size: number
  max_team_size: number
}

export default function ProfilePage() {
  const { user, profile, refreshUser } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    location: '',
    job_title: '',
    experience_years: 0,
    bio: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  })

  const [skills, setSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' as const })

  const [preferences, setPreferences] = useState<Preference>({
    work_types: [],
    preferred_locations: [],
    min_team_size: 1,
    max_team_size: 10,
  })

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        // Load skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', user.id)

        if (skillsError) throw skillsError

        // Load preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (prefsError && prefsError.code !== 'PGRST116') {
          throw prefsError
        }

        // Populate form data
        setFormData({
          name: user.name || '',
          email: user.email || '',
          location: profileData?.location || '',
          job_title: profileData?.job_title || '',
          experience_years: profileData?.experience_years || 0,
          bio: profileData?.bio || '',
          github_url: profileData?.github_url || '',
          linkedin_url: profileData?.linkedin_url || '',
          portfolio_url: profileData?.portfolio_url || '',
        })

        setSkills(skillsData || [])

        if (prefsData) {
          setPreferences({
            work_types: prefsData.work_types || [],
            preferred_locations: prefsData.preferred_locations || [],
            min_team_size: prefsData.min_team_size || 1,
            max_team_size: prefsData.max_team_size || 10,
          })
        }
      } catch (err: any) {
        console.error('Error loading profile:', err)
        setMessage({ type: 'error', text: '프로필 로딩 중 오류가 발생했습니다.' })
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [user])

  // Handle form input change
  const handleInputChange = (field: keyof ProfileFormData, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  // Handle skill addition
  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return

    setSkills([...skills, { ...newSkill }])
    setNewSkill({ name: '', level: 'intermediate' })
  }

  // Handle skill removal
  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  // Handle preference change
  const handlePreferenceChange = (field: keyof Preference, value: any) => {
    setPreferences({ ...preferences, [field]: value })
  }

  // Toggle work type
  const toggleWorkType = (type: string) => {
    const current = preferences.work_types
    if (current.includes(type)) {
      setPreferences({
        ...preferences,
        work_types: current.filter((t) => t !== type),
      })
    } else {
      setPreferences({
        ...preferences,
        work_types: [...current, type],
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      // Update user basic info
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Upsert user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          location: formData.location,
          job_title: formData.job_title,
          experience_years: formData.experience_years,
          bio: formData.bio,
          github_url: formData.github_url,
          linkedin_url: formData.linkedin_url,
          portfolio_url: formData.portfolio_url,
          updated_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      // Delete existing skills
      const { error: deleteSkillsError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user.id)

      if (deleteSkillsError) throw deleteSkillsError

      // Insert new skills
      if (skills.length > 0) {
        const { error: skillsError } = await supabase
          .from('user_skills')
          .insert(
            skills.map((skill) => ({
              user_id: user.id,
              skill_name: skill.name,
              proficiency_level: skill.level,
            }))
          )

        if (skillsError) throw skillsError
      }

      // Upsert preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          work_types: preferences.work_types,
          preferred_locations: preferences.preferred_locations,
          min_team_size: preferences.min_team_size,
          max_team_size: preferences.max_team_size,
          updated_at: new Date().toISOString(),
        })

      if (prefsError) throw prefsError

      // Refresh user context
      await refreshUser()

      setMessage({ type: 'success', text: '프로필이 성공적으로 저장되었습니다!' })

      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setMessage({ type: 'error', text: err.message || '프로필 저장 중 오류가 발생했습니다.' })
    } finally {
      setSaving(false)
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">프로필 설정</h1>
          <p className="mt-2 text-sm text-gray-600">
            프로필 정보를 입력하여 더 나은 팀 매칭을 받아보세요.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  위치
                </label>
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
                  직무
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                  placeholder="예: Frontend Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  경력 (년)
                </label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자기소개
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                placeholder="본인의 강점과 관심사를 소개해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Links Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">링크</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => handleInputChange('github_url', e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">스킬</h2>

            {/* Skill List */}
            <div className="mb-4 space-y-2">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        skill.level === 'expert'
                          ? 'bg-purple-100 text-purple-800'
                          : skill.level === 'advanced'
                          ? 'bg-blue-100 text-blue-800'
                          : skill.level === 'intermediate'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {skill.level}
                    </span>
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
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="스킬 이름 (예: React, Python)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newSkill.level}
                onChange={(e) =>
                  setNewSkill({
                    ...newSkill,
                    level: e.target.value as Skill['level'],
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                추가
              </button>
            </div>
          </div>

          {/* Preferences Section (Only for Seekers) */}
          {user?.role === 'seeker' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">선호 사항</h2>

              <div className="space-y-6">
                {/* Work Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선호 근무 형태
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['remote', 'hybrid', 'onsite'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleWorkType(type)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          preferences.work_types.includes(type)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {type === 'remote' ? '원격' : type === 'hybrid' ? '하이브리드' : '현장'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최소 팀 크기
                    </label>
                    <input
                      type="number"
                      value={preferences.min_team_size}
                      onChange={(e) =>
                        handlePreferenceChange('min_team_size', parseInt(e.target.value) || 1)
                      }
                      min="1"
                      max={preferences.max_team_size}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최대 팀 크기
                    </label>
                    <input
                      type="number"
                      value={preferences.max_team_size}
                      onChange={(e) =>
                        handlePreferenceChange('max_team_size', parseInt(e.target.value) || 10)
                      }
                      min={preferences.min_team_size}
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
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
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
