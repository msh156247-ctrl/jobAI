/**
 * 잡플래닛 실제 크롤링 구현
 */

import puppeteer, { Browser } from 'puppeteer'
import * as cheerio from 'cheerio'
import { ScrapedJob, ScraperParams } from '../scrapers'

/**
 * 잡플래닛 크롤링
 */
export async function crawlJobPlanet(params: ScraperParams): Promise<ScrapedJob[]> {
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

    const searchUrl = buildJobPlanetSearchUrl(params)
    console.log(`🔍 [잡플래닛] ${searchUrl}`)

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // 공고 목록 대기
    await page.waitForSelector('.job_listing_card, .jply_rec_list', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 공고 목록을 찾을 수 없습니다')
    })

    const html = await page.content()
    const $ = cheerio.load(html)

    const jobs: ScrapedJob[] = []
    const limit = params.limit || 50

    // 잡플래닛의 공고 목록 파싱
    $('.job_listing_card, .jply_rec_list').each((index, element) => {
      if (index >= limit) return false

      try {
        const $el = $(element)

        // 제목과 링크
        const titleEl = $el.find('.job_title a, .tit a')
        const title = titleEl.text().trim()
        const link = titleEl.attr('href') || ''

        // 회사명
        const companyName = $el.find('.company_name, .company').text().trim()

        // 지역
        const locationText = $el.find('.location, .job_spec_loc').text().trim()

        // 경력
        const experienceText = $el.find('.experience, .job_spec_exp').text().trim()

        // 학력
        const educationText = $el.find('.education, .job_spec_edu').text().trim()

        // 연봉 정보 (잡플래닛은 연봉 정보를 제공)
        const salaryText = $el.find('.salary, .job_spec_salary').text().trim()
        const salary = parseSalary(salaryText)

        // 마감일
        const deadlineText = $el.find('.deadline, .job_date').text().trim()
        const deadline = parseDeadline(deadlineText)

        // 회사 평점 (잡플래닛 특징)
        const ratingText = $el.find('.rating, .star_point').text().trim()
        const rating = parseFloat(ratingText) || 0

        // URL 생성
        let sourceUrl = link
        if (link && !link.startsWith('http')) {
          sourceUrl = `https://www.jobplanet.co.kr${link}`
        }

        // ID 추출
        const idMatch = sourceUrl.match(/\/(\d+)/)
        const jobId = idMatch ? `jobplanet-${idMatch[1]}` : `jobplanet-${Date.now()}-${index}`

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
          salary,
          experience,
          education: educationText || '학력무관',
          workType: 'onsite',
          description: title,
          requirements: [experienceText, educationText].filter(Boolean),
          skills: [],
          keywords: rating > 0 ? [`평점 ${rating}점`] : [],
          industry: params.industry || 'IT/소프트웨어',
          deadline,
          postedAt: new Date().toISOString(),
          sourceUrl,
          source: 'jobplanet'
        }

        jobs.push(job)
      } catch (error) {
        console.error('[잡플래닛] 공고 파싱 실패:', error)
      }
    })

    console.log(`✅ [잡플래닛] ${jobs.length}개 공고 수집 완료`)
    return jobs

  } catch (error) {
    console.error('❌ [잡플래닛] 크롤링 실패:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 잡플래닛 검색 URL 생성
 */
function buildJobPlanetSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.jobplanet.co.kr/job_postings/search'
  const searchParams = new URLSearchParams()

  if (params.keyword) {
    searchParams.append('query', params.keyword)
  }

  // 지역
  if (params.location) {
    searchParams.append('location', params.location)
  }

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('career_min', String(params.minExperience))
  }
  if (params.maxExperience !== undefined) {
    searchParams.append('career_max', String(params.maxExperience))
  }

  // 연봉
  if (params.minSalary) {
    searchParams.append('salary_min', String(params.minSalary * 10000))
  }

  // 업종
  if (params.industry) {
    const industryCodes: Record<string, string> = {
      'IT/소프트웨어': 'it',
      '개발': 'development',
      '디자인': 'design',
      '마케팅': 'marketing',
      '영업': 'sales'
    }
    const code = industryCodes[params.industry]
    if (code) {
      searchParams.append('industry', code)
    }
  }

  return `${baseUrl}?${searchParams.toString()}`
}

/**
 * 연봉 파싱
 */
function parseSalary(salaryText: string): { min: number; max: number } {
  if (!salaryText) {
    return { min: 3000, max: 6000 }
  }

  // "회사내규" 또는 "면접후결정"
  if (salaryText.includes('내규') || salaryText.includes('면접') || salaryText.includes('협의')) {
    return { min: 3000, max: 6000 }
  }

  // "3000만원~5000만원" 형식
  const rangeMatch = salaryText.match(/(\d+)\s*만원?\s*~\s*(\d+)\s*만원?/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    }
  }

  // "3000만원 이상" 형식
  const minMatch = salaryText.match(/(\d+)\s*만원?\s*이상/)
  if (minMatch) {
    const min = parseInt(minMatch[1])
    return {
      min,
      max: min + 3000
    }
  }

  // "연봉 3000" 형식 (만원 단위)
  const amountMatch = salaryText.match(/(\d+)/)
  if (amountMatch) {
    const amount = parseInt(amountMatch[1])
    if (amount >= 1000) { // 1000만원 이상이면 유효한 연봉으로 간주
      return {
        min: amount,
        max: amount + 2000
      }
    }
  }

  return { min: 3000, max: 6000 }
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

  // "상시채용"
  if (deadlineText.includes('상시') || deadlineText.includes('채용시')) {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString()
  }

  // "YYYY.MM.DD" 형식
  const dateMatch = deadlineText.match(/(\d{4})\.(\d{2})\.(\d{2})/)
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
