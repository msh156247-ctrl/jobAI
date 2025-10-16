'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { mockJobs, getCompanyById, type Job } from '@/lib/mockData'
import { getJobs } from '@/lib/jobsApi'
import { useJobSave } from '@/hooks/useJobSave'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RequireAuth from '@/components/RequireAuth'
import Header from '@/components/Header'
import JobDetailModal from '@/components/JobDetailModal'
import { Bookmark, BookmarkCheck, MapPin, Briefcase } from 'lucide-react'
import { getRecommendations } from '@/lib/services/recommendation-service'
import { trackPageView, trackJobView } from '@/lib/services/behavior-tracking-service'

// USE_API 환경 변수 확인
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true'
const USE_GRAPHQL = process.env.NEXT_PUBLIC_USE_GRAPHQL === 'true'

interface RecommendedJob extends Job {
  matchScore: number
  matchReasons: string[]
}

export default function HomePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()
  const { savedJobs, isSaved, toggleSave } = useJobSave()

  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null)
  const [allJobs, setAllJobs] = useState<Job[]>([])

  const JOBS_PER_PAGE = 10

  // 프로필 기반 추천 로직 (우선순위 기반)
  const calculateRecommendations = useCallback((jobs: Job[]): RecommendedJob[] => {
    if (!profile) {
      return jobs.slice(0, 20).map((job, idx) => ({
        ...job,
        matchScore: 95 - idx * 2,
        matchReasons: ['프로필을 설정하면 더 정확한 추천을 받을 수 있습니다']
      }))
    }

    // 우선순위가 설정되어 있는지 확인
    const priorities = profile.priorities?.filter(p => p.enabled) || []
    const hasPriorities = priorities.length > 0

    return jobs.map(job => {
      let score = 0
      const reasons: string[] = []

      if (hasPriorities) {
        // 우선순위 기반 점수 계산
        priorities.forEach((priority) => {
          const weight = priority.weight

          switch (priority.field) {
            case 'desiredJob':
              if (profile.jobDescription) {
                const desiredJobLower = profile.jobDescription.toLowerCase()
                const titleLower = job.title.toLowerCase()
                const descriptionLower = job.description.toLowerCase()

                // 제목에서 정확히 일치
                if (titleLower.includes(desiredJobLower)) {
                  score += weight
                  reasons.push(`${priority.label} 정확히 일치 (+${weight}점)`)
                }
                // 설명에서 일치
                else if (descriptionLower.includes(desiredJobLower)) {
                  score += weight * 0.7
                  reasons.push(`${priority.label} 관련 (+${Math.floor(weight * 0.7)}점)`)
                }
                // 키워드 부분 일치
                else {
                  const keywords = desiredJobLower.split(' ').filter(k => k.length > 1)
                  const matchedKeywords = keywords.filter(keyword =>
                    titleLower.includes(keyword) || descriptionLower.includes(keyword)
                  )
                  if (matchedKeywords.length > 0) {
                    const partialScore = weight * 0.5 * (matchedKeywords.length / keywords.length)
                    score += partialScore
                    reasons.push(`${priority.label} 키워드 일치 (+${Math.floor(partialScore)}점)`)
                  }
                }
              }
              break

            case 'skills':
              if (profile.skills && profile.skills.length > 0) {
                const matchedSkills = job.skills.filter(skill =>
                  profile.skills.some(ps => ps.name.toLowerCase().includes(skill.toLowerCase()) ||
                                           skill.toLowerCase().includes(ps.name.toLowerCase()))
                )
                if (matchedSkills.length > 0) {
                  score += weight
                  reasons.push(`${priority.label} ${matchedSkills.length}개 일치 (+${weight}점)`)
                }
              }
              break

            case 'industry':
              if (profile.industry && job.industry === profile.industry) {
                score += weight
                reasons.push(`${priority.label} 일치 (+${weight}점)`)
              }
              break

            case 'location':
              if (profile.preferredLocations && profile.preferredLocations.length > 0) {
                const locationMatch = profile.preferredLocations.some(loc => job.location.includes(loc))
                if (locationMatch) {
                  score += weight
                  reasons.push(`${priority.label} 일치 (+${weight}점)`)
                }
              }
              break

            case 'workType':
              if (profile.workTypes && profile.workTypes.includes(job.workType)) {
                score += weight
                reasons.push(`${priority.label} 일치 (+${weight}점)`)
              }
              break

            case 'salary':
              if (profile.salaryMin && profile.salaryMax) {
                const isInRange = job.salary.max >= profile.salaryMin && job.salary.min <= profile.salaryMax
                if (isInRange) {
                  score += weight
                  reasons.push(`${priority.label} 범위 내 (+${weight}점)`)
                }
              }
              break

            case 'career':
              if (profile.careerType === 'newcomer' && job.requirements.some(r => r.includes('신입') || r.includes('0년'))) {
                score += weight
                reasons.push(`신입 가능 (+${weight}점)`)
              } else if (profile.careerType === 'experienced' && profile.careerYears) {
                const yearsMatch = job.requirements.some(r => {
                  const match = r.match(/(\d+)년/)
                  return match && parseInt(match[1]) <= profile.careerYears
                })
                if (yearsMatch) {
                  score += weight
                  reasons.push(`경력 조건 부합 (+${weight}점)`)
                }
              }
              break
          }
        })
      } else {
        // 우선순위 미설정 시 기본 로직 (기존 로직)
        score = 50

        // 희망직무 매칭 (25점) - 가장 중요한 필터
        if (profile.jobDescription) {
          const desiredJobLower = profile.jobDescription.toLowerCase()
          const titleLower = job.title.toLowerCase()
          const descriptionLower = job.description.toLowerCase()

          // 제목에서 희망직무 키워드 포함 시
          if (titleLower.includes(desiredJobLower)) {
            score += 25
            reasons.push(`희망 직무와 정확히 일치`)
          }
          // 설명에서 희망직무 키워드 포함 시
          else if (descriptionLower.includes(desiredJobLower)) {
            score += 15
            reasons.push(`희망 직무 관련`)
          }
          // 부분 키워드 매칭 (예: "백엔드 개발자"에서 "백엔드" 또는 "개발자")
          else {
            const keywords = desiredJobLower.split(' ').filter(k => k.length > 1)
            const matchedKeywords = keywords.filter(keyword =>
              titleLower.includes(keyword) || descriptionLower.includes(keyword)
            )
            if (matchedKeywords.length > 0) {
              score += matchedKeywords.length * 8
              reasons.push(`직무 키워드 ${matchedKeywords.length}개 일치`)
            }
          }
        }

        // 스킬 매칭 (25점)
        if (profile.skills && profile.skills.length > 0) {
          const matchedSkills = job.skills.filter(skill =>
            profile.skills.some(ps => ps.name.toLowerCase().includes(skill.toLowerCase()) ||
                                     skill.toLowerCase().includes(ps.name.toLowerCase()))
          )
          if (matchedSkills.length > 0) {
            score += Math.min(25, matchedSkills.length * 8)
            reasons.push(`보유 스킬 ${matchedSkills.length}개 일치`)
          }
        }

        // 업종 매칭 (15점)
        if (profile.industry && job.industry === profile.industry) {
          score += 15
          reasons.push(`희망 업종 일치`)
        }

        // 지역 매칭 (15점)
        if (profile.preferredLocations && profile.preferredLocations.length > 0) {
          const locationMatch = profile.preferredLocations.some(loc => job.location.includes(loc))
          if (locationMatch) {
            score += 15
            reasons.push(`희망 근무지 일치`)
          }
        }

        // 근무 형태 매칭 (10점)
        if (profile.workTypes && profile.workTypes.includes(job.workType)) {
          score += 10
          reasons.push(`희망 근무 형태 일치`)
        }

        // 연봉 매칭 (15점)
        if (profile.salaryMin && profile.salaryMax) {
          const isInRange = job.salary.max >= profile.salaryMin && job.salary.min <= profile.salaryMax
          if (isInRange) {
            score += 15
            reasons.push(`희망 연봉 범위 내`)
          }
        }

        // 경력 매칭 (10점)
        if (profile.careerType === 'newcomer' && job.requirements.some(r => r.includes('신입') || r.includes('0년'))) {
          score += 10
          reasons.push(`신입 가능`)
        } else if (profile.careerType === 'experienced' && profile.careerYears) {
          const yearsMatch = job.requirements.some(r => {
            const match = r.match(/(\d+)년/)
            return match && parseInt(match[1]) <= profile.careerYears
          })
          if (yearsMatch) {
            score += 10
            reasons.push(`경력 조건 부합`)
          }
        }
      }

      return {
        ...job,
        matchScore: Math.min(100, score),
        matchReasons: reasons.length > 0 ? reasons : ['관심사 기반 추천']
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
  }, [profile])

  // 페이지 조회 추적
  useEffect(() => {
    if (user?.id) {
      trackPageView(user.id, '/')
    }
  }, [user])

  // API에서 채용공고 데이터 가져오기 (또는 GraphQL 추천 사용)
  useEffect(() => {
    const fetchJobs = async () => {
      // GraphQL 추천 시스템 사용
      if (USE_GRAPHQL && USE_API && user?.id) {
        try {
          setLoading(true)
          const recommendedJobs = await getRecommendations(user.id, 100)

          // GraphQL 추천 결과를 Mock 형식으로 변환
          const transformedJobs: Job[] = recommendedJobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company || '회사명 없음',
            companyId: job.companyId || '',
            location: job.location || '위치 미정',
            salary: job.salary || { min: 0, max: 0 },
            workType: job.type || 'onsite',
            description: job.description || '',
            requirements: job.requirements || [],
            skills: job.skills || [],
            industry: job.industry || '기타',
            postedAt: job.postedAt || new Date().toISOString(),
            deadline: job.deadline
          }))

          setAllJobs(transformedJobs)
          setLoading(false)
          return
        } catch (error) {
          console.error('Failed to fetch GraphQL recommendations:', error)
          // GraphQL 실패 시 기존 방식으로 fallback
        }
      }

      // 기존 방식 (REST API 또는 Mock)
      if (!USE_API) {
        setAllJobs(mockJobs)
        return
      }

      try {
        setLoading(true)
        const data = await getJobs({ limit: 100 }) as any

        // API 데이터를 Mock 형식으로 변환
        const transformedJobs: Job[] = (data || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company_profiles?.company_name || '회사명 없음',
          companyId: job.company_id,
          location: job.location,
          salary: {
            min: job.salary_min || 0,
            max: job.salary_max || 0
          },
          workType: job.type || 'onsite',
          description: job.description || '',
          requirements: job.requirements || [],
          skills: job.skills_required || [],
          industry: job.industry || '기타',
          postedAt: job.created_at,
          deadline: job.deadline
        }))

        setAllJobs(transformedJobs)
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
        setAllJobs(mockJobs)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [user])

  // 초기 추천 로드
  useEffect(() => {
    if (!user || allJobs.length === 0) return

    const recommended = calculateRecommendations(allJobs)
    setRecommendations(recommended.slice(0, JOBS_PER_PAGE))
    setHasMore(recommended.length > JOBS_PER_PAGE)
  }, [user, allJobs, calculateRecommendations])

  // 무한 스크롤 로드
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return

    setLoading(true)
    setTimeout(() => {
      const recommended = calculateRecommendations(mockJobs)
      const nextJobs = recommended.slice(page * JOBS_PER_PAGE, (page + 1) * JOBS_PER_PAGE)

      if (nextJobs.length > 0) {
        setRecommendations(prev => [...prev, ...nextJobs])
        setPage(prev => prev + 1)
        setHasMore((page + 1) * JOBS_PER_PAGE < recommended.length)
      } else {
        setHasMore(false)
      }
      setLoading(false)
    }, 500)
  }, [page, loading, hasMore, calculateRecommendations])

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      setSelectedJob(null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'onsite': return '사무실'
      case 'dispatch': return '파견'
      case 'remote': return '원격'
      default: return type
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header />

        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 animate-fade-in-down">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 맞춤 채용공고</h1>
            <p className="text-gray-600">
              {profile?.name ? `${profile.name}님의 프로필을 기반으로 추천합니다` : '프로필을 설정하면 더 정확한 추천을 받을 수 있습니다'}
            </p>
          </div>

          {/* 추천 공고 리스트 */}
          <div className="space-y-4">
            {recommendations.map((job, index) => {
              const company = getCompanyById(job.companyId)

              return (
                <div
                  key={job.id}
                  className="bg-white shadow rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => {
                    setSelectedJob(job)
                    // 공고 조회 추적
                    if (user?.id) {
                      trackJobView(user.id, job.id, job.title, job.company)
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${
                          job.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                          job.matchScore >= 60 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          매칭도 {job.matchScore}%
                        </span>
                      </div>

                      <p className="text-gray-600 hover:text-blue-600 mb-2">
                        {job.company}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">₩</span>
                          {job.salary.min.toLocaleString()}만 - {job.salary.max.toLocaleString()}만원
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={16} />
                          {getWorkTypeLabel(job.workType)}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>

                      {/* 추천 사유 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.matchReasons.map((reason, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                            ✓ {reason}
                          </span>
                        ))}
                      </div>

                      {/* 스킬 태그 */}
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex sm:flex-col flex-row gap-2 w-full sm:w-auto sm:ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSave(job.id)
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                          isSaved(job.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isSaved(job.id) ? '저장 해제' : '저장'}
                      >
                        {isSaved(job.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      </button>
                      <Link
                        href={`/apply/${job.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center text-sm transition-all duration-200 hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                      >
                        지원하기
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 로딩 인디케이터 */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">추가 공고를 불러오는 중...</p>
            </div>
          )}

          {/* 더 이상 없음 */}
          {!hasMore && recommendations.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">모든 추천 공고를 확인했습니다</p>
              <Link href="/search" className="text-blue-600 hover:underline mt-2 inline-block">
                더 많은 공고 검색하기 →
              </Link>
            </div>
          )}

          {/* 공고 없음 */}
          {recommendations.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">추천 공고가 없습니다</p>
              <Link href="/profile" className="text-blue-600 hover:underline">
                프로필을 설정하고 맞춤 추천을 받아보세요 →
              </Link>
            </div>
          )}
        </main>

        {/* 상세 모달 */}
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            isOpen={!!selectedJob}
            onClose={() => setSelectedJob(null)}
            isSaved={isSaved(selectedJob.id)}
            onToggleSave={() => toggleSave(selectedJob.id)}
          />
        )}
      </div>
    </RequireAuth>
  )
}
