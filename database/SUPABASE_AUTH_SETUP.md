# Supabase Auth 설정 가이드

> **버전**: 1.0.0
> **작성일**: 2025-11-13
> **대상**: Supabase 인증 시스템 설정

---

## 📋 목차

1. [개요](#개요)
2. [Supabase Auth 설정](#supabase-auth-설정)
3. [소셜 로그인 설정](#소셜-로그인-설정)
4. [이메일 템플릿 설정](#이메일-템플릿-설정)
5. [환경 변수 설정](#환경-변수-설정)
6. [테스트](#테스트)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

### 지원하는 인증 방법

JobAI는 다음 인증 방법을 지원합니다:

1. **이메일/비밀번호** 인증
2. **Google OAuth** 소셜 로그인
3. **GitHub OAuth** 소셜 로그인
4. **비밀번호 재설정** (이메일 링크)

### 예상 소요 시간

- Supabase Auth 기본 설정: **5분**
- Google OAuth 설정: **10분**
- GitHub OAuth 설정: **10분**
- 이메일 템플릿 설정: **5분**

**총 소요 시간**: 약 **30분**

---

## Supabase Auth 설정

### 1. Supabase 프로젝트 접속

1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. JobAI 프로젝트 선택
3. 좌측 메뉴에서 **Authentication** 클릭

### 2. Auth 기본 설정

**Authentication → Configuration → Settings**

```yaml
# Site URL (프로덕션 URL)
Site URL: https://yourdomain.com

# Redirect URLs (허용된 리다이렉트 URL)
Redirect URLs:
  - http://localhost:3000/auth/callback
  - http://localhost:3000/auth/reset-password
  - https://yourdomain.com/auth/callback
  - https://yourdomain.com/auth/reset-password

# Email Auth (이메일 인증 활성화)
Enable Email Signup: ✅ Enabled
Enable Email Confirmations: ✅ Enabled (프로덕션)
Enable Email Confirmations: ❌ Disabled (개발)

# Password Requirements (비밀번호 요구사항)
Minimum Password Length: 6

# Session Settings (세션 설정)
JWT Expiry: 3600 (1시간)
Refresh Token Rotation: ✅ Enabled
```

### 3. PKCE Flow 활성화

PKCE (Proof Key for Code Exchange)는 보안을 강화합니다.

**Authentication → Configuration → Settings → Auth Flow**

```yaml
Auth Flow: PKCE
```

---

## 소셜 로그인 설정

### Google OAuth 설정

#### Step 1: Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** → **Credentials** 이동
4. **+ CREATE CREDENTIALS** → **OAuth client ID** 클릭

#### Step 2: OAuth 동의 화면 설정

**OAuth consent screen** 탭:

```yaml
Application name: JobAI
User support email: your-email@example.com
Developer contact: your-email@example.com

Scopes:
  - .../auth/userinfo.email
  - .../auth/userinfo.profile
  - openid

Authorized domains:
  - localhost (개발)
  - yourdomain.com (프로덕션)
```

#### Step 3: OAuth Client ID 생성

**Credentials** 탭:

```yaml
Application type: Web application
Name: JobAI Web Client

Authorized JavaScript origins:
  - http://localhost:3000
  - https://yourdomain.com

Authorized redirect URIs:
  - https://<your-project-id>.supabase.co/auth/v1/callback
```

#### Step 4: Supabase에 Google OAuth 설정

**Supabase Dashboard → Authentication → Providers → Google**

```yaml
Google Enabled: ✅ Enabled

Client ID: <your-google-client-id>
Client Secret: <your-google-client-secret>

Authorized Client IDs: (비워둠)

Scopes: email profile (기본값 사용)
```

### GitHub OAuth 설정

#### Step 1: GitHub OAuth App 생성

1. [GitHub Settings](https://github.com/settings/developers) 접속
2. **OAuth Apps** → **New OAuth App** 클릭

#### Step 2: OAuth App 설정

```yaml
Application name: JobAI
Homepage URL: https://yourdomain.com
Application description: AI 기반 팀 매칭 플랫폼

Authorization callback URL:
  - https://<your-project-id>.supabase.co/auth/v1/callback
```

#### Step 3: Client ID/Secret 발급

1. **Generate a new client secret** 클릭
2. Client ID와 Client Secret 복사

#### Step 4: Supabase에 GitHub OAuth 설정

**Supabase Dashboard → Authentication → Providers → GitHub**

```yaml
GitHub Enabled: ✅ Enabled

Client ID: <your-github-client-id>
Client Secret: <your-github-client-secret>

Scopes: user:email (기본값 사용)
```

---

## 이메일 템플릿 설정

### 1. 회원가입 확인 이메일

**Authentication → Email Templates → Confirm signup**

```html
<h2>JobAI 회원가입을 환영합니다!</h2>

<p>안녕하세요,</p>

<p>JobAI에 가입해주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 주소를 인증해주세요.</p>

<a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
  이메일 인증하기
</a>

<p>위 버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
<p>{{ .ConfirmationURL }}</p>

<p>이 링크는 24시간 동안 유효합니다.</p>

<p>감사합니다,<br>JobAI 팀</p>
```

### 2. 비밀번호 재설정 이메일

**Authentication → Email Templates → Reset password**

```html
<h2>비밀번호 재설정</h2>

<p>안녕하세요,</p>

<p>비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>

<a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
  비밀번호 재설정
</a>

<p>위 버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
<p>{{ .ConfirmationURL }}</p>

<p>이 링크는 1시간 동안 유효합니다.</p>

<p><strong>본인이 요청하지 않았다면 이 이메일을 무시하세요.</strong></p>

<p>감사합니다,<br>JobAI 팀</p>
```

### 3. 마법의 링크 (Magic Link) - 선택사항

**Authentication → Email Templates → Magic Link**

```html
<h2>JobAI 로그인</h2>

<p>안녕하세요,</p>

<p>아래 버튼을 클릭하여 로그인하세요.</p>

<a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
  로그인하기
</a>

<p>위 버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
<p>{{ .ConfirmationURL }}</p>

<p>이 링크는 1시간 동안 유효합니다.</p>

<p>감사합니다,<br>JobAI 팀</p>
```

---

## 환경 변수 설정

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (DO NOT expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: OAuth Redirect URLs (for development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Vercel 배포 시 환경 변수 설정

**Vercel Dashboard → Settings → Environment Variables**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | Production |

---

## 테스트

### 1. 이메일/비밀번호 회원가입 테스트

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 http://localhost:3000/auth/signup 접속
# 3. 이메일과 비밀번호로 회원가입
# 4. 이메일 인증 (개발 환경에서는 Supabase Dashboard에서 확인)
# 5. 로그인 테스트
```

**Supabase Dashboard에서 이메일 확인**:
- **Authentication → Users** 탭
- 가입한 사용자의 **Email Confirmed** 상태 확인
- 개발 환경에서는 수동으로 확인 가능

### 2. Google OAuth 테스트

```bash
# 1. http://localhost:3000/auth/login 접속
# 2. "Google로 계속하기" 버튼 클릭
# 3. Google 계정으로 로그인
# 4. /auth/callback으로 리다이렉트 확인
# 5. /dashboard로 자동 이동 확인
```

### 3. GitHub OAuth 테스트

```bash
# 1. http://localhost:3000/auth/login 접속
# 2. "GitHub으로 계속하기" 버튼 클릭
# 3. GitHub 계정으로 로그인
# 4. /auth/callback으로 리다이렉트 확인
# 5. /dashboard로 자동 이동 확인
```

### 4. 비밀번호 재설정 테스트

```bash
# 1. http://localhost:3000/auth/login 접속
# 2. "비밀번호를 잊으셨나요?" 클릭
# 3. 이메일 입력 후 전송
# 4. 이메일 확인 (Supabase Dashboard → Email Templates → Logs)
# 5. 재설정 링크 클릭
# 6. 새 비밀번호 입력
# 7. 로그인 테스트
```

---

## 트러블슈팅

### 문제 1: "Invalid login credentials"

**증상**:
```
Error: Invalid login credentials
```

**원인**:
- 이메일이 확인되지 않음
- 잘못된 비밀번호

**해결**:
```sql
-- Supabase SQL Editor에서 실행
-- 이메일 수동 확인
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

### 문제 2: OAuth 리다이렉트 오류

**증상**:
```
Error: redirect_uri_mismatch
```

**원인**:
- Google/GitHub OAuth 설정에서 리다이렉트 URI가 일치하지 않음

**해결**:
1. Google Cloud Console 또는 GitHub Settings 확인
2. 리다이렉트 URI를 다음과 같이 설정:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```

### 문제 3: "Failed to exchange code for session"

**증상**:
```
Error: Failed to exchange code for session
```

**원인**:
- PKCE flow 설정 오류
- 만료된 auth code

**해결**:
1. Supabase Dashboard → Authentication → Configuration 확인
2. Auth Flow가 PKCE로 설정되어 있는지 확인
3. 브라우저 캐시 삭제 후 재시도

### 문제 4: 이메일이 발송되지 않음

**증상**:
- 회원가입/비밀번호 재설정 이메일이 도착하지 않음

**원인**:
- Supabase Free Tier 이메일 제한 (시간당 3-4개)
- 스팸 필터

**해결**:
1. **Supabase Dashboard → Settings → Auth → SMTP Settings**에서 커스텀 SMTP 설정 (추천)
2. 스팸 폴더 확인
3. 이메일 템플릿 로그 확인: **Authentication → Logs**

#### 커스텀 SMTP 설정 (SendGrid 예시)

```yaml
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
Username: apikey
Password: <your-sendgrid-api-key>
Sender Email: noreply@yourdomain.com
Sender Name: JobAI
```

### 문제 5: "User already registered"

**증상**:
```
Error: User already registered
```

**원인**:
- 이미 가입된 이메일

**해결**:
1. 로그인 페이지로 이동
2. 또는 비밀번호 재설정 사용

---

## 보안 Best Practices

### 1. Row Level Security (RLS) 활성화

모든 테이블에 RLS 활성화 (이미 `rls-policies.sql`에 적용됨):

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ... 기타 테이블
```

### 2. Service Role Key 보호

⚠️ **절대 클라이언트에 노출하지 마세요!**

- ✅ 서버 측 코드에서만 사용
- ✅ 환경 변수로 관리
- ❌ Git에 커밋하지 않기
- ❌ 프론트엔드 코드에 포함하지 않기

### 3. HTTPS 사용

프로덕션에서는 반드시 HTTPS 사용:

```bash
# Vercel은 자동으로 HTTPS 제공
# 또는 Cloudflare 사용
```

### 4. Rate Limiting

Supabase는 기본적으로 Rate Limiting을 제공:

- 로그인 시도: 시간당 30회
- 회원가입: 시간당 10회
- 비밀번호 재설정: 시간당 5회

### 5. 강력한 비밀번호 정책

```typescript
// 비밀번호 검증 함수
function validatePassword(password: string): boolean {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&  // 대문자
         /[a-z]/.test(password) &&  // 소문자
         /[0-9]/.test(password)     // 숫자
}
```

---

## 다음 단계

Auth 설정이 완료되면:

1. ✅ **사용자 프로필 시스템** 구축
2. ✅ **역할 기반 접근 제어 (RBAC)** 구현
3. ✅ **다단계 인증 (MFA)** 추가 (선택사항)
4. ✅ **소셜 프로필 연동** (프로필 이미지, 이름 자동 입력)

---

## 참고 자료

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Google OAuth 설정 가이드](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [GitHub OAuth 설정 가이드](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [RLS 정책 가이드](https://supabase.com/docs/guides/auth/row-level-security)

---

**작성자**: Claude Code (Anthropic)
**버전**: 1.0.0
**최종 수정일**: 2025-11-13
