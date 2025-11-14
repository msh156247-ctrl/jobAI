'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// User Profile from database
export interface UserProfile {
  user_id: string
  profile_image_url?: string
  introduction?: string
  location?: string
  industry?: string
  sub_industry?: string
  job_description?: string
  career_type?: 'newcomer' | 'junior' | 'mid-level' | 'senior' | 'expert'
  career_years?: number
  current_position?: string
  skills?: any
  preferred_locations?: string[]
  work_types?: string[]
  personalities?: string[]
  priorities?: any
  is_verified?: boolean
  verified_at?: string
  verification_method?: string
}

// Combined user info
export interface User {
  id: string
  email: string
  name?: string
  role: 'seeker' | 'employer' | 'admin'
  profile?: UserProfile
  created_at?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user from database
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Get user from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching user:', userError)
        return null
      }

      // If user doesn't exist in database, create it
      if (!userData) {
        const newUser = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          role: 'seeker' as const, // Default role
        }

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          return null
        }

        return createdUser
      }

      return userData
    } catch (error) {
      console.error('Error in fetchUserData:', error)
      return null
    }
  }

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()

      if (!supabaseUser) {
        setUser(null)
        setProfile(null)
        setSupabaseUser(null)
        return
      }

      setSupabaseUser(supabaseUser)

      // Fetch user data from database
      const userData = await fetchUserData(supabaseUser)
      if (userData) {
        setUser(userData as User)

        // Fetch user profile
        const profileData = await fetchUserProfile(supabaseUser.id)
        if (profileData) {
          setProfile(profileData as UserProfile)
          setUser(prev => prev ? { ...prev, profile: profileData as UserProfile } : null)
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      setProfile(null)
      setSupabaseUser(null)
    }
  }

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        fetchUserData(session.user).then(userData => {
          if (userData) {
            setUser(userData as User)
            fetchUserProfile(session.user.id).then(profileData => {
              if (profileData) {
                setProfile(profileData as UserProfile)
                setUser(prev => prev ? { ...prev, profile: profileData as UserProfile } : null)
              }
            })
          }
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        const userData = await fetchUserData(session.user)
        if (userData) {
          setUser(userData as User)
          const profileData = await fetchUserProfile(session.user.id)
          if (profileData) {
            setProfile(profileData as UserProfile)
            setUser(prev => prev ? { ...prev, profile: profileData as UserProfile } : null)
          }
        }
      } else {
        setUser(null)
        setProfile(null)
        setSupabaseUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSupabaseUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, supabaseUser, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}