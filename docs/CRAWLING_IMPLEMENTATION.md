# 크롤링 시스템 구현 가이드

JobAI 프로젝트의 실시간 채용 공고 크롤링 시스템에 대한 완전한 구현 문서입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [구현된 기능](#구현된-기능)
4. [크롤러 상세](#크롤러-상세)
5. [사용 방법](#사용-방법)
6. [테스트](#테스트)
7. [주의사항](#주의사항)

## 시스템 개요

### 지원 사이트
- ✅ 사람인 (Saramin)
- ✅ 잡코리아 (JobKorea)
- ✅ 원티드 (Wanted)
- ✅ 인크루트 (Incruit)
- ✅ 잡플래닛 (JobPlanet)

### 핵심 기능
- **AI 기반 URL 패턴 자동 학습**: GPT-4를 활용하여 채용 사이트의 URL 구조를 자동으로 학습
- **패턴 캐싱 시스템**: 학습된 패턴을 30일간 캐싱하여 재사용
- **실시간 크롤링**: Puppeteer + Cheerio를 사용한 실시간 데이터 수집
- **자동 검증 시스템**: 수집된 데이터의 품질을 자동으로 검증
- **중복 제거**: 동일한 공고를 자동으로 제거

## 아키텍처

```
src/lib/
├── crawling/
│   ├── urlPatternLearner.ts    # AI 기반 URL 패턴 학습
│   ├── patternCache.ts         # 패턴 캐싱 시스템
│   ├── validator.ts            # 데이터 검증 시스템
│   ├── saraminCrawler.ts       # 사람인 크롤러
│   ├── jobkoreaCrawler.ts      # 잡코리아 크롤러
│   ├── wantedCrawler.ts        # 원티드 크롤러
│   ├── incruitCrawler.ts       # 인크루트 크롤러
│   └── jobplanetCrawler.ts     # 잡플래닛 크롤러
└── scrapers/
    └── index.ts                # 통합 인터페이스
```

### 데이터 플로우

```
1. 사용자 요청
   ↓
2. ScraperParams 생성 (keyword, location, etc.)
   ↓
3. 크롤러 실행
   ├─ 패턴 캐시 확인
   ├─ 필요시 AI 패턴 학습
   ├─ Puppeteer로 페이지 접근
   ├─ Cheerio로 HTML 파싱
   └─ 데이터 추출
   ↓
4. 데이터 검증
   ├─ 필수 필드 확인
   ├─ 형식 검증
   └─ 유효성 체크
   ↓
5. 중복 제거
   ↓
6. 결과 반환
```

## 구현된 기능

### 1. URL 패턴 자동 학습 (urlPatternLearner.ts)

AI를 활용하여 채용 사이트의 URL 구조를 자동으로 학습합니다.

```typescript
// 사용 예시
import { learnURLPattern } from '@/lib/crawling/urlPatternLearner'

const pattern = await learnURLPattern('https://www.saramin.co.kr/zf_user/jobs/list', {
  headless: true,
  timeout: 30000
})

// 결과:
// {
//   domain: 'saramin.co.kr',
//   listPagePattern: '/zf_user/jobs/list',
//   detailPagePattern: '/zf_user/jobs/relay/view?rec_idx={id}',
//   detailPageRegex: /\/zf_user\/jobs\/relay\/view\?rec_idx=\d+/,
//   selectors: { jobList: '.item_recruit', ... }
// }
```

**주요 기능:**
- 페이지의 모든 링크 수집 및 분석
- 채용 공고 링크 자동 식별 (키워드 및 패턴 기반)
- GPT-4를 통한 패턴 검증 및 정제
- CSS 셀렉터 자동 감지

### 2. 패턴 캐싱 시스템 (patternCache.ts)

학습된 패턴을 파일 시스템에 저장하여 재사용합니다.

```typescript
import { savePattern, loadPattern, isPatternFresh } from '@/lib/crawling/patternCache'

// 패턴 저장
savePattern(pattern)

// 패턴 불러오기
const cached = loadPattern('saramin.co.kr')

// 신선도 확인 (7일 이내)
if (!isPatternFresh('saramin.co.kr', 7)) {
  // 패턴 재학습 필요
}
```

**캐시 위치:** `.crawling-cache/`
**만료 기간:** 30일 (기본값)

### 3. 데이터 검증 시스템 (validator.ts)

수집된 데이터의 품질을 자동으로 검증합니다.

```typescript
import { validateJobs, printValidationReport } from '@/lib/crawling/validator'

const report = validateJobs(scrapedJobs)
printValidationReport(report)

// 출력:
// ============================================================
// 📊 크롤링 검증 리포트
// ============================================================
// 총 공고 수: 50
// ✅ 유효한 공고: 48
// ❌ 유효하지 않은 공고: 2
// 📈 성공률: 96.00%
```

**검증 항목:**
- 필수 필드 존재 여부 (id, title, company, sourceUrl)
- URL 형식 검증
- 연봉 범위 유효성
- 경력 범위 유효성
- 마감일 형식 검증
- 데이터 타입 검증

**에러 심각도:**
- `critical`: 필수 데이터 누락
- `high`: 데이터 형식 오류
- `medium`: 논리적 오류 (min > max 등)

## 크롤러 상세

### 사람인 (Saramin)

```typescript
import { crawlSaramin } from '@/lib/crawling/saraminCrawler'

const jobs = await crawlSaramin({
  keyword: '프론트엔드',
  location: '서울',
  minExperience: 0,
  maxExperience: 5,
  limit: 50
})
```

**특징:**
- CSS 셀렉터: `.item_recruit`
- 위치 코드: 서울(101000), 경기(102000), etc.
- 마감일 형식: D-N, ~MM/DD, 상시채용
- 스킬 태그 추출 지원

### 잡코리아 (JobKorea)

```typescript
import { crawlJobKorea } from '@/lib/crawling/jobkoreaCrawler'

const jobs = await crawlJobKorea({
  keyword: '백엔드',
  location: '서울',
  limit: 30
})
```

**특징:**
- CSS 셀렉터: `.list-post`
- 위치 코드: 서울(1), 경기(2), etc.
- URL 패턴: `/Recruit/GI_Read/{id}`

### 원티드 (Wanted)

```typescript
import { crawlWanted } from '@/lib/crawling/wantedCrawler'

const jobs = await crawlWanted({
  keyword: '데이터 엔지니어',
  location: '서울',
  limit: 20
})
```

**특징:**
- SPA 구조 (추가 대기 시간 필요)
- 여러 가능한 셀렉터 자동 탐색
- 추천보상금 정보 추출
- 스킬 태그 자동 추출

### 인크루트 (Incruit)

```typescript
import { crawlIncruit } from '@/lib/crawling/incruitCrawler'

const jobs = await crawlIncruit({
  keyword: 'DevOps',
  location: '경기',
  employmentType: '정규직',
  limit: 25
})
```

**특징:**
- CSS 셀렉터: `.c_col`
- 고용형태 코드 지원
- 다양한 마감일 형식 지원

### 잡플래닛 (JobPlanet)

```typescript
import { crawlJobPlanet } from '@/lib/crawling/jobplanetCrawler'

const jobs = await crawlJobPlanet({
  keyword: 'AI 엔지니어',
  minSalary: 4000,
  limit: 20
})
```

**특징:**
- CSS 셀렉터: `.job_listing_card`
- 연봉 정보 파싱 지원
- 회사 평점 정보 추출

## 사용 방법

### 1. 단일 사이트 크롤링

```typescript
import { scrapeSaramin } from '@/lib/scrapers'

const jobs = await scrapeSaramin({
  keyword: 'React 개발자',
  location: '서울',
  minExperience: 2,
  maxExperience: 5,
  limit: 50
})

console.log(`수집된 공고: ${jobs.length}개`)
```

### 2. 모든 사이트 병렬 크롤링

```typescript
import { scrapeAllSites } from '@/lib/scrapers'

const jobs = await scrapeAllSites(
  {
    keyword: 'Node.js 개발자',
    location: '서울',
    limit: 30
  },
  {
    validate: true,        // 자동 검증 활성화
    removeDuplicates: true // 중복 제거 활성화
  }
)

console.log(`전체 수집: ${jobs.length}개`)
```

### 3. API 엔드포인트에서 사용

```typescript
// app/api/crawl/route.ts
import { scrapeAllSites } from '@/lib/scrapers'

export async function POST(request: Request) {
  const params = await request.json()

  try {
    const jobs = await scrapeAllSites(params, {
      validate: true,
      removeDuplicates: true
    })

    return Response.json({
      success: true,
      count: jobs.length,
      jobs
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

## 테스트

### CLI 테스트 스크립트

프로젝트에는 크롤러를 쉽게 테스트할 수 있는 CLI 스크립트가 포함되어 있습니다.

```bash
# 단일 사이트 테스트
npm run test:crawl -- --site saramin --keyword "프론트엔드" --limit 10

# 모든 사이트 테스트
npm run test:crawl -- --site all --keyword "백엔드 개발자" --limit 20

# 지역 지정
npm run test:crawl -- --site wanted --keyword "React" --location "서울" --limit 15

# 잡코리아만 테스트
npm run test:crawl -- --site jobkorea --keyword "Node.js"
```

**사용 가능한 옵션:**
- `--site`: 크롤링할 사이트 (saramin, jobkorea, wanted, incruit, jobplanet, all)
- `--keyword`: 검색 키워드 (기본값: "개발자")
- `--location`: 지역 (예: 서울, 경기)
- `--limit`: 크롤링할 최대 공고 수 (기본값: 10)

### 테스트 결과 예시

```
🚀 크롤러 테스트 시작
설정: {
  "keyword": "프론트엔드",
  "limit": 10
}

📍 [saramin] 크롤링 시작...
🔍 [사람인] https://www.saramin.co.kr/zf_user/search?searchword=프론트엔드
✅ [사람인] 10개 공고 수집 완료

✅ [saramin] 크롤링 완료
   - 수집된 공고: 10개
   - 소요 시간: 3.45초

📋 샘플 데이터 (첫 번째 공고):
{
  "id": "saramin-12345678",
  "title": "프론트엔드 개발자 (React)",
  "company": "테크 스타트업",
  "location": "서울 강남구",
  ...
}

✅ 검증 통과
```

## 주의사항

### 법적 및 윤리적 고려사항

1. **robots.txt 준수**
   - 각 사이트의 robots.txt를 확인하고 준수해야 합니다
   - 크롤링이 금지된 페이지는 접근하지 마세요

2. **Rate Limiting**
   - 서버에 부담을 주지 않도록 요청 간격을 두세요
   - 병렬 크롤링 시 동시 연결 수를 제한하세요
   - 현재 구현: 배치당 5개 동시 연결, 배치 사이 500ms 대기

3. **이용약관 확인**
   - 각 채용 사이트의 이용약관을 반드시 확인하세요
   - 상업적 사용이 제한될 수 있습니다

4. **User-Agent 설정**
   - 적절한 User-Agent를 설정하여 신원을 밝히세요
   - 봇임을 숨기지 마세요

### 기술적 고려사항

1. **안티봇 시스템**
   - 일부 사이트는 Puppeteer를 차단할 수 있습니다
   - Headless 모드 감지를 우회하는 설정이 필요할 수 있습니다

2. **동적 콘텐츠**
   - SPA 사이트(Wanted 등)는 추가 대기 시간이 필요합니다
   - `waitForSelector`로 요소가 로드될 때까지 대기하세요

3. **사이트 구조 변경**
   - 사이트 리뉴얼 시 크롤러가 작동하지 않을 수 있습니다
   - 정기적인 패턴 업데이트가 필요합니다
   - 패턴 학습 시스템으로 자동 적응 가능

4. **메모리 관리**
   - Puppeteer 브라우저는 반드시 `close()`해야 합니다
   - 모든 크롤러에 `finally` 블록으로 정리 코드 포함됨

5. **에러 핸들링**
   - 네트워크 오류, 타임아웃 등을 적절히 처리하세요
   - `Promise.allSettled`로 일부 실패해도 계속 진행

## 환경 변수

```env
# .env.local

# OpenAI API Key (패턴 학습용)
OPENAI_API_KEY=your_openai_api_key

# Puppeteer 설정 (선택사항)
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
```

## 성능 최적화

### 1. 패턴 캐싱 활용
- 첫 실행 후 30일간 패턴 재사용
- AI 호출 비용 및 시간 절약

### 2. 병렬 처리
- `Promise.allSettled`로 5개 사이트 동시 크롤링
- 실패한 사이트가 있어도 계속 진행

### 3. 선택적 검증
- 개발 중에는 `validate: false`로 속도 향상
- 프로덕션에서는 `validate: true` 권장

### 4. 샘플 크롤링
- `limit` 파라미터로 수집량 제한
- 테스트 시에는 10~20개 정도만 수집

## 트러블슈팅

### 문제: Puppeteer 설치 실패

```bash
# Windows
npm install puppeteer --ignore-scripts
npx puppeteer browsers install chrome

# Linux
sudo apt-get install -y \
  fonts-liberation \
  libnss3 \
  libxss1 \
  xdg-utils
```

### 문제: 타임아웃 에러

```typescript
// timeout 값 증가
const jobs = await crawlSaramin({
  ...params,
  timeout: 60000 // 60초로 증가
})
```

### 문제: 빈 결과

1. 사이트 구조가 변경되었는지 확인
2. CSS 셀렉터가 올바른지 확인
3. 패턴 캐시 삭제 후 재학습

```typescript
import { deletePattern } from '@/lib/crawling/patternCache'

deletePattern('saramin.co.kr')
// 다시 크롤링하면 자동으로 재학습됨
```

### 문제: 검증 실패율 높음

```typescript
// 검증 리포트 확인
const report = validateJobs(jobs)
printValidationReport(report)

// 상세 에러 확인
report.details
  .filter(d => !d.valid)
  .forEach(d => {
    console.log(`[${d.jobId}]`, d.errors)
  })
```

## 향후 개선사항

- [ ] GraphQL API 직접 호출 (Wanted)
- [ ] 프록시 로테이션 지원
- [ ] Redis 캐싱 추가
- [ ] 크롤링 큐 시스템
- [ ] 실시간 모니터링 대시보드
- [ ] 자동 패턴 업데이트 감지
- [ ] 멀티스레드 크롤링
- [ ] Docker 컨테이너화

## 라이선스 및 면책

이 크롤링 시스템은 교육 및 개인 프로젝트 목적으로 제작되었습니다. 상업적 사용 시 각 채용 사이트의 이용약관 및 법률을 준수해야 할 책임은 사용자에게 있습니다.
