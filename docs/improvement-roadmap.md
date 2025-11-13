# JobAI 팀 매칭 시스템 개선 로드맵

> **작성일**: 2025-11-13
> **버전**: 1.0.0
> **현재 상태**: MVP 완료
> **목표**: 프로덕션급 서비스로 확장

---

## 📋 목차

1. [현재 상태 요약](#현재-상태-요약)
2. [핵심 개선 영역](#핵심-개선-영역)
3. [상세 개선 계획](#상세-개선-계획)
4. [우선순위 및 단계별 로드맵](#우선순위-및-단계별-로드맵)
5. [기술 스택 전환 계획](#기술-스택-전환-계획)

---

## 현재 상태 요약

### ✅ 완료된 기능

#### 1. 7-Factor 매칭 알고리즘 (100점)
- 직무 일치 (25점)
- 필수 스킬 (20점)
- 우대 스킬 (10점)
- 경력 적합성 (15점)
- 근무 형태 (10점)
- 복지/문화 (10점)
- 성향 매칭 (10점)

#### 2. 대기열/우선순위 시스템
- 3단계 우선순위 정렬 (매칭 점수 > 지원 시각 > 팀 우선순위)
- 상태 관리 (active, dormant, expired, converted)
- 공석 자동 처리

#### 3. 역할별 상세 페이지
- 역할별 매칭 점수 계산
- 실시간 대기열 정보
- 스마트 지원/대기열 버튼

### 🔴 현재의 한계점

#### 기술적 한계
- **localStorage 기반**: 데이터 영속성, 동기화, 용량 문제
- **규칙 기반 알고리즘**: 정성적 요소, 컨텍스트 반영 부족
- **단순 문자열 매칭**: 스킬 레벨, 최근성, 도메인 지식 미반영

#### UX 한계
- **상대적 평가 부재**: 다른 지원자 대비 나의 위치
- **팀 컨텍스트 부족**: 현재 팀 구성, 프로젝트 상황
- **투명성 부족**: 매칭 점수 이유 설명 불충분

#### 프로세스 한계
- **지원 과정 단순화**: 포트폴리오, 평가 시스템 없음
- **팀 관리 기능 부재**: 지원자 검토, 우선순위 조정 UI 없음
- **피드백 루프 없음**: 합격/불합격 데이터로 알고리즘 개선 안됨

---

## 핵심 개선 영역

### 1. 알고리즘 고도화

#### 현재 문제점
```typescript
// 현재: 단순 규칙 기반
if (positionTitle === userPosition) {
  return 25  // Exact match
}
```

**문제**:
- 직무명 문자열 일치만 확인
- 역할의 실제 기능(Function) 파악 불가
- "프론트엔드 개발자" vs "Frontend Engineer" 구분 못함

#### 개선 방향

##### A. Vector Space 모델로 전환
```typescript
// 개선: 임베딩 기반 유사도
interface SkillEmbedding {
  skill: string
  vector: number[]        // 384-dim embedding
  level: 'beginner' | 'intermediate' | 'advanced'
  lastUsed: Date          // 최근성
  projectContext: string  // 사용 맥락
}

function calculateSkillSimilarity(
  userSkills: SkillEmbedding[],
  teamSkills: SkillEmbedding[]
): number {
  // Cosine similarity + Level weight + Recency weight
  return cosineSimilarity + levelBonus + recencyBonus
}
```

##### B. 직무 기능 카테고리 DB
```typescript
const jobFunctionTaxonomy = {
  'Frontend': {
    keywords: ['frontend', 'fe', 'react', 'vue', 'ui/ux'],
    relatedFunctions: ['UI Developer', 'Web Developer'],
    skills: ['React', 'TypeScript', 'CSS', 'Webpack']
  },
  'Backend': {
    keywords: ['backend', 'be', 'api', 'server'],
    relatedFunctions: ['API Developer', 'Server Engineer'],
    skills: ['Node.js', 'Python', 'Database', 'Redis']
  },
  // ... 기타 카테고리
}
```

##### C. 스킬 정밀도 추가
```typescript
interface DetailedSkill {
  name: string
  level: 1 | 2 | 3 | 4 | 5           // 1=입문 ~ 5=전문가
  yearsOfExperience: number
  lastUsed: Date                      // 최근 6개월 사용 시 가점
  proofOfWork?: {
    githubRepo?: string
    projectDescription?: string
    certificateUrl?: string
  }
}
```

##### D. 성향/문화 매칭 개선
```typescript
// 현재: 키워드 매칭
const matchKeywords = ['협업', '소통', '학습']
if (personality.includes(keyword)) { matches++ }

// 개선: 텍스트 임베딩 유사도
interface TeamCultureVector {
  values: number[]           // "빠른 실험과 학습" 임베딩
  workingStyle: number[]     // "Agile Sprint" 임베딩
  decisionStyle: number[]    // "Data-driven" 임베딩
}

function cultureSimilarity(
  userPersonality: string,
  teamCulture: TeamCultureVector
): number {
  const userVector = embed(userPersonality)
  return (
    cosineSimilarity(userVector, teamCulture.values) * 0.4 +
    cosineSimilarity(userVector, teamCulture.workingStyle) * 0.3 +
    cosineSimilarity(userVector, teamCulture.decisionStyle) * 0.3
  )
}
```

##### E. Feedback Learning (Multi-Armed Bandit)
```typescript
interface MatchingFeedback {
  teamId: string
  userId: string
  applied: boolean
  accepted: boolean
  performanceScore?: number  // 합류 후 평가
}

// Thompson Sampling으로 가중치 자동 조정
function updateWeights(feedback: MatchingFeedback[]) {
  // 성공 케이스가 많은 요소에 가중치 증가
  const successRate = {
    jobTitleMatch: calculateSuccessRate(feedback, 'jobTitle'),
    skillsMatch: calculateSuccessRate(feedback, 'skills'),
    // ...
  }

  // Bayesian 업데이트
  weights.jobTitle = betaDistribution(successRate.jobTitleMatch)
  weights.skills = betaDistribution(successRate.skillsMatch)
}
```

---

### 2. 대기열 시스템 개선

#### 현재 문제점

```typescript
// localStorage 기반 - 브라우저별 다름, 동기화 불가
localStorage.setItem('jobai_team_waitlist', JSON.stringify(waitlist))

// 우선순위 계산이 정적
const priority = matchScorePriority + timePriority + teamPriorityValue
```

**문제**:
- 데이터 충돌 위험
- 용량 제한 (5-10MB)
- 상태 변화 실시간 반영 불가
- 팀 전략(긴급 충원) 반영 안됨

#### 개선 방향

##### A. DB 스키마 설계 (Supabase 추천)

```sql
-- 대기열 테이블
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id),
  position_id UUID REFERENCES positions(id),
  applicant_id UUID REFERENCES users(id),
  applicant_name TEXT NOT NULL,

  -- 우선순위 계산 요소
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_priority INTEGER,                    -- 팀에서 지정
  position_urgency INTEGER DEFAULT 5,       -- 1=긴급, 10=여유

  -- 상태 관리
  status TEXT CHECK (status IN ('active', 'dormant', 'expired', 'converted')) DEFAULT 'active',
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),

  -- 알림
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP WITH TIME ZONE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 인덱스
  INDEX idx_waitlist_team_position (team_id, position_id),
  INDEX idx_waitlist_applicant (applicant_id),
  INDEX idx_waitlist_status (status)
);

-- 대기열 히스토리 (Analytics용)
CREATE TABLE waitlist_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waitlist_id UUID REFERENCES waitlist(id),
  action TEXT CHECK (action IN ('added', 'converted', 'expired', 'removed')),
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### B. 우선순위 고도화

```typescript
// 동적 우선순위 계산
interface PriorityFactors {
  matchScore: number           // 0-100
  appliedAt: Date
  teamPriority?: number        // 1-10 (1=최고)
  positionUrgency: number      // 1-10 (1=긴급)
  applicantEngagement: number  // 프로필 완성도, 활동성
  teamBudget: number           // 예산 여유
  marketDemand: number         // 해당 Role의 시장 수요
}

function calculateDynamicPriority(factors: PriorityFactors): number {
  const weights = {
    matchScore: 0.35,
    timeliness: 0.15,
    teamPriority: 0.20,
    positionUrgency: 0.15,
    engagement: 0.10,
    market: 0.05
  }

  return (
    (100 - factors.matchScore) * weights.matchScore +
    getTimelinessScore(factors.appliedAt) * weights.timeliness +
    (factors.teamPriority || 5) * weights.teamPriority +
    factors.positionUrgency * weights.positionUrgency +
    factors.applicantEngagement * weights.engagement +
    factors.marketDemand * weights.market
  )
}
```

##### C. 대기열 자동 관리 (Cron Job)

```typescript
// Supabase Edge Function
export async function updateWaitlistStatuses() {
  const now = new Date()

  // 1. 만료 처리 (30일 경과)
  await supabase
    .from('waitlist')
    .update({ status: 'expired' })
    .lt('expires_at', now)
    .eq('status', 'active')

  // 2. 휴면 처리 (14일 활동 없음)
  await supabase
    .from('waitlist')
    .update({ status: 'dormant' })
    .lt('last_activity_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000))
    .eq('status', 'active')

  // 3. Analytics 업데이트
  await updateWaitlistAnalytics()
}

// 매일 자정 실행
// cron: '0 0 * * *'
```

##### D. 팀 관리자용 대기열 UI

```
┌────────────────────────────────────────────────────────┐
│  대기열 관리 (프론트엔드 개발자)                        │
├────────────────────────────────────────────────────────┤
│  총 대기 인원: 12명  │  평균 대기 시간: 7일            │
│  우선순위 모드: [●자동] [ 수동]                        │
├────────────────────────────────────────────────────────┤
│  순위 │ 이름   │ 매칭 │ 대기일 │ 상태   │ 액션       │
│  ────┼────────┼──────┼────────┼────────┼────────────│
│  1   │ Alice  │ 95점 │ 3일    │ active │ [승인][거절]│
│  2   │ Bob    │ 90점 │ 5일    │ active │ [승인][거절]│
│  3   │ Charlie│ 87점 │ 2일    │ active │ [▲위로 이동]│
│  ...                                                   │
└────────────────────────────────────────────────────────┘

[우선순위 자동 정렬] [엑셀 다운로드] [일괄 알림]
```

##### E. 대기열 Analytics

```typescript
interface WaitlistAnalytics {
  teamId: string
  positionId: string

  // 핵심 지표
  averageWaitTime: number        // 평균 대기 시간 (일)
  conversionRate: number         // 대기열 → 합류 전환율
  expirationRate: number         // 만료율

  // 트렌드
  dailyAdditions: number[]       // 일별 추가 인원
  dailyConversions: number[]     // 일별 전환 인원

  // 분석
  topMatchScoreRange: [number, number]  // 합류 성공자의 점수 범위
  averageScoreByOutcome: {
    converted: number
    expired: number
    removed: number
  }
}
```

---

### 3. UI/UX 개선

#### A. 팀 상세 페이지 개선

##### 현재 팀 구성원 정보 추가

```typescript
interface TeamMemberProfile {
  role: string
  name?: string              // 공개 가능 시
  skills: string[]
  yearsOfExperience: number
  joinedAt: Date
}

// UI 표시
<div className="current-team-members">
  <h3>현재 팀 구성</h3>
  <div className="members-grid">
    <div className="member-card">
      <div className="role">프론트엔드 개발자</div>
      <div className="skills">React, TypeScript, Next.js</div>
      <div className="experience">경력 5년</div>
    </div>
    <div className="member-card vacant">
      <div className="role">프론트엔드 개발자</div>
      <div className="status">모집 중 (1/2)</div>
    </div>
  </div>
</div>
```

##### 프로젝트 컨텍스트 추가

```typescript
interface TeamProjectContext {
  currentMilestone: string   // "MVP 개발 중"
  nextGoal: string          // "베타 론칭 (2개월 후)"
  challenges: string[]      // ["성능 최적화 필요", "UI/UX 개선"]
  techDebt: string[]        // ["레거시 코드 리팩토링"]
}

// UI 표시
<div className="project-context">
  <h3>프로젝트 현황</h3>
  <div className="milestone">
    <span className="label">현재:</span>
    <span className="value">MVP 개발 중 (진행률 65%)</span>
  </div>
  <div className="next-goal">
    <span className="label">다음 목표:</span>
    <span className="value">베타 론칭 (2개월 후)</span>
  </div>
  <div className="challenges">
    <span className="label">도전 과제:</span>
    <ul>
      <li>성능 최적화 필요</li>
      <li>UI/UX 개선</li>
    </ul>
  </div>
</div>
```

#### B. Role 상세 페이지 개선

##### 상대적 평가 표시

```typescript
interface RelativePositioning {
  myScore: number
  percentile: number        // 상위 12%
  averageScore: number      // 평균 73점
  topScore: number          // 최고 95점
  applicantsCount: number   // 전체 지원자 수
}

// UI 표시
<div className="relative-positioning">
  <h3>경쟁력 분석</h3>
  <div className="score-distribution">
    <div className="my-position" style={{ left: '88%' }}>
      <div className="marker">▼</div>
      <div className="label">내 점수: 87점</div>
    </div>
    <div className="distribution-bar">
      <div className="percentile-25" />
      <div className="percentile-50" />
      <div className="percentile-75" />
    </div>
  </div>
  <div className="stats">
    <p>상위 <strong>12%</strong>에 위치</p>
    <p>평균 점수: 73점</p>
    <p>최고 점수: 95점</p>
    <p>전체 지원자: 23명</p>
  </div>
</div>
```

##### 필수 스킬 갭 분석

```typescript
interface SkillGapAnalysis {
  requiredSkills: {
    skill: string
    userHas: boolean
    userLevel?: number
    requiredLevel: number
  }[]
  strengths: string[]       // 강점
  gaps: string[]           // 부족한 부분
  recommendations: string[] // 추천 학습 자료
}

// UI 표시
<div className="skill-gap-analysis">
  <h3>스킬 갭 분석</h3>
  <div className="skills-checklist">
    {requiredSkills.map(skill => (
      <div className={`skill-item ${skill.userHas ? 'match' : 'gap'}`}>
        <div className="skill-name">{skill.skill}</div>
        <div className="status">
          {skill.userHas ? (
            <span className="match">✓ 보유 (Lv.{skill.userLevel})</span>
          ) : (
            <span className="gap">✗ 부족 (필요: Lv.{skill.requiredLevel})</span>
          )}
        </div>
      </div>
    ))}
  </div>

  <div className="recommendations">
    <h4>추천 학습 경로</h4>
    <ul>
      {recommendations.map(rec => (
        <li>{rec}</li>
      ))}
    </ul>
  </div>
</div>
```

##### Role 충원 사유 표시

```typescript
interface RecruitmentReason {
  type: 'new_feature' | 'scaling' | 'replacement' | 'refactoring'
  description: string
  urgency: 1 | 2 | 3 | 4 | 5  // 1=긴급, 5=여유
  expectedStartDate: Date
}

// UI 표시
<div className="recruitment-reason">
  <h3>이 포지션이 필요한 이유</h3>
  <div className="reason-card urgency-high">
    <div className="type">신규 기능 개발</div>
    <div className="description">
      AI 챗봇 MVP를 2개월 내 출시하기 위해
      React/TypeScript 전문가가 긴급히 필요합니다.
    </div>
    <div className="urgency">
      <span className="label">긴급도:</span>
      <span className="value">매우 높음</span>
    </div>
    <div className="start-date">
      <span className="label">예상 시작일:</span>
      <span className="value">2025-12-01</span>
    </div>
  </div>
</div>
```

#### C. 팀 탐색 페이지 개선

##### Team Matrix View

```
┌──────────────────────────────────────────────────────────┐
│  팀 현황 매트릭스                                         │
├──────────────────────────────────────────────────────────┤
│  팀 이름        │ FE  │ BE  │ PM  │ Designer │ 총원      │
│  ──────────────┼─────┼─────┼─────┼──────────┼───────────│
│  HealthAI      │🟢1/2│🟢2/3│🟢1/1│  🔴0/1   │ 4/7 (57%)│
│  NFT Marketplace│🟢1/2│🟢2/2│🔴0/1│  🟢1/1   │ 4/6 (67%)│
│  JUNCTION 2025 │🟢1/2│🔴0/2│🟢1/1│  🟢1/1   │ 3/6 (50%)│
└──────────────────────────────────────────────────────────┘

🟢 공석 있음  🔴 정원 마감  🟡 마감 임박
```

##### 고급 필터링

```typescript
interface AdvancedFilters {
  // 기존
  teamType: string
  industry: string
  experienceLevel: string

  // 추가
  teamSize: { min: number; max: number }
  urgency: 'urgent' | 'normal' | 'flexible'
  benefits: string[]          // ['재택근무', '스톡옵션', '교육지원']
  location: string[]
  schedule: 'fulltime' | 'parttime' | 'flexible'
  projectStage: 'idea' | 'mvp' | 'growth' | 'mature'
  funding: 'bootstrapped' | 'seed' | 'series_a' | 'series_b_plus'
}

// UI 표시
<div className="advanced-filters">
  <h3>상세 필터</h3>

  <div className="filter-section">
    <label>팀 규모</label>
    <div className="range-slider">
      <input type="range" min="1" max="50" />
      <span>1-10명</span>
    </div>
  </div>

  <div className="filter-section">
    <label>긴급도</label>
    <div className="button-group">
      <button className="active">긴급 충원</button>
      <button>일반</button>
      <button>여유 있음</button>
    </div>
  </div>

  <div className="filter-section">
    <label>복지</label>
    <div className="checkbox-group">
      <label><input type="checkbox" /> 재택근무</label>
      <label><input type="checkbox" /> 스톡옵션</label>
      <label><input type="checkbox" /> 교육 지원</label>
      <label><input type="checkbox" /> 유연 근무</label>
    </div>
  </div>
</div>
```

##### 팀 카드 개선

```typescript
interface EnhancedTeamCard {
  // 기존
  id: string
  title: string
  description: string

  // 추가
  heatmapScore: number        // 인기도 점수
  responseRate: number        // 지원 승인율
  averageWaitTime: number     // 평균 대기 시간
  cultureHighlights: string[] // 문화 태그
  recentActivity: Date        // 최근 활동
  teamVibe: string           // "빠르게 실행하는 팀", "꼼꼼한 검토" 등
}

// UI 표시
<div className="enhanced-team-card">
  <div className="header">
    <h3>{team.title}</h3>
    <div className="badges">
      {team.heatmapScore > 80 && <span className="badge hot">🔥 인기</span>}
      {team.responseRate > 70 && <span className="badge responsive">⚡ 빠른 응답</span>}
      <span className="badge views">👁 {team.views}</span>
    </div>
  </div>

  <div className="culture-tags">
    {team.cultureHighlights.map(tag => (
      <span className="culture-tag">{tag}</span>
    ))}
  </div>

  <div className="stats">
    <div className="stat">
      <span className="label">충원율</span>
      <div className="progress-bar">
        <div style={{ width: `${team.filledSlots / team.totalSlots * 100}%` }} />
      </div>
      <span className="value">{team.filledSlots}/{team.totalSlots}</span>
    </div>

    <div className="stat">
      <span className="label">평균 대기</span>
      <span className="value">{team.averageWaitTime}일</span>
    </div>

    <div className="stat">
      <span className="label">승인율</span>
      <span className="value">{team.responseRate}%</span>
    </div>
  </div>
</div>
```

---

### 4. 지원 프로세스 확장

#### 현재 문제점

```typescript
// 현재: 버튼 클릭만으로 지원 완료
const handleApply = () => {
  alert('지원이 완료되었습니다!')
  router.push(`/teams/${teamId}`)
}
```

**문제**:
- 지원자의 동기, 경험, 포트폴리오 파악 불가
- 팀 관리자가 지원자를 평가할 수 없음
- 지원 → 합류 과정이 블랙박스

#### 개선 방향

##### A. 지원서 템플릿

```typescript
interface ApplicationForm {
  // 기본 정보 (자동 입력)
  applicantId: string
  teamId: string
  positionId: string

  // 지원자 작성
  motivation: string              // 지원 동기 (200자)
  relevantExperience: string      // 관련 경험 (500자)
  availableTime: {
    startDate: Date
    hoursPerWeek: number
    timezone: string
  }

  // 포트폴리오
  portfolioLinks: {
    type: 'github' | 'website' | 'demo' | 'video'
    url: string
    description: string
  }[]

  // 추가 질문 (팀별 커스텀 가능)
  customQuestions: {
    question: string
    answer: string
  }[]

  // 자동 계산
  matchScore: number
  submittedAt: Date
}

// UI 표시
<div className="application-form">
  <h2>지원서 작성</h2>

  <div className="form-section">
    <label>지원 동기 (200자)</label>
    <textarea
      maxLength={200}
      placeholder="이 팀에 지원하게 된 이유를 간단히 작성해주세요"
    />
  </div>

  <div className="form-section">
    <label>관련 경험 (500자)</label>
    <textarea
      maxLength={500}
      placeholder="이 포지션과 관련된 경험을 구체적으로 작성해주세요"
    />
  </div>

  <div className="form-section">
    <label>가능한 시간</label>
    <div className="time-input">
      <input type="date" placeholder="시작 가능일" />
      <input type="number" placeholder="주당 시간" />
      <select>
        <option>한국 (GMT+9)</option>
        <option>미국 동부 (GMT-5)</option>
      </select>
    </div>
  </div>

  <div className="form-section">
    <label>포트폴리오</label>
    <div className="portfolio-links">
      <button onClick={addGithubLink}>+ GitHub</button>
      <button onClick={addWebsiteLink}>+ 웹사이트</button>
      <button onClick={addDemoLink}>+ 데모</button>
    </div>
  </div>

  <div className="form-actions">
    <button className="submit">지원서 제출</button>
    <button className="save-draft">임시 저장</button>
  </div>
</div>
```

##### B. 지원자 평가 시트

```typescript
interface ApplicantEvaluation {
  applicationId: string
  evaluatorId: string           // 팀 관리자 ID

  // 평가 항목
  technicalFit: {
    score: 1 | 2 | 3 | 4 | 5    // 1=매우 부족 ~ 5=매우 우수
    comment: string
  }
  cultureFit: {
    score: 1 | 2 | 3 | 4 | 5
    comment: string
  }
  portfolio: {
    score: 1 | 2 | 3 | 4 | 5
    comment: string
  }
  communication: {
    score: 1 | 2 | 3 | 4 | 5
    comment: string
  }

  // 종합 평가
  overallScore: number            // 평균 점수
  decision: 'accept' | 'reject' | 'interview' | 'pending'
  internalNotes: string           // 내부 메모

  evaluatedAt: Date
}

// UI 표시 (팀 관리자용)
<div className="applicant-evaluation">
  <div className="applicant-info">
    <h3>Alice</h3>
    <div className="match-score">매칭 점수: 87점</div>
    <div className="applied-date">지원일: 2025-11-10</div>
  </div>

  <div className="evaluation-form">
    <div className="eval-item">
      <label>기술 적합성</label>
      <div className="star-rating">
        <span className="star active">★</span>
        <span className="star active">★</span>
        <span className="star active">★</span>
        <span className="star active">★</span>
        <span className="star">★</span>
      </div>
      <textarea placeholder="평가 코멘트" />
    </div>

    <div className="eval-item">
      <label>문화 적합성</label>
      <div className="star-rating">...</div>
      <textarea placeholder="평가 코멘트" />
    </div>

    <div className="eval-item">
      <label>포트폴리오</label>
      <div className="star-rating">...</div>
      <textarea placeholder="평가 코멘트" />
    </div>
  </div>

  <div className="decision-buttons">
    <button className="accept">✓ 승인</button>
    <button className="interview">📞 인터뷰 요청</button>
    <button className="reject">✗ 거절</button>
    <button className="pending">⏸ 보류</button>
  </div>
</div>
```

##### C. 지원 프로세스 플로우

```
구직자 측:
1. 팀 탐색
2. Role 상세 확인 + 매칭 점수 확인
3. 지원서 작성
4. 제출
5. 상태 확인 (검토 중 / 인터뷰 요청 / 승인 / 거절)

팀 관리자 측:
1. 지원 알림 수신
2. 지원서 검토
3. 평가 시트 작성
4. 결정 (승인 / 인터뷰 / 거절)
5. 알림 발송

시스템:
- 지원 상태 추적 (지원 → 검토 → 인터뷰 → 승인 → 합류)
- 자동 알림 (지원 확인, 검토 완료, 결과 통보)
- Analytics (전환율, 평균 검토 시간 등)
```

##### D. 상태 추적 UI

```typescript
interface ApplicationStatus {
  status: 'submitted' | 'reviewing' | 'interview_scheduled' | 'accepted' | 'rejected'
  timeline: {
    event: string
    date: Date
    description: string
  }[]
}

// UI 표시 (지원자 마이페이지)
<div className="application-status">
  <h3>지원 현황: AI 기반 헬스케어 서비스 - 프론트엔드 개발자</h3>

  <div className="status-timeline">
    <div className="timeline-item completed">
      <div className="marker">✓</div>
      <div className="content">
        <div className="title">지원서 제출</div>
        <div className="date">2025-11-10 14:30</div>
      </div>
    </div>

    <div className="timeline-item completed">
      <div className="marker">✓</div>
      <div className="content">
        <div className="title">검토 시작</div>
        <div className="date">2025-11-11 09:00</div>
        <div className="description">팀 관리자가 지원서를 확인했습니다</div>
      </div>
    </div>

    <div className="timeline-item current">
      <div className="marker">●</div>
      <div className="content">
        <div className="title">평가 중</div>
        <div className="date">진행 중</div>
        <div className="description">기술 적합성 평가가 진행되고 있습니다</div>
      </div>
    </div>

    <div className="timeline-item pending">
      <div className="marker">○</div>
      <div className="content">
        <div className="title">최종 결정</div>
        <div className="date">예정</div>
      </div>
    </div>
  </div>
</div>
```

---

### 5. 데이터 구조 개선

#### 현재 문제점

```typescript
// localStorage 기반, 임시 스키마
const teams = JSON.parse(localStorage.getItem('jobai_teams') || '[]')
```

**문제**:
- 확장성 없음
- 관계 정의 불명확
- 트랜잭션 불가
- 동시성 제어 불가

#### 개선 방향 (Supabase PostgreSQL)

##### A. 핵심 스키마

```sql
-- 조직 (Organization)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large')),
  founded_year INTEGER,
  website TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 팀 (Team)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),

  team_type TEXT CHECK (team_type IN ('project', 'study', 'startup', 'contest', 'opensource')),
  industry TEXT,
  tech_stack TEXT[],

  location TEXT CHECK (location IN ('online', 'offline', 'hybrid')),
  location_detail TEXT,
  duration TEXT,
  schedule TEXT,

  total_slots INTEGER NOT NULL,
  filled_slots INTEGER DEFAULT 0,

  status TEXT CHECK (status IN ('recruiting', 'full', 'closed')) DEFAULT 'recruiting',

  views INTEGER DEFAULT 0,
  applicants_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE,

  INDEX idx_teams_org (organization_id),
  INDEX idx_teams_leader (leader_id),
  INDEX idx_teams_status (status)
);

-- 포지션 (Position/Role)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  required_count INTEGER NOT NULL,
  filled_count INTEGER DEFAULT 0,

  required_skills TEXT[],
  preferred_skills TEXT[],
  responsibilities TEXT[],

  urgency INTEGER CHECK (urgency BETWEEN 1 AND 5) DEFAULT 3,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_positions_team (team_id)
);

-- 사용자 (User)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('seeker', 'employer')) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 프로필 (User Profile)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  profile_image_url TEXT,
  introduction TEXT,
  location TEXT,

  -- 구직 정보
  industry TEXT,
  sub_industry TEXT,
  job_description TEXT,
  tools TEXT[],
  career_type TEXT CHECK (career_type IN ('newcomer', 'experienced')),
  career_years INTEGER DEFAULT 0,
  current_position TEXT,

  -- 스킬 (JSON으로 상세 정보 저장)
  skills JSONB,  -- { name, level, yearsOfExperience, lastUsed, proofOfWork }

  -- 선호도
  preferred_locations TEXT[],
  work_types TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,

  -- 성향
  personalities TEXT[],

  -- 우선순위
  priorities JSONB,

  -- 인증
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method TEXT CHECK (verification_method IN ('phone', 'email')),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지원 (Application)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id),
  position_id UUID REFERENCES positions(id),
  applicant_id UUID REFERENCES users(id),

  -- 지원 내용
  motivation TEXT,
  relevant_experience TEXT,
  available_time JSONB,  -- { startDate, hoursPerWeek, timezone }
  portfolio_links JSONB,  -- [{ type, url, description }]
  custom_answers JSONB,   -- [{ question, answer }]

  -- 매칭 점수
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_details JSONB,  -- 7-factor 세부 점수

  -- 상태
  status TEXT CHECK (status IN ('submitted', 'reviewing', 'interview_scheduled', 'accepted', 'rejected')) DEFAULT 'submitted',

  -- 평가 (팀 관리자가 작성)
  evaluation JSONB,  -- { technicalFit, cultureFit, portfolio, communication, overallScore, decision, internalNotes }
  evaluated_by UUID REFERENCES users(id),
  evaluated_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_applications_team (team_id),
  INDEX idx_applications_position (position_id),
  INDEX idx_applications_applicant (applicant_id),
  INDEX idx_applications_status (status)
);

