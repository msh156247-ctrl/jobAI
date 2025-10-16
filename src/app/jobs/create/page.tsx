'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { INDUSTRIES, REGIONS, SUB_INDUSTRIES } from '@/lib/constants'
import { Briefcase, FileText, Users, Calendar, X } from 'lucide-react'

export default function CreateJobPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { companyMeta } = useProfile()

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    companyId: '',
    industry: '',
    subIndustry: '',
    description: '',
    responsibilities: [''],
    qualifications: [''],
    preferredQualifications: [''],
    skills: [''],
    location: '',
    workType: 'onsite' as 'onsite' | 'dispatch' | 'remote',
    salaryMin: '',
    salaryMax: '',
    experience: '신입' as '신입' | '경력' | '경력무관',
    experienceYears: '',
    education: '학력무관' as '학력무관' | '고졸' | '대졸' | '석사' | '박사',
    benefits: [''],
    deadline: '',
    startDate: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'employer') {
      alert('기업 회원만 채용공고를 등록할 수 있습니다.')
      router.push('/dashboard')
      return
    }

    if (companyMeta) {
      setFormData(prev => ({
        ...prev,
        company: companyMeta.companyName,
        companyId: user.id
      }))
    }
  }, [user, companyMeta, router])

  const addField = (field: keyof typeof formData) => {
    if (Array.isArray(formData[field])) {
      setFormData({
        ...formData,
        [field]: [...formData[field] as string[], '']
      })
    }
  }

  const updateField = (field: keyof typeof formData, index: number, value: string) => {
    if (Array.isArray(formData[field])) {
      const updated = [...formData[field] as string[]]
      updated[index] = value
      setFormData({
        ...formData,
        [field]: updated
      })
    }
  }

  const removeField = (field: keyof typeof formData, index: number) => {
    if (Array.isArray(formData[field])) {
      setFormData({
        ...formData,
        [field]: (formData[field] as string[]).filter((_, i) => i !== index)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.title || !formData.description || !formData.industry) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }

    if (!formData.salaryMin || !formData.salaryMax) {
      setError('연봉 범위를 입력해주세요.')
      return
    }

    if (parseInt(formData.salaryMin) > parseInt(formData.salaryMax)) {
      setError('최소 연봉이 최대 연봉보다 클 수 없습니다.')
      return
    }

    setLoading(true)

    try {
      // mockData에 저장 (실제로는 API 호출)
      const newJob = {
        id: `job-${Date.now()}`,
        ...formData,
        salary: {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax)
        },
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ''),
        qualifications: formData.qualifications.filter(q => q.trim() !== ''),
        preferredQualifications: formData.preferredQualifications.filter(p => p.trim() !== ''),
        skills: formData.skills.filter(s => s.trim() !== ''),
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        postedAt: new Date().toISOString(),
        views: 0,
        applicants: 0
      }

      // LocalStorage에 저장
      const existingJobs = JSON.parse(localStorage.getItem('customJobs') || '[]')
      localStorage.setItem('customJobs', JSON.stringify([...existingJobs, newJob]))

      alert('채용공고가 등록되었습니다!')
      router.push('/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : '채용공고 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'employer') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">채용공고 등록</h1>
          <p className="text-gray-600">우수한 인재를 찾기 위한 채용공고를 작성해주세요.</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FileText size={20} className="mr-2" />
                기본 정보
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채용 포지션 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 프론트엔드 개발자 (React)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      업종 *
                    </label>
                    <select
                      required
                      value={formData.industry}
                      onChange={(e) => {
                        setFormData({ ...formData, industry: e.target.value, subIndustry: '' })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.industry && SUB_INDUSTRIES[formData.industry] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        세부 업종
                      </label>
                      <select
                        value={formData.subIndustry}
                        onChange={(e) => setFormData({ ...formData, subIndustry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택하세요</option>
                        {SUB_INDUSTRIES[formData.industry].map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 근무 조건 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Briefcase size={20} className="mr-2" />
                근무 조건
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      근무 지역 *
                    </label>
                    <select
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      {REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      근무 형태 *
                    </label>
                    <select
                      required
                      value={formData.workType}
                      onChange={(e) => setFormData({ ...formData, workType: e.target.value as 'onsite' | 'dispatch' | 'remote' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="onsite">사무실 근무</option>
                      <option value="dispatch">파견 근무</option>
                      <option value="remote">원격 근무</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최소 연봉 (만원) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최대 연봉 (만원) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 지원 자격 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Users size={20} className="mr-2" />
                지원 자격
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      경력 조건
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value as '신입' | '경력' | '경력무관' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="신입">신입</option>
                      <option value="경력">경력</option>
                      <option value="경력무관">경력무관</option>
                    </select>
                  </div>

                  {formData.experience === '경력' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        최소 경력 (년)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="3"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      학력 조건
                    </label>
                    <select
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value as '학력무관' | '고졸' | '대졸' | '석사' | '박사' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="학력무관">학력무관</option>
                      <option value="고졸">고졸 이상</option>
                      <option value="대졸">대졸 이상</option>
                      <option value="석사">석사 이상</option>
                      <option value="박사">박사</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 설명 *
              </label>
              <textarea
                required
                rows={10}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="회사 소개, 업무 내용, 근무 환경 등을 상세히 작성해주세요."
              />
            </div>

            {/* 주요 업무 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  주요 업무
                </label>
                <button
                  type="button"
                  onClick={() => addField('responsibilities')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={resp}
                      onChange={(e) => updateField('responsibilities', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: React를 활용한 웹 애플리케이션 개발"
                    />
                    {formData.responsibilities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('responsibilities', index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 필수 자격요건 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  필수 자격요건
                </label>
                <button
                  type="button"
                  onClick={() => addField('qualifications')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.qualifications.map((qual, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={qual}
                      onChange={(e) => updateField('qualifications', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: React 3년 이상 실무 경험"
                    />
                    {formData.qualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('qualifications', index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 우대사항 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  우대사항
                </label>
                <button
                  type="button"
                  onClick={() => addField('preferredQualifications')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.preferredQualifications.map((pref, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={pref}
                      onChange={(e) => updateField('preferredQualifications', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: TypeScript 사용 경험"
                    />
                    {formData.preferredQualifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('preferredQualifications', index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 기술 스택 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  기술 스택
                </label>
                <button
                  type="button"
                  onClick={() => addField('skills')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => updateField('skills', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: React, TypeScript, Next.js"
                    />
                    {formData.skills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('skills', index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 복리후생 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  복리후생
                </label>
                <button
                  type="button"
                  onClick={() => addField('benefits')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => updateField('benefits', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 4대 보험, 연차 15일, 점심 식대 지원"
                    />
                    {formData.benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField('benefits', index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 일정 */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar size={20} className="mr-2" />
                일정
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지원 마감일
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입사 예정일
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex space-x-4 pt-6 border-t">
              <Link
                href="/dashboard"
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 text-center"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '등록 중...' : '채용공고 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}