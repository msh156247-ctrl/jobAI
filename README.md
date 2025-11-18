# JobAI - AI 기반 스마트 채용 매칭 플랫폼

Next.js + TypeScript + OpenAI로 구축된 차세대 지능형 구인구직 플랫폼입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)](https://openai.com/)

---

## 🎯 주요 기능

### 📰 뉴스 크롤링 & 집계 (NEW)

#### 1. RSS 기반 실시간 뉴스 크롤링
- **10개 주요 언론사 지원**
  - 방송: 연합뉴스, KBS, MBC, SBS
  - 신문: 한겨레, 경향신문
  - 경제: 한국경제, 매일경제
  - IT/과학: 전자신문, ZDNet

- **주제별 뉴스 분류**
  - 정치, 경제, 사회, IT/과학, 문화, 스포츠, 국제, 연예, 생활/건강
  - 각 언론사별 주제별 RSS 피드 자동 수집

- **스마트 필터링**
  - 키워드 검색 (제목, 내용)
  - 주제별 필터
  - 언론사별 필터
  - 최신순 자동 정렬

- **고급 기능**
  - HTML 엔티티 자동 디코딩
  - 중복 기사 자동 제거 (URL 기준)
  - 5분 캐시로 빠른 응답
  - 크롤링 통계 및 성능 지표 제공

### 🔍 스마트 검색 & 필터링

#### 1. 고급 검색 시스템
- **세부 업종별 기술 스택 다중 선택** (25+ 업종)
  - IT/소프트웨어: 백엔드, 프론트엔드, 풀스택, 모바일, DevOps, AI/ML, DBA, QA/테스트 등
  - 디자인: UI/UX, 그래픽, 웹디자인, 제품디자인, 영상/모션, 3D, 브랜드
  - 기획/PM: 서비스기획, 프로젝트관리, 데이터분석, 상품기획, 전략기획, PO
  - 마케팅: 디지털마케팅, 콘텐츠마케팅, 브랜드마케팅, 퍼포먼스마케팅, SNS마케팅, 그로스해킹, SEO
  - 각 세부 업종마다 맞춤형 기술 스택 제공

- **복지 키워드 다중 선택** (30개 옵션)
  - 근무 환경: 워라벨, 재택근무, 유연근무, 연차자유, 자율출퇴근
  - 급여/성과: 4대보험, 퇴직금, 연봉협상가능, 성과급, 인센티브, 스톡옵션
  - 복지 혜택: 복지포인트, 식대지원, 교통비지원, 통신비지원
  - 자기계발: 자기계발비, 도서구입비, 교육지원, 어학지원, 자격증지원
  - 기타 복지: 건강검진, 의료비지원, 경조사지원, 휴양시설, 사내카페 등

- **지역 드롭다운** (33개 지역)
  - 서울, 경기, 인천, 부산, 대구, 대전, 광주, 울산, 세종
  - 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
  - 세부 구: 강남구, 서초구, 송파구, 영등포구, 마포구 등

- **간소화된 연봉/경력 필터**
  - 연봉: 최소 연봉만 입력 (입력값 이상인 공고만 검색)
  - 경력: 최대 경력만 입력 (입력값 이하의 경력 요구 공고만 검색)

- **스마트 정렬 옵션**
  - 최신순, 마감임박순, 연봉높은순, 매칭도순

#### 2. 우선순위 조정 기능
- **드래그 앤 드롭으로 우선순위 관리** (최대 5개)
  - 연봉, 근무지, 근무형태, 기술스택, 경력, 회사규모, 복지, 업종
  - 직관적인 순서 조정으로 맞춤형 검색 가능
  - 숫자로 순위 표시 (1순위 ~ 5순위)

#### 3. AI 키워드 추출
- **GPT-4 기반 경력 설명 분석**
  - 자유 형식의 경력/경험 설명 입력
  - AI가 핵심 키워드 자동 추출 (최대 10개)
  - 추출된 키워드를 검색 필터로 자동 적용
  - 기술 스택, 직무 용어, 업계/도메인, 주요 경험, 자격증 등 분류

### 🌐 채용 공고 크롤링 인프라

#### 4. 멀티 사이트 크롤링 시스템
- **지원 사이트** (5개)
  - 사람인 (saramin.co.kr)
  - 잡코리아 (jobkorea.co.kr)
  - 원티드 (wanted.co.kr)
  - 인크루트 (incruit.com)
  - 잡플래닛 (jobplanet.co.kr)

- **크롤링 기능**
  - 검색 조건을 각 사이트 쿼리 파라미터로 자동 변환
  - 병렬 크롤링으로 빠른 결과 수집
  - 사이트별 개별 크롤링 지원
  - 크롤링 진행 상태 실시간 표시

- **데이터 정규화**
  - 모든 사이트의 데이터를 통일된 형식으로 변환
  - 실제 구직 사이트 URL 유지 (외부 링크)
  - 지원하기 버튼 클릭 시 실제 사이트로 이동

### 📊 데이터 관리

#### 5. 공고 통계 & 분석
- **크롤링 메타데이터 추적**
  - 마지막 크롤링 시간
  - 사이트별 공고 수
  - 자동 업데이트 주기 (2주)

- **지원 통계 추적**
  - 사이트별 지원 횟수
  - 공고별 지원 현황
  - localStorage 기반 로컬 저장

#### 6. 데이터 관리 기능
- **마감 공고 자동 삭제**
- **전체 크롤링 데이터 초기화**
- **필터 초기화**

### 👥 사용자 설정

#### 7. 사용자 프로필 관리
- **선호 조건 설정**
  - 선호 지역, 연봉 범위, 근무 형태
  - 직무 카테고리, 기술 스택
  - 경력 수준
- **설정 기반 자동 매칭**
- **공고 북마크 시스템**

---

## 🚀 기술 스택

### Frontend
- **Framework:** Next.js 15.5.4 (App Router + Turbopack)
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS 4
- **State:** Zustand 5.0.8
- **Icons:** Lucide React 0.544.0
- **Date Utility:** date-fns 4.1.0

### Backend & AI
- **AI:** OpenAI GPT-4 (키워드 추출)
- **크롤링:** 채용 사이트 크롤링 시뮬레이션 (실제 환경에서는 Puppeteer/Cheerio 사용 가능)
- **Storage:** localStorage (클라이언트 사이드 저장)

### 개발 도구
- **Package Manager:** npm
- **Build:** Turbopack
- **Linting:** ESLint 9

---

## 📦 시작하기

### 1. 사전 요구사항

- Node.js 18.17 이상
- npm 또는 yarn
- Supabase 계정 (무료)
- OpenAI API 키

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/jobai.git
cd jobai

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성:

```bash
# OpenAI Configuration (키워드 추출 기능에 필요)
OPENAI_API_KEY=your_openai_api_key_here
```

**참고**: OpenAI API 키가 없어도 기본 기능은 작동하며, 키워드 추출 시 간단한 패턴 매칭으로 대체됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 🗂️ 프로젝트 구조

```
jobai/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── ai/                   # AI 기능
│   │   │   │   └── extract-keywords/ # GPT-4 키워드 추출
│   │   │   ├── news/                 # 뉴스 크롤링 API
│   │   │   │   └── crawl/            # RSS 피드 크롤링
│   │   │   └── crawl/                # 채용공고 크롤링 API
│   │   ├── page.tsx                  # 메인 페이지 (뉴스 & 채용공고)
│   │   ├── settings/                 # 사용자 설정
│   │   └── search/                   # 검색 결과 페이지
│   ├── components/                   # React 컴포넌트
│   │   ├── Header.tsx                # 헤더
│   │   ├── NewsTab.tsx               # 뉴스 탭
│   │   ├── NewsCard.tsx              # 뉴스 카드
│   │   ├── JobDetailModal.tsx        # 공고 상세 모달
│   │   └── PreferencesModal.tsx      # 선호 조건 설정 모달
│   ├── lib/                          # 핵심 로직
│   │   ├── news/                     # 뉴스 관련 모듈
│   │   │   ├── index.ts              # 뉴스 메인 인터페이스
│   │   │   ├── types.ts              # 뉴스 타입 정의
│   │   │   ├── storage.ts            # 뉴스 캐시 관리
│   │   │   ├── analyzer.ts           # 뉴스 분석
│   │   │   └── companyDictionary.ts  # 기업 사전
│   │   ├── jobCrawler.ts             # 크롤링 시뮬레이션
│   │   ├── jobStats.ts               # 지원 통계 관리
│   │   ├── mockData.ts               # Mock 데이터
│   │   ├── userPreferences.ts        # 사용자 설정 관리
│   │   └── scrapers/                 # 스크레이퍼 모듈
│   │       └── index.ts              # 사이트별 크롤러
│   └── services/
│       └── crawler.ts                # 크롤링 유틸리티
├── CRAWLING_GUIDE.md                 # 크롤링 가이드
└── README.md
```

---

## 🔬 시스템 아키텍처

### 뉴스 크롤링 시스템

```
사용자 요청 (새로고침 버튼)
    ↓
[캐시 확인]
    → 캐시 유효? → 캐시 데이터 반환
    → 캐시 만료? ↓
    ↓
[병렬 RSS 크롤링]
    → 연합뉴스 (7개 주제)
    → KBS (6개 주제)
    → MBC, SBS, 한겨레, 경향신문
    → 한국경제, 매일경제
    → 전자신문, ZDNet
    ↓
[XML 파싱 & 정규화]
    → CDATA 섹션 처리
    → HTML 엔티티 디코딩
    → HTML 태그 제거
    → 텍스트 정리
    ↓
[데이터 후처리]
    → 중복 제거 (URL 기준)
    → 최신순 정렬
    → 제한 적용 (기본 50개)
    ↓
[캐시 저장]
    → localStorage 저장
    → 메타데이터 업데이트
    → 5분 캐시
    ↓
뉴스 데이터 반환
    ↓
[클라이언트 필터링]
    → 키워드 검색
    → 주제별 필터
    → 언론사별 필터
    ↓
필터링된 뉴스 표시
```

### 검색 & 필터링 파이프라인

```
사용자 입력
    ↓
[기본 필터 적용]
    → 업종, 세부업종, 지역, 근무형태
    → 연봉, 경력 범위 필터링
    ↓
[고급 필터 적용]
    → 기술 스택 (AND 조건)
    → 복지 키워드 (OR 조건)
    → 기업 규모, 학력 조건
    ↓
[AI 키워드 필터]
    → GPT-4로 경력 설명 분석
    → 핵심 키워드 추출 (최대 10개)
    → 키워드 매칭 (OR 조건)
    ↓
[우선순위 정렬]
    → 사용자 설정 우선순위 (1-5순위)
    → 최신순/마감임박순/연봉순/매칭도순
    ↓
검색 결과
```

### 크롤링 시스템

```
크롤링 트리거 (자동/수동)
    ↓
[병렬 크롤링]
    → 사람인, 잡코리아, 원티드
    → 인크루트, 잡플래닛
    ↓
[데이터 정규화]
    → 통일된 스키마로 변환
    → 실제 사이트 URL 유지
    ↓
[로컬 저장]
    → localStorage 저장
    → 메타데이터 업데이트
    ↓
검색 가능 공고 데이터
```

---

## 📊 API 문서

### 뉴스 크롤링 API

#### GET /api/news/crawl

국내 주요 언론사의 RSS 피드를 크롤링하여 뉴스 데이터를 수집합니다.

**요청 파라미터** (모두 선택적):
```typescript
GET /api/news/crawl?category=경제&source=연합뉴스&limit=20
```

| 파라미터 | 타입 | 설명 | 예시 |
|---------|------|------|------|
| category | NewsCategory | 뉴스 주제 필터 | 정치, 경제, 사회, IT/과학 등 |
| source | string | 언론사 필터 | 연합뉴스, KBS, MBC 등 |
| limit | number | 최대 기사 수 | 기본값: 50 |

**응답**:
```json
{
  "success": true,
  "count": 20,
  "articles": [
    {
      "id": "https://www.yna.co.kr/view/AKR20251118...",
      "title": "한국은행, 기준금리 동결...경제 성장률 전망 하향",
      "content": "한국은행이 기준금리를 3.50%로 동결했다. 올해 경제성장률 전망치는...",
      "summary": "한국은행이 기준금리를 3.50%로 동결했다...",
      "url": "https://www.yna.co.kr/view/AKR20251118...",
      "source": "연합뉴스",
      "publishedAt": "2025-11-18T09:00:00.000Z",
      "scrapedAt": "2025-11-18T09:15:32.000Z",
      "category": "경제",
      "keywords": []
    }
  ],
  "metadata": {
    "crawledAt": "2025-11-18T09:15:32.000Z",
    "category": "경제",
    "source": "연합뉴스",
    "limit": 20,
    "totalFetched": 150,
    "uniqueArticles": 132,
    "duplicatesRemoved": 18,
    "crawlStats": {
      "successCount": 10,
      "failCount": 0,
      "duration": "1542ms"
    }
  }
}
```

**주요 기능**:
- 병렬 RSS 피드 크롤링 (Promise.allSettled)
- 자동 중복 제거 (URL 기준)
- HTML 엔티티 디코딩 (&nbsp;, &quot;, &amp; 등)
- CDATA 섹션 자동 처리
- 5분 캐시 (Next.js revalidate)
- 상세 크롤링 통계 제공

**지원 언론사**:
- 연합뉴스, KBS, MBC, SBS
- 한겨레, 경향신문
- 한국경제, 매일경제
- 전자신문, ZDNet

**에러 응답**:
```json
{
  "success": false,
  "error": "뉴스 크롤링 중 오류가 발생했습니다.",
  "details": "Failed to fetch RSS feed"
}
```

### AI 키워드 추출

#### POST /api/ai/extract-keywords

경력/경험 설명에서 GPT-4를 사용하여 핵심 키워드를 추출합니다.

**요청**:
```typescript
POST /api/ai/extract-keywords
{
  "description": "3년간 React와 Node.js를 활용한 풀스택 개발 경험이 있습니다. AWS 클라우드 인프라 구축 및 CI/CD 파이프라인 구성 경험도 있습니다."
}
```

**응답**:
```json
{
  "keywords": ["React", "Node.js", "풀스택", "AWS", "CI/CD", "클라우드", "인프라"],
  "originalDescription": "3년간 React와 Node.js를..."
}
```

**주요 기능**:
- GPT-4 기반 자연어 처리
- 기술 스택, 직무, 도메인, 경험, 자격증 자동 분류
- 최대 10개 키워드 추출
- OpenAI API 없을 시 패턴 매칭으로 대체 (fallback: true)

### 크롤링 API

#### POST /api/crawl

채용 사이트에서 공고를 크롤링합니다 (현재는 시뮬레이션).

**요청**:
```typescript
POST /api/crawl
{
  "sites": ["saramin", "jobkorea", "wanted"],  // 선택적
  "keyword": "백엔드 개발자",
  "location": "서울",
  "minSalary": 4000,
  "maxSalary": 7000,
  "minExperience": 0,
  "maxExperience": 5,
  "employmentType": "onsite",
  "techStack": "Python",
  "limit": 50
}
```

**응답**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "saramin-0001",
      "title": "백엔드 개발자",
      "company": "네이버",
      "location": "서울 강남구",
      "salary": { "min": 4000, "max": 6000 },
      "experience": { "min": 0, "max": 3 },
      "skills": ["Python", "Django", "PostgreSQL"],
      "sourceUrl": "https://www.saramin.co.kr/...",
      "source": "saramin",
      "postedAt": "2025-11-10T00:00:00.000Z",
      "deadline": "2025-12-10T23:59:59.000Z"
    }
  ],
  "totalJobs": 50,
  "errors": [],
  "timestamp": "2025-11-10T12:00:00.000Z"
}
```

**지원 사이트**:
- saramin (사람인)
- jobkorea (잡코리아)
- wanted (원티드)
- incruit (인크루트)
- jobplanet (잡플래닛)

**참고**: 실제 크롤링 구현은 [CRAWLING_GUIDE.md](./CRAWLING_GUIDE.md)를 참조하세요.

---

## 🔐 보안

- ✅ API 키 환경 변수 분리 (.env.local)
- ✅ 클라이언트 사이드에서 API 키 노출 방지
- ✅ CORS 설정 (Next.js 기본 보안)

---

## 🚀 배포

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
# Vercel Dashboard → Settings → Environment Variables
# OPENAI_API_KEY 추가
```

