# JobAI 데이터베이스 마이그레이션 가이드

> **버전**: 1.0.0
> **작성일**: 2025-11-13
> **대상**: localStorage → Supabase PostgreSQL 마이그레이션

---

## 📋 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [Supabase 프로젝트 설정](#supabase-프로젝트-설정)
4. [스키마 적용](#스키마-적용)
5. [RLS 정책 적용](#rls-정책-적용)
6. [Seed 데이터 로드](#seed-데이터-로드)
7. [데이터 마이그레이션](#데이터-마이그레이션)
8. [환경 변수 설정](#환경-변수-설정)
9. [검증 및 테스트](#검증-및-테스트)
10. [트러블슈팅](#트러블슈팅)

---

## 개요

### 마이그레이션 목표

- **현재 상태**: localStorage 기반 데이터 저장
- **목표 상태**: Supabase PostgreSQL 기반 프로덕션 환경
- **마이그레이션 범위**:
  - 12개 테이블 스키마
  - Row Level Security (RLS) 정책
  - 기존 데이터 마이그레이션
  - Seed 데이터 (개발/테스트용)

### 예상 소요 시간

- Supabase 설정: **15분**
- 스키마 적용: **5분**
- RLS 정책 적용: **5분**
- Seed 데이터: **2분**
- 데이터 마이그레이션: **10-30분** (데이터양에 따라)
- 검증 및 테스트: **20분**

**총 소요 시간**: 약 **1-2시간**

---

## 사전 준비

### 1. 필수 도구 설치

```bash
# Node.js (v18 이상)
node --version

# npm 또는 yarn
npm --version

# (선택) Supabase CLI
npm install -g supabase
```

### 2. 필수 파일 확인

프로젝트 루트의 `database/` 디렉토리에 다음 파일이 있는지 확인:

- ✅ `schema.sql` - 데이터베이스 스키마
- ✅ `rls-policies.sql` - Row Level Security 정책
- ✅ `seed.sql` - Seed 데이터
- ✅ `migrate.ts` - TypeScript 마이그레이션 스크립트
- ✅ `MIGRATION_GUIDE.md` - 이 가이드 문서

### 3. 기존 데이터 백업 (중요!)

```javascript
// 브라우저 콘솔에서 실행
const data = {
  teams: JSON.parse(localStorage.getItem('jobai_teams') || '[]'),
  applications: JSON.parse(localStorage.getItem('jobai_team_applications') || '[]'),
  waitlist: JSON.parse(localStorage.getItem('jobai_team_waitlist') || '[]'),
  exportedAt: new Date().toISOString()
}

// JSON 다운로드
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `jobai-backup-${Date.now()}.json`
a.click()
```

또는 `migrate.ts`에 있는 `exportLocalStorageToJSON()` 함수 사용:

```javascript
// 브라우저 콘솔
import { exportLocalStorageToJSON } from './database/migrate'
exportLocalStorageToJSON()
```

---

## Supabase 프로젝트 설정

### 1. Supabase 계정 생성

1. [Supabase 웹사이트](https://supabase.com/) 방문
2. **Start your project** 클릭
3. GitHub 계정으로 로그인

### 2. 새 프로젝트 생성

1. **New Project** 클릭
2. 프로젝트 정보 입력:
   - **Name**: `jobai-production` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서버)
   - **Pricing Plan**: `Free` 선택 (개발용) 또는 `Pro` (프로덕션)

3. **Create new project** 클릭
4. 프로젝트 생성 완료까지 **2-3분** 대기

### 3. API 키 및 URL 확인

프로젝트 대시보드 → **Settings** → **API** 메뉴에서:

- ✅ **Project URL**: `https://xxx.supabase.co`
- ✅ **anon public key**: `eyJhbGci...` (클라이언트용)
- ✅ **service_role secret**: `eyJhbGci...` (서버용, **절대 클라이언트에 노출 금지**)

---

## 스키마 적용

### 방법 1: Supabase 대시보드 (추천)

1. Supabase 프로젝트 대시보드 접속
2. **SQL Editor** 메뉴 클릭
3. **New query** 클릭
4. `database/schema.sql` 파일 내용 복사하여 붙여넣기
5. **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
6. 성공 메시지 확인: `Success. No rows returned`

### 방법 2: Supabase CLI

```bash
# Supabase CLI 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref <your-project-ref>

# 스키마 적용
supabase db push

# 또는 SQL 파일 직접 실행
supabase db execute -f database/schema.sql
```

### 방법 3: psql (고급)

```bash
# Connection String은 Supabase Dashboard → Settings → Database에서 확인
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres" \
  -f database/schema.sql
```

### 확인 방법

SQL Editor에서 실행:

```sql
-- 테이블 생성 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 예상 결과: 12개 테이블
-- applications, match_score_cache, organizations, positions,
-- team_benefits, team_cultures, team_projects, teams,
-- user_profiles, users, waitlist, waitlist_history
```

---

## RLS 정책 적용

### 방법 1: Supabase 대시보드 (추천)

1. **SQL Editor** 메뉴
2. **New query** 클릭
3. `database/rls-policies.sql` 파일 내용 복사하여 붙여넣기
4. **Run** 버튼 클릭
5. 성공 메시지 확인

### 확인 방법

```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 정책 목록 확인
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

모든 테이블의 `rowsecurity`가 `true`여야 합니다.

---

## Seed 데이터 로드

### 개발/테스트용 샘플 데이터

**⚠️ 주의**: Seed 데이터는 개발/테스트 환경에만 사용하세요. 프로덕션에는 실제 마이그레이션 스크립트를 사용하세요.

### 방법 1: Supabase 대시보드

1. **SQL Editor** 메뉴
2. **New query** 클릭
3. `database/seed.sql` 파일 내용 복사하여 붙여넣기
4. **Run** 버튼 클릭

### 확인 방법

```sql
-- 데이터 개수 확인
SELECT 'organizations' AS table_name, COUNT(*) FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'positions', COUNT(*) FROM positions
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'waitlist', COUNT(*) FROM waitlist;

-- 예상 결과:
-- organizations: 3
-- users: 11
-- teams: 4
-- positions: 10
-- applications: 4
-- waitlist: 4
```

### Seed 데이터 내용

- **3개 조직**: HealthAI Inc., EduTech Solutions, GreenEnergy Co.
- **11명 사용자**: 3명 팀 리더 + 8명 구직자
- **5개 사용자 프로필**: 다양한 경력과 스킬
- **4개 팀**: 헬스케어, 교육, 에너지, 해커톤
- **10개 포지션**: 프론트엔드, 백엔드, AI/ML, 디자이너 등
- **4개 지원서**: 다양한 상태 (제출, 검토중, 수락, 인터뷰)
- **4개 대기열**: 활성 상태

---

## 데이터 마이그레이션

### 준비 사항

1. **환경 변수 설정** (`.env.local` 파일):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (anon public key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (service_role key)
```

2. **Supabase 클라이언트 설치**:

```bash
npm install @supabase/supabase-js
# 또는
yarn add @supabase/supabase-js
```

### 방법 1: 브라우저 환경 (localStorage에서 직접)

```javascript
// 1. 브라우저 콘솔에서 실행
import { runMigration } from './database/migrate'

// 2. 마이그레이션 실행
await runMigration('localStorage')

// 3. 결과 확인
// ✅ 성공 메시지 및 통계 출력
```

### 방법 2: Node.js 환경 (JSON 파일에서)

```bash
# 1. 먼저 localStorage 데이터를 JSON으로 내보내기 (브라우저에서)
# exportLocalStorageToJSON() 함수 사용

# 2. JSON 파일로 마이그레이션 실행
npx ts-node database/migrate.ts ./jobai-backup-1234567890.json

# 또는
node -r esbuild-register database/migrate.ts ./jobai-backup.json
```

### 방법 3: 커스텀 스크립트

```typescript
// scripts/run-migration.ts
import { runMigration } from '../database/migrate'

async function main() {
  try {
    console.log('Starting migration...')
    const stats = await runMigration('file', './data-export.json')
    console.log('Migration completed!')
    console.log('Stats:', stats)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
```

실행:

```bash
npx ts-node scripts/run-migration.ts
```

### 마이그레이션 진행 상황

실행 중 다음과 같은 로그가 출력됩니다:

```
================================================================================
JobAI Database Migration Started
================================================================================
📘 [2025-11-13T10:00:00.000Z] Loaded 5 teams, 12 applications, 8 waitlist entries
📘 [2025-11-13T10:00:01.000Z] Migrating organizations...
✅ [2025-11-13T10:00:02.000Z] ✓ Organization: HealthAI Inc.
✅ [2025-11-13T10:00:03.000Z] ✓ Organization: EduTech Solutions
📘 [2025-11-13T10:00:04.000Z] Migrating teams...
✅ [2025-11-13T10:00:05.000Z] ✓ Team: AI 기반 헬스케어 서비스
...
================================================================================
Migration Summary
================================================================================
Duration: 12.34s

✅ organizations: 3/3 successful
✅ teams: 5/5 successful
✅ positions: 15/15 successful
⚠️  applications: 11/12 successful
  - Failed to migrate application app_5: duplicate key value
✅ waitlist: 8/8 successful
================================================================================
Migration Completed!
================================================================================
```

---

## 환경 변수 설정

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용 추가:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (DO NOT expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. `.env.example` 파일 업데이트

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. `.gitignore` 확인

`.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인:

```
# Local env files
.env.local
.env.*.local
```

### 4. Supabase 클라이언트 초기화

`lib/supabase.ts` 파일 생성:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 검증 및 테스트

### 1. 스키마 검증

```sql
-- 테이블 개수 확인 (12개 예상)
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- 각 테이블의 컬럼 개수 확인
SELECT table_name, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

### 2. RLS 정책 검증

```sql
-- RLS가 활성화된 테이블 확인 (12개 예상)
SELECT COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- 정책 개수 확인 (30개 이상 예상)
SELECT COUNT(*)
FROM pg_policies
WHERE schemaname = 'public';
```

### 3. 데이터 무결성 검증

```sql
-- Foreign Key 제약 조건 확인
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
ORDER BY table_name;

-- 데이터 개수 확인
SELECT
  (SELECT COUNT(*) FROM teams) AS teams_count,
  (SELECT COUNT(*) FROM positions) AS positions_count,
  (SELECT COUNT(*) FROM applications) AS applications_count,
  (SELECT COUNT(*) FROM waitlist) AS waitlist_count;
```

### 4. 기능 테스트

#### A. 팀 조회 테스트

```typescript
// pages/api/test-db.ts
import { supabase } from '@/lib/supabase'

export default async function handler(req, res) {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*, positions(*)')
    .eq('status', 'recruiting')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ teams })
}
```

#### B. 지원 생성 테스트

```typescript
const { data, error } = await supabase
  .from('applications')
  .insert({
    team_id: 'team_1',
    position_id: 'pos_1_1',
    applicant_id: 'user_seeker_1',
    motivation: '테스트 지원입니다',
    match_score: 85,
    status: 'submitted'
  })
  .select()
```

#### C. RLS 테스트

```typescript
// 인증된 사용자로 자신의 지원서만 볼 수 있는지 확인
const { data: myApplications } = await supabase
  .from('applications')
  .select('*')
  // RLS가 자동으로 필터링
```

### 5. 성능 테스트

```sql
-- 인덱스 확인
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Slow Query 확인
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%teams%' OR query LIKE '%applications%'
ORDER BY total_time DESC
LIMIT 10;
```

---

## 트러블슈팅

### 문제 1: 스키마 적용 실패

**증상**:
```
ERROR: relation "teams" already exists
```

**해결**:
```sql
-- 기존 테이블 삭제 후 재적용
DROP TABLE IF EXISTS match_score_cache, waitlist_history, waitlist, applications,
  team_projects, team_benefits, team_cultures, positions, teams,
  user_profiles, users, organizations CASCADE;

-- 스키마 재적용
\i database/schema.sql
```

### 문제 2: RLS 정책 충돌

**증상**:
```
ERROR: policy "Users can view relevant applications" already exists
```

**해결**:
```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view relevant applications" ON applications;

-- RLS 정책 재적용
\i database/rls-policies.sql
```

### 문제 3: 마이그레이션 스크립트 에러

**증상**:
```
Error: Missing Supabase environment variables
```

**해결**:
- `.env.local` 파일에 환경 변수가 제대로 설정되었는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Next.js 서버 재시작

### 문제 4: Foreign Key 제약 조건 위반

**증상**:
```
ERROR: insert or update on table "positions" violates foreign key constraint "positions_team_id_fkey"
```

**해결**:
- 부모 테이블(teams)에 해당 레코드가 존재하는지 확인
- 마이그레이션 순서 확인 (teams → positions → applications)

### 문제 5: RLS로 인한 접근 거부

**증상**:
```
new row violates row-level security policy for table "applications"
```

**해결**:
- Service Role Key를 사용하여 RLS 우회 (마이그레이션 시)
- 또는 적절한 사용자 컨텍스트 설정

```typescript
// Service role 클라이언트 사용 (마이그레이션 시)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### 문제 6: 대용량 데이터 마이그레이션 시 타임아웃

**증상**:
```
Error: timeout of 30000ms exceeded
```

**해결**:
- 배치 크기 줄이기 (한 번에 100개씩)
- 타임아웃 증가

```typescript
// 배치 처리 예시
const batchSize = 100
for (let i = 0; i < teams.length; i += batchSize) {
  const batch = teams.slice(i, i + batchSize)
  await migrateTeamsBatch(batch)
  await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
}
```

### 문제 7: Seed 데이터 중복

**증상**:
```
ERROR: duplicate key value violates unique constraint "users_pkey"
```

**해결**:
```sql
-- 기존 Seed 데이터 삭제
TRUNCATE TABLE match_score_cache, waitlist_history, waitlist, applications,
  team_projects, team_benefits, team_cultures, positions, teams,
  user_profiles, users, organizations CASCADE;

-- Seed 데이터 재로드
\i database/seed.sql
```

---

## 추가 자료

### 관련 문서

- [Supabase 공식 문서](https://supabase.com/docs)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

### 다음 단계

마이그레이션이 완료되면 다음 작업을 진행하세요:

1. ✅ **인증 시스템 통합**: Supabase Auth 설정
2. ✅ **API 레이어 구현**: tRPC 또는 REST API
3. ✅ **프론트엔드 통합**: localStorage → Supabase 클라이언트로 전환
4. ✅ **모니터링 설정**: Sentry, Vercel Analytics
5. ✅ **백업 전략 수립**: 자동 백업 및 복구 계획

---

## 문의 및 지원

문제가 발생하면:

1. 이 가이드의 **트러블슈팅** 섹션 확인
2. Supabase 대시보드 → **Logs** 메뉴에서 에러 로그 확인
3. GitHub Issues에 문의

---

**작성자**: Claude Code (Anthropic)
**버전**: 1.0.0
**최종 수정일**: 2025-11-13
