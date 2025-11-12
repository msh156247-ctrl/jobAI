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
 * 아시아경제 크롤러
 */
export async function crawlAsiaEconomy(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `asia-${Date.now()}-1`,
      title: '네이버, 글로벌 AI 시장 진출 가속화',
      content: '네이버가 글로벌 AI 시장 공략에 본격 나섰다. 네이버는 미국, 일본, 동남아시아 등에서 하이퍼클로바X 기반 AI 솔루션을 출시하며 시장 확대를 추진 중이다. 업계 관계자는 "네이버의 AI 기술력이 글로벌 시장에서도 통할 것"이라고 전망했다.',
      url: 'https://asiae.co.kr/article/20251112000001',
      source: '아시아경제',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `asia-${Date.now()}-2`,
      title: '업스테이지, AI 스타트업 중 최대 규모 투자 유치',
      content: '국내 AI 스타트업 업스테이지가 3000억 원 규모의 시리즈 C 투자를 유치했다. 이번 투자로 업스테이지는 글로벌 AI 시장에서 경쟁력을 강화하고, 신규 인력 200명을 채용할 계획이다.',
      url: 'https://asiae.co.kr/article/20251112000002',
      source: '아시아경제',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '투자/M&A'
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
 * 한국경제 크롤러
 */
export async function crawlHankyung(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `hankyung-${Date.now()}-1`,
      title: '당근마켓, 지역 커뮤니티 플랫폼 강화',
      content: '당근마켓이 지역 커뮤니티 기능을 대폭 강화한다. 회사는 동네 모임, 지역 소식 등 커뮤니티 중심 서비스를 확대하며 MAU 2000만 달성을 목표로 하고 있다. 당근마켓은 이를 위해 커뮤니티 운영 인력 100명을 추가 채용할 예정이다.',
      url: 'https://hankyung.com/article/20251112000001',
      source: '한국경제',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `hankyung-${Date.now()}-2`,
      title: 'SK텔레콤, 5G 가입자 1500만 돌파',
      content: 'SK텔레콤이 5G 가입자 1500만 명을 돌파하며 국내 1위 통신사 입지를 공고히 했다. SK텔레콤은 5G 네트워크 품질 향상과 AI 기반 맞춤형 서비스 강화로 가입자 증가세를 이어갈 계획이다.',
      url: 'https://hankyung.com/article/20251112000002',
      source: '한국경제',
      publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
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
 * 매일경제 크롤러
 */
export async function crawlMaeil(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `maeil-${Date.now()}-1`,
      title: '넷마블, 신작 게임 3종 동시 출시',
      content: '넷마블이 상반기 신작 게임 3종을 동시 출시하며 시장 공략에 나선다. 회사는 RPG, 액션, 캐주얼 장르의 게임을 선보이며 글로벌 시장 점유율 확대를 목표로 하고 있다. 넷마블은 게임 개발 인력 300명을 추가 채용 중이다.',
      url: 'https://mk.co.kr/news/20251112000001',
      source: '매일경제',
      publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `maeil-${Date.now()}-2`,
      title: '하이브, 글로벌 엔터 시장 1위 등극',
      content: '하이브가 글로벌 엔터테인먼트 기업 시가총액 1위에 올랐다. 방탄소년단, 세븐틴 등 소속 아티스트들의 활약과 플랫폼 사업 확대가 주효했다. 하이브는 올해 매출 2조 원 달성을 목표로 하고 있다.',
      url: 'https://mk.co.kr/news/20251112000002',
      source: '매일경제',
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
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
 * IT조선 크롤러
 */
export async function crawlITChosun(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `itchosun-${Date.now()}-1`,
      title: '카카오뱅크, 디지털 금융 혁신상 수상',
      content: '카카오뱅크가 디지털 금융 혁신 대상을 수상했다. 심사위원단은 카카오뱅크의 편리한 UX와 AI 기반 금융 서비스를 높이 평가했다. 카카오뱅크는 올해 예금 고객 2000만 명 돌파를 목표로 하고 있다.',
      url: 'https://it.chosun.com/article/20251112000001',
      source: 'IT조선',
      publishedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `itchosun-${Date.now()}-2`,
      title: '무신사, 패션 플랫폼 1위 입지 강화',
      content: '무신사가 국내 패션 플랫폼 시장 점유율 1위를 유지하고 있다. 무신사는 독점 브랜드 유치와 물류 인프라 확충으로 경쟁력을 강화하며, 하반기 해외 진출도 검토 중이다. 회사는 이를 위해 글로벌 사업 인력 50명을 채용할 계획이다.',
      url: 'https://it.chosun.com/article/20251112000002',
      source: 'IT조선',
      publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
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
 * 디지털타임스 크롤러
 */
export async function crawlDigitalTimes(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `dt-${Date.now()}-1`,
      title: '크래프톤, PUBG 신규 모드 출시로 매출 반등',
      content: '크래프톤이 PUBG 신규 게임 모드를 출시하며 매출 반등에 성공했다. 새로운 배틀로얄 모드와 협동 플레이 시스템이 유저들의 호평을 받으며 동시 접속자 수가 30% 증가했다. 크래프톤은 후속작 개발을 위해 게임 기획자 80명을 채용 중이다.',
      url: 'https://dt.co.kr/article/20251112000001',
      source: '디지털타임스',
      publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `dt-${Date.now()}-2`,
      title: '야놀자, 해외 여행 예약 플랫폼 인수',
      content: '야놀자가 동남아시아 최대 여행 예약 플랫폼을 인수하며 글로벌 시장 진출을 본격화한다. 이번 인수로 야놀자는 아시아 최대 여행 플랫폼으로 자리매김할 전망이다. 회사는 글로벌 서비스 확대를 위해 개발 인력 150명을 채용할 계획이다.',
      url: 'https://dt.co.kr/article/20251112000002',
      source: '디지털타임스',
      publishedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '투자/M&A'
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
 * 블로터 크롤러
 */
export async function crawlBloter(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `bloter-${Date.now()}-1`,
      title: '센드버드, 글로벌 메시징 API 시장 점유율 확대',
      content: '센드버드가 글로벌 메시징 API 시장에서 점유율을 확대하고 있다. 회사는 미국, 유럽 기업들을 대상으로 SaaS 기반 메시징 솔루션을 제공하며 ARR 500억 원을 달성했다. 센드버드는 글로벌 영업 인력 30명을 추가 채용할 예정이다.',
      url: 'https://bloter.net/article/20251112000001',
      source: '블로터',
      publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: 'IT/기술'
    },
    {
      id: `bloter-${Date.now()}-2`,
      title: '직방, AI 기반 부동산 추천 서비스 고도화',
      content: '직방이 AI 기반 부동산 추천 알고리즘을 고도화하며 사용자 경험을 개선했다. 새로운 AI 시스템은 사용자의 선호도와 예산을 분석해 최적의 매물을 추천한다. 직방은 AI 개발 인력 확충을 위해 머신러닝 엔지니어 40명을 채용 중이다.',
      url: 'https://bloter.net/article/20251112000002',
      source: '블로터',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
 * 한겨레 크롤러 (정치, 사회)
 */
export async function crawlHankyoreh(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `hankyoreh-${Date.now()}-1`,
      title: '정부, 탄소중립 2030 로드맵 발표',
      content: '정부가 2030년 탄소중립 달성을 위한 구체적인 로드맵을 발표했다. 환경부는 재생에너지 확대, 전기차 보급 확대, 탄소배출권 거래제 강화 등을 핵심 과제로 제시했다. 이번 계획으로 2030년까지 온실가스 배출량을 40% 감축할 계획이다.',
      url: 'https://hani.co.kr/arti/20251112000001',
      source: '한겨레',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '환경'
    },
    {
      id: `hankyoreh-${Date.now()}-2`,
      title: '교육부, 대학 정원 확대 방안 논의',
      content: '교육부가 저출산 시대 대학 정원 조정 방안을 논의 중이다. 전문가들은 지역 균형 발전과 산업 수요를 고려한 정원 조정이 필요하다고 지적했다. 교육부는 다음 달 구체적인 방안을 발표할 예정이다.',
      url: 'https://hani.co.kr/arti/20251112000002',
      source: '한겨레',
      publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '교육'
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
 * 조선일보 크롤러 (경제, 국제)
 */
export async function crawlChosun(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `chosun-${Date.now()}-1`,
      title: '미국 연준, 금리 동결 결정',
      content: '미국 연방준비제도가 기준금리를 동결하기로 결정했다. 연준 의장은 인플레이션 추세를 지켜본 후 금리 인하를 검토하겠다고 밝혔다. 이번 결정으로 글로벌 금융시장의 불확실성이 계속될 전망이다.',
      url: 'https://chosun.com/article/20251112000001',
      source: '조선일보',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '국제'
    },
    {
      id: `chosun-${Date.now()}-2`,
      title: '부동산 시장, 정부 규제 강화에도 상승세',
      content: '정부의 강력한 부동산 규제에도 불구하고 수도권 아파트 가격이 상승세를 이어가고 있다. 전문가들은 공급 부족과 저금리 기조가 가격 상승의 주요 원인이라고 분석했다. 정부는 추가 규제 방안을 검토 중이다.',
      url: 'https://chosun.com/article/20251112000002',
      source: '조선일보',
      publishedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '부동산'
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
 * 중앙일보 크롤러 (문화, 교육)
 */
export async function crawlJoongang(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `joongang-${Date.now()}-1`,
      title: 'K-팝 BTS, 그래미 어워드 3개 부문 후보',
      content: 'BTS가 올해 그래미 어워드 3개 부문 후보에 올랐다. 빌보드는 BTS가 최고 팝 듀오 부문에서 수상 가능성이 높다고 전망했다. 팬들은 소셜미디어를 통해 응원 메시지를 보내고 있다.',
      url: 'https://joongang.joins.com/article/20251112000001',
      source: '중앙일보',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '문화'
    },
    {
      id: `joongang-${Date.now()}-2`,
      title: '대학 입시, AI 활용 확대 논란',
      content: '대학 입시에서 AI를 활용한 자기소개서 작성이 논란이 되고 있다. 교육 전문가들은 공정성 문제를 우려하며 명확한 가이드라인이 필요하다고 주장했다. 대교협은 AI 활용 지침을 마련 중이다.',
      url: 'https://joongang.joins.com/article/20251112000002',
      source: '중앙일보',
      publishedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '교육'
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
 * 연합뉴스 크롤러 (종합)
 */
export async function crawlYonhap(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `yonhap-${Date.now()}-1`,
      title: '국회, 반도체 지원법 통과',
      content: '국회가 반도체 산업 경쟁력 강화를 위한 지원법을 통과시켰다. 이번 법안은 반도체 기업에 대한 세제 혜택 확대와 R&D 지원 강화를 담고 있다. 업계는 글로벌 경쟁력 제고에 도움이 될 것으로 기대하고 있다.',
      url: 'https://yna.co.kr/view/AKR20251112000001',
      source: '연합뉴스',
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '정책/규제'
    },
    {
      id: `yonhap-${Date.now()}-2`,
      title: '한국 경제성장률 3% 전망',
      content: '한국은행이 올해 경제성장률 전망치를 3%로 상향 조정했다. 수출 호조와 내수 회복세가 주요 원인으로 분석됐다. 한은 관계자는 하반기에도 성장세가 이어질 것으로 예상했다.',
      url: 'https://yna.co.kr/view/AKR20251112000002',
      source: '연합뉴스',
      publishedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
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
 * SBS뉴스 크롤러 (사회, 환경)
 */
export async function crawlSBS(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `sbs-${Date.now()}-1`,
      title: "미세먼지 농도 '나쁨' 수준, 외출 자제 권고",
      content: '서울과 경기 지역의 미세먼지 농도가 나쁨 수준을 기록했다. 환경부는 노약자와 어린이의 외출을 자제하고 마스크 착용을 권고했다. 대기질은 내일 오후부터 점차 개선될 전망이다.',
      url: 'https://news.sbs.co.kr/news/20251112000001',
      source: 'SBS뉴스',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '환경'
    },
    {
      id: `sbs-${Date.now()}-2`,
      title: '청년 주거 지원 정책 확대',
      content: '정부가 청년 주거 지원 정책을 대폭 확대한다. 청년 전용 주택 공급을 늘리고 임대료 지원 대상도 확대할 계획이다. 국토부는 내년까지 청년 주택 5만 가구를 추가 공급할 예정이다.',
      url: 'https://news.sbs.co.kr/news/20251112000002',
      source: 'SBS뉴스',
      publishedAt: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '사회'
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
 * MBC뉴스 크롤러 (정치, 금융)
 */
export async function crawlMBC(params: NewsScraperParams): Promise<NewsArticle[]> {
  const mockArticles: NewsArticle[] = [
    {
      id: `mbc-${Date.now()}-1`,
      title: '금융위, 가상자산 규제 강화 방침',
      content: '금융위원회가 가상자산 거래소에 대한 규제를 강화하기로 했다. 투자자 보호를 위해 거래소 등록 요건을 강화하고 불법 행위에 대한 처벌을 강화할 계획이다. 업계는 과도한 규제를 우려하고 있다.',
      url: 'https://imnews.imbc.com/news/20251112000001',
      source: 'MBC뉴스',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '금융'
    },
    {
      id: `mbc-${Date.now()}-2`,
      title: '국회, 근로시간 단축 법안 계류',
      content: '주 52시간제를 더 단축하는 법안이 국회에 계류 중이다. 노동계는 근로시간 단축이 필요하다고 주장하는 반면, 경영계는 생산성 저하를 우려하고 있다. 법안 통과 여부는 불투명한 상황이다.',
      url: 'https://imnews.imbc.com/news/20251112000002',
      source: 'MBC뉴스',
      publishedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      scrapedAt: new Date().toISOString(),
      category: '정치'
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
    crawlETNews(params),
    crawlAsiaEconomy(params),
    crawlHankyung(params),
    crawlMaeil(params),
    crawlITChosun(params),
    crawlDigitalTimes(params),
    crawlBloter(params),
    crawlHankyoreh(params),
    crawlChosun(params),
    crawlJoongang(params),
    crawlYonhap(params),
    crawlSBS(params),
    crawlMBC(params)
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

  // limit 적용 (작성일 필터 없이 모든 기사 포함)
  if (params.limit) {
    return uniqueArticles.slice(0, params.limit)
  }

  return uniqueArticles
}
