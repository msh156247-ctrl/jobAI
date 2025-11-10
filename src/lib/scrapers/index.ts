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

export interface ScraperParams {
  keyword?: string
  industry?: string
  subIndustry?: string
  location?: string
  minSalary?: number
  maxSalary?: number
  minExperience?: number
  maxExperience?: number
  employmentType?: string
  techStack?: string
  benefits?: string
  limit?: number // 크롤링할 최대 공고 수
}

export interface ScrapedJob {
  id: string
  title: string
  company: string
  companyId: string
  location: string
  salary: {
    min: number
    max: number
  }
  experience?: {
    min: number
    max: number
  }
  education?: string
  employmentType?: string
  workType: 'onsite' | 'remote' | 'dispatch'
  description: string
  requirements: string[]
  skills: string[]
  keywords?: string[]
  industry: string
  deadline: string
  postedAt: string
  sourceUrl: string
  source: string
  companyLogo?: string
}

/**
 * 사람인 스크레이퍼
 */
export async function scrapeSaramin(params: ScraperParams): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = []

  try {
    // URL 생성
    const url = buildSaraminSearchUrl(params)
    console.log('[Saramin] Scraping URL:', url)

    // TODO: Puppeteer를 사용한 실제 크롤링
    // 현재는 실제 구현이 필요합니다

    // 예시 구현:
    // const browser = await puppeteer.launch({ headless: true })
    // const page = await browser.newPage()
    // await page.goto(url)
    //
    // const jobElements = await page.$$('.item_recruit')
    // for (const element of jobElements) {
    //   const job = await extractSaraminJob(element, page)
    //   jobs.push(job)
    // }
    //
    // await browser.close()

    console.log('[Saramin] Found', jobs.length, 'jobs')
  } catch (error) {
    console.error('[Saramin] Scraping error:', error)
    throw error
  }

  return jobs
}

/**
 * 잡코리아 스크레이퍼
 */
export async function scrapeJobKorea(params: ScraperParams): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = []

  try {
    const url = buildJobKoreaSearchUrl(params)
    console.log('[JobKorea] Scraping URL:', url)

    // TODO: 실제 크롤링 구현

    console.log('[JobKorea] Found', jobs.length, 'jobs')
  } catch (error) {
    console.error('[JobKorea] Scraping error:', error)
    throw error
  }

  return jobs
}

/**
 * 원티드 스크레이퍼
 */
export async function scrapeWanted(params: ScraperParams): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = []

  try {
    const url = buildWantedSearchUrl(params)
    console.log('[Wanted] Scraping URL:', url)

    // TODO: 실제 크롤링 구현
    // 원티드는 GraphQL API를 사용할 수 있음

    console.log('[Wanted] Found', jobs.length, 'jobs')
  } catch (error) {
    console.error('[Wanted] Scraping error:', error)
    throw error
  }

  return jobs
}

/**
 * 인크루트 스크레이퍼
 */
export async function scrapeIncruit(params: ScraperParams): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = []

  try {
    const url = buildIncruitSearchUrl(params)
    console.log('[Incruit] Scraping URL:', url)

    // TODO: 실제 크롤링 구현

    console.log('[Incruit] Found', jobs.length, 'jobs')
  } catch (error) {
    console.error('[Incruit] Scraping error:', error)
    throw error
  }

  return jobs
}

/**
 * 잡플래닛 스크레이퍼
 */
export async function scrapeJobPlanet(params: ScraperParams): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = []

  try {
    const url = buildJobPlanetSearchUrl(params)
    console.log('[JobPlanet] Scraping URL:', url)

    // TODO: 실제 크롤링 구현

    console.log('[JobPlanet] Found', jobs.length, 'jobs')
  } catch (error) {
    console.error('[JobPlanet] Scraping error:', error)
    throw error
  }

  return jobs
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
export async function scrapeAllSites(params: ScraperParams): Promise<ScrapedJob[]> {
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

  return allJobs
}