-- 대기열 (Waitlist) - 이미 위에서 정의됨

-- 팀 문화 (Team Culture)
CREATE TABLE team_cultures (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,

  values TEXT[],
  working_style TEXT[],
  communication_style TEXT,
  meeting_frequency TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 팀 혜택 (Team Benefits)
CREATE TABLE team_benefits (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,

  salary TEXT,
  equity BOOLEAN DEFAULT FALSE,
  work_from_home BOOLEAN DEFAULT FALSE,
  flexible_hours BOOLEAN DEFAULT FALSE,
  meals BOOLEAN DEFAULT FALSE,
  education BOOLEAN DEFAULT FALSE,
  equipment BOOLEAN DEFAULT FALSE,
  vacation TEXT,
  other TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 팀 프로젝트 (Team Projects)
CREATE TABLE team_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  progress INTEGER CHECK (progress BETWEEN 0 AND 100) DEFAULT 0,
  status TEXT CHECK (status IN ('planning', 'in-progress', 'completed')) DEFAULT 'planning',

  start_date DATE,
  end_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_team_projects_team (team_id)
);

-- 매칭 점수 캐시 (Performance)
CREATE TABLE match_score_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),

  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_details JSONB,  -- 7-factor breakdown

  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),

  UNIQUE(team_id, user_id),
  INDEX idx_match_cache_expiry (expires_at)
);
```

##### B. 관계 다이어그램

```
organizations
    ↓ (1:N)
