import { NextRequest, NextResponse } from 'next/server'
import {
  scrapeSaramin,
  scrapeJobKorea,
  scrapeWanted,
  scrapeIncruit,
  scrapeJobPlanet,
  scrapeAllSites,
  type ScraperParams
} from '@/lib/scrapers'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5분 타임아웃

interface CrawlParams extends ScraperParams {
  sites?: string[] // ['saramin', 'jobkorea', 'wanted', 'incruit', 'jobplanet']
}

/**
 * POST /api/crawl
 * 실제 채용 사이트에서 공고를 크롤링합니다
 */
export async function POST(request: NextRequest) {
  try {
    const params: CrawlParams = await request.json()

    // 크롤링할 사이트 목록 (기본값: 전체)
    const sitesToCrawl = params.sites || ['saramin', 'jobkorea', 'wanted', 'incruit', 'jobplanet']

    // 크롤링 결과를 저장할 배열
    const allJobs: any[] = []
    const errors: string[] = []

    // 모든 사이트 또는 특정 사이트 크롤링
    if (sitesToCrawl.length === 5) {
      // 모든 사이트 크롤링 - 병렬 처리
      const scrapedJobs = await scrapeAllSites(params)
      allJobs.push(...scrapedJobs)
    } else {
      // 특정 사이트만 크롤링
      for (const site of sitesToCrawl) {
        try {
          let jobs: any[] = []

          switch (site) {
            case 'saramin':
              jobs = await scrapeSaramin(params)
              break
            case 'jobkorea':
              jobs = await scrapeJobKorea(params)
              break
            case 'wanted':
              jobs = await scrapeWanted(params)
              break
            case 'incruit':
              jobs = await scrapeIncruit(params)
              break
            case 'jobplanet':
              jobs = await scrapeJobPlanet(params)
              break
            default:
              errors.push(`Unknown site: ${site}`)
          }

          allJobs.push(...jobs)
        } catch (error) {
          console.error(`Error crawling ${site}:`, error)
          errors.push(`Failed to crawl ${site}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      jobs: allJobs,
      totalJobs: allJobs.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Crawl API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

