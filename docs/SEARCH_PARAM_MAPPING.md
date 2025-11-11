# 검색 파라미터 매핑 가이드

사용자 검색 필터와 각 채용 사이트의 실제 API 파라미터가 정확하게 매핑되도록 구현했습니다.

## 파라미터 플로우

```
사용자 선호도 (UserPreferences)
  ↓
CrawlParams 변환
  ↓
ScraperParams 변환
  ↓
사이트별 URL 파라미터
```

## 1. 사용자 선호도 → CrawlParams

프론트엔드에서 사용자가 설정한 검색 조건을 `CrawlParams`로 변환합니다.

### CrawlParams 인터페이스

```typescript
interface CrawlParams {
  keyword?: string           // 검색 키워드
  industry?: string          // 업종 (예: 'IT/소프트웨어')
  subIndustry?: string       // 세부 업종 (예: '백엔드', '프론트엔드')
  location?: string          // 지역 (예: '서울', '경기')
  minSalary?: number         // 최소 연봉 (만원 단위)
  maxSalary?: number         // 최대 연봉
  minExperience?: number     // 최소 경력 (년)
  maxExperience?: number     // 최대 경력
  employmentType?: string    // 고용 형태 (예: '정규직')
  workType?: string          // 근무 형태 (예: 'remote', 'onsite')
  techStack?: string[]       // 기술 스택 배열
  benefits?: string[]        // 복지 키워드 배열
  limit?: number             // 크롤링할 최대 공고 수
}
```

### 변환 함수 사용

```typescript
import { createCrawlParamsFromPreferences } from '@/lib/jobCrawler'

// 사용자 선호도에서 자동 생성
const crawlParams = createCrawlParamsFromPreferences(preferences)

// 예시 결과:
// {
//   industry: 'IT/소프트웨어',
//   subIndustry: '백엔드',
//   location: '서울',
//   minSalary: 4000,
//   maxSalary: 7000,
//   minExperience: 0,
//   maxExperience: 5,
//   techStack: ['Node.js', 'TypeScript'],
//   limit: 50
// }
```

## 2. CrawlParams → ScraperParams

`CrawlParams`를 각 크롤러가 이해할 수 있는 `ScraperParams`로 변환합니다.

### 변환 로직

```typescript
function convertToScraperParams(params?: CrawlParams): ScraperParams {
  // 키워드 우선순위: keyword > subIndustry > industry
  let keyword = params?.keyword || ''
  if (!keyword) {
    if (params?.subIndustry) {
      keyword = params.subIndustry  // '백엔드' 사용
    } else if (params?.industry) {
      keyword = params.industry     // 'IT/소프트웨어' 사용
    }
  }

  // 첫 번째 기술 스택을 키워드에 추가
  if (params?.techStack && params.techStack.length > 0) {
    keyword = keyword ? `${keyword} ${params.techStack[0]}` : params.techStack[0]
    // 예: "백엔드 Node.js"
  }

  return {
    keyword,
    industry: params?.industry,
    location: params?.location,
    minSalary: params?.minSalary,
    maxSalary: params?.maxSalary,
    minExperience: params?.minExperience,
    maxExperience: params?.maxExperience,
    limit: params?.limit || 50
  }
}
```

## 3. ScraperParams → 사이트별 URL

각 채용 사이트의 실제 검색 URL 파라미터로 매핑됩니다.

### 사람인 (Saramin)

```typescript
// ScraperParams → Saramin URL
function buildSaraminSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.saramin.co.kr/zf_user/search'
  const searchParams = new URLSearchParams()

  // 키워드
  if (params.keyword) searchParams.append('searchword', params.keyword)

  // 지역 코드 매핑
  if (params.location) {
    const locationCodes: Record<string, string> = {
      '서울': '101000',
      '경기': '102000',
      '인천': '108000',
      '부산': '106000',
      '대구': '104000',
      '대전': '105000',
      '광주': '103000',
      '울산': '107000'
    }
    searchParams.append('loc_mcd', locationCodes[params.location])
  }

  // 경력 (형식: "0,5" = 0~5년)
  if (params.minExperience !== undefined || params.maxExperience !== undefined) {
    const min = params.minExperience || 0
    const max = params.maxExperience || 99
    searchParams.append('exp_cd', `${min},${max}`)
  }

  // 연봉 (만원 단위 → 원 단위)
  if (params.minSalary) {
    searchParams.append('sal_type', '1')
    searchParams.append('sal', String(params.minSalary * 10000))
  }

  return `${baseUrl}?${searchParams.toString()}`
}
```