teams ←──────── team_cultures
  ↓             team_benefits
  ↓             team_projects
  ↓ (1:N)
positions
  ↓ (1:N)
applications ───→ users
  ↓                ↓
waitlist       user_profiles
```

##### C. 데이터 마이그레이션 계획

```typescript
// Step 1: localStorage → JSON 덤프
function exportLocalStorageToJSON() {
  const teams = JSON.parse(localStorage.getItem('jobai_teams') || '[]')
  const applications = JSON.parse(localStorage.getItem('jobai_team_applications') || '[]')
  const waitlist = JSON.parse(localStorage.getItem('jobai_team_waitlist') || '[]')

  return {
    teams,
    applications,
    waitlist,
    exportedAt: new Date().toISOString()
  }
}

// Step 2: JSON → Supabase 마이그레이션 스크립트
async function migrateToSupabase(jsonData: any) {
  const { teams, applications, waitlist } = jsonData

  // 1. Teams 마이그레이션
  for (const team of teams) {
    const { data: teamData } = await supabase
      .from('teams')
      .insert({
        id: team.id,
        name: team.title,
        description: team.description,
        leader_id: team.leaderId,
        team_type: team.teamType,
        industry: team.industry,
        tech_stack: team.techStack,
        // ... 기타 필드
      })
      .select()
      .single()

    // 2. Positions 마이그레이션
    for (const position of team.positions) {
      await supabase
        .from('positions')
        .insert({
          id: position.id,
          team_id: teamData.id,
          title: position.title,
          description: position.description,
          required_count: position.requiredCount,
          filled_count: position.filledCount,
          required_skills: position.requiredSkills,
          responsibilities: position.responsibilities
        })
    }

    // 3. Team Culture 마이그레이션
    if (team.culture) {
      await supabase
        .from('team_cultures')
        .insert({
          team_id: teamData.id,
          values: team.culture.values,
          working_style: team.culture.workingStyle,
          communication_style: team.culture.communicationStyle,
          meeting_frequency: team.culture.meetingFrequency
        })
    }

    // 4. Team Benefits 마이그레이션
    if (team.benefits) {
      await supabase
        .from('team_benefits')
        .insert({
          team_id: teamData.id,
          ...team.benefits
        })
    }
  }

  // 5. Applications 마이그레이션
  for (const app of applications) {
    await supabase
      .from('applications')
      .insert({
        id: app.id,
        team_id: app.teamId,
        position_id: app.positionId,
        applicant_id: app.applicantId,
        // ... 기타 필드
      })
  }

  // 6. Waitlist 마이그레이션
  for (const entry of waitlist) {
    await supabase
      .from('waitlist')
      .insert({
        id: entry.id,
        team_id: entry.teamId,
        position_id: entry.positionId,
        applicant_id: entry.applicantId,
        // ... 기타 필드
      })
  }
}

