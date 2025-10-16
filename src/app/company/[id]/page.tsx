'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { mockCompanies, mockJobs } from '@/lib/mockData'
import { useAuth } from '@/contexts/AuthContext'
import { useJobSave } from '@/hooks/useJobSave'
import { Building2, MapPin, Users, Globe, DollarSign, Bookmark, BookmarkCheck } from 'lucide-react'

export default function CompanyPage() {
  const params = useParams()
  const { user } = useAuth()
  const { isSaved, toggleSave } = useJobSave()
  const companyId = params.id as string

  const company = mockCompanies.find(c => c.id === companyId)
  const companyJobs = mockJobs.filter(j => j.companyId === companyId)

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            회사를 찾을 수 없습니다
          </h2>
          <Link href="/search" className="text-blue-600 hover:underline">
            검색으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 배너 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <Building2 size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-blue-100 mt-1">{company.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 회사 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">회사 정보</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <MapPin size={16} className="mr-2" />
                    위치
                  </div>
                  <p className="text-sm text-gray-900 ml-6">{company.address}</p>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Users size={16} className="mr-2" />
                    사업자 번호
                  </div>
                  <p className="text-sm text-gray-900 ml-6">{company.businessNumber}</p>
                </div>

                {company.website && (
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Globe size={16} className="mr-2" />
                      웹사이트
                    </div>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline ml-6 break-all"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">소개</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {company.description}
                </p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 채용 공고 목록 */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                채용 중인 포지션
              </h2>
              <p className="text-gray-600">
                {companyJobs.length}개의 공고
              </p>
            </div>

            {companyJobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">현재 채용 중인 공고가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companyJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link href={`/jobs/${job.id}`}>
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                              {job.title}
                            </h3>
                          </Link>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              job.workType === 'remote'
                                ? 'bg-green-100 text-green-800'
                                : job.workType === 'dispatch'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {job.workType === 'remote' && '원격'}
                            {job.workType === 'dispatch' && '파견'}
                            {job.workType === 'onsite' && '사무실'}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <MapPin size={16} className="mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <DollarSign size={16} className="mr-1" />
                            {job.salary.min}~{job.salary.max}만원
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        {user && (
                          <button
                            onClick={() => toggleSave(job.id)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title={isSaved(job.id) ? '저장 취소' : '저장'}
                          >
                            {isSaved(job.id) ? (
                              <BookmarkCheck size={20} className="text-blue-600" />
                            ) : (
                              <Bookmark size={20} className="text-gray-400" />
                            )}
                          </button>
                        )}

                        <Link
                          href={`/apply/${job.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 text-center whitespace-nowrap"
                        >
                          지원하기
                        </Link>

                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 text-center whitespace-nowrap"
                        >
                          상세보기
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}