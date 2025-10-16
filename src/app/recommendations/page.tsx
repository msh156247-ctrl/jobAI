'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { mockJobs } from '@/lib/mockData'
import Link from 'next/link'

export default function RecommendationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    // Mock AI 추천: 상위 10개 랜덤 추천
    const shuffled = [...mockJobs].sort(() => 0.5 - Math.random())
    setRecommendations(shuffled.slice(0, 10))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold hover:text-blue-600">
                JobAI
              </Link>
              <Link href="/recommendations" className="text-blue-600 font-medium">
                AI 추천
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 AI 맞춤 채용공고</h1>
          <p className="text-gray-600">당신의 프로필을 분석하여 가장 적합한 채용공고를 추천합니다</p>
        </div>

        <div className="space-y-4">
          {recommendations.map((job, idx) => (
            <div key={job.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <span className="px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                      매칭도: {95 - idx * 5}%
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary.min.toLocaleString()}만 - {job.salary.max.toLocaleString()}만원</span>
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map((skill: string, i: number) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 ml-6"
                >
                  자세히 보기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}