// Step 3: 점진적 마이그레이션 (Dual Write)
// 일정 기간 동안 localStorage와 Supabase 모두에 쓰기
// 읽기는 Supabase에서만
```

---

### 6. 매칭 투명성 개선

#### A. 매칭 리포트 생성

```typescript
interface MatchingReport {
  teamId: string
  userId: string
  overallScore: number

  // 세부 분석
  strengths: {
    factor: string
    score: number
    reason: string
  }[]

  gaps: {
    factor: string
    score: number
    reason: string
    recommendation: string
  }[]

  // 스킬 분석
  skillAnalysis: {
    matchedSkills: string[]
    missingSkills: string[]
    bonusSkills: string[]
    levelGaps: {
      skill: string
      yourLevel: number
      requiredLevel: number
    }[]
  }

  // 경력 분석
  experienceAnalysis: {
    yourYears: number
    requiredRange: [number, number]
    fit: 'perfect' | 'underqualified' | 'overqualified'
    suggestion: string
  }

  // 문화 분석
  cultureAnalysis: {
    matchingValues: string[]
    potentialConcerns: string[]
    teamVibe: string
    yourVibe: string
  }

  // 개선 제안
  improvementPlan: {
    priority: 'high' | 'medium' | 'low'
    area: string
    action: string
    estimatedTime: string
    resources: string[]
  }[]
}

