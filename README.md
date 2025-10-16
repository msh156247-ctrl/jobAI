# JobAI 2.0 - AI 기반 구인구직 매칭 플랫폼

Next.js + TypeScript + Supabase + OpenAI로 구축된 차세대 지능형 구인구직 플랫폼입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)](https://openai.com/)

---

## 🎯 주요 기능

### 🤖 AI 기능 (JobAI 2.0)

#### 1. AI 매칭 인사이트 생성기
- GPT-4o-mini 기반 자연어 매칭 설명
- 강점/약점 분석 및 개선 포인트 제시
- 실시간 인사이트 생성 (1시간 캐싱)
- **위치:** 추천 공고 카드 내 "AI 매칭 인사이트" 버튼

#### 2. AI 자기소개서 리뷰어
- GPT-4 Turbo 기반 전문 분석
- 0-100점 종합 평가 + 등급 (우수/양호/보통/미흡)
- 강점 3-5개, 약점 2-4개 분석
- Before/After 문장 개선 예시 2-3개
- 키워드 분석 (포함된 키워드 + 추가 권장 키워드)
- **위치:** `/cover-letter-review` 페이지

#### 3. Graph 기반 추천 시스템
- OpenAI text-embedding-3-small (1536차원)
- Supabase pgvector + IVFFlat 인덱스
- 코사인 유사도 기반 벡터 검색
- 공고-사용자 임베딩 자동 생성
- **API:** `/api/recommendations/vector-search`

#### 4. Thompson Sampling Bandit (강화학습)
- Multi-Armed Bandit 알고리즘
- Beta 분포 기반 불확실성 모델링
- Explore-Exploit 자동 균형
- 행동 기반 리워드 학습:
  - View: +0.1, Click: +1.0, Save: +1.5
  - Apply: +3.0, Reject: -2.0
  - Scroll Depth/Dwell Time 보너스
- **API:** `/api/recommendations/bandit`

#### 5. 하이브리드 추천 시스템
- Vector Embedding (60%) + Thompson Sampling (40%)
- 1단계: Vector로 후보 필터링 (상위 50개)
- 2단계: Bandit으로 최종 선택 (상위 20개)
- 알고리즘 성능 비교 기능
- **API:** `/api/recommendations/hybrid`

#### 6. 행동 추적 + Time Decay
- Scroll Depth 자동 추적 (0-100%)
- Dwell Time 측정 (초 단위)
- 지수 감소 함수: `weight = e^(-0.05 * days)`
- 14일 후 50% 가중치 감소
- **Hook:** `useEnhancedTracking`

#### 7. 기업용 AI 후보자 매칭
- 벡터 유사도 기반 후보자 검색
- 매칭 점수(%) 실시간 계산
- 경력/스킬 필터링
- 후보자 프로필 통합 대시보드
- **페이지:** `/employer/candidates`

### 👥 구직자 기능
- ✅ 5단계 회원가입 (이메일/휴대폰 인증)
- ✅ AI 맞춤 추천 (Hybrid 알고리즘)
- ✅ 우선순위 설정 (클릭 편집, 드래그 정렬)
- ✅ 스마트 검색 (키워드, 지역, 연봉, 근무형태)
- ✅ 지원 관리 (이력서, 포트폴리오, 자기소개서)
- ✅ 북마크 시스템

### 🏢 기업 기능
- ✅ 채용공고 관리 (CRUD, 상태, 통계)
- ✅ AI 후보자 추천 (벡터 기반)
- ✅ 지원자 관리 (지원 현황, 면접 일정)
- ✅ 회사 프로필 (로고, 소개, 복지)

### 🌐 공통 기능
- ✅ 실시간 채팅 (구직자-기업)
- ✅ 커뮤니티 (Q&A, 정보 공유)
- ✅ 반응형 디자인 (Mobile/Tablet/Desktop)

---

## 🚀 기술 스택

### Frontend
- **Framework:** Next.js 15.5.4 (App Router + Turbopack)
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS 4
- **State:** Context API + Zustand 5.0.8
- **GraphQL:** Apollo Client 4.0.7
- **Icons:** Lucide React 0.544.0

### Backend & Database
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Vector DB:** pgvector (1536차원 임베딩)
- **AI:** OpenAI GPT-4 Turbo, GPT-4o-mini, text-embedding-3-small
- **Authentication:** Supabase Auth (Row Level Security)

### 알고리즘
- **추천 시스템:** Hybrid (Vector 60% + Bandit 40%)
- **협업 필터링:** Cosine Similarity
- **강화학습:** Thompson Sampling (Beta 분포)
- **시계열:** Exponential Time Decay

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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_USE_GRAPHQL=true
```

**📚 자세한 설정:** [.env.example](.env.example) 참조

### 4. Supabase 마이그레이션

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-id

# 마이그레이션 실행
supabase db push
```

마이그레이션 파일:
- `001_enable_pgvector.sql` - pgvector 확장 + 임베딩 테이블
- `002_bandit_policy.sql` - Bandit 정책 + 행동 로그

### 5. 개발 서버 실행

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
│   │   │   │   ├── insights/         # 매칭 인사이트
│   │   │   │   └── review-cover-letter/  # 자기소개서 리뷰
│   │   │   ├── embeddings/           # 임베딩 생성
│   │   │   │   ├── generate-job/
│   │   │   │   └── generate-user/
│   │   │   ├── recommendations/      # 추천 시스템
│   │   │   │   ├── vector-search/    # 벡터 검색
│   │   │   │   ├── bandit/           # Thompson Sampling
│   │   │   │   └── hybrid/           # 하이브리드
│   │   │   └── employer/             # 기업용
│   │   │       └── candidates/       # 후보자 매칭
│   │   ├── cover-letter-review/      # 자기소개서 리뷰 페이지
│   │   ├── employer/                 # 기업 대시보드
│   │   │   └── candidates/           # 후보자 매칭 페이지
│   │   └── ... (기타 페이지)
│   ├── components/                   # React 컴포넌트
│   │   ├── InsightTag.tsx            # AI 인사이트 UI
│   │   ├── CoverLetterReviewer.tsx   # 자기소개서 리뷰어 UI
│   │   └── JobMatchCard.tsx          # 공고 카드 (인사이트 통합)
│   ├── lib/                          # 핵심 로직
│   │   ├── algorithms/               # 알고리즘
│   │   │   ├── thompson-sampling.ts  # Thompson Sampling Bandit
│   │   │   ├── time-decay.ts         # Time Decay 함수
│   │   │   └── collaborative-filter.ts
│   │   ├── tracking/                 # 행동 추적
│   │   │   └── behavior-tracker.ts
│   │   └── supabase.ts
│   ├── hooks/                        # Custom Hooks
│   │   ├── useEnhancedTracking.ts    # Scroll/Dwell 추적
│   │   └── useJobSave.ts
│   └── types/
├── supabase/                         # Supabase 설정
│   └── migrations/
│       ├── 001_enable_pgvector.sql   # pgvector + 임베딩
│       └── 002_bandit_policy.sql     # Bandit + 행동 로그
├── .env.example
└── README.md
```

---

## 🔬 AI 시스템 아키텍처

### 추천 시스템 파이프라인

```
사용자 입력
    ↓
[1단계: Vector Embedding]
    → OpenAI 임베딩 생성 (1536차원)
    → pgvector 코사인 유사도 검색
    → 후보 공고 50개 필터링
    ↓
[2단계: Thompson Sampling]
    → Beta 분포 샘플링
    → Explore-Exploit 균형
    → 최종 20개 선택
    ↓
[3단계: 하이브리드 점수]
    → Vector (60%) + Bandit (40%)
    → 최종 순위 결정
    ↓
추천 결과
```

### 리워드 시스템

```typescript
// 기본 리워드
View: +0.1
Click: +1.0
Save: +1.5
Apply: +3.0
Reject: -2.0

// Scroll Depth 보너스
50%: +0.5
75%: +0.75
100%: +1.0

// Dwell Time 보너스
30s: +0.5
60s: +1.0
120s: +1.5

// Time Decay
weight = base_weight * e^(-0.05 * days)
```

---

## 📊 API 문서

### AI 기능

#### 1. AI 매칭 인사이트
```typescript
POST /api/ai/insights
{
  "jobId": "uuid",
  "jobTitle": "백엔드 개발자",
  "company": "카카오",
  "requiredSkills": ["Node.js", "TypeScript"],
  "userSkills": ["JavaScript", "React"],
  "matchScore": 75
}

// Response
{
  "insight": "자연어 설명...",
  "tags": ["강점1", "강점2"],
  "strengths": ["구체적 강점..."],
  "recommendations": ["개선 방향..."]
}
```

#### 2. 자기소개서 리뷰
```typescript
POST /api/ai/review-cover-letter
{
  "coverLetter": "자기소개서 내용...",
  "jobTitle": "프론트엔드 개발자",
  "company": "네이버"
}

// Response
{
  "score": 85,
  "grade": "양호",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "suggestions": ["제안1", "제안2"],
  "improvedSentences": [
    { "original": "...", "improved": "..." }
  ],
  "keywordAnalysis": {
    "presentKeywords": ["키워드1"],
    "missingKeywords": ["추가 키워드1"]
  }
}
```

### 추천 시스템

#### 3. 벡터 검색
```typescript
POST /api/recommendations/vector-search
{
  "userId": "uuid",
  "matchThreshold": 0.5,
  "matchCount": 20
}

// Response
{
  "jobs": [...],
  "totalCount": 15,
  "matchThreshold": 0.5
}
```

#### 4. Bandit 추천
```typescript
POST /api/recommendations/bandit
{
  "userId": "uuid",
  "candidateJobIds": ["id1", "id2", ...],
  "count": 10,
  "updatePolicy": true
}

// Response
{
  "jobs": [...],
  "algorithm": "thompson_sampling"
}
```

#### 5. 하이브리드 추천
```typescript
POST /api/recommendations/hybrid
{
  "userId": "uuid",
  "count": 20,
  "vectorWeight": 0.6,
  "banditWeight": 0.4
}

// Response
{
  "jobs": [
    {
      ...jobData,
      "scores": {
        "vector": 0.85,
        "bandit": 0.72,
        "hybrid": 0.798
      }
    }
  ]
}
```

### 기업용

#### 6. 후보자 매칭
```typescript
POST /api/employer/candidates
{
  "jobId": "uuid",
  "matchThreshold": 0.6,
  "matchCount": 20
}

// Response
{
  "candidates": [
    {
      "userId": "uuid",
      "similarityScore": 0.85,
      "matchPercentage": 85,
      "profile": { ... }
    }
  ]
}
```

**📚 전체 API 문서:** [API_DOCS.md](./API_DOCS.md)

---

## 🔐 보안

### 비밀번호 검증
- ✅ 최소 8자, 영문+숫자+특수문자 3가지 이상
- ✅ 연속/반복 문자 차단
- ✅ 일반 패턴 차단

### 인증 & 권한
- ✅ Supabase Auth (이메일/소셜)
- ✅ Row Level Security (RLS)
- ✅ API 키 환경 변수 분리

### 데이터 보호
- ✅ Service Role Key 서버 전용
- ✅ 클라이언트 노출 방지

---

## 🧪 테스트

### 수동 테스트 시나리오

```bash
# 1. AI 기능 테스트
- 자기소개서 리뷰 (/cover-letter-review)
- AI 인사이트 (추천 공고 카드)

# 2. 추천 시스템 테스트
- 벡터 검색 (프로필 업데이트 → 추천 확인)
- Bandit 학습 (공고 클릭 → 추천 변화 확인)

# 3. 기업 기능 테스트
- 후보자 매칭 (/employer/candidates)
```

---

## 🚀 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
# Vercel Dashboard → Settings → Environment Variables
# .env.local의 모든 변수 추가
```

### Supabase 설정

1. **프로젝트 생성**: https://supabase.com
2. **마이그레이션 실행**: `supabase db push`
3. **API 키 복사**: Settings → API → `anon key`, `service_role key`
4. **RLS 활성화**: 필수!

### 임베딩 초기 데이터 생성

```bash
# 공고 임베딩 배치 생성
PUT /api/embeddings/generate-job
{ "limit": 100 }

# 사용자 임베딩 개별 생성
POST /api/embeddings/generate-user
{ "userId": "uuid", "skills": [...] }
```

---

## 📈 성능 지표

### 빌드 결과
```
✓ Compiled successfully
33 pages
11 API routes
Total First Load JS: 135 kB
```

### AI 응답 시간
- **인사이트 생성**: ~1.5초 (GPT-4o-mini)
- **자기소개서 리뷰**: ~3초 (GPT-4 Turbo)
- **벡터 검색**: <100ms (pgvector)
- **Bandit 선택**: <50ms (in-memory)

---

## 🛠️ 트러블슈팅

### Q: OpenAI API 키 오류
**A:** `.env.local`에 `OPENAI_API_KEY` 확인 → 서버 재시작

### Q: pgvector 함수 없음
**A:** `supabase db push` 실행 → 마이그레이션 적용

### Q: 임베딩 생성 실패
**A:** Service Role Key 확인 → Anon Key는 권한 부족

### Q: Bandit 추천 결과 없음
**A:** 먼저 행동 로그 축적 필요 (최소 10개 이상)

---

## 📚 참고 자료

### 공식 문서
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [OpenAI](https://platform.openai.com/docs)
- [pgvector](https://github.com/pgvector/pgvector)

### 프로젝트 문서
- [진행 상황](./.claude/progress.md)
- [기술 스펙](./JOBAI_2.0_TECHNICAL_SPEC.md)
- [API 문서](./API_DOCS.md)
- [배포 가이드](./DEPLOYMENT.md)

---

## 🤝 기여하기

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📊 프로젝트 통계

- **총 코드 라인:** ~20,000+
- **페이지:** 33개
- **API 엔드포인트:** 11개
- **컴포넌트:** 50+ 개
- **알고리즘:** 3개 (Vector, Bandit, Hybrid)
- **테스트 커버리지:** TBD

---

## 📄 라이선스

MIT License

---

## 👥 제작자

- **개발자:** JobAI Team
- **AI 어시스턴트:** Claude (Anthropic)

---

## 🙏 감사의 말

- Next.js, Supabase, OpenAI, Tailwind CSS 팀
- pgvector 오픈소스 커뮤니티
- Thompson Sampling 연구자들

---

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**

**🚀 JobAI 2.0 - AI가 만드는 최고의 매칭**
