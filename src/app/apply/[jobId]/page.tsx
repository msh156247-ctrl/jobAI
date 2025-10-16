'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { mockJobs, createApplication, type Application } from '@/lib/mockData'
import { getJob, applyToJob } from '@/lib/jobsApi'
import { FileText, Briefcase, MapPin, DollarSign, Upload, Link2, X, CheckCircle } from 'lucide-react'
import RequireAuth from '@/components/RequireAuth'
import { useToast } from '@/components/Toast'

// USE_API 환경 변수 확인
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true'

export default function ApplyPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { showToast } = useToast()

  const jobId = params.jobId as string
  const [job, setJob] = useState<typeof mockJobs[0] | null>(null)
  const [loadingJob, setLoadingJob] = useState(true)

  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([''])
  const [expectedSalary, setExpectedSalary] = useState('')
  const [availableDate, setAvailableDate] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 채용공고 데이터 가져오기
  useEffect(() => {
    const fetchJob = async () => {
      if (!USE_API) {
        const data = mockJobs.find(j => j.id === jobId)
        setJob(data || null)
        setLoadingJob(false)
        return
      }

      try {
        setLoadingJob(true)
        const data = await getJob(jobId) as any

        if (data) {
          const transformedJob = {
            id: data.id,
            title: data.title,
            company: data.company_profiles?.company_name || '회사명 없음',
            companyId: data.company_id,
            location: data.location,
            salary: {
              min: data.salary_min || 0,
              max: data.salary_max || 0
            },
            workType: data.type || 'onsite',
            description: data.description || '',
            requirements: data.requirements || [],
            skills: data.skills_required || [],
            industry: data.industry || '기타',
            postedAt: data.created_at,
            deadline: data.deadline
          }
          setJob(transformedJob)
        } else {
          setJob(null)
        }
      } catch (error) {
        console.error('Failed to fetch job:', error)
        const data = mockJobs.find(j => j.id === jobId)
        setJob(data || null)
      } finally {
        setLoadingJob(false)
      }
    }

    fetchJob()
  }, [jobId])

  if (loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            공고를 찾을 수 없습니다
          </h2>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            채용공고로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', '파일 크기는 10MB를 초과할 수 없습니다.')
        return
      }
      setResumeFile(file)
      setError('')
    }
  }

  const addPortfolioLink = () => {
    if (portfolioLinks.length < 5) {
      setPortfolioLinks([...portfolioLinks, ''])
    }
  }

  const updatePortfolioLink = (index: number, value: string) => {
    const updated = [...portfolioLinks]
    updated[index] = value
    setPortfolioLinks(updated)
  }

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!coverLetter.trim()) {
        showToast('error', '지원 동기를 입력해주세요.')
        setLoading(false)
        return
      }

      // 포트폴리오 링크 유효성 검사
      const validLinks = portfolioLinks.filter(link => link.trim() !== '')
      for (const link of validLinks) {
        try {
          new URL(link)
        } catch {
          showToast('error', '올바른 URL 형식의 포트폴리오 링크를 입력해주세요.')
          setLoading(false)
          return
        }
      }

      if (!user) {
        showToast('error', '로그인이 필요합니다.')
        setLoading(false)
        return
      }

      if (!USE_API) {
        // Mock API 사용
        const application: Omit<Application, 'id' | 'appliedAt'> = {
          jobId: job.id,
          userId: user.id,
          status: 'pending',
          coverLetter,
        }

        createApplication(application)
      } else {
        // 실제 API 사용 (userId, jobId, coverLetter)
        await applyToJob(user.id, job.id, coverLetter)
      }

      showToast('success', '지원서가 성공적으로 제출되었습니다!')
      setSuccess(true)

      // 2초 후 지원 현황 페이지로 이동
      setTimeout(() => {
        router.push('/my-applications')
      }, 2000)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '지원서 제출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">지원 완료!</h2>
          <p className="text-gray-600 mb-6">
            {job.company}의 {job.title} 포지션에 지원되었습니다.
          </p>
          <p className="text-sm text-gray-500">
            잠시 후 지원 현황 페이지로 이동합니다...
          </p>
        </div>
      </div>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 공고 요약 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-lg text-gray-700 font-medium mb-4">{job.company}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <MapPin size={16} className="mr-1" />
              {job.location}
            </span>
            <span className="flex items-center">
              <DollarSign size={16} className="mr-1" />
              {job.salary.min.toLocaleString()}~{job.salary.max.toLocaleString()}만원
            </span>
            <span className="flex items-center">
              <Briefcase size={16} className="mr-1" />
              {job.workType === 'remote' && '원격근무'}
              {job.workType === 'dispatch' && '파견근무'}
              {job.workType === 'onsite' && '사무실근무'}
            </span>
          </div>
        </div>

        {/* 지원서 작성 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">지원서 작성</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 지원자 정보 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">지원자 정보</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">이름</span>
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">이메일</span>
                  <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">휴대폰</span>
                    <span className="text-sm font-medium text-gray-900">{user.phone}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">거주지</span>
                    <span className="text-sm font-medium text-gray-900">{profile.location}</span>
                  </div>
                )}
              </div>
              <Link
                href="/profile"
                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
              >
                프로필 수정하기
              </Link>
            </div>

            {/* 이력서 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                이력서 첨부 (PDF, DOC, DOCX - 최대 10MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {!resumeFile ? (
                  <div className="text-center">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-sm text-blue-600 hover:underline">
                        파일 선택
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      또는 파일을 드래그하여 업로드
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle size={20} className="text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">{resumeFile.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 포트폴리오 링크 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Link2 size={16} className="inline mr-1" />
                  포트폴리오 링크 (최대 5개)
                </label>
                {portfolioLinks.length < 5 && (
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updatePortfolioLink(index, e.target.value)}
                      placeholder="https://github.com/username 또는 https://portfolio.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {portfolioLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePortfolioLink(index)}
                        className="px-3 py-2 text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 지원 동기 */}
            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                자기소개서 / 지원 동기 *
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={12}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1. 지원 동기를 작성해주세요.
2. 본인의 강점과 경험을 소개해주세요.
3. 입사 후 포부를 작성해주세요."
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  최소 100자 이상 작성을 권장합니다
                </p>
                <p className="text-sm text-gray-500">
                  {coverLetter.length} 자
                </p>
              </div>
            </div>

            {/* 희망 연봉 */}
            <div>
              <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700 mb-2">
                희망 연봉 (만원)
              </label>
              <input
                type="number"
                id="expectedSalary"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="예: 5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                제안된 연봉 범위: {job.salary.min.toLocaleString()}~{job.salary.max.toLocaleString()}만원
              </p>
            </div>

            {/* 입사 가능일 */}
            <div>
              <label htmlFor="availableDate" className="block text-sm font-medium text-gray-700 mb-2">
                입사 가능일
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="availableDate"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  placeholder="날짜를 선택하세요"
                />
              </div>
            </div>

            {/* 추가 정보 */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                추가 정보 (선택)
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="기타 전달하고 싶은 내용이 있다면 작성해주세요."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '제출 중...' : '지원하기'}
              </button>
            </div>
          </form>
        </div>

        {/* 공고 상세 링크 */}
        <div className="mt-6 text-center">
          <Link
            href={`/jobs/${job.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            공고 상세 보기
          </Link>
        </div>
      </div>
    </div>
    </RequireAuth>
  )
}