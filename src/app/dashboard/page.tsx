'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    teams: 0,
    applications: 0,
    waitlist: 0,
    matches: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      if (user.role === 'seeker') {
        // 구직자용 통계
        const [applicationsRes, waitlistRes] = await Promise.all([
          supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('applicant_id', user.id),
          supabase
            .from('waitlist')
            .select('*', { count: 'exact', head: true })
            .eq('applicant_id', user.id)
            .eq('status', 'active')
        ])

        setStats({
          teams: 0, // 나중에 추천 팀 수로 업데이트
          applications: applicationsRes.count || 0,
          waitlist: waitlistRes.count || 0,
          matches: 0 // 나중에 매칭 점수 80+ 팀 수로 업데이트
        })
      } else {
        // 팀 리더용 통계
        const [teamsRes, applicationsRes] = await Promise.all([
          supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .eq('leader_id', user.id),
          supabase
            .from('applications')
            .select('a.*, t.leader_id', { count: 'exact', head: true })
            .eq('t.leader_id', user.id)
        ])

        setStats({
          teams: teamsRes.count || 0,
          applications: applicationsRes.count || 0,
          waitlist: 0, // 나중에 전체 대기열 수로 업데이트
          matches: 0
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      {user?.role === 'seeker' ? (
        <SeekerDashboard stats={stats} loading={loading} />
      ) : (
        <EmployerDashboard stats={stats} loading={loading} />
      )}
    </DashboardLayout>
  )
}

// 구직자용 대시보드
function SeekerDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-600">
          나에게 맞는 팀을 찾아보세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="추천 팀"
          value={stats.teams}
          icon={<TeamsIcon />}
          color="blue"
          loading={loading}
        />
        <StatsCard
          title="지원 중"
          value={stats.applications}
          icon={<DocumentIcon />}
          color="green"
          loading={loading}
        />
        <StatsCard
          title="대기열"
          value={stats.waitlist}
          icon={<ClockIcon />}
          color="yellow"
          loading={loading}
        />
        <StatsCard
          title="높은 매칭"
          value={stats.matches}
          icon={<FireIcon />}
          color="red"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 실행</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            href="/teams"
            title="팀 탐색"
            description="나에게 맞는 팀 찾기"
            icon={<SearchIcon />}
          />
          <QuickActionButton
            href="/profile"
            title="프로필 완성"
            description="매칭 정확도 향상"
            icon={<UserIcon />}
          />
          <QuickActionButton
            href="/applications"
            title="지원 현황"
            description="내 지원서 확인"
            icon={<DocumentIcon />}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h2>
        <div className="text-center py-12 text-gray-500">
          <p>아직 활동 내역이 없습니다.</p>
          <p className="text-sm mt-2">팀에 지원하거나 대기열에 등록해보세요!</p>
        </div>
      </div>
    </div>
  )
}

// 팀 리더용 대시보드
function EmployerDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">팀 관리 대시보드</h1>
        <p className="mt-1 text-sm text-gray-600">
          팀원을 모집하고 지원자를 관리하세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="내 팀"
          value={stats.teams}
          icon={<TeamsIcon />}
          color="blue"
          loading={loading}
        />
        <StatsCard
          title="지원자"
          value={stats.applications}
          icon={<InboxIcon />}
          color="green"
          loading={loading}
        />
        <StatsCard
          title="대기열"
          value={stats.waitlist}
          icon={<ClockIcon />}
          color="yellow"
          loading={loading}
        />
        <StatsCard
          title="모집 중"
          value={stats.teams}
          icon={<UsersIcon />}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 실행</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionButton
            href="/teams/create"
            title="팀 생성"
            description="새 팀 모집 공고 작성"
            icon={<PlusIcon />}
          />
          <QuickActionButton
            href="/teams/manage"
            title="팀 관리"
            description="내 팀 편집 및 관리"
            icon={<CogIcon />}
          />
          <QuickActionButton
            href="/applications/manage"
            title="지원자 검토"
            description="지원자 확인 및 승인"
            icon={<InboxIcon />}
          />
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">최근 지원자</h2>
        <div className="text-center py-12 text-gray-500">
          <p>아직 지원자가 없습니다.</p>
          <p className="text-sm mt-2">팀을 생성하고 팀원을 모집해보세요!</p>
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ title, value, icon, color, loading }: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red' | 'indigo'
  loading: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                {loading ? (
                  <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-semibold text-gray-900">{value}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Action Button Component
function QuickActionButton({ href, title, description, icon }: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="relative flex items-start space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:shadow transition"
    >
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="focus:outline-none">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </a>
  )
}

// Icon Components
function TeamsIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function FireIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function CogIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
