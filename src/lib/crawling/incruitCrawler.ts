/**
 * 인크루트 실제 크롤링 구현
 */

import puppeteer, { Browser } from 'puppeteer'
import * as cheerio from 'cheerio'
import { ScrapedJob, ScraperParams } from '../scrapers'

/**
 * 인크루트 크롤링
 */
export async function crawlIncruit(params: ScraperParams): Promise<ScrapedJob[]> {
  let browser: Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    const searchUrl = buildIncruitSearchUrl(params)
    console.log(`🔍 [인크루트] ${searchUrl}`)

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // 공고 목록 대기
    await page.waitForSelector('.c_col', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 공고 목록을 찾을 수 없습니다')
    })

    const html = await page.content()
    const $ = cheerio.load(html)

    const jobs: ScrapedJob[] = []
    const limit = params.limit || 50

    // 인크루트의 공고 목록 파싱
    $('.c_col').each((index, element) => {
      if (index >= limit) return false

      try {
        const $el = $(element)

        // 제목과 링크
        const titleEl = $el.find('.cl_top a, .job_name a')
        const title = titleEl.text().trim()
        const link = titleEl.attr('href') || ''

        // 회사명
        const companyName = $el.find('.cpname, .company_name').text().trim()

        // 지역
        const locationText = $el.find('.c_local, .location').text().trim()

        // 경력
        const experienceText = $el.find('.c_career, .career').text().trim()

        // 학력
        const educationText = $el.find('.c_edu, .education').text().trim()

        // 고용형태
        const employmentTypeText = $el.find('.c_pay, .employment_type').text().trim()

        // 마감일
        const deadlineText = $el.find('.c_date, .end_date').text().trim()
        const deadline = parseDeadline(deadlineText)

        // URL 생성
        let sourceUrl = link
        if (link && !link.startsWith('http')) {
          sourceUrl = `https://www.incruit.com${link}`
        }

        // ID 추출
        const idMatch = sourceUrl.match(/no=(\d+)/)
        const jobId = idMatch ? `incruit-${idMatch[1]}` : `incruit-${Date.now()}-${index}`

        // 경력 파싱
        const experience = parseExperience(experienceText)

        // 기본 검증
        if (!title || !companyName) {
          return // continue
        }

        const job: ScrapedJob = {
          id: jobId,
          title,
          company: companyName,
          companyId: `company-${companyName.replace(/\s+/g, '-').toLowerCase()}`,
          location: locationText || params.location || '서울',
          salary: { min: 3000, max: 6000 },
          experience,
          education: educationText || '학력무관',
          employmentType: employmentTypeText || '정규직',
          workType: determineWorkType(employmentTypeText),
          description: title,
          requirements: [experienceText, educationText].filter(Boolean),
          skills: [],
          industry: params.industry || 'IT/소프트웨어',
          deadline,
          postedAt: new Date().toISOString(),
          sourceUrl,
          source: 'incruit'
        }

        jobs.push(job)
      } catch (error) {
        console.error('[인크루트] 공고 파싱 실패:', error)
      }
    })

    console.log(`✅ [인크루트] ${jobs.length}개 공고 수집 완료`)
    return jobs

  } catch (error) {
    console.error('❌ [인크루트] 크롤링 실패:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 인크루트 검색 URL 생성
 */
function buildIncruitSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.incruit.com/job/search.asp'
  const searchParams = new URLSearchParams()

  if (params.keyword) {
    searchParams.append('keyword', params.keyword)
  }

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
    if (code) {
      searchParams.append('region', code)
    }
  }

  // 경력 (형식: "0-5")
  if (params.minExperience !== undefined || params.maxExperience !== undefined) {
    const min = params.minExperience || 0
    const max = params.maxExperience || 99
    searchParams.append('career', `${min}-${max}`)
  }

  // 고용형태
  if (params.employmentType) {
    const typeCodes: Record<string, string> = {
      '정규직': '1',
      '계약직': '2',
      '파견직': '3',
      '인턴': '4',
      '아르바이트': '5'
    }
    const code = typeCodes[params.employmentType]
    if (code) {
      searchParams.append('emp_type', code)
    }
  }

  return `${baseUrl}?${searchParams.toString()}`
}

/**
 * 마감일 파싱
 */
function parseDeadline(deadlineText: string): string {
  if (!deadlineText) {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString()
  }

  // "상시채용" 처리
  if (deadlineText.includes('상시') || deadlineText.includes('채용시')) {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString()
  }

  // "YYYY-MM-DD" 형식
  const dateMatch = deadlineText.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toISOString()
  }

  // "MM.DD" 형식
  const shortDateMatch = deadlineText.match(/(\d{2})\.(\d{2})/)
  if (shortDateMatch) {
    const [, month, day] = shortDateMatch
    const year = new Date().getFullYear()
    const date = new Date(year, parseInt(month) - 1, parseInt(day))
    return date.toISOString()
  }

  // "D-N" 형식
  const dDayMatch = deadlineText.match(/D-(\d+)/)
  if (dDayMatch) {
    const days = parseInt(dDayMatch[1])
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString()
  }

  // 기본값: 30일 후
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString()
}

/**
 * 경력 파싱
 */
function parseExperience(experienceText: string): { min: number; max: number } | undefined {
  if (!experienceText) return undefined

  // "신입" 또는 "경력무관"
  if (experienceText.includes('신입') || experienceText.includes('무관')) {
    return { min: 0, max: 0 }
  }

  // "N년~M년" 형식
  const rangeMatch = experienceText.match(/(\d+)년?\s*~\s*(\d+)년?/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    }
  }

  // "N년 이상" 형식
  const minMatch = experienceText.match(/(\d+)년?\s*이상/)
  if (minMatch) {
    const years = parseInt(minMatch[1])
    return {
      min: years,
      max: years + 10
    }
  }

  // "경력 N년" 형식
  const yearMatch = experienceText.match(/(\d+)년/)
  if (yearMatch) {
    const years = parseInt(yearMatch[1])
    return {
      min: years,
      max: years + 3
    }
  }

  return undefined
}

/**
 * 근무 형태 결정
 */
function determineWorkType(employmentType: string): 'onsite' | 'remote' | 'dispatch' {
  if (!employmentType) return 'onsite'

  if (employmentType.includes('재택') || employmentType.includes('원격')) {
    return 'remote'
  }
  if (employmentType.includes('파견') || employmentType.includes('계약')) {
    return 'dispatch'
  }
  return 'onsite'
}
