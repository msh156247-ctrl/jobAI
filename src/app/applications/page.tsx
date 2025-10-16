'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getCompanyProfile } from '@/lib/profiles'
import { getCompanyJobs, getJobApplications, updateApplicationStatus } from '@/lib/jobs'
import { createApplicationStatusNotification } from '@/lib/notifications'
import { getOrCreateChatRoom } from '@/lib/chat'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import { Application } from '@/types'

interface JobWithApplications {
  id: string
  title: string
  created_at: string
  applications: Application[]
}

export default function ApplicationsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobsWithApplications, setJobsWithApplications] = useState<JobWithApplications[]>([])
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'employer')) {
      router.push('/dashboard')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (user && profile?.role === 'employer') {
      loadApplications()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const loadApplications = async () => {
    if (!user) return

    try {
      setLoading(true)

      // 기업 프로필 조회
      const companyProfile = await getCompanyProfile(user.id)
      if (!companyProfile) {
        const errorMsg = '기업 프로필을 찾을 수 없습니다.'
        setError(errorMsg)
        showToast('error', errorMsg)
        return
      }

      // 기업의 모든 채용공고 조회
      const jobs = await getCompanyJobs(companyProfile.id)

      // 각 공고별 지원자 현황 조회
      const jobsWithApps = await Promise.all(
        jobs.map(async (job) => {
          const apps = await getJobApplications(job.id)
          // DB 타입을 프론트엔드 Application 타입으로 변환
          const convertedApps: Application[] = apps.map((app: any) => ({
            id: app.id,
            jobId: app.job_id || job.id,
            userId: app.user_id,
            userName: app.user_name || '',
            userEmail: app.user_email || '',
            appliedDate: app.created_at,
            status: app.status as Application['status'],
            coverLetter: app.cover_letter || undefined,
            resumeUrl: app.resume_url || undefined,
          }))
          return {
            id: job.id,
            title: job.title,
            created_at: job.created_at,
            applications: convertedApps
          }
        })
      )

      setJobsWithApplications(jobsWithApps)

      if (jobsWithApps.length > 0) {
        setSelectedJob(jobsWithApps[0].id)
        setApplications(jobsWithApps[0].applications)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '지원자 정보를 불러오는데 실패했습니다.'
      setError(errorMsg)
      showToast('error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleJobSelect = (jobId: string) => {
    setSelectedJob(jobId)
    const job = jobsWithApplications.find(j => j.id === jobId)
    setApplications(job?.applications || [])
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(applicationId, newStatus as Application['status'])

      // 지원자 정보 찾기
      const application = applications.find(app => app.id === applicationId)
      if (application) {
        const selectedJobData = jobsWithApplications.find(j => j.id === selectedJob)

        // 알림 생성
        await createApplicationStatusNotification(
          application.userId,
          selectedJobData?.title || '채용공고',
          profile?.name || '기업',
          newStatus
        )
      }

      // 상태 업데이트 후 목록 새로고침
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus as Application['status'] }
            : app
        )
      )

      showToast('success', '지원 상태가 업데이트되었습니다.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '상태 업데이트에 실패했습니다.')
    }
  }

  const handleStartChat = async (applicantId: string) => {
    if (!user) return

    try {
      const chatRoom = await getOrCreateChatRoom(user.id, applicantId)
      router.push(`/chat/${chatRoom.id}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      showToast('error', '채팅방 생성 중 오류가 발생했습니다: ' + errorMsg)
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap = {
      pending: '검토 중',
      reviewed: '서류 통과',
      interview: '면접 예정',
      accepted: '최종 합격',
      rejected: '불합격'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      interview: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || profile?.role !== 'employer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">기업 계정만 접근할 수 있습니다.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xl font-semibold hover:text-blue-600"
              >
                JobAI
              </button>
              <nav className="flex space-x-8">
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
                  채용공고
                </Link>
                <Link href="/applications" className="text-blue-600 font-medium">
                  지원자 관리
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  프로필
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {profile.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">지원자 관리</h1>
          <p className="mt-2 text-gray-600">채용 공고별 지원자 현황을 관리하세요.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 채용공고 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-3 border-b">
                <h3 className="text-lg font-medium">채용 공고</h3>
              </div>
              <div className="divide-y">
                {jobsWithApplications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    등록된 채용 공고가 없습니다.
                  </div>
                ) : (
                  jobsWithApplications.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleJobSelect(job.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${
                        selectedJob === job.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 truncate">
                        {job.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        지원자: {job.applications.length}명
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 지원자 목록 */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">
                  {selectedJob && jobsWithApplications.find(j => j.id === selectedJob)?.title} 지원자
                </h3>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg">아직 지원자가 없습니다.</p>
                  <p className="text-sm mt-2">채용 공고를 홍보해보세요!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {applications.map((application) => (
                    <div key={application.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {application.userName || application.userEmail}
                            </h4>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(application.status)}`}>
                              {getStatusLabel(application.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">이메일</p>
                              <p className="text-gray-900">{application.userEmail}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">지원일</p>
                              <p className="text-gray-900">{new Date(application.appliedDate).toLocaleDateString('ko-KR')}</p>
                            </div>
                          </div>

                          {application.coverLetter && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-2">자기소개서</p>
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                {application.coverLetter}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 상태 변경 및 채팅 버튼 */}
                        <div className="ml-6">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleStartChat(application.userId)}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              채팅하기
                            </button>
                            {application.status !== 'reviewed' && (
                              <button
                                onClick={() => handleStatusUpdate(application.id, 'reviewed')}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                서류 통과
                              </button>
                            )}
                            {application.status !== 'interview' && (
                              <button
                                onClick={() => handleStatusUpdate(application.id, 'interview')}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                              >
                                면접 예정
                              </button>
                            )}
                            {application.status !== 'accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(application.id, 'accepted')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                최종 합격
                              </button>
                            )}
                            {application.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                불합격
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}