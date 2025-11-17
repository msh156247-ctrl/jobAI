# Supabase 설정 체크리스트

> 이 체크리스트를 따라 Supabase 프로젝트를 설정하세요.
> 예상 소요 시간: **30-45분**

---

## ✅ Phase 1: Supabase 프로젝트 생성

### 1. Supabase 계정 생성 (5분)

- [ ] [Supabase 웹사이트](https://supabase.com/) 접속
- [ ] **Start your project** 클릭
- [ ] GitHub 계정으로 로그인

### 2. 새 프로젝트 생성 (5분)

- [ ] **New Project** 클릭
- [ ] 프로젝트 정보 입력:
  - **Name**: `jobai-production`
  - **Database Password**: 강력한 비밀번호 (저장 필수!)
  - **Region**: `Northeast Asia (Seoul)` 선택
  - **Pricing Plan**: `Free` 또는 `Pro`
- [ ] **Create new project** 클릭
- [ ] 프로젝트 생성 완료 대기 (2-3분)

### 3. API 키 확인 및 저장 (2분)

**Settings → API**

- [ ] **Project URL** 복사: `https://xxx.supabase.co`
- [ ] **anon public** key 복사
- [ ] **service_role secret** key 복사 ⚠️ 안전하게 보관!

---

## ✅ Phase 2: 데이터베이스 스키마 적용

### 4. SQL Editor에서 스키마 적용 (5분)

**SQL Editor → New query**

- [ ] `database/schema.sql` 파일 내용 복사
- [ ] SQL Editor에 붙여넣기
- [ ] **Run** 버튼 클릭 (또는 `Ctrl+Enter`)
- [ ] 성공 메시지 확인: `Success. No rows returned`

### 5. 테이블 생성 확인 (2분)

**Table Editor**

- [ ] 12개 테이블이 생성되었는지 확인:
  - ✅ organizations
  - ✅ users
  - ✅ user_profiles
  - ✅ teams
  - ✅ team_cultures
  - ✅ team_benefits
  - ✅ team_projects
  - ✅ positions
  - ✅ applications
  - ✅ waitlist
  - ✅ waitlist_history
  - ✅ match_score_cache

---

## ✅ Phase 3: Row Level Security 적용

### 6. RLS 정책 적용 (3분)

**SQL Editor → New query**

- [ ] `database/rls-policies.sql` 파일 내용 복사
- [ ] SQL Editor에 붙여넣기
- [ ] **Run** 버튼 클릭
- [ ] 성공 메시지 확인

### 7. RLS 활성화 확인 (1분)

**SQL Editor**에서 실행:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

- [ ] 모든 테이블의 `rowsecurity`가 `true`인지 확인

---

## ✅ Phase 4: Seed 데이터 로드 (개발용)

### 8. Seed 데이터 삽입 (2분)

**SQL Editor → New query**

- [ ] `database/seed.sql` 파일 내용 복사
- [ ] SQL Editor에 붙여넣기
- [ ] **Run** 버튼 클릭

### 9. 데이터 확인 (1분)

**Table Editor**에서 확인:

- [ ] `users` 테이블: 11명 사용자
- [ ] `teams` 테이블: 4개 팀
- [ ] `positions` 테이블: 10개 포지션
- [ ] `applications` 테이블: 4개 지원서
- [ ] `waitlist` 테이블: 4개 대기열

---

## ✅ Phase 5: 인증 설정

### 10. Auth 기본 설정 (3분)

**Authentication → Configuration → Settings**

- [ ] **Site URL**: `http://localhost:3000` (개발) 또는 실제 도메인
- [ ] **Redirect URLs** 추가:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/reset-password
  ```
- [ ] **Enable Email Signup**: ✅ Enabled
- [ ] **Enable Email Confirmations**:
  - ❌ Disabled (개발)
  - ✅ Enabled (프로덕션)
- [ ] **Auth Flow**: `PKCE`

### 11. Google OAuth 설정 (선택, 10분)

**Authentication → Providers → Google**

먼저 [Google Cloud Console](https://console.cloud.google.com/)에서:

- [ ] 프로젝트 생성
- [ ] **APIs & Services → Credentials**
- [ ] **OAuth consent screen** 설정
- [ ] **OAuth 2.0 Client ID** 생성
- [ ] Authorized redirect URI 추가:
  ```
  https://[your-project-id].supabase.co/auth/v1/callback
  ```

Supabase에서:

- [ ] **Google Enabled**: ✅
- [ ] **Client ID** 입력
- [ ] **Client Secret** 입력
- [ ] **Save** 클릭

### 12. GitHub OAuth 설정 (선택, 10분)

**Authentication → Providers → GitHub**

먼저 [GitHub Settings](https://github.com/settings/developers)에서:

- [ ] **OAuth Apps → New OAuth App**
- [ ] Authorization callback URL:
  ```
  https://[your-project-id].supabase.co/auth/v1/callback
  ```
- [ ] **Client Secret** 생성

Supabase에서:

- [ ] **GitHub Enabled**: ✅
- [ ] **Client ID** 입력
- [ ] **Client Secret** 입력
- [ ] **Save** 클릭

---

## ✅ Phase 6: 로컬 환경 설정

### 13. 환경 변수 설정 (3분)

프로젝트 루트에서:

- [ ] `.env.example` 파일을 복사하여 `.env.local` 생성
  ```bash
  cp .env.example .env.local
  ```
- [ ] `.env.local` 파일 편집:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
  SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```
- [ ] 파일 저장

### 14. 패키지 설치 및 개발 서버 실행 (2분)

```bash
# Supabase 클라이언트 설치 (아직 안 했다면)
npm install @supabase/supabase-js

# 개발 서버 실행
npm run dev
```

- [ ] `http://localhost:3000` 접속
- [ ] 콘솔에 에러가 없는지 확인

---

## ✅ Phase 7: 테스트

### 15. 회원가입 테스트 (3분)

- [ ] `http://localhost:3000/auth/signup` 접속
- [ ] 이메일과 비밀번호로 회원가입
- [ ] **Supabase Dashboard → Authentication → Users**에서 사용자 확인
- [ ] 개발 환경에서는 이메일 수동 확인:
  ```sql
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email = 'your-email@example.com';
  ```

### 16. 로그인 테스트 (2분)

- [ ] `http://localhost:3000/auth/login` 접속
- [ ] 가입한 계정으로 로그인
- [ ] `/dashboard`로 리다이렉트 확인
- [ ] 로그아웃 테스트

### 17. Google OAuth 테스트 (선택, 2분)

- [ ] `http://localhost:3000/auth/login` 접속
- [ ] "Google로 계속하기" 클릭
- [ ] Google 계정으로 로그인
- [ ] `/dashboard`로 리다이렉트 확인
- [ ] **Supabase Dashboard → Authentication → Users**에서 사용자 확인

### 18. GitHub OAuth 테스트 (선택, 2분)

- [ ] `http://localhost:3000/auth/login` 접속
- [ ] "GitHub으로 계속하기" 클릭
- [ ] GitHub 계정으로 로그인
- [ ] `/dashboard`로 리다이렉트 확인

---

## ✅ Phase 8: 프로덕션 배포 준비

### 19. Vercel 환경 변수 설정 (5분)

**Vercel Dashboard → Settings → Environment Variables**

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 추가
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 추가 (Production, Preview만)
- [ ] `NEXT_PUBLIC_SITE_URL` 추가 (실제 도메인)

### 20. Supabase 리다이렉트 URL 업데이트 (2분)

**Authentication → Configuration → Settings**

- [ ] **Site URL**: 실제 도메인으로 변경
- [ ] **Redirect URLs**에 프로덕션 URL 추가:
  ```
  https://yourdomain.com/auth/callback
  https://yourdomain.com/auth/reset-password
  ```

### 21. OAuth 리다이렉트 URL 업데이트 (선택, 3분)

**Google Cloud Console / GitHub Settings**

- [ ] Authorized redirect URIs에 프로덕션 URL 추가

---

## 🎉 완료!

모든 체크리스트를 완료하셨다면 Supabase 설정이 완료되었습니다!

### 다음 단계

- ✅ **대시보드 페이지** 구현
- ✅ **API 레이어** 구현 (tRPC)
- ✅ **프론트엔드 마이그레이션** (localStorage → Supabase)
- ✅ **UI/UX 개선**

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [database/MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)
- [database/SUPABASE_AUTH_SETUP.md](database/SUPABASE_AUTH_SETUP.md)

---

**작성일**: 2025-11-13
**예상 소요 시간**: 30-45분
