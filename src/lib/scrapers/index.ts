/**
 * 웹 스크레이핑 유틸리티
 *
 * 실제 채용 사이트에서 공고를 크롤링하기 위한 스크레이퍼
 *
 * 주의사항:
 * 1. 실제 프로덕션 환경에서는 Puppeteer를 사용해야 합니다
 * 2. 각 사이트의 robots.txt와 이용약관을 준수해야 합니다
 * 3. Rate limiting을 적용하여 서버에 부담을 주지 않아야 합니다
 * 4. 사이트 구조가 변경될 수 있으므로 정기적인 업데이트가 필요합니다
 */

// 타입 정의는 별도 파일에서 import (클라이언트 번들링 방지)
export type { ScraperParams, ScrapedJob } from './types'
import type { ScraperParams, ScrapedJob } from './types'

/**
 * 사람인 스크레이퍼
 */
export async function scrapeSaramin(params: ScraperParams): Promise<ScrapedJob[]> {
  const { crawlSaramin } = await import('../crawling/saraminCrawler')
  return crawlSaramin(params)
}

/**
 * 잡코리아 스크레이퍼
 */
export async function scrapeJobKorea(params: ScraperParams): Promise<ScrapedJob[]> {
  const { crawlJobKorea } = await import('../crawling/jobkoreaCrawler')
  return crawlJobKorea(params)
}

/**
 * 원티드 스크레이퍼
 */
export async function scrapeWanted(params: ScraperParams): Promise<ScrapedJob[]> {
  const { crawlWanted } = await import('../crawling/wantedCrawler')
  return crawlWanted(params)
}

/**
 * 인크루트 스크레이퍼
 */
export async function scrapeIncruit(params: ScraperParams): Promise<ScrapedJob[]> {
  const { crawlIncruit } = await import('../crawling/incruitCrawler')
  return crawlIncruit(params)
}

/**
 * 잡플래닛 스크레이퍼
 */
export async function scrapeJobPlanet(params: ScraperParams): Promise<ScrapedJob[]> {
  const { crawlJobPlanet } = await import('../crawling/jobplanetCrawler')
  return crawlJobPlanet(params)
}

// ============================================================================
// URL 빌더 함수들
// ============================================================================

function buildSaraminSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.saramin.co.kr/zf_user/search'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('searchword', params.keyword)

  // 지역 코드 매핑
  if (params.location) {
    const locationCodes: Record<string, string> = {
      '서울': '101000',
      '경기': '102000',
      '인천': '108000',
      '부산': '106000',
      '대구': '104000',
      '대전': '105000',
      '광주': '103000',
      '울산': '107000',
      '세종': '118000',
      '강원': '109000',
      '충북': '111000',
      '충남': '110000',
      '전북': '112000',
      '전남': '113000',
      '경북': '114000',
      '경남': '115000',
      '제주': '116000'
    }
    const code = locationCodes[params.location]
    if (code) searchParams.append('loc_mcd', code)
  }

  // 경력
  if (params.minExperience !== undefined || params.maxExperience !== undefined) {
    const min = params.minExperience || 0
    const max = params.maxExperience || 99
    searchParams.append('exp_cd', `${min},${max}`)
  }

  // 연봉
  if (params.minSalary) {
    searchParams.append('sal_type', '1')
    searchParams.append('sal', String(params.minSalary * 10000))
  }

  // 근무 형태
  if (params.employmentType) {
    const typeCodes: Record<string, string> = {
      'onsite': '1',
      'remote': '4',
      'dispatch': '3'
    }
    const code = typeCodes[params.employmentType]
    if (code) searchParams.append('job_type', code)
  }

  return `${baseUrl}?${searchParams.toString()}`
}

function buildJobKoreaSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.jobkorea.co.kr/Search/'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('stext', params.keyword)

  // 지역
  if (params.location) {
    const locationCodes: Record<string, string> = {
      '서울': '1',
      '경기': '2',
      '인천': '3',
      '부산': '4',
      '대구': '5',
      '대전': '6',
      '광주': '7',
      '울산': '8',
      '세종': '9',
      '강원': '10',
      '충북': '11',
      '충남': '12',
      '전북': '13',
      '전남': '14',
      '경북': '15',
      '경남': '16',
      '제주': '17'
    }
    const code = locationCodes[params.location]
    if (code) searchParams.append('local', code)
  }

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('exp_min', String(params.minExperience))
  }
  if (params.maxExperience !== undefined) {
    searchParams.append('exp_max', String(params.maxExperience))
  }

  return `${baseUrl}?${searchParams.toString()}`
}

function buildWantedSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.wanted.co.kr/search'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('query', params.keyword)

  // 지역
  if (params.location) {
    const locationTags: Record<string, string> = {
      '서울': 'locations.seoul',
      '경기': 'locations.gyeonggi',
      '부산': 'locations.busan',
      '대구': 'locations.daegu',
      '인천': 'locations.incheon',
      '광주': 'locations.gwangju',
      '대전': 'locations.daejeon',
      '울산': 'locations.ulsan'
    }
    const tag = locationTags[params.location]
    if (tag) searchParams.append('tag_type_ids[]', tag)
  }

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('years', String(params.minExperience))
  }

  return `${baseUrl}?${searchParams.toString()}`
}

function buildIncruitSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.incruit.com/job/search.asp'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('keyword', params.keyword)
  if (params.location) searchParams.append('region', params.location)

  // 경력
  if (params.minExperience !== undefined || params.maxExperience !== undefined) {
    const min = params.minExperience || 0
    const max = params.maxExperience || 99
    searchParams.append('career', `${min}-${max}`)
  }

  return `${baseUrl}?${searchParams.toString()}`
}

function buildJobPlanetSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.jobplanet.co.kr/job_postings/search'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('query', params.keyword)
  if (params.location) searchParams.append('location', params.location)

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('career_min', String(params.minExperience))
  }
  if (params.maxExperience !== undefined) {
    searchParams.append('career_max', String(params.maxExperience))
  }

  return `${baseUrl}?${searchParams.toString()}`
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * Rate limiting을 위한 딜레이 함수
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 여러 사이트를 병렬로 크롤링
 */
export async function scrapeAllSites(
  params: ScraperParams,
  options: {
    validate?: boolean
    removeDuplicates?: boolean
  } = {}
): Promise<ScrapedJob[]> {
  const { validate = true, removeDuplicates: removeDups = true } = options

  const results = await Promise.allSettled([
    scrapeSaramin(params),
    scrapeJobKorea(params),
    scrapeWanted(params),
    scrapeIncruit(params),
    scrapeJobPlanet(params)
  ])

  const allJobs: ScrapedJob[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    const siteName = ['Saramin', 'JobKorea', 'Wanted', 'Incruit', 'JobPlanet'][index]

    if (result.status === 'fulfilled') {
      allJobs.push(...result.value)
      console.log(`[${siteName}] Successfully scraped ${result.value.length} jobs`)
    } else {
      errors.push(`[${siteName}] ${result.reason}`)
      console.error(`[${siteName}] Scraping failed:`, result.reason)
    }
  })

  if (errors.length > 0) {
    console.warn('Some scrapers failed:', errors)
  }

  let finalJobs = allJobs

  // 중복 제거
  if (removeDups && allJobs.length > 0) {
    const { removeDuplicates } = await import('../crawling/validator')
    const result = removeDuplicates(allJobs)
    finalJobs = result.unique
    if (result.duplicates > 0) {
      console.log(`🔄 중복 제거: ${result.duplicates}건`)
    }
  }

  // 검증
  if (validate && finalJobs.length > 0) {
    const { validateJobs, printValidationReport } = await import('../crawling/validator')
    const report = validateJobs(finalJobs)
    printValidationReport(report)

    // 유효한 공고만 반환
    const validJobIds = new Set(
      report.details.filter(d => d.valid).map(d => d.jobId)
    )
    finalJobs = finalJobs.filter(job => validJobIds.has(job.id))
  }

  return finalJobs
}
