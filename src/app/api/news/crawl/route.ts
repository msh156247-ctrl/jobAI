import { NextRequest, NextResponse } from 'next/server'
import type { NewsArticle, NewsCategory } from '@/lib/news/types'

/**
 * 뉴스 크롤링 API
 *
 * 국내 주요 언론사의 RSS 피드를 크롤링하여 뉴스 데이터를 수집합니다.
 * GET /api/news/crawl?category=경제&limit=20
 */

// RSS 피드 URL 맵핑
const RSS_FEEDS: Record<string, { url: string; category?: NewsCategory }[]> = {
  '연합뉴스': [
    { url: 'https://www.yna.co.kr/rss/news.xml', category: '정치' },
    { url: 'https://www.yna.co.kr/rss/economy.xml', category: '경제' },
    { url: 'https://www.yna.co.kr/rss/society.xml', category: '사회' },
    { url: 'https://www.yna.co.kr/rss/itscience.xml', category: 'IT/과학' },
    { url: 'https://www.yna.co.kr/rss/culture.xml', category: '문화' },
    { url: 'https://www.yna.co.kr/rss/sports.xml', category: '스포츠' },
    { url: 'https://www.yna.co.kr/rss/international.xml', category: '국제' },
  ],
  'KBS': [
    { url: 'https://news.kbs.co.kr/rss/news/news_11.xml', category: '정치' },
    { url: 'https://news.kbs.co.kr/rss/news/news_12.xml', category: '경제' },
    { url: 'https://news.kbs.co.kr/rss/news/news_13.xml', category: '사회' },
    { url: 'https://news.kbs.co.kr/rss/news/news_14.xml', category: 'IT/과학' },
    { url: 'https://news.kbs.co.kr/rss/news/news_15.xml', category: '문화' },
    { url: 'https://news.kbs.co.kr/rss/news/news_16.xml', category: '스포츠' },
  ],
  'MBC': [
    { url: 'https://imnews.imbc.com/rss/news/news_00.xml' }, // 전체 뉴스
  ],
  'SBS': [
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER' }, // 정치
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=02&plink=RSSREADER', category: '경제' },
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=07&plink=RSSREADER', category: '사회' },
    { url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08&plink=RSSREADER', category: 'IT/과학' },
  ],
  '한겨레': [
    { url: 'https://www.hani.co.kr/rss/' }, // 전체 뉴스
  ],
  '경향신문': [
    { url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml' }, // 전체 뉴스
  ],
  '한국경제': [
    { url: 'https://www.hankyung.com/rss/economy', category: '경제' },
    { url: 'https://www.hankyung.com/rss/society', category: '사회' },
  ],
  '매일경제': [
    { url: 'https://www.mk.co.kr/rss/30100041/' }, // 전체 뉴스
  ],
  '전자신문': [
    { url: 'https://www.etnews.com/rss.xml', category: 'IT/과학' },
  ],
  'ZDNet': [
    { url: 'https://zdnet.co.kr/rss/news.xml', category: 'IT/과학' },
  ],
}

/**
 * XML 파싱을 위한 간단한 유틸리티 함수
 * RSS 아이템에서 뉴스 데이터 추출
 */
function parseRSSItem(itemText: string, source: string, category?: NewsCategory): NewsArticle | null {
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

    return {
      id: guid || link,
      title: cleanText(title),
      content: description ? cleanText(description) : '',
      summary: description ? cleanText(description).substring(0, 200) : '',
      url: link.trim(),
      source,
      publishedAt: pubDate || new Date().toISOString(),
      scrapedAt: new Date().toISOString(),
      category,
      keywords: []
    }
  } catch (error) {
    console.error('Error parsing RSS item:', error)
    return null
  }
}

/**
 * RSS 피드에서 뉴스 기사 크롤링
 */
async function fetchRSS(url: string, source: string, category?: NewsCategory): Promise<NewsArticle[]> {
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
      const article = parseRSSItem('<item>' + itemText.split('</item>')[0] + '</item>', source, category)
      if (article) {
        articles.push(article)
      }
    }

    console.log(`[RSS Crawl] Successfully fetched ${articles.length} articles from ${source}${category ? ` (${category})` : ''}`)
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
        crawlPromises.push(fetchRSS(feed.url, sourceName, feed.category))
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
