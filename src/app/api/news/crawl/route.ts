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
}

// XML 파싱을 위한 간단한 유틸리티 함수
function parseRSSItem(itemText: string, source: string, category?: NewsCategory): NewsArticle | null {
  try {
    const title = itemText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                  itemText.match(/<title>(.*?)<\/title>/)?.[1]
    const link = itemText.match(/<link>(.*?)<\/link>/)?.[1]
    const description = itemText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                       itemText.match(/<description>(.*?)<\/description>/)?.[1]
    const pubDate = itemText.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
    const guid = itemText.match(/<guid.*?>(.*?)<\/guid>/)?.[1]

    if (!title || !link) return null

    return {
      id: guid || link,
      title: title.trim(),
      content: description?.trim() || '',
      summary: description?.trim() || '',
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

async function fetchRSS(url: string, source: string, category?: NewsCategory): Promise<NewsArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAI-NewsBot/1.0)',
      },
      next: { revalidate: 300 } // 5분 캐시
    })

    if (!response.ok) {
      console.error(`Failed to fetch RSS from ${url}: ${response.status}`)
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

    return articles
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as NewsCategory | null
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')

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

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value)
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

    return NextResponse.json({
      success: true,
      count: limitedArticles.length,
      articles: limitedArticles,
      metadata: {
        crawledAt: new Date().toISOString(),
        category,
        source,
        limit,
      }
    })
  } catch (error) {
    console.error('News crawl error:', error)
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
