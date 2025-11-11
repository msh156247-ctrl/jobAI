/**
 * 잡코리아 실제 크롤링 구현
 */

import puppeteer, { Browser } from 'puppeteer'
import * as cheerio from 'cheerio'
import { ScrapedJob, ScraperParams } from '../scrapers'

/**
 * 잡코리아 크롤링
 */
export async function crawlJobKorea(params: ScraperParams): Promise<ScrapedJob[]> {
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

    const searchUrl = buildJobKoreaSearchUrl(params)
    console.log(`🔍 [잡코리아] ${searchUrl}`)

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    await page.waitForSelector('.list-post', { timeout: 10000 }).catch(() => {
      console.log('⚠️ 공고 목록을 찾을 수 없습니다')
    })

    const html = await page.content()
    const $ = cheerio.load(html)

    const jobs: ScrapedJob[] = []
    const limit = params.limit || 50

    $('.list-post').each((index, element) => {
      if (index >= limit) return false

      try {
        const $el = $(element)

        const titleEl = $el.find('.post-list-corp-name a')
        const title = titleEl.text().trim()
        const link = titleEl.attr('href') || ''
        const companyName = $el.find('.post-list-info .name').text().trim()
        const locationText = $el.find('.option-recruit .loc').text().trim()
        const experienceText = $el.find('.option-recruit .exp').text().trim()

        let sourceUrl = link
        if (!sourceUrl.startsWith('http')) {
          sourceUrl = `https://www.jobkorea.co.kr${link}`
        }

        const idMatch = sourceUrl.match(/GI_Read\/(\d+)/)
        const jobId = idMatch ? `jobkorea-${idMatch[1]}` : `jobkorea-${Date.now()}-${index}`

        const experience = parseExperience(experienceText)

        const job: ScrapedJob = {
          id: jobId,
          title,
          company: companyName,
          companyId: `company-${companyName.replace(/\s+/g, '-').toLowerCase()}`,
          location: locationText || '서울',
          salary: { min: 3000, max: 7000 },
          experience,
          workType: 'onsite',
          description: title,
          requirements: [experienceText].filter(Boolean),
          skills: [],
          industry: params.industry || 'IT/소프트웨어',
          deadline: getDefaultDeadline(),
          postedAt: new Date().toISOString(),
          sourceUrl,
          source: 'jobkorea'
        }

        jobs.push(job)
      } catch (error) {
        console.error('공고 파싱 실패:', error)
      }
    })

    console.log(`✅ [잡코리아] ${jobs.length}개 공고 수집 완료`)
    return jobs

  } catch (error) {
    console.error('❌ [잡코리아] 크롤링 실패:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function buildJobKoreaSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.jobkorea.co.kr/Search/'
  const searchParams = new URLSearchParams()

  if (params.keyword) searchParams.append('stext', params.keyword)

  if (params.location) {
    const locationCodes: Record<string, string> = {
      '서울': '1',
      '경기': '2',
      '인천': '3',
      '부산': '4',
      '대구': '5',
      '대전': '6',
      '광주': '7',
      '울산': '8'
    }
    const code = locationCodes[params.location]
    if (code) searchParams.append('local', code)
  }

  if (params.minExperience !== undefined) {
    searchParams.append('exp_min', String(params.minExperience))
  }
  if (params.maxExperience !== undefined) {
    searchParams.append('exp_max', String(params.maxExperience))
  }

  return `${baseUrl}?${searchParams.toString()}`
}

function parseExperience(text: string): { min: number; max: number } | undefined {
  if (!text) return undefined

  if (text.includes('신입') || text.includes('무관')) {
    return { min: 0, max: 0 }
  }

  const rangeMatch = text.match(/(\d+)~(\d+)/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    }
  }

  const minMatch = text.match(/(\d+)년/)
  if (minMatch) {
    const years = parseInt(minMatch[1])
    return { min: years, max: years + 10 }
  }

  return undefined
}

function getDefaultDeadline(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString()
}