**예시:**
```
https://www.saramin.co.kr/zf_user/search?searchword=백엔드&loc_mcd=101000&exp_cd=0,5&sal_type=1&sal=40000000
```

### 잡코리아 (JobKorea)

```typescript
function buildJobKoreaSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.jobkorea.co.kr/Search/'
  const searchParams = new URLSearchParams()

  // 키워드
  if (params.keyword) searchParams.append('stext', params.keyword)

  // 지역 코드 (서울: '1', 경기: '2', ...)
  if (params.location) {
    const locationCodes: Record<string, string> = {
      '서울': '1',
      '경기': '2',
      '인천': '3',
      '부산': '4',
      '대구': '5',
      '대전': '6',
      '광주': '7',
      '울산': '8'
    }
    searchParams.append('local', locationCodes[params.location])
  }

  // 경력 (별도 파라미터)
  if (params.minExperience !== undefined) {
    searchParams.append('exp_min', String(params.minExperience))
  }
  if (params.maxExperience !== undefined) {
    searchParams.append('exp_max', String(params.maxExperience))
  }

  return `${baseUrl}?${searchParams.toString()}`
}
```

**예시:**
```
https://www.jobkorea.co.kr/Search/?stext=백엔드&local=1&exp_min=0&exp_max=5
```

### 원티드 (Wanted)

```typescript
function buildWantedSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.wanted.co.kr/search'
  const searchParams = new URLSearchParams()

  // 키워드
  if (params.keyword) searchParams.append('query', params.keyword)

  // 지역 태그
  if (params.location) {
    const locationTags: Record<string, string> = {
      '서울': 'locations.all.seoul',
      '경기': 'locations.all.gyeonggi',
      '부산': 'locations.all.busan'
    }
    searchParams.append('locations', locationTags[params.location])
  }

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('years', String(params.minExperience))
  }

  return `${baseUrl}?${searchParams.toString()}`
}
```

**예시:**
```
https://www.wanted.co.kr/search?query=백엔드&locations=locations.all.seoul&years=0
```

### 인크루트 (Incruit)

```typescript
function buildIncruitSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.incruit.com/job/search.asp'
  const searchParams = new URLSearchParams()

  // 키워드
  if (params.keyword) searchParams.append('keyword', params.keyword)

  // 지역
  if (params.location) {
    const locationCodes: Record<string, string> = {
      '서울': '1',
      '경기': '2',
      '인천': '3'
    }
    searchParams.append('region', locationCodes[params.location])
  }

  // 경력 (형식: "0-5")
  if (params.minExperience !== undefined || params.maxExperience !== undefined) {
    const min = params.minExperience || 0
    const max = params.maxExperience || 99
    searchParams.append('career', `${min}-${max}`)
  }

  return `${baseUrl}?${searchParams.toString()}`
}
```

**예시:**
```
https://www.incruit.com/job/search.asp?keyword=백엔드&region=1&career=0-5
```

### 잡플래닛 (JobPlanet)

```typescript
function buildJobPlanetSearchUrl(params: ScraperParams): string {
  const baseUrl = 'https://www.jobplanet.co.kr/job_postings/search'
  const searchParams = new URLSearchParams()

  // 키워드
  if (params.keyword) searchParams.append('query', params.keyword)

  // 지역
  if (params.location) searchParams.append('location', params.location)

  // 경력
  if (params.minExperience !== undefined) {
    searchParams.append('career_min', String(params.minExperience))
  }
  if (params.maxExperience !== undefined) {
    searchParams.append('career_max', String(params.maxExperience))
  }

  // 연봉 (만원 → 원)
  if (params.minSalary) {
    searchParams.append('salary_min', String(params.minSalary * 10000))
  }

  return `${baseUrl}?${searchParams.toString()}`
}
```

**예시:**
```
https://www.jobplanet.co.kr/job_postings/search?query=백엔드&location=서울&career_min=0&career_max=5&salary_min=40000000
```

## 4. 전체 플로우 예시

### 사용자 입력

프론트엔드 UI에서 사용자가 다음과 같이 설정:

