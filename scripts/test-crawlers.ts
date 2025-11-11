#!/usr/bin/env tsx
/**
 * 크롤러 테스트 스크립트
 *
 * 사용법:
 * npm run test:crawl -- --site saramin
 * npm run test:crawl -- --site all --keyword "개발자"
 * npm run test:crawl -- --site wanted --limit 10
 */

import { ScraperParams } from '../src/lib/scrapers'

async function main() {
  // 명령줄 인자 파싱
  const args = process.argv.slice(2)
  const site = getArg(args, '--site') || 'saramin'
  const keyword = getArg(args, '--keyword') || '개발자'
  const location = getArg(args, '--location')
  const limit = parseInt(getArg(args, '--limit') || '10')

  const params: ScraperParams = {
    keyword,
    location,
    limit
  }

  console.log('🚀 크롤러 테스트 시작')
  console.log('설정:', JSON.stringify(params, null, 2))
  console.log('')

  try {
    if (site === 'all') {
      await testAllSites(params)
    } else {
      await testSingleSite(site, params)
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
    process.exit(1)
  }
}

async function testSingleSite(site: string, params: ScraperParams) {
  console.log(`📍 [${site}] 크롤링 시작...`)

  let scraper: (params: ScraperParams) => Promise<any>

  switch (site.toLowerCase()) {
    case 'saramin':
      const { crawlSaramin } = await import('../src/lib/crawling/saraminCrawler')
      scraper = crawlSaramin
      break
    case 'jobkorea':
      const { crawlJobKorea } = await import('../src/lib/crawling/jobkoreaCrawler')
      scraper = crawlJobKorea
      break
    case 'wanted':
      const { crawlWanted } = await import('../src/lib/crawling/wantedCrawler')
      scraper = crawlWanted
      break
    case 'incruit':
      const { crawlIncruit } = await import('../src/lib/crawling/incruitCrawler')
      scraper = crawlIncruit
      break
    case 'jobplanet':
      const { crawlJobPlanet } = await import('../src/lib/crawling/jobplanetCrawler')
      scraper = crawlJobPlanet
      break
    default:
      throw new Error(`Unknown site: ${site}`)
  }

  const startTime = Date.now()
  const jobs = await scraper(params)
  const duration = Date.now() - startTime

  console.log(`\n✅ [${site}] 크롤링 완료`)
  console.log(`   - 수집된 공고: ${jobs.length}개`)
  console.log(`   - 소요 시간: ${(duration / 1000).toFixed(2)}초`)

  if (jobs.length > 0) {
    console.log('\n📋 샘플 데이터 (첫 번째 공고):')
    console.log(JSON.stringify(jobs[0], null, 2))

    // 검증
    const { validateJob } = await import('../src/lib/crawling/validator')
    const validation = validateJob(jobs[0])

    if (!validation.valid) {
      console.log('\n⚠️ 검증 실패:')
      validation.errors.forEach(error => {
        console.log(`   - ${error.field}: ${error.message}`)
      })
    } else {
      console.log('\n✅ 검증 통과')
    }
  }
}

async function testAllSites(params: ScraperParams) {
  console.log('📍 모든 사이트 크롤링 시작...\n')

  const { scrapeAllSites } = await import('../src/lib/scrapers')

  const startTime = Date.now()
  const jobs = await scrapeAllSites(params, {
    validate: true,
    removeDuplicates: true
  })
  const duration = Date.now() - startTime

  console.log(`\n✅ 전체 크롤링 완료`)
  console.log(`   - 총 수집된 공고: ${jobs.length}개`)
  console.log(`   - 소요 시간: ${(duration / 1000).toFixed(2)}초`)
  console.log(`   - 평균 속도: ${(jobs.length / (duration / 1000)).toFixed(2)}개/초`)

  // 사이트별 통계
  const bySite: Record<string, number> = {}
  jobs.forEach(job => {
    bySite[job.source] = (bySite[job.source] || 0) + 1
  })

  console.log('\n📊 사이트별 통계:')
  Object.entries(bySite).forEach(([site, count]) => {
    console.log(`   - ${site}: ${count}개`)
  })

  // 샘플 출력
  if (jobs.length > 0) {
    console.log('\n📋 샘플 공고:')
    jobs.slice(0, 3).forEach((job, index) => {
      console.log(`\n${index + 1}. [${job.source}] ${job.title}`)
      console.log(`   회사: ${job.company}`)
      console.log(`   지역: ${job.location}`)
      console.log(`   연봉: ${job.salary.min}~${job.salary.max}만원`)
      console.log(`   URL: ${job.sourceUrl}`)
    })
  }
}

function getArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) {
    return undefined
  }
  return args[index + 1]
}

// 스크립트 실행
main().catch(console.error)
