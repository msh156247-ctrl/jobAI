import { NextRequest, NextResponse } from 'next/server'
import { crawlAllNews } from '@/lib/news/crawlers'
import { generateCompanyReports } from '@/lib/news/analyzer'
import type { NewsScraperParams } from '@/lib/news/types'

export async function POST(request: NextRequest) {
  try {
    const params: NewsScraperParams = await request.json()

    // 뉴스 크롤링
    const articles = await crawlAllNews(params)

    // 기업별 리포트 생성
    const companyReports = generateCompanyReports(articles)

    return NextResponse.json({
      success: true,
      articles,
      companyReports,
      metadata: {
        totalArticles: articles.length,
        totalCompanies: companyReports.length,
        crawledAt: new Date().toISOString(),
        sources: ['ZDNet', '서울경제', '전자신문']
      }
    })
  } catch (error) {
    console.error('Error crawling news:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to crawl news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const company = searchParams.get('company')
    const keyword = searchParams.get('keyword')
    const limit = searchParams.get('limit')

    const params: NewsScraperParams = {
      company: company || undefined,
      keyword: keyword || undefined,
      limit: limit ? parseInt(limit) : 20
    }

    const articles = await crawlAllNews(params)
    const companyReports = generateCompanyReports(articles)

    return NextResponse.json({
      success: true,
      articles,
      companyReports,
      metadata: {
        totalArticles: articles.length,
        totalCompanies: companyReports.length,
        crawledAt: new Date().toISOString(),
        sources: ['ZDNet', '서울경제', '전자신문']
      }
    })
  } catch (error) {
    console.error('Error crawling news:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to crawl news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
