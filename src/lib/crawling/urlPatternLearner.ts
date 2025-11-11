/**
 * URL 패턴 자동 학습 모듈
 * AI를 활용하여 채용 사이트의 URL 패턴을 자동으로 학습합니다
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface URLPattern {
  domain: string
  listPagePattern: string // 목록 페이지 URL 패턴
  detailPagePattern: string // 상세 페이지 URL 패턴
  detailPageRegex: RegExp // 상세 페이지 정규식
  queryParams: {
    keyword?: string
    location?: string
    experience?: string
    page?: string
  }
  selectors: {
    jobList: string // 공고 목록 셀렉터
    jobLink: string // 공고 링크 셀렉터
    title: string // 제목 셀렉터
    company: string // 회사명 셀렉터
    location: string // 지역 셀렉터
  }
  createdAt: string
  lastUpdated: string
}

interface LinkAnalysis {
  url: string
  text: string
  isJobLink: boolean
  pattern: string | null
}

/**
 * 페이지에서 모든 링크 수집
 */
async function collectLinks(page: Page, domain: string): Promise<LinkAnalysis[]> {
  const links = await page.$$eval('a', (anchors) =>
    anchors.map(a => ({
      url: a.href,
      text: a.textContent?.trim() || '',
      classes: a.className,
      id: a.id
    }))
  )

  // 동일 도메인의 링크만 필터링
  const filteredLinks = links.filter(link => {
    try {
      const url = new URL(link.url)
      return url.hostname.includes(domain)
    } catch {
      return false
    }
  })

  return filteredLinks.map(link => ({
    url: link.url,
    text: link.text,
    isJobLink: isLikelyJobLink(link.url, link.text),
    pattern: extractPattern(link.url)
  }))
}

/**
 * 채용 공고 링크인지 판단
 */
function isLikelyJobLink(url: string, text: string): boolean {
  const jobKeywords = [
    'job', 'recruit', 'career', '채용', '공고', 'position',
    'wd', 'view', 'detail', 'read'
  ]

  const urlLower = url.toLowerCase()
  const textLower = text.toLowerCase()

  // URL이나 텍스트에 채용 관련 키워드가 있는지 확인
  const hasKeyword = jobKeywords.some(keyword =>
    urlLower.includes(keyword) || textLower.includes(keyword)
  )

  // 숫자가 포함된 경로인지 확인 (대부분의 공고는 ID를 포함)
  const hasNumber = /\d{4,}/.test(url)

  return hasKeyword && hasNumber
}

/**
 * URL에서 패턴 추출
 */
function extractPattern(url: string): string | null {
  try {
    const urlObj = new URL(url)
    let path = urlObj.pathname

    // 숫자를 {id}로 치환
    path = path.replace(/\d+/g, '{id}')

    // 쿼리 파라미터 처리
    const queryStr = urlObj.search
    if (queryStr) {
      // 숫자 값을 {id}로 치환
      const normalizedQuery = queryStr.replace(/=\d+/g, '={id}')
      return path + normalizedQuery
    }

    return path
  } catch {
    return null
  }
}

/**
 * GPT-4를 사용하여 패턴 분석
 */
