/**
 * 뉴스 관리 메인 인터페이스
 * 크롤링, 저장, 분석 등 모든 뉴스 관련 기능 통합
 */

export * from './types'
export * from './companyDictionary'
export * from './analyzer'
export * from './storage'

import type { NewsArticle, CompanyNewsReport, NewsScraperParams } from './types'
import { generateCompanyReports } from './analyzer'
import {
  getNewsArticles,
  getCompanyReports,
  isNewsCacheExpired,
  cacheNewsData,
  getNewsMetadata
} from './storage'

/**
 * 내부 헬퍼: API에서 뉴스 데이터 가져오기
 */
async function fetchNewsFromAPI(params?: NewsScraperParams): Promise<{
  articles: NewsArticle[]
  companyReports: CompanyNewsReport[]
}> {
  // Query params 구성
  const queryParams = new URLSearchParams()
  if (params?.category) queryParams.set('category', params.category)
  if (params?.source) queryParams.set('source', params.source)
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const url = `/api/news/crawl${queryParams.toString() ? '?' + queryParams.toString() : ''}`

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Unknown error occurred')
  }

  // 소스별 분류
  const sourceBreakdown: Record<string, number> = {}
  for (const article of data.articles) {
    sourceBreakdown[article.source] = (sourceBreakdown[article.source] || 0) + 1
  }

  // 기업 리포트는 현재 사용하지 않음
  const companyReports: CompanyNewsReport[] = []

  // 캐시에 저장
  cacheNewsData(data.articles, companyReports, sourceBreakdown)

  return {
    articles: data.articles,
    companyReports
  }
}

/**
 * 뉴스 데이터 가져오기 (캐시 우선)
 * 캐시가 만료되었거나 없으면 새로 크롤링
 */
export async function fetchNews(params?: NewsScraperParams): Promise<{
  articles: NewsArticle[]
  companyReports: CompanyNewsReport[]
}> {
  // 캐시가 유효하면 캐시 데이터 반환
  if (!isNewsCacheExpired()) {
    const articles = getNewsArticles()
    const reports = getCompanyReports()

    if (articles.length > 0) {
      return {
        articles,
        companyReports: reports
      }
    }
  }

  // 캐시가 없거나 만료되었으면 API 호출
  try {
    return await fetchNewsFromAPI(params)
  } catch (error) {
    console.error('Error fetching news:', error)

    // 에러 발생 시 캐시된 데이터라도 반환 (stale-while-revalidate)
    const articles = getNewsArticles()
    const reports = getCompanyReports()

    return {
      articles,
      companyReports: reports
    }
  }
}

/**
 * 강제 새로고침 (캐시 무시하고 새로 크롤링)
 */
export async function refreshNews(params?: NewsScraperParams): Promise<{
  articles: NewsArticle[]
  companyReports: CompanyNewsReport[]
}> {
  return await fetchNewsFromAPI(params)
}

/**
 * 뉴스 메타데이터 가져오기
 */
export function getNewsCrawlMetadata() {
  return getNewsMetadata()
}
