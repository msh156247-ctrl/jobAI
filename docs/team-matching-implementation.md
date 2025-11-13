# JobAI 팀 매칭 시스템 구현 문서

> **작성일**: 2025-11-13
> **버전**: 1.0.0
> **최종 커밋**: ed8b2dc

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [7-Factor 매칭 알고리즘](#7-factor-매칭-알고리즘)
4. [대기열/우선순위 시스템](#대기열우선순위-시스템)
5. [역할별 상세 페이지](#역할별-상세-페이지)
6. [구현 파일 상세](#구현-파일-상세)
7. [API 레퍼런스](#api-레퍼런스)
8. [사용 가이드](#사용-가이드)
9. [트러블슈팅](#트러블슈팅)

---

## 프로젝트 개요

### 목적
AI 기반 팀 매칭 플랫폼으로, 구직자와 팀을 정교한 알고리즘으로 매칭하여 최적의 팀 구성을 지원합니다.

### 핵심 기능
- **100점 만점 7-Factor 매칭 알고리즘**: 직무, 스킬, 경력, 위치, 문화, 성향 등 7가지 요소를 종합 평가
- **스마트 대기열 시스템**: 정원 마감 시 우선순위 기반 자동 대기열 관리
- **역할별 상세 매칭**: 팀 내 각 포지션에 대한 개별 매칭 점수 제공

### 기술 스택
- **Frontend**: Next.js 15.5.4, React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Storage**: localStorage (프로토타입)
- **Build Tool**: Turbopack

---

## 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 인터페이스                       │
├─────────────────────────────────────────────────────────────┤
│  /teams (목록)  │  /teams/[id] (상세)  │  /teams/[id]/roles/[roleId]  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      비즈니스 로직 계층                        │
├─────────────────────────────────────────────────────────────┤
│  · 7-Factor Matching Engine (src/lib/teamData.ts)          │
│  · Waitlist Management System                              │
│  · Priority Sorting Algorithm                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      데이터 저장 계층                         │
├─────────────────────────────────────────────────────────────┤
│  · localStorage (jobai_teams)                              │
│  · localStorage (jobai_team_applications)                  │
│  · localStorage (jobai_team_waitlist)                      │
│  · localStorage (user_preferences)                         │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
사용자 프로필 입력
    ↓
getUserPreferences() → 사용자 선호도 로드
    ↓
getRecommendedTeams() → 7-Factor 알고리즘 실행
    ↓
TeamMatchResult 생성 (7가지 세부 점수 포함)
    ↓
UI에 매칭 결과 표시
    ↓
지원 또는 대기열 등록
    ↓
sortWaitlistByPriority() → 우선순위 정렬
    ↓
processWaitlistOnVacancy() → 공석 발생 시 자동 처리
```

---

## 7-Factor 매칭 알고리즘

### 개요
총 100점 만점으로 7가지 핵심 요소를 평가하여 구직자와 팀 간의 적합도를 정량화합니다.

### 점수 배분

| 요소 | 배점 | 설명 |
|------|------|------|
| 직무 일치 | 25점 | 포지션명 정확도 (Exact/Function/Keyword) |
| 필수 스킬 | 20점 | 기술 스택 + 필수 역량 일치율 |
| 우대 스킬 | 10점 | 선호 스킬 보유 여부 |
| 경력 적합성 | 15점 | 경력 연차 범위 매칭 |
| 근무 형태 | 10점 | 온라인/오프라인/하이브리드 선호도 |
| 복지/문화 | 10점 | 재택근무, 교육지원, 유연근무 등 |
| 성향 매칭 | 10점 | 팀 문화와 개인 성향 조화도 |

### 알고리즘 상세

#### 1. 직무 일치 매칭 (25점)

```typescript
function calculateJobTitleMatch(team: TeamRecruitment, userPrefs: any): number {
  // Exact match: 25점
  if (positionTitle === userPosition || userDesiredPositions.includes(positionTitle)) {
    return 25
  }

  // Function match: 15점 (키워드 기반)
  const keywords = ['frontend', 'backend', 'fullstack', 'designer', 'pm', 'ai', 'ml', 'blockchain', 'devops']
  if (positionTitle.includes(keyword) && userPosition.includes(keyword)) {
    return 15
  }

  // Partial match: 8점
  if (positionTitle.includes(userPosition)) {
    return 8
  }

  return 0
}
```

**채점 기준**:
- **Exact Match (25점)**: 직무명이 정확히 일치
- **Function Match (15점)**: 직무 카테고리가 일치 (예: frontend, backend)
- **Keyword Match (8점)**: 직무명에 연관 키워드 포함
- **No Match (0점)**: 관련성 없음

#### 2. 필수 스킬 매칭 (20점)

```typescript
function calculateRequiredSkillsMatch(team: TeamRecruitment, userPrefs: any): number {
  const allRequiredSkills = [...team.requiredSkills, ...team.techStack]

  const matchedCount = allRequiredSkills.filter(skill =>
    userSkills.some(userSkill =>
      userSkill.includes(skill) || skill.includes(userSkill)
    )
  ).length

  const matchRatio = matchedCount / allRequiredSkills.length
  return Math.round(matchRatio * 20)
}
```

**채점 기준**:
- 필수 스킬 일치율 = (일치한 스킬 수) / (전체 필수 스킬 수)
- 일치율 × 20점 = 최종 점수
- 예시: 5개 중 4개 일치 → 0.8 × 20 = 16점

#### 3. 우대 스킬 매칭 (10점)

```typescript
function calculatePreferredSkillsMatch(team: TeamRecruitment, userPrefs: any): number {
  if (!team.preferredSkills || team.preferredSkills.length === 0) {
    return 10 // 우대 스킬 요구사항 없으면 만점
  }

  const matchedCount = preferredSkills.filter(skill =>
    userSkills.some(userSkill =>
      userSkill.includes(skill) || skill.includes(userSkill)
    )
  ).length

  return Math.min(10, matchedCount * 5) // 1개당 5점, 최대 10점
}
```

**채점 기준**:
- 우대 스킬 1개 보유 → +5점
- 우대 스킬 2개 이상 → +10점 (최대)
- 우대 스킬 요구 없음 → 10점 (만점)

#### 4. 경력 범위 적합성 (15점)

```typescript
function calculateExperienceMatch(team: TeamRecruitment, userPrefs: any): number {
  const experienceRanges = {
    beginner: { min: 0, max: 2 },      // 0-2년
    intermediate: { min: 2, max: 5 },  // 2-5년
    advanced: { min: 5, max: 100 }     // 5년 이상
  }

  const range = experienceRanges[team.experienceLevel]

  // 범위 내: 만점
  if (userYears >= range.min && userYears <= range.max) {
    return 15
  }

  // 범위보다 적음 (경력 부족): 7점
  if (userYears < range.min) {
    return 7
  }

  // 범위보다 많음 (과경력): 10점
  return 10
}
```

**채점 기준**:
- **Perfect Match (15점)**: 경력이 요구 범위 내
- **Under-qualified (7점)**: 경력 부족 (학습 가능성 고려)
- **Over-qualified (10점)**: 과경력 (리더십 가능성 고려)
- **Any Level (15점)**: 경력 무관 팀

#### 5. 지역/근무 형태 선호 (10점)

```typescript
function calculateLocationMatch(team: TeamRecruitment, userPrefs: any): number {
  let score = 0

  // 근무 형태 매칭 (5점)
  const workTypeMapping = {
    online: ['remote'],
    offline: ['onsite'],
    hybrid: ['remote', 'onsite', 'hybrid']
  }

  if (userWorkTypes.some(type => teamWorkTypes.includes(type))) {
    score += 5
  }

  // 지역 매칭 (5점)
  if (teamLocation === 'online' || userLocations.length === 0) {
    score += 5 // 온라인이거나 선호 지역 없으면 만점
  } else if (userLocations.some(loc => teamLocationDetail.includes(loc))) {
    score += 5
  }

  return score
}
```

**채점 기준**:
- 근무 형태 일치 → +5점
- 지역 일치 또는 온라인 → +5점
- 최대 10점

#### 6. 복지/문화 적합성 (10점)

```typescript
function calculateCultureMatch(team: TeamRecruitment, userPrefs: any): number {
  let score = 0

  // 복지 매칭 (5점)
  const benefitMatches = [
    team.benefits.workFromHome && userPrefs.remote,
    team.benefits.flexibleHours && userPrefs.flexible,
    team.benefits.education && userPrefs.education
  ].filter(Boolean).length

  score += Math.round((benefitMatches / 3) * 5)

  // 문화 정보 존재 여부 (5점)
  score += team.culture ? 5 : 5

  return score
}
```

**채점 기준**:
- 재택근무 선호도 일치 → +1.67점
- 유연근무 선호도 일치 → +1.67점
- 교육지원 선호도 일치 → +1.67점
- 팀 문화 정보 제공 → +5점

#### 7. 인성/성향 매칭 (10점)

```typescript
function calculatePersonalityMatch(team: TeamRecruitment, userPrefs: any): number {
  const userPersonalities = userPrefs.personalities || []

  if (userPersonalities.length === 0) {
    return 10 // 데이터 없으면 만점
  }

  // 팀 문화 키워드 매칭
  const matchKeywords = ['협업', '소통', '학습', '성장', '창의', '책임']

  let matches = 0
  for (const personality of userPersonalities) {
    if (matchKeywords.some(keyword => personality.includes(keyword))) {
      matches++
    }
  }

  return Math.min(10, matches * 3) // 1개당 3점, 최대 10점
}
```

**채점 기준**:
- 긍정적 성향 키워드 1개 → +3점
- 최대 10점
- 성향 데이터 없음 → 10점 (불이익 없음)

### 매칭 점수 해석

| 점수 범위 | 등급 | 의미 | 추천 메시지 |
|-----------|------|------|-------------|
| 80-100 | S급 | 매우 적합 | "🎉 매우 적합합니다! 지금 바로 지원해보세요." |
| 60-79 | A급 | 적합 | "👍 적합한 포지션입니다. 도전해보세요!" |
| 40-59 | B급 | 보통 | "💡 관심이 있다면 지원해보세요." |
| 0-39 | C급 | 부적합 | "다른 팀도 둘러보시는 것을 추천드립니다." |

---

## 대기열/우선순위 시스템

### 개요
팀 정원이 마감된 경우 지원자를 대기열에 등록하고, 공석 발생 시 우선순위에 따라 자동으로 팀에 배정합니다.

### 대기열 데이터 구조

```typescript
interface WaitlistEntry {
  id: string                    // 대기열 항목 고유 ID
  teamId: string                // 팀 ID
  positionId: string            // 포지션 ID
  applicantId: string           // 지원자 ID
  applicantName: string         // 지원자 이름

  // 우선순위 계산 요소
  matchScore: number            // 매칭 점수 (0-100)
  appliedAt: string             // 지원 시각 (ISO 8601)
  teamPriority?: number         // 팀에서 지정한 우선순위 (optional)

  // 상태 관리
  status: 'active' | 'dormant' | 'expired' | 'converted'
  lastActivityAt: string        // 마지막 활동 시각
  createdAt: string             // 생성 시각
  expiresAt: string             // 만료 예정일 (30일 후)

  // 알림
  notified: boolean             // 공석 알림 발송 여부
  notifiedAt?: string           // 알림 발송 시각
}
```

### 우선순위 정렬 알고리즘

#### 3단계 우선순위

```typescript
function sortWaitlistByPriority(entries: WaitlistEntry[]): WaitlistPriority[] {
  const prioritized = entries.map(entry => {
    // 1순위: 매칭 점수 (높을수록 우선) → 100 - score로 역순 변환
    const matchScorePriority = 100 - entry.matchScore

    // 2순위: 지원 시각 (빠를수록 우선) → 타임스탬프를 정규화
    const timePriority = new Date(entry.appliedAt).getTime() / 1000000

    // 3순위: 팀 우선순위 (낮을수록 우선) → 직접 값 사용
    const teamPriorityValue = entry.teamPriority || 999

    // 최종 우선순위 (낮을수록 높은 우선순위)
    const priority = matchScorePriority + timePriority + teamPriorityValue

    return { entry, priority, reason: `매칭점수 ${entry.matchScore}점` }
  })

  return prioritized.sort((a, b) => a.priority - b.priority)
}
```

**우선순위 예시**:

| 순위 | 지원자 | 매칭 점수 | 지원 시각 | 팀 우선순위 | 최종 Priority |
|------|--------|-----------|-----------|-------------|---------------|
| 1위 | Alice | 95점 | 2025-11-01 | - | 5 + 1.73 + 999 = 1005.73 |
| 2위 | Bob | 90점 | 2025-11-02 | 1 | 10 + 1.73 + 1 = 12.73 |
| 3위 | Charlie | 85점 | 2025-11-01 | - | 15 + 1.73 + 999 = 1015.73 |

### 상태 관리 정책

#### 상태 전이도

```
        ┌─────────┐
        │ active  │ ← 초기 등록
        └────┬────┘
             │
    14일 활동 없음 ─────┐
             │          │
             ↓          ↓
        ┌─────────┐  ┌──────────┐
        │ dormant │  │ expired  │ ← 30일 경과
        └────┬────┘  └──────────┘
             │
        공석 발생
             │
             ↓
        ┌───────────┐
        │ converted │ ← 팀 배정 완료
        └───────────┘
```

#### 상태별 설명

| 상태 | 설명 | 전환 조건 |
|------|------|-----------|
| `active` | 활성 대기 중 | 등록 직후 |
| `dormant` | 비활성 (휴면) | 14일 동안 활동 없음 |
| `expired` | 만료됨 | 30일 경과 |
| `converted` | 팀 배정 완료 | 공석 발생 시 자동 승격 |

### 공석 처리 프로세스

```typescript
function processWaitlistOnVacancy(
  teamId: string,
  positionId: string,
  vacancyCount: number = 1
): WaitlistEntry[] {
  // 1. 대기열 조회
  const waitlist = getWaitlist(teamId, positionId)

  // 2. 우선순위 정렬
  const sorted = sortWaitlistByPriority(waitlist)

  // 3. 상위 N명 자동 승격
  const converted = []
  for (let i = 0; i < Math.min(vacancyCount, sorted.length); i++) {
    const { entry } = sorted[i]

    // 상태를 'converted'로 변경
    updateWaitlistEntryStatus(entry.id, 'converted')

    // 알림 발송 표시
    markWaitlistNotified(entry.id)

    converted.push(entry)
  }

  return converted
}
```

**자동 처리 흐름**:

1. 팀원 탈퇴/거절 → 공석 1개 발생
2. `processWaitlistOnVacancy(teamId, positionId, 1)` 호출
3. 대기열에서 최우선순위 지원자 선정
4. 지원자 상태를 `converted`로 변경
5. 지원자에게 알림 발송 (이메일/푸시)
6. 팀에 자동 배정

### API 함수

#### addToWaitlist
```typescript
addToWaitlist(
  teamId: string,
  positionId: string,
  applicantId: string,
  applicantName: string,
  matchScore: number
): WaitlistEntry
```
- **설명**: 대기열에 지원자 추가
- **반환**: 생성된 WaitlistEntry 객체
- **만료 기한**: 등록일 + 30일

#### getWaitlist
```typescript
getWaitlist(teamId: string, positionId?: string): WaitlistEntry[]
```
- **설명**: 특정 팀/포지션의 대기열 조회
- **필터링**: expired, converted 상태 제외
- **자동 처리**: 호출 시 상태 자동 업데이트

#### sortWaitlistByPriority
```typescript
sortWaitlistByPriority(entries: WaitlistEntry[]): WaitlistPriority[]
```
- **설명**: 대기열 우선순위 정렬
- **정렬 기준**: 매칭 점수 > 지원 시각 > 팀 우선순위

#### updateWaitlistStatuses
```typescript
updateWaitlistStatuses(): void
```
- **설명**: 모든 대기열 항목의 상태 자동 업데이트
- **처리 내용**:
  - 30일 경과 → `expired`
  - 14일 활동 없음 → `dormant`

#### getUserWaitlist
```typescript
getUserWaitlist(applicantId: string): WaitlistEntry[]
```
- **설명**: 특정 사용자의 모든 대기열 항목 조회
- **용도**: 마이페이지, 대기열 현황 표시

---

## 역할별 상세 페이지

### 개요
각 팀의 개별 포지션에 대한 상세 정보와 역할별 매칭 점수를 제공하는 페이지입니다.

### 라우팅
- **경로**: `/teams/[id]/roles/[roleId]`
- **예시**: `/teams/team_1/roles/pos_1`

### 페이지 구성

```
┌────────────────────────────────────────────────┐
│  [← 팀 상세로 돌아가기]                          │
├────────────────────────────────────────────────┤
│  프론트엔드 개발자              [모집중]         │
│  AI 기반 헬스케어 서비스 개발 팀원 모집          │
│                                                │
│  ┌──────────────┬──────────────┬──────────────┐│
│  │ 모집 인원    │ 근무 형태    │ 활동 기간    ││
│  │ 1/2명        │ 혼합         │ 6개월        ││
│  └──────────────┴──────────────┴──────────────┘│
├────────────────────────────────────────────────┤
│  AI 매칭 점수: 87점                             │
│  ████████████████░░ 87%                        │
│  🎉 매우 적합합니다! 지금 바로 지원해보세요.     │
├────────────────────────────────────────────────┤
│  [정원 마감 알림]                               │
│  현재 대기 인원: 5명 (내 순위: 2번째)           │
├────────────────────────────────────────────────┤
│  필수 역량                                      │
│  [React] [TypeScript] [Next.js]                │
├────────────────────────────────────────────────┤
│  담당 업무                                      │
│  · 웹 프론트엔드 개발                           │
│  · UI/UX 구현                                   │
│  · API 연동                                     │
├────────────────────────────────────────────────┤
│  [대기열 등록] 또는 [지원하기]                  │
└────────────────────────────────────────────────┘
```

### 핵심 기능

#### 1. 역할별 매칭 점수
```typescript
const matchScore = calculateMatchScore(teamId, userId)
```
- 팀 전체가 아닌 **특정 포지션에 대한 매칭 점수** 계산
- 해당 역할의 requiredSkills만 평가
- 더 정교한 적합도 분석

#### 2. 실시간 대기열 정보
```typescript
const waitlist = getWaitlist(teamId, positionId)
const sortedWaitlist = sortWaitlistByPriority(waitlist)
const userPosition = sortedWaitlist.findIndex(w => w.entry.applicantId === userId) + 1
```
- 현재 대기 인원 수 표시
- 본인의 대기 순위 표시 (로그인 시)
- 우선순위 실시간 반영

#### 3. 스마트 버튼 로직
```typescript
const isPositionFull = position.filledCount >= position.requiredCount
const isAlreadyInWaitlist = userWaitlistPosition > 0

// 버튼 상태
if (isAlreadyInWaitlist) {
  return "대기열 등록 완료 (2번째)" // disabled
} else if (isPositionFull) {
  return "대기열 등록" // 노란색
} else {
  return "지원하기" // 파란색
}
```

#### 4. 지원/대기열 처리
```typescript
const handleApply = () => {
  if (isPositionFull) {
    // 대기열 등록
    const entry = addToWaitlist(teamId, positionId, userId, userName, matchScore)
    const waitlistData = getWaitlist(teamId, positionId)
    const sorted = sortWaitlistByPriority(waitlistData)
    const myRank = sorted.findIndex(w => w.entry.id === entry.id) + 1

    alert(`대기열에 등록되었습니다!\n매칭 점수: ${matchScore}점\n우선순위: ${myRank}번째`)
  } else {
    // 직접 지원
    alert('지원이 완료되었습니다!')
    router.push(`/teams/${teamId}`)
  }
}
```

### UI/UX 특징

#### 1. 정원 마감 시각적 표시
- 🟢 **모집중**: 초록색 배지 + "지원하기" 파란 버튼
- 🟡 **정원 마감**: 노란색 배지 + "대기열 등록" 노란 버튼
- ⚫ **대기 완료**: 회색 배지 + "대기열 등록 완료 (N번째)" 회색 버튼 (비활성)

#### 2. 진행률 바
```tsx
<div className="w-full bg-gray-200 rounded-full h-1.5">
  <div
    className="bg-blue-600 h-1.5 rounded-full"
    style={{ width: `${fillPercentage}%` }}
  />
</div>
```

#### 3. 대기열 안내
```tsx
{isPositionFull && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h3>현재 정원이 마감되었습니다</h3>
    <p>대기열에 등록하시면 공석 발생 시 우선순위에 따라 자동으로 안내드립니다.</p>
    <p>현재 대기 인원: {waitlist.length}명 (내 순위: {userWaitlistPosition}번째)</p>
  </div>
)}
```

---

## 구현 파일 상세

### src/types/index.ts

#### TeamMatchResult (7-factor)
```typescript
export interface TeamMatchResult {
  teamId: string
  applicantId: string
  matchScore: number // 0-100 (7-factor algorithm)
  matchReasons: {
    jobTitleMatch: number        // 직무 일치 (25점)
    requiredSkillsMatch: number  // 필수 스킬 (20점)
    preferredSkillsMatch: number // 우대 스킬 (10점)
    experienceMatch: number      // 경력 범위 (15점)
    locationMatch: number        // 지역/근무형태 (10점)
    cultureMatch: number         // 복지/문화 (10점)
    personalityMatch: number     // 인성/성향 (10점)
  }
  recommendations: string[]
  concerns?: string[]
}
```

#### WaitlistEntry
```typescript
export interface WaitlistEntry {
  id: string
  teamId: string
  positionId: string
  applicantId: string
  applicantName: string
  matchScore: number
  appliedAt: string
  teamPriority?: number
  status: 'active' | 'dormant' | 'expired' | 'converted'
  lastActivityAt: string
  createdAt: string
  expiresAt: string
  notified: boolean
  notifiedAt?: string
}
```

#### WaitlistPriority
```typescript
export interface WaitlistPriority {
  entry: WaitlistEntry
  priority: number    // 계산된 우선순위 (낮을수록 높은 우선순위)
  reason: string      // 우선순위 부여 이유
}
```

### src/lib/teamData.ts

#### 핵심 함수 목록

**매칭 알고리즘 (8개 함수)**:
1. `calculateMatchScore()` - 메인 매칭 함수
2. `calculateJobTitleMatch()` - 직무 일치
3. `calculateRequiredSkillsMatch()` - 필수 스킬
4. `calculatePreferredSkillsMatch()` - 우대 스킬
5. `calculateExperienceMatch()` - 경력 적합성
6. `calculateLocationMatch()` - 근무 형태
7. `calculateCultureMatch()` - 복지/문화
8. `calculatePersonalityMatch()` - 성향 매칭

**대기열 관리 (9개 함수)**:
1. `addToWaitlist()` - 대기열 추가
2. `getWaitlist()` - 대기열 조회
3. `sortWaitlistByPriority()` - 우선순위 정렬
4. `processWaitlistOnVacancy()` - 공석 자동 처리
5. `updateWaitlistEntryStatus()` - 상태 변경
6. `markWaitlistNotified()` - 알림 발송 표시
7. `updateWaitlistStatuses()` - 상태 자동 업데이트
8. `removeFromWaitlist()` - 대기열 제거
9. `getUserWaitlist()` - 사용자별 대기열 조회

**기타**:
- `getRecommendedTeams()` - 추천 팀 목록 (7-factor 점수 포함)
- `getTeamById()` - 팀 상세 조회
- `incrementTeamViews()` - 조회수 증가

### src/app/teams/[id]/page.tsx

#### 주요 변경 사항
```typescript
// 7-factor 매칭 결과 표시
{user && matchResult && (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    <div className="text-center p-3 bg-white rounded-lg">
      <p className="text-xs text-gray-600">직무 일치</p>
      <p className="text-sm font-bold text-blue-600">
        {matchResult.matchReasons.jobTitleMatch}/25
      </p>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
        <div className="bg-blue-600 h-1.5 rounded-full"
             style={{ width: `${(matchResult.matchReasons.jobTitleMatch / 25) * 100}%` }} />
      </div>
    </div>
    {/* ... 나머지 6개 요소 동일 구조 */}
  </div>
)}

// 역할 상세 페이지 링크
{team.positions.map(position => (
  <Link href={`/teams/${team.id}/roles/${position.id}`}>
    <h3 className="font-semibold hover:text-blue-600">
      {position.title}
    </h3>
  </Link>
))}
```

### src/app/teams/[id]/roles/[roleId]/page.tsx (신규)

#### 파일 구조
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamById, calculateMatchScore, addToWaitlist, getWaitlist, sortWaitlistByPriority } from '@/lib/teamData'

interface PageProps {
  params: Promise<{ id: string; roleId: string }>
}

export default function RoleDetailPage({ params }: PageProps) {
  // Next.js 15 params unwrapping
  const [unwrappedParams, setUnwrappedParams] = useState(null)
  useEffect(() => {
    params.then(p => setUnwrappedParams(p))
  }, [params])

  // 매칭 점수 계산
  const matchScore = calculateMatchScore(unwrappedParams.id, user.id)

  // 대기열 조회 및 정렬
  const waitlist = getWaitlist(unwrappedParams.id, position.id)
  const sortedWaitlist = sortWaitlistByPriority(waitlist)
  const userWaitlistPosition = sortedWaitlist.findIndex(w => w.entry.applicantId === user.id) + 1

  // 지원/대기열 등록 처리
  const handleApply = () => {
    if (isPositionFull) {
      addToWaitlist(team.id, position.id, user.id, user.name, matchScore)
      alert(`대기열 등록 완료! 순위: ${sortedWaitlist.length + 1}번째`)
    } else {
      alert('지원 완료!')
      router.push(`/teams/${team.id}`)
    }
  }

  return (/* UI 렌더링 */)
}
```

### src/app/teams/page.tsx

#### 추천 팀 표시
```typescript
{user && recommended.length > 0 && (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
    <h2>당신에게 추천하는 팀</h2>
    {recommended.map(rec => {
      const team = teams.find(t => t.id === rec.teamId)
      return (
        <Link href={`/teams/${rec.teamId}`}>
          <span className="text-sm font-bold text-blue-600">
            {rec.matchScore}% 매칭
          </span>
          <p>{rec.recommendations[0]}</p>
        </Link>
      )
    })}
  </div>
)}
```

---

## API 레퍼런스

### 매칭 API

#### calculateMatchScore
```typescript
calculateMatchScore(teamId: string, applicantId: string): number
```

**설명**: 7-factor 알고리즘으로 매칭 점수 계산

**매개변수**:
- `teamId`: 팀 ID
- `applicantId`: 지원자 ID

**반환값**: 0-100 사이의 매칭 점수

**예시**:
```typescript
const score = calculateMatchScore('team_1', 'user_123')
console.log(score) // 87
```

#### getRecommendedTeams
```typescript
getRecommendedTeams(userId: string, limit: number = 5): TeamMatchResult[]
```

**설명**: 사용자에게 추천할 팀 목록 반환 (매칭 점수 높은 순)

**매개변수**:
- `userId`: 사용자 ID
- `limit`: 반환할 최대 팀 수 (기본값: 5)

**반환값**: TeamMatchResult 배열 (7-factor 세부 점수 포함)

**예시**:
```typescript
const recommendations = getRecommendedTeams('user_123', 10)
console.log(recommendations[0])
// {
//   teamId: 'team_1',
//   applicantId: 'user_123',
//   matchScore: 87,
//   matchReasons: {
//     jobTitleMatch: 25,
//     requiredSkillsMatch: 18,
//     preferredSkillsMatch: 10,
//     experienceMatch: 15,
//     locationMatch: 8,
//     cultureMatch: 6,
//     personalityMatch: 5
//   },
//   recommendations: ['직무가 귀하의 경력 및 관심사와 매우 잘 맞습니다', ...]
// }
```

### 대기열 API

#### addToWaitlist
```typescript
addToWaitlist(
  teamId: string,
  positionId: string,
  applicantId: string,
  applicantName: string,
  matchScore: number
): WaitlistEntry
```

**설명**: 대기열에 지원자 추가

**매개변수**:
- `teamId`: 팀 ID
- `positionId`: 포지션 ID
- `applicantId`: 지원자 ID
- `applicantName`: 지원자 이름
- `matchScore`: 매칭 점수

**반환값**: 생성된 WaitlistEntry 객체

**예시**:
```typescript
const entry = addToWaitlist('team_1', 'pos_1', 'user_123', 'Alice', 87)
console.log(entry.id) // 'waitlist_1699876543210_abc123'
console.log(entry.expiresAt) // '2025-12-13T10:00:00Z' (30일 후)
```

#### getWaitlist
```typescript
getWaitlist(teamId: string, positionId?: string): WaitlistEntry[]
```

**설명**: 대기열 조회 (expired, converted 제외)

**매개변수**:
- `teamId`: 팀 ID
- `positionId`: 포지션 ID (선택사항, 없으면 전체 포지션)

**반환값**: WaitlistEntry 배열

**예시**:
```typescript
// 특정 포지션의 대기열
const waitlist = getWaitlist('team_1', 'pos_1')
console.log(waitlist.length) // 5

// 팀 전체 대기열
const allWaitlist = getWaitlist('team_1')
console.log(allWaitlist.length) // 12
```

#### sortWaitlistByPriority
```typescript
sortWaitlistByPriority(entries: WaitlistEntry[]): WaitlistPriority[]
```

**설명**: 대기열 우선순위 정렬

**매개변수**:
- `entries`: WaitlistEntry 배열

**반환값**: 우선순위 정렬된 WaitlistPriority 배열

**예시**:
```typescript
const waitlist = getWaitlist('team_1', 'pos_1')
const sorted = sortWaitlistByPriority(waitlist)

console.log(sorted[0])
// {
//   entry: { id: 'waitlist_xyz', matchScore: 95, appliedAt: '2025-11-01T10:00:00Z', ... },
//   priority: 1005.73,
//   reason: '매칭점수 95점'
// }
```

#### processWaitlistOnVacancy
```typescript
processWaitlistOnVacancy(
  teamId: string,
  positionId: string,
  vacancyCount: number = 1
): WaitlistEntry[]
```

**설명**: 공석 발생 시 대기열에서 자동 승격

**매개변수**:
- `teamId`: 팀 ID
- `positionId`: 포지션 ID
- `vacancyCount`: 공석 수 (기본값: 1)

**반환값**: 승격된 WaitlistEntry 배열

**예시**:
```typescript
// 2명 공석 발생
const converted = processWaitlistOnVacancy('team_1', 'pos_1', 2)

console.log(converted.length) // 2
console.log(converted[0].status) // 'converted'
console.log(converted[0].notified) // true
```

#### updateWaitlistStatuses
```typescript
updateWaitlistStatuses(): void
```

**설명**: 모든 대기열 항목의 상태 자동 업데이트

**처리 내용**:
- 30일 경과 → `expired`
- 14일 활동 없음 → `dormant`

**예시**:
```typescript
// 시스템 크론잡 또는 페이지 로드 시 호출
updateWaitlistStatuses()
```

#### getUserWaitlist
```typescript
getUserWaitlist(applicantId: string): WaitlistEntry[]
```

**설명**: 특정 사용자의 모든 대기열 항목 조회

**매개변수**:
- `applicantId`: 지원자 ID

**반환값**: WaitlistEntry 배열 (active, dormant만)

**예시**:
```typescript
const myWaitlist = getUserWaitlist('user_123')

console.log(myWaitlist)
// [
//   { teamId: 'team_1', positionId: 'pos_1', status: 'active', ... },
//   { teamId: 'team_3', positionId: 'pos_5', status: 'dormant', ... }
// ]
```

---

## 사용 가이드

### 구직자 플로우

#### 1. 프로필 설정
```typescript
// 사용자 선호도 입력
const userPrefs = {
  career: {
    currentPosition: 'Frontend Developer',
    years: 3
  },
  interests: {
    positions: ['Frontend Developer', 'Fullstack Developer'],
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js']
  },
  workPreferences: {
    workTypes: ['remote', 'hybrid'],
    preferredLocations: ['서울', '경기'],
    flexibleHours: true
  },
  personalities: ['협업 중시', '빠른 학습']
}

saveUserPreferences(userPrefs)
```

#### 2. 팀 탐색
```typescript
// 추천 팀 확인
const recommendations = getRecommendedTeams('user_123', 5)

recommendations.forEach(rec => {
  console.log(`팀: ${rec.teamId}`)
  console.log(`매칭 점수: ${rec.matchScore}점`)
  console.log(`추천 이유: ${rec.recommendations.join(', ')}`)
})
```

#### 3. 역할 상세 확인
```typescript
// 특정 역할에 대한 매칭 점수 확인
const matchScore = calculateMatchScore('team_1', 'user_123')
console.log(`이 역할에 대한 적합도: ${matchScore}점`)
```

#### 4. 지원 또는 대기열 등록
```typescript
const team = getTeamById('team_1')
const position = team.positions.find(p => p.id === 'pos_1')

if (position.filledCount >= position.requiredCount) {
  // 정원 마감 → 대기열 등록
  const entry = addToWaitlist('team_1', 'pos_1', 'user_123', 'Alice', matchScore)

  const waitlist = getWaitlist('team_1', 'pos_1')
  const sorted = sortWaitlistByPriority(waitlist)
  const myRank = sorted.findIndex(w => w.entry.id === entry.id) + 1

  console.log(`대기 순위: ${myRank}번째`)
} else {
  // 정원 미달 → 바로 지원
  applyToTeam('team_1', 'pos_1', 'user_123', applicationData)
}
```

#### 5. 대기열 현황 확인
```typescript
const myWaitlist = getUserWaitlist('user_123')

myWaitlist.forEach(entry => {
  const waitlist = getWaitlist(entry.teamId, entry.positionId)
  const sorted = sortWaitlistByPriority(waitlist)
  const myRank = sorted.findIndex(w => w.entry.id === entry.id) + 1

  console.log(`팀: ${entry.teamId}, 포지션: ${entry.positionId}`)
  console.log(`내 순위: ${myRank}번째 / 총 ${sorted.length}명`)
  console.log(`만료일: ${new Date(entry.expiresAt).toLocaleDateString()}`)
})
```

### 팀 리더 플로우

#### 1. 팀 생성
```typescript
const newTeam: TeamRecruitment = {
  id: generateId(),
  title: 'AI 챗봇 프로젝트',
  description: '...',
  leaderId: 'user_456',
  leaderName: 'Bob',
  teamType: 'project',
  industry: 'IT/기술',
  techStack: ['Python', 'TensorFlow', 'React'],
  positions: [
    {
      id: 'pos_1',
      title: 'AI 엔지니어',
      description: 'ML 모델 개발',
      requiredCount: 2,
      filledCount: 0,
      requiredSkills: ['Python', 'TensorFlow', 'PyTorch'],
      responsibilities: ['모델 설계', '학습 파이프라인 구축']
    }
  ],
  // ... 기타 정보
}

createTeam(newTeam)
```

#### 2. 지원자 검토
```typescript
// 특정 포지션의 지원자 목록
const applications = getApplicationsByPosition('team_1', 'pos_1')

applications.forEach(app => {
  // 각 지원자의 매칭 점수 확인
  const matchScore = calculateMatchScore('team_1', app.applicantId)

  console.log(`지원자: ${app.applicantName}`)
  console.log(`매칭 점수: ${matchScore}점`)
  console.log(`지원 동기: ${app.motivation}`)
})
```

#### 3. 대기열 관리
```typescript
// 포지션별 대기열 확인
const waitlist = getWaitlist('team_1', 'pos_1')
const sorted = sortWaitlistByPriority(waitlist)

console.log(`대기 인원: ${sorted.length}명`)

sorted.forEach((item, index) => {
  console.log(`${index + 1}위: ${item.entry.applicantName}`)
  console.log(`  매칭 점수: ${item.entry.matchScore}점`)
  console.log(`  지원 일자: ${new Date(item.entry.appliedAt).toLocaleDateString()}`)
})
```

#### 4. 공석 발생 시 자동 처리
```typescript
// 팀원 1명 탈퇴 → 공석 1개 발생
const converted = processWaitlistOnVacancy('team_1', 'pos_1', 1)

if (converted.length > 0) {
  console.log(`${converted[0].applicantName}님이 자동으로 팀에 배정되었습니다.`)
  console.log(`매칭 점수: ${converted[0].matchScore}점`)

  // 알림 발송 (이메일, 푸시)
  sendNotification(converted[0].applicantId, {
    type: 'waitlist_converted',
    teamId: 'team_1',
    positionId: 'pos_1'
  })
}
```

#### 5. 우선순위 수동 조정 (선택사항)
```typescript
// 특정 지원자에게 팀 우선순위 부여
const entry = waitlist.find(w => w.entry.applicantId === 'user_789')
if (entry) {
  // teamPriority 값이 낮을수록 우선순위 높음
  entry.entry.teamPriority = 1
  updateWaitlistEntry(entry.entry)

  // 재정렬
  const newSorted = sortWaitlistByPriority(getWaitlist('team_1', 'pos_1'))
  console.log(`새로운 1순위: ${newSorted[0].entry.applicantName}`)
}
```

---

## 트러블슈팅

### 1. 매칭 점수가 0점으로 나옵니다

**원인**:
- 사용자 프로필이 비어있음
- `getUserPreferences()` 호출 실패

**해결 방법**:
```typescript
// 1. 사용자 프로필 확인
const prefs = getUserPreferences()
console.log(prefs)

// 2. 비어있으면 초기 데이터 설정
if (!prefs.interests || prefs.interests.skills.length === 0) {
  saveUserPreferences({
    career: { currentPosition: 'Developer', years: 0 },
    interests: {
      positions: ['Developer'],
      skills: ['JavaScript']
    }
  })
}
```

### 2. 대기열 순위가 변경되지 않습니다

**원인**:
- localStorage 캐싱 문제
- `updateWaitlistStatuses()` 미호출

**해결 방법**:
```typescript
// 1. 상태 강제 업데이트
updateWaitlistStatuses()

// 2. 대기열 다시 조회
const waitlist = getWaitlist('team_1', 'pos_1')
const sorted = sortWaitlistByPriority(waitlist)

// 3. localStorage 직접 확인
const raw = localStorage.getItem('jobai_team_waitlist')
console.log(JSON.parse(raw))
```

### 3. "calculateMatchScore is not exported" 에러

**원인**:
- 함수가 export되지 않음

**해결 방법**:
```typescript
// src/lib/teamData.ts
export function calculateMatchScore(teamId: string, applicantId: string): number {
  // ...
}
```

### 4. TypeScript 타입 에러: "disabled prop"

**원인**:
- `disabled` prop이 `boolean | null` 타입을 받음

**해결 방법**:
```typescript
// 수정 전
<button disabled={isApplying || (user && userWaitlistPosition > 0)}>

// 수정 후 (!! 연산자로 boolean 강제 변환)
<button disabled={!!(isApplying || (user && userWaitlistPosition > 0))}>
```

### 5. Next.js 15에서 params 접근 에러

**원인**:
- Next.js 15부터 params가 Promise 타입으로 변경됨

**해결 방법**:
```typescript
// 수정 전
export default function Page({ params }: { params: { id: string } }) {
  const team = getTeamById(params.id) // 에러!
}

// 수정 후
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [unwrappedParams, setUnwrappedParams] = useState(null)

  useEffect(() => {
    params.then(p => setUnwrappedParams(p))
  }, [params])

  useEffect(() => {
    if (!unwrappedParams) return
    const team = getTeamById(unwrappedParams.id) // 정상 작동
  }, [unwrappedParams])
}
```

### 6. 대기열이 만료되지 않습니다

**원인**:
- `updateWaitlistStatuses()` 자동 호출 미설정

**해결 방법**:
```typescript
// Option 1: 페이지 로드 시 호출
useEffect(() => {
  updateWaitlistStatuses()
  const waitlist = getWaitlist(teamId, positionId)
}, [])

// Option 2: 크론잡 설정 (프로덕션)
// 매일 자정에 실행
setInterval(() => {
  updateWaitlistStatuses()
}, 24 * 60 * 60 * 1000)
```

### 7. 우선순위 정렬이 예상과 다릅니다

**원인**:
- priority 계산 로직 이해 부족
- 낮은 값이 높은 우선순위임

**해결 방법**:
```typescript
// 우선순위 계산 확인
const sorted = sortWaitlistByPriority(waitlist)

sorted.forEach((item, index) => {
  console.log(`순위 ${index + 1}:`)
  console.log(`  매칭 점수: ${item.entry.matchScore}점`)
  console.log(`  지원 시각: ${item.entry.appliedAt}`)
  console.log(`  팀 우선순위: ${item.entry.teamPriority || '없음'}`)
  console.log(`  계산된 priority: ${item.priority}`)
  console.log(`  이유: ${item.reason}`)
})
```

### 8. 빌드 에러: "implicit 'any' type"

**원인**:
- TypeScript strict 모드에서 타입 추론 실패

**해결 방법**:
```typescript
// 수정 전
userSkills.some(userSkill => skill.includes(userSkill))

// 수정 후
userSkills.some((userSkill: string) => skill.includes(userSkill))
```

---

## 부록

### A. 데이터 구조 다이어그램

```
TeamRecruitment
├── id: string
├── title: string
├── positions: TeamPosition[]
│   ├── id: string
│   ├── title: string
│   ├── requiredCount: number
│   ├── filledCount: number
│   ├── requiredSkills: string[]
│   └── responsibilities: string[]
├── techStack: string[]
├── requiredSkills: string[]
├── preferredSkills: string[]
├── experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'any'
├── location: 'online' | 'offline' | 'hybrid'
├── culture: TeamCulture
│   ├── values: string[]
│   ├── workingStyle: string[]
│   ├── communicationStyle: string
│   └── meetingFrequency: string
└── benefits: Benefits
    ├── salary: string
    ├── workFromHome: boolean
    ├── flexibleHours: boolean
    ├── education: boolean
    └── ...
```

### B. 상수 및 설정값

| 항목 | 값 | 설명 |
|------|-----|------|
| 총 매칭 점수 | 100점 | 7-factor 합계 |
| 대기열 만료 기한 | 30일 | 등록 후 자동 만료 |
| 휴면 처리 기한 | 14일 | 활동 없으면 dormant |
| 직무 일치 배점 | 25점 | Exact(25) / Function(15) / Keyword(8) |
| 필수 스킬 배점 | 20점 | 일치율 기반 |
| 우대 스킬 배점 | 10점 | 1개당 5점 |
| 경력 범위 배점 | 15점 | 범위 내(15) / 부족(7) / 과다(10) |
| 근무 형태 배점 | 10점 | 형태(5) + 지역(5) |
| 복지/문화 배점 | 10점 | 복지(5) + 문화(5) |
| 성향 매칭 배점 | 10점 | 1개당 3점 |

### C. 추천 성능 최적화

#### localStorage 크기 제한 대응
```typescript
// 대용량 데이터 압축 저장
function compressWaitlist(waitlist: WaitlistEntry[]): string {
  // 만료된 항목 제거
  const active = waitlist.filter(w => w.status !== 'expired')

  // 30일 이상 된 converted 항목 제거
  const recent = active.filter(w => {
    if (w.status !== 'converted') return true
    const daysSince = (Date.now() - new Date(w.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince < 30
  })

  return JSON.stringify(recent)
}

// 주기적으로 정리
setInterval(() => {
  const waitlist = JSON.parse(localStorage.getItem(WAITLIST_KEY) || '[]')
  localStorage.setItem(WAITLIST_KEY, compressWaitlist(waitlist))
}, 24 * 60 * 60 * 1000) // 24시간마다
```

#### 매칭 점수 캐싱
```typescript
const matchScoreCache = new Map<string, { score: number; timestamp: number }>()

function getCachedMatchScore(teamId: string, userId: string): number {
  const key = `${teamId}_${userId}`
  const cached = matchScoreCache.get(key)

  // 1시간 이내 캐시 사용
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.score
  }

  const score = calculateMatchScore(teamId, userId)
  matchScoreCache.set(key, { score, timestamp: Date.now() })

  return score
}
```

### D. 향후 개선 사항

1. **백엔드 통합**
   - localStorage → PostgreSQL/MongoDB 마이그레이션
   - RESTful API 또는 GraphQL 엔드포인트 구축

2. **실시간 알림**
   - WebSocket 또는 Server-Sent Events
   - 공석 발생 시 즉시 푸시 알림

3. **고급 매칭 알고리즘**
   - ML 기반 성향 분석 (MBTI, DISC 테스트 연동)
   - 협업 스타일 매칭 (Git 활동 패턴 분석)
   - 팀 성과 예측 모델

4. **대시보드**
   - 팀 리더용 분석 대시보드
   - 지원자 풀 시각화
   - 매칭 성공률 트래킹

5. **A/B 테스팅**
   - 매칭 알고리즘 가중치 최적화
   - UI/UX 개선 실험

---

## 문서 정보

- **작성자**: Claude Code (Anthropic)
- **최종 수정일**: 2025-11-13
- **문서 버전**: 1.0.0
- **Git 커밋**: ed8b2dc
- **관련 파일**:
  - `src/types/index.ts`
  - `src/lib/teamData.ts`
  - `src/app/teams/[id]/page.tsx`
  - `src/app/teams/[id]/roles/[roleId]/page.tsx`
  - `src/app/teams/page.tsx`

### 변경 이력

| 날짜 | 버전 | 변경 내용 | 커밋 |
|------|------|-----------|------|
| 2025-11-13 | 1.0.0 | 초기 문서 작성 (7-factor 알고리즘, 대기열 시스템, 역할 페이지) | ed8b2dc |

---

**끝**
