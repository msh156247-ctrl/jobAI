'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { mockJobs } from '@/lib/mockData'
import { getJob } from '@/lib/jobsApi'
import Link from 'next/link'
import { trackPageView, trackJobView } from '@/lib/services/behavior-tracking-service'
import { useEnhancedTracking } from '@/hooks/useEnhancedTracking'

// USE_API 환경 변수 확인
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true'

interface JobDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [job, setJob] = useState<typeof mockJobs[0] | null>(null)
  const [loading, setLoading] = useState(true)

  // Enhanced Tracking (job이 로드된 후에만 활성화)
  const tracking = job
    ? useEnhancedTracking({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        enableScrollTracking: true,
        enableDwellTracking: true,
      })
    : null

  // 페이지 조회 추적
  useEffect(() => {
    if (user?.id) {
      trackPageView(user.id, `/jobs/${resolvedParams.id}`)
    }
  }, [user, resolvedParams.id])

  // 공고 조회 추적
  useEffect(() => {
    if (user?.id && job) {
      trackJobView(user.id, job.id, job.title, job.company)
    }
  }, [user, job])

  useEffect(() => {
    const fetchJob = async () => {
      if (!USE_API) {
        const data = mockJobs.find(j => j.id === resolvedParams.id)
        setJob(data || null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getJob(resolvedParams.id) as any

        if (data) {
          // API 데이터를 Mock 형식으로 변환
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
        // 에러 시 Mock 데이터 폴백
        const data = mockJobs.find(j => j.id === resolvedParams.id)
        setJob(data || null)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [resolvedParams.id])

  if (loading) {
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
          <p className="text-lg text-red-600 mb-4">채용공고를 찾을 수 없습니다.</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
            채용공고 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold hover:text-blue-600">
                JobAI
              </Link>
              <Link href="/jobs" className="text-blue-600 font-medium">
                채용공고
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {job.title}
                </h1>
                <p className="text-xl text-gray-600 mb-4">
                  {job.company}
                </p>
                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">📍</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">💰</span>
                    <span>{job.salary.min.toLocaleString()}만 - {job.salary.max.toLocaleString()}만원</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🏢</span>
                    <span>{job.workType === 'onsite' ? '사무실' : job.workType === 'dispatch' ? '파견' : '원격'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  tracking?.trackApply();
                  router.push(`/apply/${job.id}`);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium ml-6"
              >
                지원하기
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">직무 설명</h2>
                <p className="whitespace-pre-wrap text-gray-700">
                  {job.description}
                </p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">자격 요건</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.requirements.map((req: string, index: number) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.skills && job.skills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">필요 기술</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">회사 정보</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-lg">{job.company}</h3>
                  <p className="text-gray-600 mt-1">업종: {job.industry}</p>
                  <p className="text-gray-600 mt-1">위치: {job.location}</p>
                  <Link
                    href={`/company/${job.companyId}`}
                    className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    회사 상세 정보 보기 →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
            ← 채용공고 목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  )
}