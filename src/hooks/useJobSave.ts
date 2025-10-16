'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { saveJob, unsaveJob, getSavedJobs } from '@/lib/mockData'
import { useToast } from '@/components/Toast'

/**
 * 채용공고 저장/해제 관리 Hook
 *
 * @example
 * const { savedJobs, isSaved, toggleSave } = useJobSave()
 *
 * <button onClick={() => toggleSave('job-001')}>
 *   {isSaved('job-001') ? '저장됨' : '저장'}
 * </button>
 */
export function useJobSave() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [savedJobs, setSavedJobs] = useState<string[]>([])

  // 초기 로드: 저장된 공고 목록 가져오기
  useEffect(() => {
    if (user) {
      const saved = getSavedJobs(user.id)
      setSavedJobs(saved)
    } else {
      setSavedJobs([])
    }
  }, [user])

  // 특정 공고가 저장되어 있는지 확인
  const isSaved = useCallback((jobId: string): boolean => {
    return savedJobs.includes(jobId)
  }, [savedJobs])

  // 저장/해제 토글
  const toggleSave = useCallback((jobId: string) => {
    if (!user) {
      showToast('warning', '로그인이 필요합니다')
      return
    }

    const saved = isSaved(jobId)

    if (saved) {
      // 저장 해제
      unsaveJob(user.id, jobId)
      setSavedJobs(prev => prev.filter(id => id !== jobId))
      showToast('info', '저장이 해제되었습니다')
    } else {
      // 저장
      saveJob(user.id, jobId)
      setSavedJobs(prev => [...prev, jobId])
      showToast('success', '공고가 저장되었습니다')
    }
  }, [user, isSaved, showToast])

  // 저장 (저장만 실행)
  const save = useCallback((jobId: string) => {
    if (!user) {
      showToast('warning', '로그인이 필요합니다')
      return
    }

    if (!isSaved(jobId)) {
      saveJob(user.id, jobId)
      setSavedJobs(prev => [...prev, jobId])
      showToast('success', '공고가 저장되었습니다')
    }
  }, [user, isSaved, showToast])

  // 해제 (해제만 실행)
  const unsave = useCallback((jobId: string) => {
    if (!user) return

    if (isSaved(jobId)) {
      unsaveJob(user.id, jobId)
      setSavedJobs(prev => prev.filter(id => id !== jobId))
      showToast('info', '저장이 해제되었습니다')
    }
  }, [user, isSaved, showToast])

  return {
    savedJobs,      // 저장된 공고 ID 배열
    isSaved,        // (jobId) => boolean
    toggleSave,     // (jobId) => void - 저장/해제 토글
    save,           // (jobId) => void - 저장만
    unsave,         // (jobId) => void - 해제만
  }
}
