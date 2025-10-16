import { supabase } from './supabase'
import { Database } from '@/types/database'

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type CompanyProfile = Database['public']['Tables']['company_profiles']['Row']

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createUserProfile(userId: string, profileData: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        user_id: userId,
        skills: profileData.skills || [],
        career_years: profileData.career_years || 0,
        location: profileData.location || null,
        bio: profileData.bio || null,
      },
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>) {
  const { data, error } = await (supabase
    .from('user_profiles') as any)
    .update({
      skills: profileData.skills,
      career_years: profileData.career_years,
      location: profileData.location,
      bio: profileData.bio,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createCompanyProfile(userId: string, profileData: Partial<CompanyProfile>) {
  const { data, error } = await supabase
    .from('company_profiles')
    .insert([
      {
        user_id: userId,
        company_name: profileData.company_name || '',
        description: profileData.description || null,
        industry: profileData.industry || null,
        location: profileData.location || null,
        website: profileData.website || null,
      },
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function updateCompanyProfile(userId: string, profileData: Partial<CompanyProfile>) {
  const { data, error } = await (supabase
    .from('company_profiles') as any)
    .update({
      company_name: profileData.company_name,
      description: profileData.description,
      industry: profileData.industry,
      location: profileData.location,
      website: profileData.website,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as any
}