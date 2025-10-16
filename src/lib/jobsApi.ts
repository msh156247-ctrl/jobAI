import { supabase } from './supabase'
import { Database } from '@/types/database'

// Type aliases
type Job = Database['public']['Tables']['jobs']['Row'] & {
  company_profiles?: {
    company_name: string
    description: string | null
  }
}

type JobInsert = Database['public']['Tables']['jobs']['Insert']
type JobUpdate = Database['public']['Tables']['jobs']['Update']

// 채용공고 조회 (전체)
export async function getJobs(filters?: {
  location?: string
  type?: string
  salaryMin?: number
  search?: string
  limit?: number
  offset?: number
}) {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        description
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.salaryMin) {
    query = query.gte('salary_min', filters.salaryMin)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Job[]
}

// 채용공고 상세 조회
export async function getJob(jobId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        id,
        company_name,
        description,
        industry,
        location,
        website
      )
    `)
    .eq('id', jobId)
    .single()

  if (error) throw error
  return data
}

// 추천 채용공고 조회 (프로필 기반)
export async function getRecommendedJobs(userId: string, limit: number = 10) {
  // 1. 사용자 프로필 조회
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError) throw profileError

  // 2. 사용자 스킬과 일치하는 채용공고 조회
  let query = supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        description
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  // 사용자 위치가 있으면 우선적으로 필터링
  if ((userProfile as any)?.location) {
    query = query.ilike('location', `%${(userProfile as any).location}%`)
  }

  const { data: jobs, error: jobsError } = await query

  if (jobsError) throw jobsError

  return jobs as Job[]
}

// 채용공고 검색
export async function searchJobs(keyword: string, filters?: {
  location?: string
  minSalary?: number
  workType?: string
}) {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        description
      )
    `)
    .eq('status', 'active')
    .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    .order('created_at', { ascending: false })

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters?.minSalary) {
    query = query.gte('salary_min', filters.minSalary)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Job[]
}

// 저장된 채용공고 조회 (북마크)
export async function getSavedJobs(userId: string) {
  // saved_jobs 테이블이 있다고 가정
  // 없으면 Supabase에 테이블 생성 필요
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      job_id,
      jobs (
        *,
        company_profiles (
          company_name,
          description
        )
      )
    `)
    .eq('user_id', userId)

  if (error) {
    // saved_jobs 테이블이 없으면 빈 배열 반환
    if (error.code === '42P01') {
      return []
    }
    throw error
  }

  return (data as any).map((item: any) => item.jobs).filter(Boolean)
}

// 채용공고 저장 (북마크)
export async function saveJob(userId: string, jobId: string) {
  const { error } = await supabase
    .from('saved_jobs')
    .insert({ user_id: userId, job_id: jobId } as any)

  if (error) {
    // 이미 저장된 경우 무시
    if (error.code === '23505') {
      return
    }
    throw error
  }
}

// 채용공고 저장 해제
export async function unsaveJob(userId: string, jobId: string) {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId)

  if (error) throw error
}

// 저장 여부 확인
export async function isJobSaved(userId: string, jobId: string) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 데이터 없음
      return false
    }
    // saved_jobs 테이블 없음
    if (error.code === '42P01') {
      return false
    }
    throw error
  }

  return !!data
}

// 채용공고 생성 (기업용)
export async function createJob(job: JobInsert) {
  const { data, error } = await supabase
    .from('jobs')
    .insert(job as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// 채용공고 수정 (기업용)
export async function updateJob(jobId: string, updates: JobUpdate) {
  const { data, error } = await (supabase
    .from('jobs') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// 채용공고 삭제 (기업용)
export async function deleteJob(jobId: string) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)

  if (error) throw error
}

// 기업의 채용공고 목록
export async function getCompanyJobs(companyId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 채용공고 지원
export async function applyToJob(userId: string, jobId: string, coverLetter: string) {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      job_id: jobId,
      cover_letter: coverLetter,
      status: 'pending',
    } as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// 사용자 지원 목록
export async function getUserApplications(userId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (
        title,
        company_profiles (
          company_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 채용공고의 지원자 목록 (기업용)
export async function getJobApplications(jobId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles (
        id,
        email,
        full_name
      ),
      user_profiles (
        skills,
        career_years,
        location,
        bio
      )
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 지원 상태 변경 (기업용)
export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
) {
  const { data, error } = await (supabase
    .from('applications') as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error
  return data as any
}
