/**
 * 뉴스 데이터 저장 및 관리
 * localStorage 기반 (추후 Supabase 또는 IndexedDB로 확장 가능)
 */

import type { NewsArticle, CompanyNewsReport, NewsCrawlMetadata } from './types'

const NEWS_STORAGE_KEY = 'jobai_news_articles'
const NEWS_METADATA_KEY = 'jobai_news_metadata'
const NEWS_REPORTS_KEY = 'jobai_news_reports'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24시간

/**
 * 뉴스 기사 저장
 */
export function saveNewsArticles(articles: NewsArticle[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(articles))
  } catch (error) {
    console.error('Failed to save news articles:', error)
  }
}

/**
 * 뉴스 기사 불러오기
 */
export function getNewsArticles(): NewsArticle[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(NEWS_STORAGE_KEY)
    if (!stored) return []

    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load news articles:', error)
    return []
  }
}

/**
 * 기업 리포트 저장
 */
export function saveCompanyReports(reports: CompanyNewsReport[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(NEWS_REPORTS_KEY, JSON.stringify(reports))
  } catch (error) {
    console.error('Failed to save company reports:', error)
  }
}

/**
 * 기업 리포트 불러오기
 */
export function getCompanyReports(): CompanyNewsReport[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(NEWS_REPORTS_KEY)
    if (!stored) return []

    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load company reports:', error)
    return []
  }
}

/**
 * 뉴스 메타데이터 저장
 */
export function saveNewsMetadata(metadata: NewsCrawlMetadata): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(NEWS_METADATA_KEY, JSON.stringify(metadata))
  } catch (error) {
    console.error('Failed to save news metadata:', error)
  }
}

/**
 * 뉴스 메타데이터 불러오기
 */
export function getNewsMetadata(): NewsCrawlMetadata | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(NEWS_METADATA_KEY)
    if (!stored) return null

    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load news metadata:', error)
    return null
  }
}

/**
 * 뉴스 캐시 만료 여부 확인
 */
export function isNewsCacheExpired(): boolean {
  const metadata = getNewsMetadata()
  if (!metadata) return true

  const expiresAt = new Date(metadata.expiresAt).getTime()
  return Date.now() > expiresAt
}

/**
 * 뉴스 데이터 캐싱 (기사 + 리포트 + 메타데이터)
 */
export function cacheNewsData(
  articles: NewsArticle[],
  reports: CompanyNewsReport[],
  sourceBreakdown: Record<string, number>
): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_DURATION)

  const metadata: NewsCrawlMetadata = {
    lastCrawledAt: now.toISOString(),
    totalArticles: articles.length,
    sourceBreakdown,
    companyCount: reports.length,
    expiresAt: expiresAt.toISOString()
  }

  saveNewsArticles(articles)
  saveCompanyReports(reports)
  saveNewsMetadata(metadata)
}

/**
 * 뉴스 데이터 전체 삭제
 */
export function clearNewsCache(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(NEWS_STORAGE_KEY)
    localStorage.removeItem(NEWS_REPORTS_KEY)
    localStorage.removeItem(NEWS_METADATA_KEY)
  } catch (error) {
    console.error('Failed to clear news cache:', error)
  }
}

/**
 * 특정 기업의 뉴스만 가져오기
 */
export function getNewsByCompany(companyName: string): NewsArticle[] {
  const articles = getNewsArticles()
  return articles.filter(article => article.company === companyName)
}

/**
 * 특정 출처의 뉴스만 가져오기
 */
export function getNewsBySource(source: string): NewsArticle[] {
  const articles = getNewsArticles()
  return articles.filter(article => article.source === source)
}

/**
 * 키워드로 뉴스 검색
 */
export function searchNews(keyword: string): NewsArticle[] {
  const articles = getNewsArticles()
  const keywordLower = keyword.toLowerCase()

  return articles.filter(article =>
    article.title.toLowerCase().includes(keywordLower) ||
    article.content.toLowerCase().includes(keywordLower)
  )
}

/**
 * 날짜 범위로 뉴스 필터링
 */
export function getNewsByDateRange(startDate: Date, endDate: Date): NewsArticle[] {
  const articles = getNewsArticles()

  return articles.filter(article => {
    const publishedDate = new Date(article.publishedAt)
    return publishedDate >= startDate && publishedDate <= endDate
  })
}

/**
 * 뉴스 통계 가져오기
 */
export function getNewsStatistics() {
  const articles = getNewsArticles()
  const metadata = getNewsMetadata()

  if (articles.length === 0) {
    return {
      totalArticles: 0,
      totalCompanies: 0,
      sourceBreakdown: {},
      lastCrawledAt: null,
      isExpired: true
    }
  }

  const companies = new Set(articles.filter(a => a.company).map(a => a.company))

  return {
    totalArticles: articles.length,
    totalCompanies: companies.size,
    sourceBreakdown: metadata?.sourceBreakdown || {},
    lastCrawledAt: metadata?.lastCrawledAt || null,
    isExpired: isNewsCacheExpired()
  }
}
