/**
 * 학습된 채용 사이트 목록 조회 API
 * GET /api/crawl/sites
 */

import { NextResponse } from 'next/server'
import { getAllPatterns } from '@/lib/crawling/patternCache'

export async function GET() {
  try {
    const patterns = getAllPatterns()

    const sites = patterns.map(pattern => ({
      domain: pattern.domain,
      listPagePattern: pattern.listPagePattern,
      detailPagePattern: pattern.detailPagePattern,
      createdAt: pattern.createdAt,
      lastUpdated: pattern.lastUpdated
    }))

    return NextResponse.json({
      success: true,
      count: sites.length,
      sites
    })

  } catch (error: any) {
    console.error('[API] 사이트 목록 조회 실패:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사이트 목록 조회 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}