// UI 표시
<div className="matching-report">
  <h2>매칭 분석 리포트</h2>

  <div className="overall-score">
    <div className="score-circle">
      <div className="score-value">87</div>
      <div className="score-label">점</div>
    </div>
    <div className="grade">S급 (상위 12%)</div>
  </div>

  <div className="strengths">
    <h3>강점 (3개)</h3>
    <div className="strength-item">
      <div className="factor">직무 일치</div>
      <div className="score">25/25</div>
      <div className="reason">
        Frontend Developer 포지션과 귀하의 경력이 완벽하게 일치합니다
      </div>
    </div>
    {/* ... */}
  </div>

  <div className="gaps">
    <h3>개선 가능 영역 (2개)</h3>
    <div className="gap-item">
      <div className="factor">우대 스킬</div>
      <div className="score">5/10</div>
      <div className="reason">
        헬스케어 도메인 지식이 부족합니다
      </div>
      <div className="recommendation">
        추천: "의료 데이터 분석 입문" 강의 수강 (2주)
      </div>
    </div>
    {/* ... */}
  </div>

  <div className="skill-analysis">
    <h3>스킬 갭 분석</h3>
    <div className="matched-skills">
      <h4>✓ 보유 스킬 (5개)</h4>
      <ul>
        <li>React (Lv.4 / 필요 Lv.3) ✓</li>
        <li>TypeScript (Lv.3 / 필요 Lv.3) ✓</li>
        <li>Next.js (Lv.3 / 필요 Lv.2) ✓</li>
      </ul>
    </div>

    <div className="missing-skills">
      <h4>✗ 부족한 스킬 (2개)</h4>
      <ul>
        <li>
          <span className="skill-name">TensorFlow</span>
          <span className="gap">필요 Lv.2, 현재 Lv.0</span>
          <span className="estimate">예상 학습 시간: 4주</span>
        </li>
      </ul>
    </div>
  </div>

  <div className="improvement-plan">
    <h3>레벨업 플랜</h3>
    <div className="plan-item priority-high">
      <div className="priority">🔴 높음</div>
      <div className="area">헬스케어 도메인 지식</div>
      <div className="action">
        의료 데이터 분석 온라인 강의 수강
      </div>
      <div className="time">예상 시간: 2주</div>
      <div className="resources">
        <a href="#">추천 강의 보기</a>
      </div>
    </div>
  </div>
