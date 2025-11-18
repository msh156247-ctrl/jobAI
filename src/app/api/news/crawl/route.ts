import { NextRequest, NextResponse } from 'next/server'
import type { NewsArticle, NewsCategory } from '@/lib/news/types'

/**
 * 뉴스 크롤링 API
 *
 * 국내 주요 언론사의 RSS 피드를 크롤링하여 뉴스 데이터를 수집합니다.
 * GET /api/news/crawl?category=경제&limit=20
 */

// RSS 피드 URL 맵핑 - 주제별 / 키워드 중심
const RSS_FEEDS: Record<string, { url: string; category?: NewsCategory; keywords?: string[] }[]> = {
  // === 종합 일간지 ===
  '연합뉴스': [
    { url: 'https://www.yna.co.kr/rss/news.xml', category: '정치', keywords: ['정치', '국회', '정부', '대통령'] },
    { url: 'https://www.yna.co.kr/rss/economy.xml', category: '경제', keywords: ['경제', '금융', '증시', '기업'] },
    { url: 'https://www.yna.co.kr/rss/society.xml', category: '사회', keywords: ['사회', '사건', '사고', '복지'] },
    { url: 'https://www.yna.co.kr/rss/itscience.xml', category: 'IT/과학', keywords: ['IT', '과학', '기술', '인터넷'] },
    { url: 'https://www.yna.co.kr/rss/culture.xml', category: '문화', keywords: ['문화', '예술', '공연', '전시'] },
    { url: 'https://www.yna.co.kr/rss/sports.xml', category: '스포츠', keywords: ['스포츠', '야구', '축구', '올림픽'] },
    { url: 'https://www.yna.co.kr/rss/international.xml', category: '국제', keywords: ['국제', '미국', '중국', '일본'] },
  ],

  '조선일보': [
    { url: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml', keywords: ['정치', '경제', '사회', '국제'] },
  ],

  '중앙일보': [
    { url: 'https://koreajoongangdaily.joins.com/news/rss.aspx', keywords: ['정치', '경제', '사회', '문화'] },
  ],

  '동아일보': [
    { url: 'https://rss.donga.com/total.xml', keywords: ['정치', '경제', '사회', '국제'] },
  ],

  '한겨레': [
    { url: 'https://www.hani.co.kr/rss/', keywords: ['정치', '경제', '사회', '국제'] },
  ],

  '경향신문': [
    { url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml', keywords: ['정치', '경제', '사회', '문화'] },
  ],

  // === 방송사 ===
  'KBS': [
    { url: 'https://news.kbs.co.kr/rss/headline.xml', keywords: ['헤드라인', '주요뉴스'] },
  ],

  'MBC': [
    { url: 'https://imnews.imbc.com/rss/news/news_00.xml', keywords: ['정치', '경제', '사회'] },
  ],

  'SBS': [
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER', category: '정치', keywords: ['정치', '국회'] },
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=02&plink=RSSREADER', category: '경제', keywords: ['경제', '증시'] },
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=07&plink=RSSREADER', category: '사회', keywords: ['사회', '사건'] },
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08&plink=RSSREADER', category: 'IT/과학', keywords: ['IT', '과학'] },
  ],

  'JTBC': [
    { url: 'https://fs.jtbc.co.kr/RSS/politics.xml', category: '정치', keywords: ['정치', '국회', '정당'] },
    { url: 'https://fs.jtbc.co.kr/RSS/economy.xml', category: '경제', keywords: ['경제', '금융', '기업'] },
  ],

  // === 경제지 ===
  '한국경제': [
    { url: 'https://www.hankyung.com/feed/economy', category: '경제', keywords: ['경제', '주식', '부동산', '금융'] },
    { url: 'https://www.hankyung.com/feed/it', category: 'IT/과학', keywords: ['IT', '기술', '스타트업'] },
  ],

  '매일경제': [
    { url: 'https://www.mk.co.kr/rss/30000001/', category: '경제', keywords: ['경제', '증시', '기업'] },
  ],

  '서울경제': [
    { url: 'https://www.sedaily.com/RSS/S00.xml', category: '경제', keywords: ['경제', '금융', '산업'] },
  ],

  '머니투데이': [
    { url: 'https://rss.mt.co.kr/mt_news.xml', category: '경제', keywords: ['경제', '증시', '부동산'] },
  ],

  '파이낸셜뉴스': [
    { url: 'https://www.fnnews.com/rss/r20_finance.xml', category: '경제', keywords: ['금융', '증권', '은행'] },
  ],

  // === IT/과학 전문지 ===
  '전자신문': [
    { url: 'https://www.etnews.com/rss.xml', category: 'IT/과학', keywords: ['IT', '전자', '반도체', '통신'] },
  ],

  'ZDNet': [
    { url: 'https://www.zdnet.co.kr/rss/news.xml', category: 'IT/과학', keywords: ['IT', '인터넷', '소프트웨어'] },
  ],

  'IT조선': [
    { url: 'https://it.chosun.com/rss/clickTop.xml', category: 'IT/과학', keywords: ['IT', '테크', '스마트폰', '게임'] },
  ],

  '디지털타임스': [
    { url: 'https://www.dt.co.kr/rss/economy.xml', category: 'IT/과학', keywords: ['IT', '디지털', '전자', '통신'] },
  ],

  '블로터': [
    { url: 'https://www.bloter.net/feed/', category: 'IT/과학', keywords: ['IT', '스타트업', '테크', '인터넷'] },
  ],

  // === 기타 전문지 ===
  '서울신문': [
    { url: 'https://www.seoul.co.kr/rss/rss_cp.xml', keywords: ['정치', '경제', '사회'] },
  ],

  '국민일보': [
    { url: 'https://rss.kmib.co.kr/data/kmibRssAll.xml', keywords: ['정치', '경제', '사회'] },
  ],

  '세계일보': [
    { url: 'https://www.segye.com/rssFeed/list.html', keywords: ['정치', '경제', '사회'] },
  ],
}

/**
 * XML 파싱을 위한 간단한 유틸리티 함수
 * RSS 아이템에서 뉴스 데이터 추출 및 키워드 태깅
 */
function parseRSSItem(itemText: string, source: string, category?: NewsCategory, feedKeywords?: string[]): NewsArticle | null {
  try {
    // CDATA 섹션과 일반 텍스트 모두 처리
    const title = itemText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                  itemText.match(/<title>(.*?)<\/title>/)?.[1]

    const link = itemText.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/)?.[1] ||
                 itemText.match(/<link>(.*?)<\/link>/)?.[1]

    const description = itemText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                       itemText.match(/<description>(.*?)<\/description>/)?.[1]

    const pubDate = itemText.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
    const guid = itemText.match(/<guid.*?>(.*?)<\/guid>/)?.[1]

    // 필수 필드 검증
    if (!title || !link) {
      return null
    }

    // HTML 태그 제거 및 정리
    const cleanText = (text: string) => {
      return text
        .replace(/<[^>]*>/g, '') // HTML 태그 제거
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim()
    }

    const cleanTitle = cleanText(title)
    const cleanContent = description ? cleanText(description) : ''

    // 키워드 자동 태깅: 제목과 내용에서 feedKeywords와 매칭되는 키워드 추출
    const matchedKeywords: string[] = []
    if (feedKeywords && feedKeywords.length > 0) {
      const fullText = `${cleanTitle} ${cleanContent}`.toLowerCase()
      for (const keyword of feedKeywords) {
        if (fullText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword)
        }
      }
    }

    return {
      id: guid || link,
      title: cleanTitle,
      content: cleanContent,
      summary: cleanContent.substring(0, 200),
      url: link.trim(),
      source,
      publishedAt: pubDate || new Date().toISOString(),
      scrapedAt: new Date().toISOString(),
      category,
      keywords: matchedKeywords
    }
  } catch (error) {
    console.error('Error parsing RSS item:', error)
    return null
  }
}