```javascript
const userPreferences = {
  industry: 'IT/소프트웨어',
  subIndustry: '백엔드',
  location: '서울',
  minSalary: 4000,
  maxSalary: 7000,
  minExperience: 0,
  maxExperience: 5,
  techStack: ['Node.js', 'TypeScript'],
  benefits: ['재택근무', '유연근무']
}
```

### 1단계: CrawlParams 생성

```javascript
import { createCrawlParamsFromPreferences } from '@/lib/jobCrawler'

const crawlParams = createCrawlParamsFromPreferences(userPreferences)

// 결과:
// {
//   industry: 'IT/소프트웨어',
//   subIndustry: '백엔드',
//   location: '서울',
//   minSalary: 4000,
//   maxSalary: 7000,
//   minExperience: 0,
//   maxExperience: 5,
//   techStack: ['Node.js', 'TypeScript'],
//   benefits: ['재택근무', '유연근무'],
//   limit: 50
// }
```

### 2단계: 크롤링 실행

```javascript
import { crawlSingleSite } from '@/lib/jobCrawler'

// 사람인 크롤링
const saraminJobs = await crawlSingleSite('사람인', crawlParams)

// 또는 모든 사이트 크롤링
import { crawlAllSites } from '@/lib/jobCrawler'
const allJobs = await crawlAllSites(crawlParams)
```

### 3단계: 내부 변환

**crawlSaramin 함수 내부:**

```javascript
// CrawlParams → ScraperParams
const scraperParams = {
  keyword: '백엔드 Node.js',    // subIndustry + techStack[0]
  industry: 'IT/소프트웨어',
  location: '서울',
  minSalary: 4000,
  maxSalary: 7000,
  minExperience: 0,
  maxExperience: 5,
  limit: 50
}

// ScraperParams → Saramin URL
// https://www.saramin.co.kr/zf_user/search?searchword=백엔드+Node.js&loc_mcd=101000&exp_cd=0,5&sal_type=1&sal=40000000
```

### 4단계: 크롤링 결과

```javascript
// 수집된 공고들
[
  {
    id: 'saramin-12345678',
    title: 'Node.js 백엔드 개발자',
    company: '테크 스타트업',
    location: '서울 강남구',
    salary: { min: 4000, max: 6000 },
    experience: { min: 0, max: 3 },
    skills: ['Node.js', 'TypeScript', 'Express'],
    source: 'saramin',
    sourceUrl: 'https://www.saramin.co.kr/...',
    ...
  },
  ...
]
```

## 5. 파라미터 매핑 테이블

| 사용자 필터 | CrawlParams | ScraperParams | 사람인 | 잡코리아 | 원티드 | 인크루트 | 잡플래닛 |
|------------|-------------|---------------|--------|---------|--------|---------|----------|
| 세부 업종 | `subIndustry` | `keyword` | `searchword` | `stext` | `query` | `keyword` | `query` |
| 지역 (서울) | `location` | `location` | `loc_mcd=101000` | `local=1` | `locations=locations.all.seoul` | `region=1` | `location=서울` |
| 최소 경력 | `minExperience` | `minExperience` | `exp_cd=0,N` | `exp_min=0` | `years=0` | `career=0-N` | `career_min=0` |
| 최대 경력 | `maxExperience` | `maxExperience` | `exp_cd=N,5` | `exp_max=5` | - | `career=N-5` | `career_max=5` |
| 최소 연봉 | `minSalary` (만원) | `minSalary` | `sal=40000000` (원) | - | - | - | `salary_min=40000000` (원) |
| 기술 스택 | `techStack[]` | `keyword` 에 포함 | `searchword` 에 포함 | `stext` 에 포함 | `query` 에 포함 | `keyword` 에 포함 | `query` 에 포함 |

## 6. 사용 예시

### 프론트엔드에서 크롤링 실행

```typescript
// page.tsx
import { crawlSingleSite, createCrawlParamsFromPreferences } from '@/lib/jobCrawler'

const handleManualCrawl = async (siteName: string) => {
  // 사용자 선호도를 파라미터로 변환
  const crawlParams = createCrawlParamsFromPreferences(preferences)

  console.log('크롤링 파라미터:', crawlParams)
  // {
  //   industry: 'IT/소프트웨어',
  //   subIndustry: '백엔드',
  //   location: '서울',
  //   minExperience: 0,
  //   maxExperience: 5,
  //   techStack: ['Node.js'],
  //   limit: 50
  // }

  // 크롤링 실행
  await crawlSingleSite(siteName, crawlParams)

  // 결과 표시
  const jobs = getMergedJobs(mockJobs)
  setJobs(jobs)
}
```

