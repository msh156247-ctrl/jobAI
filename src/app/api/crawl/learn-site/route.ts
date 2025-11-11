/**
 * 새 채용 사이트 패턴 학습 API
 * POST /api/crawl/learn-site
 * Body: { siteUrl: string, siteName: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { learnURLPattern } from '@/lib/crawling/urlPatternLearner'
import { savePattern } from '@/lib/crawling/patternCache'

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, siteName } = await request.json()

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'siteUrl이 필요합니다' },
        { status: 400 }
      )
    }

    console.log(`[API] 새 사이트 학습 시작: ${siteName || siteUrl}`)

    // AI를 사용하여 패턴 학습
    const pattern = await learnURLPattern(siteUrl, {
      headless: true,
      timeout: 30000
    })

    // 패턴 캐시에 저장
    savePattern(pattern)

    console.log(`[API] ${pattern.domain} 패턴 학습 완료`)

    return NextResponse.json({
      success: true,
      siteName: siteName || pattern.domain,
      pattern: {
        domain: pattern.domain,
        listPagePattern: pattern.listPagePattern,
        detailPagePattern: pattern.detailPagePattern,
        confidence: 0.8, // Placeholder
        selectors: pattern.selectors,
        createdAt: pattern.createdAt
      },
      message: `${pattern.domain} 사이트가 성공적으로 추가되었습니다`
    })

  } catch (error: any) {
    console.error('[API] 사이트 학습 실패:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '사이트 패턴 학습 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}
