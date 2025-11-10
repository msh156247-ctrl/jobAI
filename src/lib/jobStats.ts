// 채용 공고 통계 관리

interface JobStats {
  bookmarkedJobs: {
    jobId: string
    timestamp: string
    source: string
  }[]
  appliedJobs: {
    jobId: string
    timestamp: string
    source: string
  }[]
}

const STORAGE_KEY = 'jobai_job_stats'

/**
 * 통계 데이터 가져오기
 */
export function getJobStats(): JobStats {
  if (typeof window === 'undefined') {
    return { bookmarkedJobs: [], appliedJobs: [] }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { bookmarkedJobs: [], appliedJobs: [] }
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load job stats:', error)
    return { bookmarkedJobs: [], appliedJobs: [] }
  }
}

/**
 * 통계 데이터 저장
 */
function saveJobStats(stats: JobStats) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('Failed to save job stats:', error)
  }
}

/**
 * 즐겨찾기 기록 추가
 */
export function trackBookmark(jobId: string, source: string) {
  const stats = getJobStats()

  // 이미 존재하는지 확인
  const exists = stats.bookmarkedJobs.some(item => item.jobId === jobId)
  if (exists) return

  stats.bookmarkedJobs.push({
    jobId,
    timestamp: new Date().toISOString(),
    source
  })

  saveJobStats(stats)
}

/**
 * 즐겨찾기 기록 제거
 */
export function removeBookmark(jobId: string) {
  const stats = getJobStats()
  stats.bookmarkedJobs = stats.bookmarkedJobs.filter(item => item.jobId !== jobId)
  saveJobStats(stats)
}

/**
 * 지원하기 기록 추가
 */
export function trackApply(jobId: string, source: string) {
  const stats = getJobStats()

  // 이미 존재하는지 확인
  const exists = stats.appliedJobs.some(item => item.jobId === jobId)
  if (exists) return

  stats.appliedJobs.push({
    jobId,
    timestamp: new Date().toISOString(),
    source
  })

  saveJobStats(stats)
}

/**
 * 통계 데이터 초기화
 */
export function clearJobStats() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 출처별 통계 집계
 */
export function getStatsBySource() {
  const stats = getJobStats()

  const bookmarksBySource: Record<string, number> = {}
  const appliesBySource: Record<string, number> = {}

  stats.bookmarkedJobs.forEach(item => {
    bookmarksBySource[item.source] = (bookmarksBySource[item.source] || 0) + 1
  })

  stats.appliedJobs.forEach(item => {
    appliesBySource[item.source] = (appliesBySource[item.source] || 0) + 1
  })

  return { bookmarksBySource, appliesBySource }
}