async function analyzePatternWithAI(links: LinkAnalysis[]): Promise<{
  detailPagePattern: string
  confidence: number
}> {
  const jobLinks = links.filter(link => link.isJobLink)

  if (jobLinks.length === 0) {
    throw new Error('채용 공고 링크를 찾을 수 없습니다')
  }

  // 패턴별로 그룹화
  const patternCounts = new Map<string, number>()
  jobLinks.forEach(link => {
    if (link.pattern) {
      patternCounts.set(link.pattern, (patternCounts.get(link.pattern) || 0) + 1)
    }
  })

  // 가장 많이 나타나는 패턴
  let mostCommonPattern = ''
  let maxCount = 0
  patternCounts.forEach((count, pattern) => {
    if (count > maxCount) {
      maxCount = count
      mostCommonPattern = pattern
    }
  })

  const confidence = jobLinks.length > 0 ? maxCount / jobLinks.length : 0

  // GPT-4에게 패턴 검증 요청
  const sampleLinks = jobLinks.slice(0, 10).map(l => l.url).join('\n')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `당신은 URL 패턴 분석 전문가입니다. 채용 공고 URL들을 분석하여 공통 패턴을 찾아주세요.

패턴 추출 규칙:
1. 숫자로 된 ID는 {id}로 표현
2. 쿼리 파라미터는 중요한 것만 포함
3. 정규식으로 변환 가능한 형태로 반환

응답 형식 (JSON):
{
  "pattern": "추출된 패턴",
  "regex": "정규식 문자열",
  "confidence": 0.0 ~ 1.0
}`
        },
        {
          role: 'user',
          content: `다음 채용 공고 URL들의 공통 패턴을 찾아주세요:\n\n${sampleLinks}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse)
        return {
          detailPagePattern: parsed.pattern || mostCommonPattern,
          confidence: parsed.confidence || confidence
        }
      } catch {
        return {
          detailPagePattern: mostCommonPattern,
          confidence
        }
      }
    }
  } catch (error) {
    console.error('AI 패턴 분석 실패:', error)
  }

  return {
    detailPagePattern: mostCommonPattern,
    confidence
  }
}

/**
 * 페이지 셀렉터 자동 감지
 */
async function detectSelectors(page: Page, html: string): Promise<URLPattern['selectors']> {
  const $ = cheerio.load(html)

  // 일반적인 채용 공고 목록 셀렉터 패턴
  const possibleListSelectors = [
    '.job-list', '.recruit-list', '#jobList', '.list',
    '[class*="job"]', '[class*="recruit"]', '[class*="list"]',
    'ul.jobs', 'div.jobs', 'section.jobs'
  ]

  let jobListSelector = ''
  for (const selector of possibleListSelectors) {
    const elements = $(selector)
    if (elements.length > 0) {
      jobListSelector = selector
      break
    }
  }

  // 링크 셀렉터
  const jobLinkSelector = jobListSelector ? `${jobListSelector} a` : 'a[href*="job"], a[href*="recruit"]'

  return {
    jobList: jobListSelector || '.job-list',
    jobLink: jobLinkSelector,
    title: '.job-title, .title, h3, h4',
    company: '.company, .company-name, .corp_name',
    location: '.location, .area, .loc'
  }
}

/**
 * 채용 사이트 URL 패턴 학습
 */
export async function learnURLPattern(
  siteUrl: string,
  options: {
    timeout?: number
    headless?: boolean
  } = {}
): Promise<URLPattern> {
  const { timeout = 30000, headless = true } = options

  let browser: Browser | null = null

  try {
    // Puppeteer 브라우저 시작
    browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    console.log(`🔍 ${siteUrl} 분석 시작...`)

    // 페이지 방문
    await page.goto(siteUrl, {
      waitUntil: 'networkidle2',
      timeout
    })

    // 도메인 추출
    const urlObj = new URL(siteUrl)
    const domain = urlObj.hostname.replace('www.', '')

    // HTML 가져오기
    const html = await page.content()

    // 링크 수집
    const links = await collectLinks(page, domain)

    console.log(`📊 총 ${links.length}개 링크 발견, ${links.filter(l => l.isJobLink).length}개 공고 링크`)

    // AI로 패턴 분석
    const { detailPagePattern, confidence } = await analyzePatternWithAI(links)

    console.log(`✅ 패턴 학습 완료 (신뢰도: ${(confidence * 100).toFixed(1)}%)`)
    console.log(`   패턴: ${detailPagePattern}`)

    // 셀렉터 감지
    const selectors = await detectSelectors(page, html)

    // 정규식 생성
    let regexPattern = detailPagePattern
      .replace(/\{id\}/g, '\\d+')
      .replace(/[.]/g, '\\.')
      .replace(/[?]/g, '\\?')
      .replace(/[&]/g, '\\&')

    const urlPattern: URLPattern = {
      domain,
      listPagePattern: urlObj.pathname,
      detailPagePattern,
      detailPageRegex: new RegExp(regexPattern),
      queryParams: {
        keyword: 'keyword',
        location: 'location',
        page: 'page'
      },
      selectors,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    return urlPattern

  } catch (error) {
    console.error('❌ URL 패턴 학습 실패:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 학습된 패턴으로 URL 생성
 */
export function generateURL(pattern: URLPattern, jobId: string): string {
  const url = `https://${pattern.domain}${pattern.detailPagePattern.replace('{id}', jobId)}`
  return url
}

/**
 * URL이 패턴과 일치하는지 확인
 */
export function matchesPattern(pattern: URLPattern, url: string): boolean {
  return pattern.detailPageRegex.test(url)
}
