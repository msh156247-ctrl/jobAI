# JobAI 2.0 - 완전 가이드 (Complete Guide)

**작성일**: 2025-10-15
**버전**: JobAI 2.0
**프로젝트**: AI 기반 구인구직 매칭 플랫폼

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)](https://openai.com/)

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [주요 기능](#주요-기능)
3. [기술 스택](#기술-스택)
4. [시작하기](#시작하기)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [배포 가이드](#배포-가이드)
7. [API 문서](#api-문서)
8. [기술 구현 상세](#기술-구현-상세)
9. [배포 전 체크리스트](#배포-전-체크리스트)
10. [트러블슈팅](#트러블슈팅)

---

## 🎯 프로젝트 개요

JobAI는 Next.js + TypeScript + Supabase + OpenAI로 구축된 차세대 지능형 구인구직 플랫폼입니다.

### 핵심 목표

JobAI 1.0은 **하이브리드 추천 시스템 (콘텐츠 60% + 협업 필터링 40%)**을 기반으로 25개 페이지, 115개 소스 파일, 100% 완성도를 달성했습니다.

JobAI 2.0에서는 다음 7가지 핵심 AI 기능을 추가하여 **AI 기반 추천 정확도 향상**, **사용자 경험 개인화**, **B2B 기능 확장**을 목표로 합니다:

1. ✅ AI 자기소개서 리뷰어 → 지원 품질 향상
2. ✅ Graph 기반 추천 (Vector Embedding) → 추천 다양성 증가
3. ✅ 강화학습 추천 (Thompson Sampling) → 실시간 적응형 추천
4. ✅ AI 매칭 인사이트 → 신뢰도 향상
5. ✅ 행동 로그 확장 + Time Decay → 추천 정확도 향상
6. ✅ 기업용 AI 후보 추천 → B2B 수익 모델 강화
7. ✅ Enhanced Tracking (Scroll Depth + Dwell Time)

---

## 🚀 주요 기능

### 🤖 AI 기능 (JobAI 2.0)

#### 1. AI 매칭 인사이트 생성기
- GPT-4o-mini 기반 자연어 매칭 설명
- 강점/약점 분석 및 개선 포인트 제시
- 실시간 인사이트 생성 (1시간 캐싱)
- **위치:** 추천 공고 카드 내 "AI 매칭 인사이트" 버튼
- **API:** `/api/ai/insights`

#### 2. AI 자기소개서 리뷰어
- GPT-4 Turbo 기반 전문 분석
- 0-100점 종합 평가 + 등급 (우수/양호/보통/미흡)
- 강점 3-5개, 약점 2-4개 분석
- Before/After 문장 개선 예시 2-3개
- 키워드 분석 (포함된 키워드 + 추가 권장 키워드)
- **위치:** `/cover-letter-review` 페이지
- **API:** `/api/ai/review-cover-letter`

#### 3. Vector Embedding 추천 시스템
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

#### 6. Enhanced Tracking (행동 추적)
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

## 🛠️ 기술 스택

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

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 🗄️ 데이터베이스 설정

새 Supabase 프로젝트에 JobAI를 처음 설정하는 경우 이 가이드를 따르세요.

### 📋 실행 순서

1. **기본 스키마** (JobAI 1.0)
2. **추가 테이블** (북마크, 면접 슬롯 등)
3. **pgvector 확장** (AI 임베딩)
4. **Bandit 정책** (강화학습)

### 🚀 Step 1: Supabase 프로젝트 준비

#### 1. Supabase Dashboard 접속
- https://supabase.com/dashboard
- 프로젝트 선택 또는 신규 생성

#### 2. SQL Editor 열기
- 좌측 메뉴: **SQL Editor**
- **New query** 버튼 클릭

### 📦 Step 2: 기본 스키마 생성 (JobAI 1.0)

SQL Editor에 다음 전체 SQL을 복사하여 실행:

```sql
-- JobAI 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 프로필 테이블 (기본 사용자 정보)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('user', 'company')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 구직자 프로필 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  career_years INTEGER DEFAULT 0,
  location TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기업 프로필 테이블
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 채용 공고 테이블
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')) DEFAULT 'full-time',
  status TEXT CHECK (status IN ('active', 'closed', 'draft')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 지원 테이블
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected')) DEFAULT 'pending',
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id) -- 중복 지원 방지
);

-- 6. 매칭 테이블
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- 7. 채팅룸 테이블
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 메시지 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 알림 테이블
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 이벤트 테이블
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('job_fair', 'workshop', 'webinar', 'networking', 'info_session')) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  online_link TEXT,
  max_participants INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 이벤트 참석자 테이블
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')) DEFAULT 'registered',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 12. 리뷰 테이블
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  review_type TEXT CHECK (review_type IN ('company_to_user', 'user_to_company')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, application_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_events_company_id ON events(company_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**RUN 버튼 클릭** 또는 **Ctrl+Enter**

**✅ 확인**: "Success. No rows returned" 메시지

### 📦 Step 3: 추가 테이블 생성

SQL Editor에서 New query 클릭 후 다음 SQL 실행:

```sql
-- 추가 테이블: 저장된 채용공고 (북마크)
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- 추가 테이블: 면접 슬롯
CREATE TABLE IF NOT EXISTS interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60, -- 분 단위
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  booked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS saved_jobs_user_id_idx ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS saved_jobs_job_id_idx ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS interview_slots_job_id_idx ON interview_slots(job_id);
CREATE INDEX IF NOT EXISTS interview_slots_datetime_idx ON interview_slots(datetime);

-- RLS (Row Level Security) 정책
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;

-- saved_jobs 정책
CREATE POLICY "Users can view their own saved jobs"
  ON saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs"
  ON saved_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- interview_slots 정책
CREATE POLICY "Anyone can view interview slots"
  ON interview_slots FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can book interview slots"
  ON interview_slots FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = booked_by);
```

**RUN 버튼 클릭**

### 🤖 Step 4: pgvector 확장 활성화 (JobAI 2.0)

#### 1. Extensions 페이지에서 활성화
- 좌측 메뉴: **Database** → **Extensions**
- 검색: "vector"
- **vector** 확장의 **Enable** 버튼 클릭

#### 2. SQL Editor에서 New query 클릭 후 다음 SQL 실행:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 공고 벡터 임베딩 테이블
CREATE TABLE IF NOT EXISTS job_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small 차원
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id)
);

-- 사용자 프로필 벡터 임베딩 테이블
CREATE TABLE IF NOT EXISTS user_profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 벡터 유사도 검색을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS job_embeddings_idx
ON job_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS user_profile_embeddings_idx
ON user_profile_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 공고 ID로 빠르게 조회하기 위한 인덱스
CREATE INDEX IF NOT EXISTS job_embeddings_job_id_idx
ON job_embeddings(job_id);

CREATE INDEX IF NOT EXISTS user_profile_embeddings_user_id_idx
ON user_profile_embeddings(user_id);

-- 유사한 공고 검색 함수 (사용자 기반)
CREATE OR REPLACE FUNCTION get_similar_jobs_for_user(
  target_user_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  job_id UUID,
  similarity_score FLOAT,
  job_title TEXT,
  company_name TEXT,
  location TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    je.job_id,
    1 - (je.embedding <=> upe.embedding) AS similarity_score,
    jp.title,
    cp.company_name,
    jp.location
  FROM job_embeddings je
  CROSS JOIN user_profile_embeddings upe
  INNER JOIN jobs jp ON je.job_id = jp.id
  LEFT JOIN company_profiles cp ON jp.company_id = cp.id
  WHERE
    upe.user_id = target_user_id
    AND (1 - (je.embedding <=> upe.embedding)) > match_threshold
    AND jp.status = 'active'
  ORDER BY je.embedding <=> upe.embedding ASC
  LIMIT match_count;
END;
$$;

-- 특정 공고와 유사한 공고 검색 함수
CREATE OR REPLACE FUNCTION get_similar_jobs_to_job(
  target_job_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  job_id UUID,
  similarity_score FLOAT,
  job_title TEXT,
  company_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    je2.job_id,
    1 - (je1.embedding <=> je2.embedding) AS similarity_score,
    jp.title,
    cp.company_name
  FROM job_embeddings je1
  CROSS JOIN job_embeddings je2
  INNER JOIN jobs jp ON je2.job_id = jp.id
  LEFT JOIN company_profiles cp ON jp.company_id = cp.id
  WHERE
    je1.job_id = target_job_id
    AND je2.job_id != target_job_id
    AND (1 - (je1.embedding <=> je2.embedding)) > match_threshold
    AND jp.status = 'active'
  ORDER BY je1.embedding <=> je2.embedding ASC
  LIMIT match_count;
END;
$$;

-- 후보자 검색 함수 (기업용)
CREATE OR REPLACE FUNCTION get_matching_candidates_for_job(
  target_job_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  similarity_score FLOAT,
  full_name TEXT,
  email TEXT,
  skills TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    upe.user_id,
    1 - (je.embedding <=> upe.embedding) AS similarity_score,
    p.full_name,
    p.email,
    up.skills
  FROM job_embeddings je
  CROSS JOIN user_profile_embeddings upe
  INNER JOIN profiles p ON upe.user_id = p.id
  LEFT JOIN user_profiles up ON p.id = up.user_id
  WHERE
    je.job_id = target_job_id
    AND (1 - (je.embedding <=> upe.embedding)) > match_threshold
    AND p.role = 'user'
  ORDER BY je.embedding <=> upe.embedding ASC
  LIMIT match_count;
END;
$$;

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_job_embeddings_updated_at
BEFORE UPDATE ON job_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profile_embeddings_updated_at
BEFORE UPDATE ON user_profile_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 코멘트
COMMENT ON TABLE job_embeddings IS '공고별 벡터 임베딩 (OpenAI text-embedding-3-small, 1536 차원)';
COMMENT ON TABLE user_profile_embeddings IS '사용자 프로필 벡터 임베딩 (스킬, 경력, 선호도 기반)';
COMMENT ON FUNCTION get_similar_jobs_for_user IS '사용자 프로필과 유사한 공고 검색 (코사인 유사도 기반)';
COMMENT ON FUNCTION get_similar_jobs_to_job IS '특정 공고와 유사한 다른 공고 검색';
COMMENT ON FUNCTION get_matching_candidates_for_job IS '공고에 적합한 후보자 검색 (기업용)';
```

**RUN 버튼 클릭**

### 🎯 Step 5: Bandit 정책 테이블 (강화학습)

SQL Editor에서 New query 클릭 후 다음 SQL 실행:

```sql
-- Thompson Sampling Bandit 정책 저장 테이블

-- 1. Bandit Policy 테이블
CREATE TABLE IF NOT EXISTS bandit_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Beta 분포 파라미터
  alpha FLOAT NOT NULL DEFAULT 1.0,  -- 성공 횟수 + 1
  beta FLOAT NOT NULL DEFAULT 1.0,   -- 실패 횟수 + 1

  -- 통계
  total_pulls INT NOT NULL DEFAULT 0,
  total_reward FLOAT NOT NULL DEFAULT 0.0,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, job_id)
);

-- 2. 행동 로그 테이블 (확장)
CREATE TABLE IF NOT EXISTS user_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- 행동 타입
  action_type VARCHAR(20) NOT NULL CHECK (
    action_type IN ('view', 'click', 'save', 'apply', 'reject')
  ),

  -- 리워드
  reward FLOAT NOT NULL,

  -- Enhanced Tracking 데이터
  scroll_depth INT, -- 0-100
  dwell_time INT,  -- seconds

  -- 메타데이터
  session_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS bandit_policies_user_id_idx ON bandit_policies(user_id);
CREATE INDEX IF NOT EXISTS bandit_policies_job_id_idx ON bandit_policies(job_id);
CREATE INDEX IF NOT EXISTS bandit_policies_updated_at_idx ON bandit_policies(updated_at);

CREATE INDEX IF NOT EXISTS behavior_logs_user_id_idx ON user_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS behavior_logs_job_id_idx ON user_behavior_logs(job_id);
CREATE INDEX IF NOT EXISTS behavior_logs_created_at_idx ON user_behavior_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS behavior_logs_action_type_idx ON user_behavior_logs(action_type);

-- 4. 사용자별 Bandit 정책 조회 함수
CREATE OR REPLACE FUNCTION get_user_bandit_policy(
  target_user_id UUID,
  job_limit INT DEFAULT 100
)
RETURNS TABLE (
  job_id UUID,
  alpha FLOAT,
  beta FLOAT,
  total_pulls INT,
  total_reward FLOAT,
  expected_value FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.job_id,
    bp.alpha,
    bp.beta,
    bp.total_pulls,
    bp.total_reward,
    (bp.alpha / (bp.alpha + bp.beta)) AS expected_value
  FROM bandit_policies bp
  WHERE bp.user_id = target_user_id
  ORDER BY (bp.alpha / (bp.alpha + bp.beta)) DESC
  LIMIT job_limit;
END;
$$;

-- 5. Bandit 정책 업데이트 함수
CREATE OR REPLACE FUNCTION update_bandit_policy(
  target_user_id UUID,
  target_job_id UUID,
  reward_value FLOAT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_policy RECORD;
  new_alpha FLOAT;
  new_beta FLOAT;
BEGIN
  -- 기존 정책 조회
  SELECT alpha, beta, total_pulls, total_reward
  INTO current_policy
  FROM bandit_policies
  WHERE user_id = target_user_id AND job_id = target_job_id;

  -- 정책이 없으면 생성
  IF current_policy IS NULL THEN
    INSERT INTO bandit_policies (user_id, job_id, alpha, beta, total_pulls, total_reward)
    VALUES (
      target_user_id,
      target_job_id,
      CASE WHEN reward_value > 0 THEN 1 + reward_value ELSE 1 END,
      CASE WHEN reward_value <= 0 THEN 1 + ABS(reward_value) ELSE 1 END,
      1,
      reward_value
    );
  ELSE
    -- 정책 업데이트
    new_alpha := current_policy.alpha + CASE WHEN reward_value > 0 THEN reward_value ELSE 0 END;
    new_beta := current_policy.beta + CASE WHEN reward_value <= 0 THEN ABS(reward_value) ELSE 0 END;

    UPDATE bandit_policies
    SET
      alpha = new_alpha,
      beta = new_beta,
      total_pulls = current_policy.total_pulls + 1,
      total_reward = current_policy.total_reward + reward_value,
      updated_at = NOW()
    WHERE user_id = target_user_id AND job_id = target_job_id;
  END IF;
END;
$$;

-- 6. 행동 로그 저장 및 Bandit 정책 자동 업데이트 함수
CREATE OR REPLACE FUNCTION log_user_behavior(
  target_user_id UUID,
  target_job_id UUID,
  action VARCHAR(20),
  scroll_depth_value INT DEFAULT NULL,
  dwell_time_value INT DEFAULT NULL,
  session_id_value VARCHAR(100) DEFAULT NULL,
  metadata_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  reward_value FLOAT;
  log_id UUID;
BEGIN
  -- 행동 타입별 리워드 계산
  reward_value := CASE action
    WHEN 'view' THEN 0.1
    WHEN 'click' THEN 1.0
    WHEN 'save' THEN 1.5
    WHEN 'apply' THEN 3.0
    WHEN 'reject' THEN -2.0
    ELSE 0
  END;

  -- Scroll Depth 보너스
  IF scroll_depth_value IS NOT NULL THEN
    IF scroll_depth_value >= 100 THEN
      reward_value := reward_value + 1.0;
    ELSIF scroll_depth_value >= 75 THEN
      reward_value := reward_value + 0.75;
    ELSIF scroll_depth_value >= 50 THEN
      reward_value := reward_value + 0.5;
    END IF;
  END IF;

  -- Dwell Time 보너스
  IF dwell_time_value IS NOT NULL THEN
    IF dwell_time_value >= 120 THEN
      reward_value := reward_value + 1.5;
    ELSIF dwell_time_value >= 60 THEN
      reward_value := reward_value + 1.0;
    ELSIF dwell_time_value >= 30 THEN
      reward_value := reward_value + 0.5;
    END IF;
  END IF;

  -- 행동 로그 저장
  INSERT INTO user_behavior_logs (
    user_id,
    job_id,
    action_type,
    reward,
    scroll_depth,
    dwell_time,
    session_id,
    metadata
  )
  VALUES (
    target_user_id,
    target_job_id,
    action,
    reward_value,
    scroll_depth_value,
    dwell_time_value,
    session_id_value,
    metadata_value
  )
  RETURNING id INTO log_id;

  -- Bandit 정책 업데이트
  PERFORM update_bandit_policy(target_user_id, target_job_id, reward_value);

  RETURN log_id;
END;
$$;

-- 7. 사용자별 행동 통계 조회 함수
CREATE OR REPLACE FUNCTION get_user_behavior_stats(
  target_user_id UUID,
  days_back INT DEFAULT 30
)
RETURNS TABLE (
  total_actions BIGINT,
  views BIGINT,
  clicks BIGINT,
  saves BIGINT,
  applies BIGINT,
  rejects BIGINT,
  avg_scroll_depth FLOAT,
  avg_dwell_time FLOAT,
  total_reward FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_actions,
    COUNT(*) FILTER (WHERE action_type = 'view') AS views,
    COUNT(*) FILTER (WHERE action_type = 'click') AS clicks,
    COUNT(*) FILTER (WHERE action_type = 'save') AS saves,
    COUNT(*) FILTER (WHERE action_type = 'apply') AS applies,
    COUNT(*) FILTER (WHERE action_type = 'reject') AS rejects,
    AVG(scroll_depth) AS avg_scroll_depth,
    AVG(dwell_time) AS avg_dwell_time,
    SUM(reward) AS total_reward
  FROM user_behavior_logs
  WHERE
    user_id = target_user_id
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$;

-- 8. 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_bandit_policies_updated_at
BEFORE UPDATE ON bandit_policies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 9. 코멘트
COMMENT ON TABLE bandit_policies IS 'Thompson Sampling Bandit 정책 (사용자별 공고 학습)';
COMMENT ON TABLE user_behavior_logs IS '사용자 행동 로그 (리워드 계산 포함)';
COMMENT ON FUNCTION get_user_bandit_policy IS '사용자별 Bandit 정책 조회 (기댓값 내림차순)';
COMMENT ON FUNCTION update_bandit_policy IS 'Bandit 정책 업데이트 (Beta 분포 파라미터)';
COMMENT ON FUNCTION log_user_behavior IS '행동 로그 저장 + Bandit 정책 자동 업데이트';
COMMENT ON FUNCTION get_user_behavior_stats IS '사용자 행동 통계 (최근 N일)';
```

**RUN 버튼 클릭**

### ✅ 완료 확인

#### Table Editor에서 다음 테이블들이 모두 생성되었는지 확인:

**JobAI 1.0 기본 테이블** (12개):
- ✅ profiles
- ✅ user_profiles
- ✅ company_profiles
- ✅ jobs
- ✅ applications
- ✅ matches
- ✅ chat_rooms
- ✅ messages
- ✅ notifications
- ✅ events
- ✅ event_attendees
- ✅ reviews

**추가 테이블** (2개):
- ✅ saved_jobs
- ✅ interview_slots

**JobAI 2.0 AI 테이블** (4개):
- ✅ job_embeddings
- ✅ user_profile_embeddings
- ✅ bandit_policies
- ✅ user_behavior_logs

**총 18개 테이블**

#### Database → Functions에서 다음 함수들 확인:

**유틸리티 함수**:
- ✅ update_updated_at

**Vector 함수** (3개):
- ✅ get_similar_jobs_for_user
- ✅ get_similar_jobs_to_job
- ✅ get_matching_candidates_for_job

**Bandit 함수** (4개):
- ✅ get_user_bandit_policy
- ✅ update_bandit_policy
- ✅ log_user_behavior
- ✅ get_user_behavior_stats

**총 8개 함수**

---

## 🚀 배포 가이드

### 사전 준비사항

배포 전 다음 항목들을 준비해주세요:

#### 필수 계정
- [ ] **Vercel 계정** (https://vercel.com)
- [ ] **Supabase 계정** (https://supabase.com)
- [ ] **OpenAI 계정** (https://platform.openai.com)

#### 필수 정보
- [ ] **OpenAI API Key** (결제 정보 등록 필요)
- [ ] **Supabase Project URL**
- [ ] **Supabase Anon Key**
- [ ] **Supabase Service Role Key**

### Vercel 배포

#### 1단계: GitHub 연동

프로젝트를 GitHub에 푸시 (아직 안했다면):
```bash
git init
git add .
git commit -m "JobAI 2.0 - Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/jobai.git
git push -u origin main
```

#### 2단계: Vercel 프로젝트 생성

1. https://vercel.com 접속 후 로그인
2. **"Add New..." → Project** 클릭
3. GitHub 저장소 연결:
   - "Import Git Repository" 클릭
   - jobai 저장소 선택
   - **Import** 클릭

#### 3단계: 프로젝트 설정

**Configure Project** 화면에서:
- **Framework Preset**: Next.js (자동 감지됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)

#### 4단계: 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수들을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_API_URL=https://your-vercel-url.vercel.app/api
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_USE_GRAPHQL=true
```

⚠️ **주의사항**:
- `NEXT_PUBLIC_API_URL`은 나중에 Vercel URL을 받은 후 업데이트해야 합니다
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 GitHub에 커밋하지 마세요!

#### 5단계: 배포 시작

1. **Deploy** 버튼 클릭
2. 배포 진행 상황 모니터링 (약 2-3분 소요)
3. ✅ 배포 완료 시 "Visit" 버튼으로 사이트 확인

#### 6단계: API URL 업데이트

1. 배포된 URL 복사 (예: `https://jobai-xxx.vercel.app`)
2. Vercel Dashboard → **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_API_URL` 값 수정:
   ```
   https://jobai-xxx.vercel.app/api
   ```
4. **Redeploy** 클릭하여 재배포

### OpenAI API Key 결제 설정

1. https://platform.openai.com/account/billing 접속
2. **결제 정보 등록** (신용카드/직불카드)
3. **사용량 제한 설정** (권장: $10-50/month)
4. **잔액 충전** (최소 $5 이상)

⚠️ 결제 정보가 없으면 API 호출이 실패합니다!

### 초기 데이터 설정

배포 후 임베딩 생성이 필요합니다.

#### Job Embeddings 생성

**모든 공고에 대해 임베딩 생성** (배치 처리):

```bash
# REST API 호출
curl -X PUT https://your-vercel-url.vercel.app/api/embeddings/generate-job \
  -H "Content-Type: application/json"
```

또는 브라우저에서:
1. 개발자 도구 열기 (F12)
2. Console 탭에서 실행:
```javascript
fetch('/api/embeddings/generate-job', { method: 'PUT' })
  .then(res => res.json())
  .then(data => console.log(data));
```

#### User Embeddings 생성

사용자별로 임베딩 생성 (사용자 로그인 후):

```bash
curl -X POST https://your-vercel-url.vercel.app/api/embeddings/generate-user \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid-here"}'
```

### 배포 후 테스트

#### 1. AI 인사이트 생성 (/api/ai/insights)

**테스트 방법**:
1. 공고 상세 페이지 접속
2. "AI 인사이트" 버튼 클릭
3. 로딩 후 인사이트 표시 확인

**확인 사항**:
- [ ] 인사이트가 3-5초 내에 로드됨
- [ ] 강점 3개, 추천사항 3개 표시
- [ ] 한글로 자연스럽게 작성됨

#### 2. 자기소개서 리뷰 (/cover-letter-review)

**테스트 방법**:
1. `/cover-letter-review` 페이지 접속
2. 테스트 자기소개서 입력 (500자 이상)
3. "AI 리뷰 받기" 클릭

**확인 사항**:
- [ ] 점수 (0-100) 표시
- [ ] 등급 (A+~F) 표시
- [ ] 강점/약점/개선 제안 표시
- [ ] 개선된 문장 예시 표시
- [ ] 키워드 분석 표시

#### 3. 벡터 추천 (/api/recommendations/vector-search)

**테스트 방법**:
1. 사용자 프로필 업데이트 (스킬, 경력 입력)
2. 메인 페이지에서 "추천 공고" 확인

**확인 사항**:
- [ ] 유사도 점수가 높은 공고부터 표시
- [ ] 매칭 퍼센트 표시
- [ ] 사용자 스킬과 관련된 공고 우선 표시

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

---

## 🔬 기술 구현 상세

### AI 시스템 아키텍처

#### 추천 시스템 파이프라인

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

#### 리워드 시스템

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

### 성능 지표

#### 빌드 결과
```
✓ Compiled successfully
33 pages
11 API routes
Total First Load JS: 135 kB
```

#### AI 응답 시간
- **인사이트 생성**: ~1.5초 (GPT-4o-mini)
- **자기소개서 리뷰**: ~3초 (GPT-4 Turbo)
- **벡터 검색**: <100ms (pgvector)
- **Bandit 선택**: <50ms (in-memory)

#### 예상 비용 (월간)
- GPT-4o-mini (인사이트): ~$5-10
- GPT-4 Turbo (리뷰): ~$20-50
- text-embedding-3-small: ~$1-5
- **총 예상**: $30-70/month (사용량에 따라 변동)

---

## ✅ 배포 전 체크리스트

### 1. 코드 품질 체크

#### 빌드 테스트
```bash
npm run build
```

**확인 사항**:
- [ ] ✓ Compiled successfully
- [ ] 0 errors, 0 warnings
- [ ] 모든 페이지 정상 빌드됨
- [ ] Total First Load JS < 200 kB

#### TypeScript 타입 체크
```bash
npx tsc --noEmit
```

**확인 사항**:
- [ ] No type errors
- [ ] 모든 implicit any 제거됨
- [ ] strict mode 통과

#### Linting
```bash
npm run lint
```

**확인 사항**:
- [ ] No linting errors
- [ ] 코딩 컨벤션 준수

### 2. 환경 변수 설정

#### .env.local 확인

**필수 변수**:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`

#### .gitignore 확인

**확인 사항**:
- [ ] `.env.local`이 .gitignore에 포함됨
- [ ] `.env.local`이 Git tracking 안 됨
- [ ] Service Role Key가 코드에 하드코딩 안 됨

### 3. API 키 준비

#### Supabase 키

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. **Settings → API** 이동
4. 다음 키 복사:

| 키 이름 | 위치 | 용도 |
|---------|------|------|
| **Project URL** | Project URL | API 엔드포인트 |
| **anon public** | Project API keys | 클라이언트 사이드 |
| **service_role** | Project API keys | 서버 사이드 (비공개!) |

#### OpenAI API Key

1. https://platform.openai.com/api-keys 접속
2. **"Create new secret key"** 클릭
3. 키 이름 입력: `jobai-production`
4. 키 복사 (⚠️ 한 번만 표시됨!)

**결제 설정 확인**:
- [ ] https://platform.openai.com/account/billing 접속
- [ ] 결제 수단 등록됨
- [ ] 잔액 $5 이상
- [ ] Usage limits 설정됨

### 4. Supabase 데이터베이스 준비

#### pgvector 확장 설치

**Supabase Dashboard → Database → Extensions**:
- [ ] `vector` extension이 활성화되어 있음

#### 마이그레이션 파일 확인

**필수 SQL 실행 완료**:
- [ ] 기본 스키마 (profiles, jobs, applications 등)
- [ ] 추가 테이블 (saved_jobs, interview_slots)
- [ ] pgvector 확장 (job_embeddings, user_profile_embeddings)
- [ ] Bandit 정책 (bandit_policies, user_behavior_logs)

### 5. 코드 보안 점검

#### Service Role Key 노출 체크

```bash
# 위험: 클라이언트 코드에서 Service Role Key 사용
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/components
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/app --exclude-dir=api
```

**결과가 없어야 정상!**

#### API Key 하드코딩 체크

```bash
# 위험: API 키 하드코딩
grep -r "sk-proj-" src/
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/
```

**결과가 없어야 정상!**

### 6. 최종 배포 준비 상태

#### 전체 체크리스트

##### 코드
- [ ] ✅ Build 성공 (0 errors)
- [ ] ✅ TypeScript 타입 체크 통과
- [ ] ✅ Linting 통과
- [ ] ✅ 11개 API 라우트 존재
- [ ] ✅ 주요 컴포넌트 존재

##### 보안
- [ ] ✅ Service Role Key 노출 없음
- [ ] ✅ API Key 하드코딩 없음
- [ ] ✅ .env.local이 Git에서 제외됨
- [ ] ⏳ Service Role Key 업데이트 필요
- [ ] ⏳ OpenAI API Key 업데이트 필요

##### 데이터베이스
- [ ] ✅ Supabase 프로젝트 존재
- [ ] ✅ pgvector 확장 활성화됨
- [ ] ✅ 모든 테이블 생성 완료 (18개)
- [ ] ✅ 모든 함수 생성 완료 (8개)

##### API 키
- [ ] ✅ Supabase URL 준비됨
- [ ] ✅ Supabase Anon Key 준비됨
- [ ] ⏳ Supabase Service Role Key 업데이트 필요
- [ ] ⏳ OpenAI API Key 업데이트 필요
- [ ] ⏳ OpenAI 결제 정보 등록 필요

---

## ❌ 트러블슈팅

### 문제 1: "OpenAI API Error: Insufficient Quota"

**원인**: OpenAI 계정 잔액 부족 또는 결제 정보 미등록

**해결**:
1. https://platform.openai.com/account/billing 접속
2. 결제 정보 등록
3. 잔액 충전 ($5 이상)
4. 5분 후 재시도

### 문제 2: "Supabase Connection Failed"

**원인**: 환경 변수 오류 또는 잘못된 URL

**해결**:
1. Vercel Dashboard → Settings → Environment Variables 확인
2. `NEXT_PUBLIC_SUPABASE_URL` 형식 확인:
   - ✅ 올바름: `https://xxx.supabase.co`
   - ❌ 틀림: `https://xxx.supabase.co/` (슬래시 있음)
3. 환경 변수 수정 후 **Redeploy**

### 문제 3: "pgvector function does not exist"

**원인**: 마이그레이션 미실행

**해결**:
1. Supabase Dashboard → Database → Extensions
2. `vector` 확장 활성화 확인
3. SQL Editor에서 pgvector 마이그레이션 재실행

### 문제 4: "Embedding generation too slow"

**원인**: 대량 데이터 처리 시 타임아웃

**해결**:
1. 배치 크기 줄이기 (100 → 50)
2. 여러 번 나눠서 실행
3. Vercel Serverless Function 타임아웃 늘리기 (Pro 플랜)

### 문제 5: "Bandit recommendations not working"

**원인**: 행동 데이터 부족

**해결**:
1. 최소 10-20개 이상의 행동 데이터 필요
2. 테스트용 데이터 생성:
```sql
-- 테스트 행동 데이터 삽입
INSERT INTO user_behavior_logs (user_id, job_id, action_type, scroll_depth, dwell_time, reward)
VALUES
  ('test-user-id', 'job-1', 'view', 75, 45, 0.8),
  ('test-user-id', 'job-2', 'apply', 100, 120, 3.0),
  ('test-user-id', 'job-3', 'save', 90, 60, 1.5);
```

### 문제 6: "Service Role Key exposed to client"

**위험**: 보안 취약점 - 즉시 조치 필요!

**해결**:
1. Supabase Dashboard → Settings → API → **Reset Service Role Key**
2. 새 키를 Vercel 환경 변수에만 설정
3. 절대 클라이언트 코드에서 사용하지 마세요!

---

## 📚 참고 자료

### 공식 문서
- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [OpenAI](https://platform.openai.com/docs)
- [pgvector](https://github.com/pgvector/pgvector)

### 논문/아티클
- [Deep Learning for Recommender Systems (2021)](https://arxiv.org/abs/2109.12084)
- [Thompson Sampling Tutorial](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf)
- [Graph Embedding Techniques](https://arxiv.org/abs/1709.07604)

### 기술 문서
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns)
- [LangChain Docs](https://js.langchain.com/docs/get_started/introduction)

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

---

**최종 업데이트**: 2025-10-15
**버전**: JobAI 2.0
**문서 상태**: 완료
