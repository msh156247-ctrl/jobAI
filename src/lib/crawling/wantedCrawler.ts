/**
 * 원티드 실제 크롤링 구현
 */

import puppeteer, { Browser } from 'puppeteer'
import * as cheerio from 'cheerio'
import { ScrapedJob, ScraperParams } from '../scrapers'

/**
 * 원티드 크롤링
 * 주의: 원티드는 GraphQL API를 사용할 수 있으므로 필요시 API 호출 방식으로 전환 가능
 */
export async function crawlWanted(params: ScraperParams): Promise<ScrapedJob[]> {
  let browser: Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    const searchUrl = buildWantedSearchUrl(params)
    console.log(`🔍 [원티드] ${searchUrl}`)

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // 원티드는 SPA이므로 조금 더 대기
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 공고 목록 대기 (원티드의 여러 가능한 셀렉터)
    const possibleSelectors = [
      '[data-job-card]',
      '.JobCard_container',
      '[class*="JobCard"]',
      'li[data-cy="job-card"]'
    ]

    let jobSelector = ''
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        jobSelector = selector
        console.log(`✅ [원티드] 셀렉터 발견: ${selector}`)
        break
      } catch {
        continue
      }
    }

    if (!jobSelector) {
      console.log('⚠️ [원티드] 공고 목록을 찾을 수 없습니다')
      return []
    }

    const html = await page.content()
    const $ = cheerio.load(html)

    const jobs: ScrapedJob[] = []
    const limit = params.limit || 50

    // 원티드는 여러 가능한 구조를 시도
    const jobElements = $(jobSelector)

    jobElements.each((index, element) => {
      if (index >= limit) return false

      try {
        const $el = $(element)

        // 제목과 링크
        const titleEl = $el.find('a[data-position-name], a.job-card-title, h2 a')
        const title = titleEl.text().trim() || $el.find('h2, h3, .title').text().trim()
        const link = titleEl.attr('href') || $el.find('a').first().attr('href') || ''

        // 회사명
        const companyName = $el.find('[data-company-name], .company-name, .company').text().trim()

        // 지역
        const locationText = $el.find('[data-location], .location, .region').text().trim()

        // URL 생성
        let sourceUrl = link
        if (link && !link.startsWith('http')) {
          sourceUrl = `https://www.wanted.co.kr${link}`
        }

        // ID 추출 (원티드는 /wd/{id} 형식)
        const idMatch = sourceUrl.match(/\/wd\/(\d+)/)
        const jobId = idMatch ? `wanted-${idMatch[1]}` : `wanted-${Date.now()}-${index}`

        // 보상금 정보 (원티드 특징)
        const rewardText = $el.find('[class*="reward"], [class*="compensation"]').text().trim()
        const hasReward = rewardText.includes('만원') || rewardText.includes('원')

        // 스킬 태그
        const skills: string[] = []
        $el.find('[class*="skill"], [class*="tag"], .tag').each((i, el) => {
          const skill = $(el).text().trim()
          if (skill && skill.length < 20) {
            skills.push(skill)
          }
        })

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
          salary: { min: 3000, max: 8000 }, // 원티드는 평균적으로 연봉이 높음
          experience: parseExperienceFromTitle(title),
          workType: 'onsite',
          description: title,
          requirements: [],
          skills,
          keywords: [...skills],
          industry: params.industry || 'IT/소프트웨어',
          deadline: getDefaultDeadline(),
          postedAt: new Date().toISOString(),
          sourceUrl,
          source: 'wanted'
        }

        // 보상금 정보 추가
        if (hasReward) {
          job.keywords = [...(job.keywords || []), '추천보상금']
        }

        jobs.push(job)
      } catch (error) {
        console.error('[원티드] 공고 파싱 실패:', error)
      }
    })

    console.log(`✅ [원티드] ${jobs.length}개 공고 수집 완료`)
    return jobs

  } catch (error) {
    console.error('❌ [원티드] 크롤링 실패:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 원티드 검색 URL 생성
 */
function buildWantedSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.wanted.co.kr/search'
  const searchParams = new URLSearchParams()

  if (params.keyword) {
    searchParams.append('query', params.keyword)
  }

  // 지역 태그
  if (params.location) {
    const locationTags: Record<string, string> = {
      '서울': 'locations.all.seoul',
      '경기': 'locations.all.gyeonggi',
      '부산': 'locations.all.busan',
      '대구': 'locations.all.daegu',
      '인천': 'locations.all.incheon',
      '광주': 'locations.all.gwangju',
      '대전': 'locations.all.daejeon',
      '울산': 'locations.all.ulsan',
      '세종': 'locations.all.sejong'
    }
    const tag = locationTags[params.location]
    if (tag) {
      searchParams.append('locations', tag)
    }
  }

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('years', String(params.minExperience))
  }

  // 직군 (업계)
  if (params.industry) {
    const industryCodes: Record<string, string> = {
      'IT/소프트웨어': '518',
      '개발': '518',
      '데이터': '10110',
      'AI': '10111',
      '디자인': '2',
      '마케팅': '523'
    }
    const code = industryCodes[params.industry]
    if (code) {
      searchParams.append('job_sort', code)
    }
  }

  return `${baseUrl}?${searchParams.toString()}`
}

/**
 * 제목에서 경력 추출 시도
 */
function parseExperienceFromTitle(title: string): { min: number; max: number } | undefined {
  if (!title) return undefined

  // "신입" 키워드
  if (title.includes('신입') || title.includes('Junior')) {
    return { min: 0, max: 0 }
  }

  // "경력무관" 키워드
  if (title.includes('경력무관') || title.includes('경력 무관')) {
    return { min: 0, max: 0 }
  }

  // "시니어" 키워드
  if (title.includes('시니어') || title.includes('Senior')) {
    return { min: 5, max: 15 }
  }

  // "N년 이상" 패턴
  const yearMatch = title.match(/(\d+)년\s*이상/)
  if (yearMatch) {
    const years = parseInt(yearMatch[1])
    return { min: years, max: years + 10 }
  }

  // "N~M년" 패턴
  const rangeMatch = title.match(/(\d+)~(\d+)년/)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2])
    }
  }

  return undefined
}

/**
 * 기본 마감일 생성 (30일 후)
 */
function getDefaultDeadline(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString()
}
