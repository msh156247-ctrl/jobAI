import { supabase } from './supabase'
import { Database } from '@/types/database'

export type Job = Database['public']['Tables']['jobs']['Row']
export type Application = Database['public']['Tables']['applications']['Row']

export interface JobWithCompany extends Job {
  company_profiles: {
    company_name: string
    location: string | null
  } | null
}

export async function createJob(companyId: string, jobData: Partial<Job>) {
  const { data, error } = await supabase
    .from('jobs')
    .insert([
      {
        company_id: companyId,
        title: jobData.title || '',
        description: jobData.description || '',
        requirements: jobData.requirements || [],
        salary_min: jobData.salary_min || null,
        salary_max: jobData.salary_max || null,
        location: jobData.location || null,
        type: jobData.type || 'full-time',
        status: jobData.status || 'active',
      },
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function updateJob(jobId: string, jobData: Partial<Job>) {
  const { data, error } = await (supabase
    .from('jobs') as any)
    .update({
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      location: jobData.location,
      type: jobData.type,
      status: jobData.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function deleteJob(jobId: string) {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)

  if (error) throw error
}

export async function getJob(jobId: string): Promise<JobWithCompany | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        location
      )
    `)
    .eq('id', jobId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getJobs(filters?: {
  type?: string
  location?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<JobWithCompany[]> {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      company_profiles (
        company_name,
        location
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`)
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
  return data || []
}

export async function getCompanyJobs(companyId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function applyToJob(
  jobId: string,
  userId: string,
  coverLetter?: string
) {
  const { data, error } = await supabase
    .from('applications')
    .insert([
      {
        job_id: jobId,
        user_id: userId,
        cover_letter: coverLetter || null,
        status: 'pending',
      },
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function getUserApplications(userId: string): Promise<Application[]> {
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
  return data || []
}

export async function getJobApplications(jobId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles (
        full_name,
        email
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
  return data || []
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
) {
  const { data, error } = await (supabase
    .from('applications') as any)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error
  return data as any
}