/**
 * RSS 피드에서 뉴스 기사 크롤링 및 키워드 태깅
 */
async function fetchRSS(url: string, source: string, category?: NewsCategory, keywords?: string[]): Promise<NewsArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAI-NewsBot/1.0)',
      },
      next: { revalidate: 300 } // 5분 캐시
    })

    if (!response.ok) {
      console.error(`[RSS Crawl] Failed to fetch from ${source} (${url}): ${response.status} ${response.statusText}`)
      return []
    }

    const xml = await response.text()

    // <item> 태그로 분할하여 파싱
    const items = xml.split('<item>').slice(1) // 첫 번째 요소는 헤더이므로 제외

    const articles: NewsArticle[] = []
    for (const itemText of items) {
      const article = parseRSSItem('<item>' + itemText.split('</item>')[0] + '</item>', source, category, keywords)
      if (article) {
        articles.push(article)
      }
    }

    const keywordsInfo = keywords && keywords.length > 0 ? ` [키워드: ${keywords.join(', ')}]` : ''
    console.log(`[RSS Crawl] Successfully fetched ${articles.length} articles from ${source}${category ? ` (${category})` : ''}${keywordsInfo}`)
    return articles
  } catch (error) {
    console.error(`[RSS Crawl] Error fetching from ${source} (${url}):`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as NewsCategory | null
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log(`[RSS Crawl] Starting crawl - category: ${category || 'all'}, source: ${source || 'all'}, limit: ${limit}`)

    const allArticles: NewsArticle[] = []

    // 크롤링할 소스 결정
    const sourcesToCrawl = source && RSS_FEEDS[source]
      ? [[source, RSS_FEEDS[source]]]
      : Object.entries(RSS_FEEDS)

    // 병렬로 RSS 피드 크롤링
    const crawlPromises: Promise<NewsArticle[]>[] = []

    for (const [sourceName, feeds] of sourcesToCrawl) {
      const filteredFeeds = category
        ? feeds.filter(feed => feed.category === category)
        : feeds

      for (const feed of filteredFeeds) {
        crawlPromises.push(fetchRSS(feed.url, sourceName, feed.category, feed.keywords))
      }
    }

    const results = await Promise.allSettled(crawlPromises)
    let successCount = 0
    let failCount = 0

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value)
        successCount++
      } else {
        failCount++
      }
    }

    // 중복 제거 (URL 기준)
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    )

    // 최신순 정렬
    const sortedArticles = uniqueArticles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    // 제한 적용
    const limitedArticles = sortedArticles.slice(0, limit)

    const duration = Date.now() - startTime
    console.log(`[RSS Crawl] Completed - Total: ${allArticles.length}, Unique: ${uniqueArticles.length}, Returned: ${limitedArticles.length}, Success: ${successCount}, Failed: ${failCount}, Duration: ${duration}ms`)

    return NextResponse.json({
      success: true,
      count: limitedArticles.length,
      articles: limitedArticles,
      metadata: {
        crawledAt: new Date().toISOString(),
        category,
        source,
        limit,
        totalFetched: allArticles.length,
        uniqueArticles: uniqueArticles.length,
        duplicatesRemoved: allArticles.length - uniqueArticles.length,
        crawlStats: {
          successCount,
          failCount,
          duration: `${duration}ms`
        }
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[RSS Crawl] Failed after ${duration}ms:`, error)
    return NextResponse.json(
      {
        success: false,
        error: '뉴스 크롤링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