### 환경 변수 설정
Vercel 대시보드에서 다음 변수를 설정하세요:
- `OPENAI_API_KEY`: OpenAI API 키 (키워드 추출 기능용)

---

## 📈 주요 기능 설명

### 고급 검색
1. **기본 필터**: 업종, 지역, 근무형태, 정렬
2. **세부 업종 선택**: 25+ 세부 업종별 맞춤 기술 스택
3. **다중 선택**: 기술 스택 (AND), 복지 (OR)
4. **우선순위**: 드래그 앤 드롭으로 5개까지 순위 조정

### AI 키워드 추출
1. 경력/경험을 자유롭게 텍스트로 입력
2. GPT-4가 자동으로 핵심 키워드 추출
3. 추출된 키워드로 공고 자동 필터링

### 크롤링 시스템
1. 5개 주요 구직 사이트 지원
2. 자동 크롤링 (2주 주기) 또는 수동 크롤링
3. localStorage 기반 로컬 캐싱

---

## 🛠️ 트러블슈팅

### Q: OpenAI API 키 오류
**A:** `.env.local`에 `OPENAI_API_KEY` 확인 → 서버 재시작. 키가 없어도 기본 기능은 작동하며 패턴 매칭으로 대체됩니다.

### Q: 크롤링 데이터가 보이지 않음
**A:** 메인 페이지 상단의 "채용공고 크롤링" 탭에서 "전체 크롤링 시작" 버튼 클릭

