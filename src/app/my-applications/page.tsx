'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getUserApplications } from '@/lib/jobs'
import { getFileIcon, formatFileSize } from '@/lib/files'
import Link from 'next/link'

export default function MyApplicationsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'seeker')) {
      router.push('/dashboard')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (user && profile?.role === 'seeker') {
      loadApplications()
    }
  }, [user, profile])

  const loadApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserApplications(user.id)
      setApplications(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const getStatusIcon = (status: string) => {
    const iconMap = {
      pending: '⏳',
      reviewed: '📄',
      interview: '💼',
      accepted: '🎉',
      rejected: '❌'
    }
    return iconMap[status as keyof typeof iconMap] || '📋'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || profile?.role !== 'seeker') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">구직자 계정만 접근할 수 있습니다.</p>
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
                <Link href="/my-applications" className="text-blue-600 font-medium">
                  지원 현황
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

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">내 지원 현황</h1>
          <p className="mt-2 text-gray-600">지원한 채용공고의 진행 상황을 확인하세요.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-600">전체 지원</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter(app => app.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">검토 중</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">
              {applications.filter(app => app.status === 'reviewed').length}
            </div>
            <div className="text-sm text-gray-600">서류 통과</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">
              {applications.filter(app => app.status === 'interview').length}
            </div>
            <div className="text-sm text-gray-600">면접 예정</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === 'accepted').length}
            </div>
            <div className="text-sm text-gray-600">최종 합격</div>
          </div>
        </div>

        {/* 지원 목록 */}
        <div className="bg-white shadow rounded-lg">
          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg text-gray-500 mb-4">아직 지원한 공고가 없습니다.</p>
              <Link
                href="/jobs"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                채용공고 둘러보기
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {applications.map((application) => (
                <div key={application.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getStatusIcon(application.status)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.jobs?.title}
                          </h3>
                          <p className="text-gray-600">
                            {application.jobs?.company_profiles?.company_name}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">지원일</p>
                          <p className="text-gray-900">
                            {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">최종 업데이트</p>
                          <p className="text-gray-900">
                            {new Date(application.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">진행 상황</p>
                          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                      </div>

                      {/* 제출 파일 정보 */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">제출한 파일</p>
                        <div className="flex flex-wrap gap-2">
                          {application.resume_file && (
                            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{getFileIcon(application.resume_file.file_type)}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {application.resume_file.file_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  이력서 • {formatFileSize(application.resume_file.file_size)}
                                </p>
                              </div>
                              <a
                                href={application.resume_file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="파일 보기"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                          {application.cover_letter_file && (
                            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{getFileIcon(application.cover_letter_file.file_type)}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {application.cover_letter_file.file_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  자기소개서 • {formatFileSize(application.cover_letter_file.file_size)}
                                </p>
                              </div>
                              <a
                                href={application.cover_letter_file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="파일 보기"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                          {!application.resume_file && !application.cover_letter_file && (
                            <p className="text-sm text-gray-500">업로드된 파일이 없습니다</p>
                          )}
                        </div>
                      </div>

                      {application.cover_letter && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">제출한 자기소개서</p>
                          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                            {application.cover_letter}
                          </div>
                        </div>
                      )}

                      {/* 진행 상황별 안내 메시지 */}
                      {application.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                          <p className="text-yellow-800">
                            📝 지원서가 접수되었습니다. 기업의 서류 검토를 기다리고 있어요.
                          </p>
                        </div>
                      )}
                      {application.status === 'reviewed' && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                          <p className="text-blue-800">
                            🎉 축하합니다! 서류 전형을 통과하셨습니다. 곧 면접 일정이 안내될 예정입니다.
                          </p>
                        </div>
                      )}
                      {application.status === 'interview' && (
                        <div className="bg-purple-50 border border-purple-200 p-3 rounded text-sm">
                          <p className="text-purple-800">
                            💼 면접이 예정되어 있습니다. 면접 준비를 철저히 해주세요!
                          </p>
                        </div>
                      )}
                      {application.status === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
                          <p className="text-green-800">
                            🎉 축하합니다! 최종 합격하셨습니다. 입사 절차에 대한 안내를 기다려주세요.
                          </p>
                        </div>
                      )}
                      {application.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                          <p className="text-red-800">
                            아쉽게도 이번 기회는 아니었습니다. 더 좋은 기회를 위해 계속 도전해보세요!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <Link
                        href={`/jobs/${application.job_id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        공고 보기 →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}