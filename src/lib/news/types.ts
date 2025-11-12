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
  | '정치'
  | '사회'
  | '국제'
  | '문화'
  | '과학'
  | '환경'
  | '교육'
  | '부동산'
  | '금융'
  | '기타'

export type IssueType =
  | '채용'
  | '투자'
  | '기술'
  | '리스크'
  | '정책'
  | '혁신'
  | '글로벌'
  | '규제'
  | '환경'
  | '사회적가치'

export interface IssueKeywords {
  채용: string[]
  투자: string[]
  기술: string[]
  리스크: string[]
  정책: string[]
  혁신: string[]
  글로벌: string[]
  규제: string[]
  환경: string[]
  사회적가치: string[]
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
    '개발', '기술', '플랫폼', '솔루션', '특허', '연구',
    '클라우드', '빅데이터', 'IoT', '블록체인', '메타버스'
  ],
  리스크: [
    '구조조정', '논란', '위기', '적자', '손실', '감원', '폐쇄', '중단',
    '소송', '분쟁', '제재', '과징금', '벌금', '고발', '사과',
    '해킹', '유출', '사고', '문제', '비판', '우려'
  ],
  정책: [
    '정부', '지원', '인증', '법안', '제도', '정책', '승인',
    '허가', '협약', 'MOU', '협력', '파트너십', '제휴'
  ],
  혁신: [
    '혁신', '개선', '획기적', '최초', '차세대', '미래', '변화', '전환',
    '새로운', '도입', '시도', '발전', '개척', '선도'
  ],
  글로벌: [
    '글로벌', '해외', '수출', '진출', '국제', '세계', '미국', '중국',
    '유럽', '아시아', '확장', '글로벌화', '해외시장'
  ],
  규제: [
    '규제', '제재', '단속', '금지', '제한', '의무', '준수', '위반',
    '감독', '검사', '시정', '개선명령'
  ],
  환경: [
    '환경', '친환경', '탄소', '에너지', '재생', '지속가능', 'ESG',
    '온실가스', '배출', '감축', '녹색', '기후'
  ],
  사회적가치: [
    '사회공헌', '기부', '나눔', '봉사', '윤리', '투명성', '다양성',
    '포용', '평등', '인권', '복지', '공정'
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
    혁신: number
    글로벌: number
    규제: number
    환경: number
    사회적가치: number
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