### Q: 필터링이 작동하지 않음
**A:** 브라우저 콘솔에서 에러 확인. localStorage를 지원하는 브라우저인지 확인

---

## 📚 참고 자료

### 공식 문서
- [Next.js 15 문서](https://nextjs.org/docs)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 프로젝트 문서
- [크롤링 가이드](./CRAWLING_GUIDE.md) - 실제 크롤링 구현 방법

---

## 🤝 기여하기

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📊 프로젝트 통계

### 뉴스 시스템
- **API 엔드포인트:** 1개 (뉴스 크롤링)
- **지원 언론사:** 10개
- **뉴스 주제:** 9개 (정치, 경제, 사회, IT/과학, 문화, 스포츠, 국제, 연예, 생활/건강)
- **RSS 피드:** 20+ 개
- **크롤링 성능:** 평균 1.5초 (150+ 기사)

### 채용 시스템
- **API 엔드포인트:** 2개 (키워드 추출, 크롤링)
- **지원 채용 사이트:** 5개
- **업종 카테고리:** 10개 (IT, 디자인, 기획/PM, 마케팅 등)
- **세부 업종:** 25+ 개
- **복지 옵션:** 30개
- **지역 옵션:** 33개
- **기술 스택 맵핑:** 1,000+ 개 기술

---

## 🔄 최근 업데이트

### v2.0.0 - 뉴스 크롤링 시스템 추가 (2025-11-18)

#### 새로운 기능
- ✅ **RSS 기반 뉴스 크롤링 시스템** 구축
  - 10개 주요 언론사 지원 (연합뉴스, KBS, MBC, SBS, 한겨레, 경향신문, 한국경제, 매일경제, 전자신문, ZDNet)
  - 주제별 자동 분류 (9개 카테고리)
  - 실시간 RSS 피드 수집

- ✅ **뉴스 탭 UI** 구현
  - 키워드 검색 기능
  - 주제별/언론사별 필터
  - 반응형 카드 레이아웃
  - 새로고침 버튼

- ✅ **네비게이션 개선**
  - 뉴스 탭을 첫 번째 탭으로 이동
  - "추천 공고", "저장한 공고" 탭 제거
  - 2탭 구조로 단순화 (뉴스 → 채용 공고)

#### 코드 개선
- ✅ **코드 리팩토링**
  - `fetchNews`/`refreshNews` 중복 코드 제거
  - 공통 로직을 `fetchNewsFromAPI` 헬퍼 함수로 추출
  - 코드 가독성 및 유지보수성 향상

- ✅ **RSS 파싱 개선**
  - HTML 엔티티 자동 디코딩 (&nbsp;, &quot;, &amp; 등)
  - HTML 태그 자동 제거
  - CDATA 섹션 처리 개선
  - 텍스트 정규화

- ✅ **에러 처리 및 로깅 강화**
  - 상세 크롤링 통계 (성공/실패 횟수, 소요 시간)
  - 중복 제거 통계
  - 구조화된 로그 메시지 ([RSS Crawl] 접두사)

- ✅ **UI/백엔드 일치성 개선**
  - 실제 구성된 언론사만 필터 목록에 표시
  - 사용자 경험 개선

---

## 📄 라이선스

MIT License

---

## 👥 제작자

- **개발:** JobAI Team
- **AI 어시스턴트:** Claude (Anthropic)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 및 서비스를 활용합니다:
- Next.js 15 (Vercel)
- OpenAI GPT-4
- Tailwind CSS
- Lucide React (아이콘)

---

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**

**🚀 JobAI - 스마트한 채용 매칭의 시작**
