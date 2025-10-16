-- ============================================================================
-- JobAI 2.0 - 완전 데이터베이스 설정 스크립트
-- ============================================================================
--
-- 작성일: 2025-10-15
-- 버전: 2.0
-- 설명: Supabase SQL Editor에서 순차적으로 실행하세요
--
-- 실행 순서:
-- 1. 기본 스키마 (profiles, jobs, applications 등)
-- 2. 추가 테이블 (saved_jobs, interview_slots)
-- 3. pgvector 확장 (job_embeddings, user_profile_embeddings)
-- 4. Bandit 정책 (bandit_policies, user_behavior_logs)
--
-- ⚠️ 주의: 전체 스크립트를 한번에 실행하지 말고, 섹션별로 나눠서 실행하세요!
-- ============================================================================

-- ============================================================================
-- SECTION 1: 기본 스키마 (JobAI 1.0)
-- ============================================================================

-- 1. 프로필 테이블 (기본 사용자 정보)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('user', 'company')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 구직자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
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
CREATE TABLE IF NOT EXISTS company_profiles (
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
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  skills_required TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')) DEFAULT 'full-time',
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'any')) DEFAULT 'any',
  status TEXT CHECK (status IN ('active', 'closed', 'draft')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 지원 테이블
CREATE TABLE IF NOT EXISTS applications (
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
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- 7. 채팅룸 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE TABLE IF NOT EXISTS events (
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
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')) DEFAULT 'registered',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 12. 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
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
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_events_company_id ON events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

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

-- ============================================================================
-- SECTION 2: 추가 테이블 (북마크, 면접 슬롯)
-- ============================================================================

-- 저장된 채용공고 (북마크)
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- 면접 슬롯
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
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs;
CREATE POLICY "Users can view their own saved jobs"
  ON saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved jobs" ON saved_jobs;
CREATE POLICY "Users can insert their own saved jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON saved_jobs;
CREATE POLICY "Users can delete their own saved jobs"
  ON saved_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- interview_slots 정책
DROP POLICY IF EXISTS "Anyone can view interview slots" ON interview_slots;
CREATE POLICY "Anyone can view interview slots"
  ON interview_slots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can book interview slots" ON interview_slots;
CREATE POLICY "Authenticated users can book interview slots"
  ON interview_slots FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = booked_by);

-- 코멘트
COMMENT ON TABLE saved_jobs IS '사용자가 저장한 채용공고 (북마크)';
COMMENT ON TABLE interview_slots IS '면접 일정 슬롯';

-- ============================================================================
-- SECTION 3: pgvector 확장 (JobAI 2.0 - Vector Embeddings)
-- ============================================================================
-- ⚠️ 주의: Database → Extensions에서 'vector' 확장을 먼저 활성화하세요!
-- ============================================================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 공고 벡터 임베딩 테이블
CREATE TABLE IF NOT EXISTS job_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small 차원
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id)
);

-- 3. 사용자 프로필 벡터 임베딩 테이블
CREATE TABLE IF NOT EXISTS user_profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. 벡터 유사도 검색을 위한 인덱스 생성
-- IVFFlat 인덱스: 대규모 데이터셋에서 빠른 근사 검색
CREATE INDEX IF NOT EXISTS job_embeddings_idx
ON job_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS user_profile_embeddings_idx
ON user_profile_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. 공고 ID로 빠르게 조회하기 위한 인덱스
CREATE INDEX IF NOT EXISTS job_embeddings_job_id_idx ON job_embeddings(job_id);
CREATE INDEX IF NOT EXISTS user_profile_embeddings_user_id_idx ON user_profile_embeddings(user_id);

-- 6. 유사한 공고 검색 함수 (사용자 기반)
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

-- 7. 특정 공고와 유사한 공고 검색 함수 (공고 기반)
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

-- 8. 후보자 검색 함수 (기업용 - 공고에 맞는 후보자 찾기)
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

-- 9. 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_job_embeddings_updated_at
BEFORE UPDATE ON job_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profile_embeddings_updated_at
BEFORE UPDATE ON user_profile_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 10. 코멘트
COMMENT ON TABLE job_embeddings IS '공고별 벡터 임베딩 (OpenAI text-embedding-3-small, 1536 차원)';
COMMENT ON TABLE user_profile_embeddings IS '사용자 프로필 벡터 임베딩 (스킬, 경력, 선호도 기반)';
COMMENT ON FUNCTION get_similar_jobs_for_user IS '사용자 프로필과 유사한 공고 검색 (코사인 유사도 기반)';
COMMENT ON FUNCTION get_similar_jobs_to_job IS '특정 공고와 유사한 다른 공고 검색';
COMMENT ON FUNCTION get_matching_candidates_for_job IS '공고에 적합한 후보자 검색 (기업용)';

-- ============================================================================
-- SECTION 4: Bandit 정책 (JobAI 2.0 - Thompson Sampling)
-- ============================================================================

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

-- ============================================================================
-- 설정 완료!
-- ============================================================================
--
-- ✅ 총 18개 테이블 생성됨
-- ✅ 총 8개 함수 생성됨
-- ✅ 인덱스 및 RLS 정책 설정 완료
--
-- 다음 단계:
-- 1. Supabase Dashboard → Table Editor에서 테이블 생성 확인
-- 2. Database → Functions에서 함수 생성 확인
-- 3. 로컬 테스트: npm run dev
-- 4. 임베딩 생성: PUT /api/embeddings/generate-job
--
-- ============================================================================
