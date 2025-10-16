# 네이버 OAuth 설정 가이드

## 1. 네이버 개발자센터에서 애플리케이션 등록

### 단계 1: 네이버 개발자센터 접속
1. https://developers.naver.com/apps/#/register 접속
2. 네이버 아이디로 로그인

### 단계 2: 애플리케이션 등록
1. **애플리케이션 이름**: JobAI
2. **사용 API**:
   - ✅ 네이버 로그인
3. **제공 정보 선택**:
   - ✅ 회원이름
   - ✅ 이메일 주소
   - ✅ 프로필 사진

### 단계 3: 서비스 환경 등록
**PC 웹**:
- 서비스 URL: `http://localhost:3000` (개발)
- 서비스 URL: `https://your-domain.vercel.app` (프로덕션)

**Callback URL** (중요!):
```
http://localhost:3000/api/auth/naver/callback
https://your-domain.vercel.app/api/auth/naver/callback
```

### 단계 4: 등록 완료 후 정보 확인
등록 완료 후 다음 정보를 받게 됩니다:
- **Client ID**: `예) abc123def456`
- **Client Secret**: `예) XyZ789Abc`

---

## 2. 환경 변수 설정

### 로컬 개발 환경 (`.env.local`)
```bash
# 네이버 OAuth
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Vercel 배포 환경
Vercel Dashboard → Settings → Environment Variables에 추가:
```
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (Supabase Dashboard에서 확인)
```

---

## 3. 작동 방식

### 로그인 흐름
1. 사용자가 "네이버 로그인" 버튼 클릭
2. `/api/auth/naver/login` → 네이버 OAuth 페이지로 리다이렉트
3. 사용자가 네이버에서 로그인 및 동의
4. `/api/auth/naver/callback` → 인증 코드 수신
5. Access Token 요청 및 사용자 정보 조회
6. Supabase에 사용자 생성 또는 로그인 처리
7. 메인 페이지로 리다이렉트

### API 엔드포인트
- **로그인 시작**: `GET /api/auth/naver/login`
- **콜백 처리**: `GET /api/auth/naver/callback`

---

## 4. 테스트 방법

### 로컬 테스트
1. `.env.local`에 네이버 Client ID/Secret 설정
2. `npm run dev` 실행
3. http://localhost:3000/login 접속
4. "네이버" 버튼 클릭
5. 네이버 로그인 후 메인 페이지로 리다이렉트 확인

### 프로덕션 테스트
1. Vercel 환경 변수 설정
2. Vercel 재배포
3. 배포된 URL에서 네이버 로그인 테스트

---

## 5. 트러블슈팅

### 에러: "redirect_uri mismatch"
- 네이버 개발자센터에서 Callback URL이 정확히 등록되었는지 확인
- `http://` vs `https://` 확인
- 포트 번호 확인 (로컬은 :3000)

### 에러: "invalid_client"
- Client ID/Secret이 정확한지 확인
- `.env.local` 파일이 저장되었는지 확인
- 서버 재시작 (`npm run dev` 종료 후 재실행)

### 에러: "state_mismatch"
- 브라우저 쿠키가 활성화되어 있는지 확인
- 개인정보 보호 모드에서는 작동하지 않을 수 있음

---

## 6. 보안 주의사항

⚠️ **절대 Git에 커밋하지 마세요**:
- `.env.local` 파일
- Client Secret 정보

✅ **올바른 방법**:
- `.env.local`은 `.gitignore`에 포함됨
- Vercel 환경 변수로 안전하게 관리
- Client Secret은 서버 사이드에서만 사용

---

## 7. 참고 자료

- [네이버 로그인 API 가이드](https://developers.naver.com/docs/login/api/api.md)
- [네이버 개발자센터](https://developers.naver.com)
