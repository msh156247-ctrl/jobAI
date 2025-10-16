'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { SeekerProfile, CompanyMeta } from '@/types'
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage'

const STORAGE_KEY = 'jobai:profile'

// Re-export types for backward compatibility
export type {
  SeekerProfile,
  CompanyMeta,
  Skill,
  CareerHistory,
  Education,
  Certification,
  LanguageScore,
  PriorityItem
} from '@/types'

interface ProfileContextType {
  profile: SeekerProfile | null
  companyMeta: CompanyMeta | null
  updateProfile: (updates: Partial<SeekerProfile>) => void
  updateCompanyMeta: (meta: CompanyMeta) => void
  clearProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [companyMeta, setCompanyMeta] = useState<CompanyMeta | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setCompanyMeta(null)
      return
    }

    const storageKey = `${STORAGE_KEY}:${user.id}`
    const data = getStorageItem<any>(storageKey, null)

    if (data) {
      if (user.role === 'seeker') {
        setProfile(data.profile || null)
      } else if (user.role === 'employer') {
        setCompanyMeta(data.companyMeta || null)
      }
    } else {
      if (user.role === 'seeker') {
        const initialProfile: SeekerProfile = {
          name: user.name,
          email: user.email,
          phone: user.phone,
          educations: [],
          certifications: [],
          languageScores: [],
          careerType: 'newcomer',
          careerYears: 0,
          skills: [],
          personalities: [],
          preferredLocations: [],
          workTypes: [],
        }
        setProfile(initialProfile)
        setStorageItem(storageKey, { profile: initialProfile })
      }
    }
  }, [user])

  const updateProfile = (updates: Partial<SeekerProfile>) => {
    if (!user || user.role !== 'seeker') return

    const updated = { ...profile, ...updates } as SeekerProfile
    setProfile(updated)
    setStorageItem(`${STORAGE_KEY}:${user.id}`, { profile: updated })
  }

  const updateCompanyMeta = (meta: CompanyMeta) => {
    if (!user || user.role !== 'employer') return

    setCompanyMeta(meta)
    setStorageItem(`${STORAGE_KEY}:${user.id}`, { companyMeta: meta })
  }

  const clearProfile = () => {
    if (!user) return
    removeStorageItem(`${STORAGE_KEY}:${user.id}`)
    setProfile(null)
    setCompanyMeta(null)
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        companyMeta,
        updateProfile,
        updateCompanyMeta,
        clearProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}