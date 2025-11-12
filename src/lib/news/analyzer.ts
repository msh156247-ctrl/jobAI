/**
 * 뉴스 분석 유틸리티
 * 기사 내용에서 키워드 기반으로 이슈 타입 분석
 */

import { ISSUE_KEYWORDS, type IssueType, type NewsArticle, type CompanyNewsReport } from './types'

/**
 * 텍스트에서 이슈 타입 분석
 * @param text 기사 제목 또는 본문
 * @returns 매칭된 이슈 타입 배열
 */
export function analyzeIssueTypes(text: string): IssueType[] {
  if (!text) return []

  const issueTypes: IssueType[] = []
  const textLower = text.toLowerCase()

  // 각 이슈 타입별로 키워드 매칭
  for (const [issueType, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        issueTypes.push(issueType as IssueType)
        break // 해당 이슈 타입에서 하나라도 매칭되면 다음 이슈 타입으로
      }
    }
  }

  return issueTypes
}

/**
 * 기업별 뉴스 그룹화 및 리포트 생성
 * @param articles 뉴스 기사 배열
 * @returns 기업별 리포트 배열
 */
export function generateCompanyReports(articles: NewsArticle[]): CompanyNewsReport[] {
  // 기업별로 그룹화
  const companyMap = new Map<string, NewsArticle[]>()

  for (const article of articles) {
    if (!article.company) continue

    if (!companyMap.has(article.company)) {
      companyMap.set(article.company, [])
    }
    companyMap.get(article.company)!.push(article)
  }

  // 각 기업별 리포트 생성
  const reports: CompanyNewsReport[] = []

  for (const [companyName, companyArticles] of companyMap.entries()) {
    // 이슈 분포 집계
    const issueDistribution = {
      채용: 0,
      투자: 0,
      기술: 0,
      리스크: 0,
      정책: 0
    }

    for (const article of companyArticles) {
      if (article.issueType) {
        for (const issue of article.issueType) {
          issueDistribution[issue]++
        }
      }
    }

    // 최신 기사 날짜
    const latestArticle = companyArticles.reduce((latest, current) =>
      new Date(current.publishedAt) > new Date(latest.publishedAt) ? current : latest
    )

    // 키워드 추출 (제목에서 자주 등장하는 단어)
    const keywords = extractKeywords(companyArticles.map(a => a.title).join(' '))

    // 최신 기사 5개
    const recentArticles = companyArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 5)

    reports.push({
      companyName,
      totalArticles: companyArticles.length,
      latestArticleDate: latestArticle.publishedAt,
      issueDistribution,
      recentArticles,
      keywords
    })
  }

  // 기사 수 기준 내림차순 정렬
  reports.sort((a, b) => b.totalArticles - a.totalArticles)

  return reports
}

/**
 * 텍스트에서 키워드 추출 (간단한 빈도 분석)
 * @param text 분석할 텍스트
 * @returns 상위 키워드 배열
 */
export function extractKeywords(text: string): string[] {
  if (!text) return []

  // 불용어 (제외할 단어)
  const stopWords = new Set([
    '을', '를', '이', '가', '은', '는', '의', '에', '에서', '로', '으로',
    '과', '와', '도', '만', '한', '하는', '하다', '있다', '없다', '되다',
    '및', '등', '중', '내', '위해', '통해', '대해', '위한', '따라',
    '것', '수', '때', '년', '월', '일', '등', '약', '개', '명'
  ])

  // 단어 빈도 계산
  const words = text.split(/\s+/)
  const wordFreq = new Map<string, number>()

  for (const word of words) {
    const cleaned = word.trim()
    if (cleaned.length < 2 || stopWords.has(cleaned)) continue

    wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1)
  }

  // 빈도순 정렬하여 상위 10개 반환
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

/**
 * 이슈 분포 비율 계산
 * @param distribution 이슈 분포 객체
 * @returns 백분율 객체
 */
export function calculateIssuePercentage(distribution: CompanyNewsReport['issueDistribution']): Record<IssueType, number> {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return {
      채용: 0,
      투자: 0,
      기술: 0,
      리스크: 0,
      정책: 0
    }
  }

  return {
    채용: Math.round((distribution.채용 / total) * 100),
    투자: Math.round((distribution.투자 / total) * 100),
    기술: Math.round((distribution.기술 / total) * 100),
    리스크: Math.round((distribution.리스크 / total) * 100),
    정책: Math.round((distribution.정책 / total) * 100)
  }
}

/**
 * 감성 분석 (간단한 휴리스틱)
 * 추후 AI 모델로 확장 가능
 */
export function analyzeSentiment(article: NewsArticle): 'positive' | 'neutral' | 'negative' {
  const text = (article.title + ' ' + article.content).toLowerCase()

  const positiveKeywords = [
    '성공', '증가', '성장', '확대', '개선', '혁신', '수상', '선정',
    '투자유치', '채용', '출시', '협력', '제휴', '발전'
  ]

  const negativeKeywords = [
    '실패', '감소', '하락', '축소', '악화', '논란', '위기', '적자',
    '손실', '구조조정', '소송', '문제', '비판', '우려'
  ]

  let positiveCount = 0
  let negativeCount = 0

  for (const keyword of positiveKeywords) {
    if (text.includes(keyword)) positiveCount++
  }

  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) negativeCount++
  }

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}