</div>
```

#### B. 실시간 피드백

```typescript
// 지원서 작성 중 실시간 점수 업데이트
function calculateLiveMatchScore(formData: Partial<ApplicationForm>) {
  // 사용자가 포트폴리오 링크를 추가할 때마다 점수 재계산
  const updatedScore = calculateMatchScore(teamId, userId, formData)

  return {
    score: updatedScore,
    changes: [
      { factor: 'portfolio', before: 0, after: 5, reason: 'GitHub 링크 추가' }
    ]
  }
}

// UI 표시
<div className="live-score-feedback">
  <div className="score-indicator">
    현재 매칭 점수: <span className="score">87점</span>
    <span className="change">+5점 ↑</span>
  </div>

  <div className="recent-changes">
    <div className="change-item">
      <span className="icon">✓</span>
      <span className="message">GitHub 포트폴리오 추가로 +5점</span>
    </div>
  </div>

  <div className="suggestions">
    <h4>점수를 더 올리려면?</h4>
    <ul>
      <li>관련 프로젝트 경험 추가 시 +3점 예상</li>
      <li>헬스케어 관련 경험 작성 시 +2점 예상</li>
    </ul>
  </div>
</div>
```

---

## 우선순위 및 단계별 로드맵

### Phase 1: 기반 안정화 (1-2개월)

**목표**: MVP를 프로덕션 환경에서 안정적으로 운영

#### 1.1 데이터베이스 마이그레이션
- [ ] Supabase 프로젝트 설정
- [ ] 스키마 구현 (teams, positions, users, applications, waitlist)
- [ ] localStorage → DB 마이그레이션 스크립트
- [ ] API 레이어 구현 (tRPC 또는 REST)

#### 1.2 인증 시스템
- [ ] Supabase Auth 통합
- [ ] 소셜 로그인 (Google, GitHub)
- [ ] 이메일 인증
- [ ] 권한 관리 (구직자 / 팀 관리자)

#### 1.3 기본 UI/UX 개선
- [ ] 팀 카드 개선 (조회수, 인기도, 응답률)
- [ ] Role 상세 페이지 개선 (팀 구성, 긴급도)
- [ ] 필터링 기능 강화

#### 1.4 모니터링 & Analytics
- [ ] Vercel Analytics 또는 Mixpanel 연동
- [ ] 에러 추적 (Sentry)
- [ ] 성능 모니터링

**성과 지표**:
- DB 마이그레이션 완료
- 페이지 로딩 속도 < 2초
- 에러율 < 1%

---

### Phase 2: 알고리즘 고도화 (2-3개월)

**목표**: 매칭 정확도 향상 및 사용자 경험 개선

#### 2.1 Vector-based 매칭 시스템
- [ ] OpenAI Embeddings API 통합
- [ ] 스킬 임베딩 생성
- [ ] 직무 설명 임베딩 생성
- [ ] Cosine Similarity 기반 매칭

#### 2.2 스킬 정밀도 추가
- [ ] 스킬 레벨 입력 (1-5)
- [ ] 최근 사용 여부
- [ ] 증빙 자료 (GitHub, 프로젝트)

#### 2.3 직무 기능 카테고리 DB
- [ ] 직무 분류 체계 구축
- [ ] 키워드 매핑
- [ ] 관련 기능 정의

#### 2.4 매칭 리포트
- [ ] 세부 분석 리포트 생성
- [ ] 강점/약점 분석
- [ ] 레벨업 플랜 제공

**성과 지표**:
- 매칭 정확도 > 85%
- 사용자 만족도 > 4.0/5.0
- 지원 전환율 > 15%

---

### Phase 3: 프로세스 확장 (3-4개월)

**목표**: 지원 프로세스 고도화 및 팀 관리 기능 강화

#### 3.1 지원서 시스템
- [ ] 지원서 템플릿 구현
- [ ] 포트폴리오 업로드
- [ ] 커스텀 질문

#### 3.2 평가 시스템
- [ ] 지원자 평가 시트
- [ ] 평가 점수 집계
- [ ] 내부 메모

#### 3.3 팀 관리 대시보드
- [ ] 지원자 목록 관리
- [ ] 대기열 우선순위 조정 UI
- [ ] Analytics 대시보드

#### 3.4 알림 시스템
- [ ] 이메일 알림 (지원 확인, 결과 통보)
- [ ] 푸시 알림 (공석 발생)
- [ ] 슬랙 연동 (팀 관리자용)

**성과 지표**:
- 평균 검토 시간 < 3일
- 팀 관리자 만족도 > 4.2/5.0
- 승인율 > 25%

---

### Phase 4: AI 고도화 (4-6개월)

**목표**: AI 기반 추천 및 피드백 루프 구축

#### 4.1 Feedback Learning
- [ ] Multi-Armed Bandit 알고리즘 구현
- [ ] 성공 케이스 학습
- [ ] 가중치 자동 조정

#### 4.2 성향 분석
- [ ] MBTI/DISC 연동 (선택사항)
- [ ] Git 활동 패턴 분석
- [ ] 커뮤니케이션 스타일 분석

#### 4.3 팀 성과 예측
- [ ] 팀 구성 최적화 제안
- [ ] 프로젝트 성공 확률 예측
- [ ] 이탈 위험 감지

#### 4.4 자동화
- [ ] 자동 매칭 제안
- [ ] 스마트 대기열 관리
- [ ] 자동 알림 최적화

**성과 지표**:
- AI 추천 수락률 > 40%
- 팀 성공률 > 70%
- 이탈률 < 10%

---

## 기술 스택 전환 계획

### 현재 스택

```
Frontend: Next.js 15.5.4 + React 19 + TypeScript
Styling: Tailwind CSS
State: React Context API
Storage: localStorage
Build: Turbopack
```

### 목표 스택 (프로덕션)

```
Frontend: Next.js 15+ + React 19 + TypeScript
Styling: Tailwind CSS + shadcn/ui
State: Zustand (or Jotai)
Backend: Supabase (PostgreSQL + Edge Functions)
API: tRPC (type-safe API)
Auth: Supabase Auth
Storage: Supabase Storage (파일 업로드)
AI: OpenAI API (Embeddings + GPT-4)
Analytics: Mixpanel + Vercel Analytics
Monitoring: Sentry
Email: Resend
Deployment: Vercel
```

### 마이그레이션 체크리스트

#### Frontend
- [ ] shadcn/ui 컴포넌트 라이브러리 도입
- [ ] Zustand로 전역 상태 관리 전환
- [ ] React Query로 서버 상태 관리

#### Backend
- [ ] Supabase 프로젝트 생성
- [ ] PostgreSQL 스키마 구현
- [ ] Row Level Security (RLS) 정책 설정
- [ ] Edge Functions 구현

#### API
- [ ] tRPC 라우터 구현
- [ ] Type-safe API 엔드포인트
- [ ] API 문서 자동 생성

#### AI
- [ ] OpenAI API 키 발급
- [ ] Embeddings 생성 파이프라인
- [ ] Rate limiting 설정

#### DevOps
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] Staging 환경 구축
- [ ] 모니터링 대시보드

---

## 다음 단계

### 옵션 1: MVP → 프로덕션 로드맵 (추천)
전체 개선 계획을 타임라인과 함께 상세화

### 옵션 2: DB 스키마 상세 설계
Supabase PostgreSQL 스키마 완전판 + 마이그레이션 스크립트

### 옵션 3: API 구조 설계
tRPC 기반 type-safe API 아키텍처

### 옵션 4: UI 와이어프레임
개선된 UI/UX 와이어프레임 (텍스트 기반)

### 옵션 5: Phase 1 구현 시작
기반 안정화 단계 즉시 시작

---

## 문서 정보

- **작성자**: Claude Code (Anthropic)
- **작성일**: 2025-11-13
- **문서 버전**: 1.0.0
- **관련 문서**: [team-matching-implementation.md](./team-matching-implementation.md)

---

**끝**
