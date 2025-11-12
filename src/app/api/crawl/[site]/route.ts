/**
 * 크롤링 API Route (서버 사이드)
 * GET /api/crawl/[site]?keyword=...&location=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { ScraperParams } from '@/lib/scrapers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const { site } = await params

    // URL 파라미터에서 검색 조건 추출
    const scraperParams: ScraperParams = {
      keyword: searchParams.get('keyword') || undefined,
      industry: searchParams.get('industry') || undefined,
      subIndustry: searchParams.get('subIndustry') || undefined,
      location: searchParams.get('location') || undefined,
      minSalary: searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!) : undefined,
      maxSalary: searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!) : undefined,
      minExperience: searchParams.get('minExperience') ? parseInt(searchParams.get('minExperience')!) : undefined,
      maxExperience: searchParams.get('maxExperience') ? parseInt(searchParams.get('maxExperience')!) : undefined,
      employmentType: searchParams.get('employmentType') || undefined,
      techStack: searchParams.get('techStack') || undefined,
      benefits: searchParams.get('benefits') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    }

    console.log(`[API] ${site} 크롤링 요청:`, scraperParams)

    let jobs: any[] = []

    // 사이트별 크롤러 실행
    switch (site.toLowerCase()) {
      case 'saramin':
      case '사람인': {
        const { crawlSaramin } = await import('@/lib/crawling/saraminCrawler')
        jobs = await crawlSaramin(scraperParams)
        break
      }
      case 'jobkorea':
      case '잡코리아': {
        const { crawlJobKorea } = await import('@/lib/crawling/jobkoreaCrawler')
        jobs = await crawlJobKorea(scraperParams)
        break
      }
      case 'wanted':
      case '원티드': {
        const { crawlWanted } = await import('@/lib/crawling/wantedCrawler')
        jobs = await crawlWanted(scraperParams)
        break
      }
      case 'incruit':
      case '인크루트': {
        const { crawlIncruit } = await import('@/lib/crawling/incruitCrawler')
        jobs = await crawlIncruit(scraperParams)
        break
      }
      case 'jobplanet':
      case '잡플래닛': {
        const { crawlJobPlanet } = await import('@/lib/crawling/jobplanetCrawler')
        jobs = await crawlJobPlanet(scraperParams)
        break
      }
      default:
        return NextResponse.json(
          { error: `알 수 없는 사이트: ${site}` },
          { status: 400 }
        )
    }

    console.log(`[API] ${site} 크롤링 완료: ${jobs.length}개`)

    return NextResponse.json({
      success: true,
      site,
      count: jobs.length,
      jobs,
      crawledAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[API] 크롤링 실패:', error)
    const { site } = await params
    return NextResponse.json(
      {
        success: false,
        error: error.message || '크롤링 중 오류가 발생했습니다',
        site
      },
      { status: 500 }
    )
  }
}