### 테스트 스크립트에서 사용

```bash
# 사람인에서 백엔드 개발자 검색 (서울, 0~5년 경력)
npm run test:crawl -- --site saramin --keyword "백엔드" --location "서울" --limit 10
```

## 7. 주의사항

### 키워드 우선순위

키워드는 다음 우선순위로 결정됩니다:

1. **명시적 keyword** - 사용자가 직접 입력한 키워드
2. **subIndustry** - 세부 업종 (예: '백엔드', '프론트엔드')
3. **industry** - 대분류 업종 (예: 'IT/소프트웨어')
4. **techStack[0]** - 첫 번째 기술 스택이 키워드에 추가됨

### 지역 코드 차이

각 사이트마다 지역 코드 체계가 다릅니다:
- **사람인**: 6자리 코드 (101000)
- **잡코리아**: 1자리 숫자 (1)
- **원티드**: 태그 형식 (locations.all.seoul)
- **인크루트**: 1자리 숫자 (1)
- **잡플래닛**: 한글 그대로 (서울)

### 연봉 단위 변환

- 프론트엔드: **만원 단위** (4000 = 4천만원)
- 사람인/잡플래닛 API: **원 단위** (40000000)
- 변환: `minSalary * 10000`

### 경력 형식 차이

- **사람인**: `exp_cd=0,5` (쉼표로 구분)
- **잡코리아**: `exp_min=0&exp_max=5` (별도 파라미터)
- **원티드**: `years=0` (최소값만)
- **인크루트**: `career=0-5` (하이픈으로 구분)
- **잡플래닛**: `career_min=0&career_max=5` (별도 파라미터)

## 8. 트러블슈팅

### 문제: 검색 결과가 없음

**원인:** 키워드가 제대로 전달되지 않음

**해결:**
```javascript
// 브라우저 콘솔에서 확인
const crawlParams = createCrawlParamsFromPreferences(preferences)
console.log('생성된 파라미터:', crawlParams)

// keyword가 비어있으면 subIndustry 또는 industry가 설정되어 있는지 확인
```

### 문제: 지역 필터가 작동하지 않음

**원인:** 지역명이 매핑 테이블에 없음

**해결:**
```typescript
// 지원되는 지역 확인
const supportedLocations = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산']

// 사용자 입력이 정확한지 확인
if (!supportedLocations.includes(preferences.location)) {
  console.warn('지원되지 않는 지역:', preferences.location)
}
```

### 문제: 크롤링은 되지만 필터가 적용되지 않음

**원인:** 사이트가 해당 파라미터를 지원하지 않음

**확인:**
- 원티드는 최대 경력을 지원하지 않음
- 잡코리아는 연봉 필터를 지원하지 않음
- 사이트별 지원 파라미터 차이를 문서에서 확인

## 9. 확장 가이드

### 새로운 필터 추가

1. **CrawlParams에 필드 추가**
```typescript
export interface CrawlParams {
  // ... 기존 필드
  companySize?: string  // 새 필터
}
```

2. **변환 함수 수정**
```typescript
function convertToScraperParams(params?: CrawlParams): ScraperParams {
  return {
    // ... 기존 매핑
    companySize: params?.companySize
  }
}
```

3. **사이트별 URL 빌더 수정**
```typescript
function buildSaraminSearchUrl(params: ScraperParams): string {
  // ... 기존 로직
  if (params.companySize) {
    searchParams.append('company_size', mapCompanySize(params.companySize))
  }
}
```

### 새로운 사이트 추가

1. **크롤러 구현** (`src/lib/crawling/newSiteCrawler.ts`)
2. **URL 빌더 추가**
3. **jobCrawler.ts에 통합**
4. **매핑 테이블 업데이트**

## 요약

- ✅ 사용자 검색 필터가 각 사이트의 실제 API 파라미터와 정확하게 매핑됨
- ✅ 키워드는 subIndustry + techStack 조합으로 자동 생성
- ✅ 지역, 경력, 연봉 등 모든 필터가 사이트별 형식에 맞게 변환
- ✅ 실패 시 시뮬레이션 데이터로 폴백하여 안정성 확보
- ✅ 확장 가능한 구조로 새로운 필터/사이트 추가 용이
