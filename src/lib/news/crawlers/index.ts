/**
 * 뉴스 크롤러 통합 인터페이스
 *
 * 주의사항:
 * 1. 실제 프로덕션 환경에서는 Puppeteer를 사용해야 합니다
 * 2. 각 사이트의 robots.txt와 이용약관을 준수해야 합니다
 * 3. Rate limiting을 적용하여 서버에 부담을 주지 않아야 합니다
 * 4. 사이트 구조가 변경될 수 있으므로 정기적인 업데이트가 필요합니다
 */

import type { NewsArticle, NewsScraperParams } from '../types'
import { detectCompany } from '../companyDictionary'
import { analyzeIssueTypes } from '../analyzer'

/**
 * ZDNet 크롤러
 */
export async function crawlZDNet(params: NewsScraperParams): Promise<NewsArticle[]> {
  // TODO: 실제 Puppeteer 기반 크롤링 구현
  // 현재는 Mock 데이터 반환

  const mockArticles: NewsArticle[] = [
    {
      id: `zdnet-${Date.now()}-1`,
      title: '카카오, AI 신사업 인재 채용 본격화',
      content: '카카오가 인공지능(AI) 분야 신사업 확장을 위해 대규모 채용에 나섰다. 카카오는 AI 엔지니어, 데이터 사이언티스트 등 100여 명을 채용할 계획이라고 밝혔다. 회사 관계자는 "AI 기술 역량 강화를 위해 우수 인재 영입에 집중하고 있다"고 말했다.',
      url: 'https://zdnet.co.kr/view/?no=20251112000001',
      source: 'ZDNet',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `zdnet-${Date.now()}-2`,
      title: '네이버클라우드, 생성형 AI 서비스 고도화',
      content: '네이버클라우드가 생성형 AI 플랫폼 하이퍼클로바X를 고도화하며 기업용 시장 공략에 박차를 가하고 있다. 네이버는 이번 업데이트를 통해 멀티모달 기능을 강화하고 API 성능을 2배 향상시켰다고 발표했다.',
      url: 'https://zdnet.co.kr/view/?no=20251112000002',
      source: 'ZDNet',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `zdnet-${Date.now()}-3`,
      title: '토스, 시리즈 F 투자 유치 성공',
      content: '핀테크 기업 토스(비바리퍼블리카)가 시리즈 F 라운드에서 5000억 원 규모의 투자를 유치했다. 이번 투자로 토스의 기업 가치는 10조 원을 넘어섰다. 토스는 조달한 자금으로 해외 진출과 신사업 확장에 나설 계획이다.',
      url: 'https://zdnet.co.kr/view/?no=20251112000003',
      source: 'ZDNet',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '투자/M&A'
    }
  ]

  // 기업명 탐지 및 이슈 타입 분석
  return mockArticles.map(article => {
    const company = detectCompany(article.title + ' ' + article.content)
    const issueType = analyzeIssueTypes(article.title + ' ' + article.content)

    return {
      ...article,
      company: company || undefined,
      issueType
    }
  }).filter(article => {
    // 검색 조건 필터링
    if (params.company && article.company !== params.company) return false
    if (params.keyword && !article.title.includes(params.keyword) && !article.content.includes(params.keyword)) return false
    return true
  })
}

/**
 * 서울경제 크롤러
 */
export async function crawlSeoulEconomy(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `seoul-${Date.now()}-1`,
      title: '쿠팡, 물류센터 확대로 일자리 2000개 창출',
      content: '쿠팡이 경기도에 신규 물류센터를 오픈하며 2000여 개의 일자리를 창출한다. 쿠팡은 이번 물류센터 오픈으로 배송 속도를 더욱 향상시킬 수 있을 것으로 기대하고 있다. 회사는 지속적인 인프라 투자로 고용 확대에 기여하겠다고 밝혔다.',
      url: 'https://sedaily.com/NewsView/20251112000001',
      source: '서울경제',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '경제/비즈니스'
    },
    {
      id: `seoul-${Date.now()}-2`,
      title: '배달의민족, 음식 배달 로봇 시범 운영',
      content: '배달의민족이 자율주행 배달 로봇 시범 운영에 나선다. 우아한형제들은 강남구 일대에서 로봇 배달 서비스를 테스트하며, 성공적으로 완료되면 서울 전역으로 확대할 계획이다. 회사는 이를 통해 배달 효율성을 높이고 인건비 부담을 줄일 수 있을 것으로 기대하고 있다.',
      url: 'https://sedaily.com/NewsView/20251112000002',
      source: '서울경제',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    }
  ]

  return mockArticles.map(article => {
    const company = detectCompany(article.title + ' ' + article.content)
    const issueType = analyzeIssueTypes(article.title + ' ' + article.content)

    return {
      ...article,
      company: company || undefined,
      issueType
    }
  }).filter(article => {
    if (params.company && article.company !== params.company) return false
    if (params.keyword && !article.title.includes(params.keyword) && !article.content.includes(params.keyword)) return false
    return true
  })
}

/**
 * 전자신문 크롤러
 */
export async function crawlETNews(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `etnews-${Date.now()}-1`,
      title: '삼성전자, 차세대 반도체 개발 인력 500명 채용',
      content: '삼성전자가 3나노 이하 차세대 반도체 개발을 위해 대규모 채용을 진행한다. 삼성전자는 반도체 설계, 공정 개발, 품질 관리 분야에서 500여 명을 선발할 예정이다. 회사 관계자는 "글로벌 반도체 경쟁에서 우위를 점하기 위해 우수 인재 확보에 총력을 기울이고 있다"고 말했다.',
      url: 'https://etnews.com/20251112000001',
      source: '전자신문',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `etnews-${Date.now()}-2`,
      title: 'LG전자, 구조조정 논란 속 실적 부진',
      content: 'LG전자가 실적 부진으로 일부 사업부 구조조정에 나서면서 내부 불안감이 커지고 있다. 회사는 수익성이 낮은 사업부를 통폐합하고 인력 재배치를 추진 중이다. 업계에서는 LG전자의 구조조정이 불가피한 선택이었다는 분석과 함께 향후 실적 회복 여부에 주목하고 있다.',
      url: 'https://etnews.com/20251112000002',
      source: '전자신문',
      publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '경제/비즈니스'
    }
  ]

  return mockArticles.map(article => {
    const company = detectCompany(article.title + ' ' + article.content)
    const issueType = analyzeIssueTypes(article.title + ' ' + article.content)

    return {
      ...article,
      company: company || undefined,
      issueType
    }
  }).filter(article => {
    if (params.company && article.company !== params.company) return false
    if (params.keyword && !article.title.includes(params.keyword) && !article.content.includes(params.keyword)) return false
    return true
  })
}

/**
 * 모든 뉴스 사이트에서 크롤링
 */
export async function crawlAllNews(params: NewsScraperParams): Promise<NewsArticle[]> {
  const results = await Promise.all([
    crawlZDNet(params),
    crawlSeoulEconomy(params),
    crawlETNews(params)
  ])

  const allArticles = results.flat()

  // 중복 제거 (같은 제목의 기사)
  const uniqueArticles = Array.from(
    new Map(allArticles.map(article => [article.title, article])).values()
  )

  // 최신순 정렬
  uniqueArticles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  // limit 적용
  if (params.limit) {
    return uniqueArticles.slice(0, params.limit)
  }

  return uniqueArticles
}
