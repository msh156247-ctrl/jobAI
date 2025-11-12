/**
 * 뉴스 데이터 타입 정의
 */

export interface NewsArticle {
  id: string
  title: string
  content: string
  summary?: string
  url: string
  source: string // 출처 (ZDNet, 서울경제, 전자신문 등)
  author?: string
  publishedAt: string
  scrapedAt: string
  imageUrl?: string
  company?: string // 매칭된 기업명
  category?: NewsCategory
  keywords?: string[]
  issueType?: IssueType[] // 복수 이슈 타입 가능
}

export type NewsCategory =
  | 'IT/기술'
  | '경제/비즈니스'
  | '스타트업'
  | '인사/채용'
  | '투자/M&A'
  | '정책/규제'
  | '산업'
  | '기타'

export type IssueType =
  | '채용'
  | '투자'
  | '기술'
  | '리스크'
  | '정책'

export interface IssueKeywords {
  채용: string[]
  투자: string[]
  기술: string[]
  리스크: string[]
  정책: string[]
}

export const ISSUE_KEYWORDS: IssueKeywords = {
  채용: [
    '채용', '모집', '인재', '공고', '구인', '신입', '경력', '지원자',
    '면접', '입사', '직원', '인력', '확대', '증원', '선발'
  ],
  투자: [
    '투자', '유치', '펀딩', '자금', '라운드', '시리즈', 'IPO', '상장',
    '조달', '투자유치', '벤처캐피탈', 'VC', '엔젤', '프리 IPO'
  ],
  기술: [
    'AI', '인공지능', '머신러닝', '딥러닝', '서비스', '신제품', '출시',
    '개발', '기술', '플랫폼', '솔루션', '혁신', '특허', '연구',
    '클라우드', '빅데이터', 'IoT', '블록체인', '메타버스'
  ],
  리스크: [
    '구조조정', '논란', '위기', '적자', '손실', '감원', '폐쇄', '중단',
    '소송', '분쟁', '제재', '과징금', '벌금', '고발', '사과',
    '해킹', '유출', '사고', '문제', '비판', '우려'
  ],
  정책: [
    '정부', '규제', '지원', '인증', '법안', '제도', '정책', '승인',
    '허가', '협약', 'MOU', '협력', '파트너십', '제휴'
  ]
}

export interface CompanyNewsReport {
  companyName: string
  totalArticles: number
  latestArticleDate: string
  issueDistribution: {
    채용: number
    투자: number
    기술: number
    리스크: number
    정책: number
  }
  recentArticles: NewsArticle[]
  keywords: string[] // 자주 등장하는 키워드
  sentiment?: 'positive' | 'neutral' | 'negative' // 추후 확장 가능
}

export interface Company {
  name: string
  aliases: string[] // 유사명칭 (예: "삼성전자", "삼성전자㈜", "Samsung Electronics")
  industry?: string
  description?: string
}

export interface NewsScraperParams {
  keyword?: string
  company?: string
  category?: NewsCategory
  startDate?: string
  endDate?: string
  limit?: number
  source?: string // 특정 뉴스 사이트만
}

export interface NewsCrawlMetadata {
  lastCrawledAt: string
  totalArticles: number
  sourceBreakdown: {
    [source: string]: number
  }
  companyCount: number
  expiresAt: string // 캐시 만료 시간
}
