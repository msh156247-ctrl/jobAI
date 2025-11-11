/**
 * 사람인 실제 크롤링 구현
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as cheerio from 'cheerio'
import { ScrapedJob, ScraperParams } from '../scrapers'
import { loadPattern, savePattern } from './patternCache'
import { learnURLPattern } from './urlPatternLearner'

/**
 * 사람인 크롤링
 */
export async function crawlSaramin(params: ScraperParams): Promise<ScrapedJob[]> {
  let browser: Browser | null = null

  try {
    // 패턴 캐시 확인
    let pattern = loadPattern('saramin.co.kr')

    if (!pattern) {
      console.log('📚 사람인 패턴 학습 중...')
      pattern = await learnURLPattern('https://www.saramin.co.kr/zf_user/jobs/list/job-category?cat_cd=214', {
        headless: true,
        timeout: 30000
      })
      savePattern(pattern)
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // 검색 URL 생성
    const searchUrl = buildSaraminSearchUrl(params)
    console.log(`🔍 [사람인] ${searchUrl}`)

    // 페이지 이동
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('.item_recruit', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 공고 목록을 찾을 수 없습니다')
    })

    // HTML 가져오기
    const html = await page.content()
    const $ = cheerio.load(html)

    const jobs: ScrapedJob[] = []
    const limit = params.limit || 50

    // 공고 목록 파싱
    $('.item_recruit').each((index, element) => {
      if (index >= limit) return false // 제한 도달

      try {
        const $el = $(element)

        // 기본 정보
        const titleEl = $el.find('.job_tit a')
        const title = titleEl.text().trim()
        const link = titleEl.attr('href') || ''
        const companyName = $el.find('.corp_name a').text().trim()
        const locationText = $el.find('.job_condition span:first').text().trim()
        const experienceText = $el.find('.job_condition span:nth-child(2)').text().trim()
        const educationText = $el.find('.job_condition span:nth-child(3)').text().trim()
        const employmentTypeText = $el.find('.job_condition span:nth-child(4)').text().trim()

        // 마감일
        const deadlineText = $el.find('.job_date .date').text().trim()
        const deadline = parseDeadline(deadlineText)

        // 기술 스택 (있는 경우)
        const skills: string[] = []
        $el.find('.job_sector a').each((i, el) => {
          skills.push($(el).text().trim())
        })

        // URL 생성
        let sourceUrl = link
        if (!sourceUrl.startsWith('http')) {
          sourceUrl = `https://www.saramin.co.kr${link}`
        }

        // ID 추출
        const idMatch = sourceUrl.match(/rec_idx=(\d+)/)
        const jobId = idMatch ? `saramin-${idMatch[1]}` : `saramin-${Date.now()}-${index}`

        // 경력 파싱
        const experience = parseExperience(experienceText)

        // 연봉 정보 (사람인은 목록에서 연봉을 보여주지 않음)
        const salary = {
          min: 3000,
          max: 7000
        }

        const job: ScrapedJob = {
          id: jobId,
          title,
          company: companyName,
          companyId: `company-${companyName.replace(/\s+/g, '-').toLowerCase()}`,
          location: locationText || '서울',
          salary,
          experience,
          education: educationText || '학력무관',
          employmentType: employmentTypeText || '정규직',
          workType: determineWorkType(employmentTypeText),
          description: title,
          requirements: [experienceText, educationText].filter(Boolean),
          skills,
          keywords: [...skills],
          industry: params.industry || 'IT/소프트웨어',
          deadline,
          postedAt: new Date().toISOString(),
          sourceUrl,
          source: 'saramin'
        }

        jobs.push(job)
      } catch (error) {
        console.error('공고 파싱 실패:', error)
      }
    })

    console.log(`✅ [사람인] ${jobs.length}개 공고 수집 완료`)

    return jobs

  } catch (error) {
    console.error('❌ [사람인] 크롤링 실패:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 검색 URL 생성
 */
function buildSaraminSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.saramin.co.kr/zf_user/search'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('searchword', params.keyword)

  // 지역 코드
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
      '세종': '118000'
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

  // 페이지당 결과 수
  searchParams.append('count', String(params.limit || 50))

  return `${baseUrl}?${searchParams.toString()}`
}

/**
 * 마감일 파싱
 */
function parseDeadline(deadlineText: string): string {
  if (!deadlineText) {
    // 기본값: 30일 후
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString()
  }

  if (deadlineText.includes('상시')) {
    // 상시 채용: 1년 후
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString()
  }

  // "~MM/DD" 형식
  const match = deadlineText.match(/~(\d{2})\/(\d{2})/)
  if (match) {
    const [, month, day] = match
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

  // 기본값
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString()
}

/**
 * 경력 파싱
 */
function parseExperience(experienceText: string): { min: number; max: number } | undefined {
  if (!experienceText) return undefined

  if (experienceText.includes('신입') || experienceText.includes('무관')) {
    return { min: 0, max: 0 }
  }

  // "경력 3~5년" 형식
  const rangeMatch = experienceText.match(/(\d+)~(\d+)/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    }
  }

  // "경력 3년↑" 형식
  const minMatch = experienceText.match(/(\d+)년/)
  if (minMatch) {
    const years = parseInt(minMatch[1])
    return {
      min: years,
      max: years + 10
    }
  }

  return undefined
}

/**
 * 근무 형태 결정
 */
function determineWorkType(employmentType: string): 'onsite' | 'remote' | 'dispatch' {
  if (employmentType.includes('재택') || employmentType.includes('원격')) {
    return 'remote'
  }
  if (employmentType.includes('파견') || employmentType.includes('계약')) {
    return 'dispatch'
  }
  return 'onsite'
}
