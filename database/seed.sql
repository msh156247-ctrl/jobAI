-- ============================================================================
-- JobAI Team Matching System - Seed Data
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-13
-- Description: Sample data for testing and development
-- ============================================================================

-- Clear existing data (be careful in production!)
-- TRUNCATE TABLE match_score_cache, waitlist_history, waitlist, applications,
--   team_projects, team_benefits, team_cultures, positions, teams,
--   user_profiles, users, organizations CASCADE;

-- ============================================================================
-- Organizations
-- ============================================================================

INSERT INTO organizations (id, name, description, industry, size, founded_year, website) VALUES
('org_1', 'HealthAI Inc.', '헬스케어 AI 솔루션을 개발하는 스타트업', 'IT/기술', 'startup', 2024, 'https://healthai.example.com'),
('org_2', 'EduTech Solutions', '교육 기술 혁신을 선도하는 기업', 'IT/기술', 'small', 2022, 'https://edutech.example.com'),
('org_3', 'GreenEnergy Co.', '친환경 에너지 솔루션 개발', '에너지/환경', 'medium', 2020, 'https://greenenergy.example.com');

-- ============================================================================
-- Users (Job Seekers and Employers)
-- ============================================================================

-- Note: In production, these would be created via Supabase Auth
-- For testing, we create them directly

INSERT INTO users (id, email, name, phone, role) VALUES
-- Team Leaders (Employers)
('user_leader_1', 'kim.leader@healthai.com', '김팀장', '010-1234-5678', 'employer'),
('user_leader_2', 'lee.leader@edutech.com', '이대표', '010-2345-6789', 'employer'),
('user_leader_3', 'park.leader@greenenergy.com', '박매니저', '010-3456-7890', 'employer'),

-- Job Seekers
('user_seeker_1', 'alice@example.com', 'Alice Kim', '010-1111-1111', 'seeker'),
('user_seeker_2', 'bob@example.com', 'Bob Lee', '010-2222-2222', 'seeker'),
('user_seeker_3', 'charlie@example.com', 'Charlie Park', '010-3333-3333', 'seeker'),
('user_seeker_4', 'david@example.com', 'David Choi', '010-4444-4444', 'seeker'),
('user_seeker_5', 'emma@example.com', 'Emma Jung', '010-5555-5555', 'seeker'),
('user_seeker_6', 'frank@example.com', 'Frank Kang', '010-6666-6666', 'seeker'),
('user_seeker_7', 'grace@example.com', 'Grace Han', '010-7777-7777', 'seeker'),
('user_seeker_8', 'henry@example.com', 'Henry Shin', '010-8888-8888', 'seeker');

-- ============================================================================
-- User Profiles (Job Seekers)
-- ============================================================================

INSERT INTO user_profiles (user_id, introduction, location, industry, sub_industry, job_description, career_type, career_years, current_position, skills, preferred_locations, work_types, personalities, priorities) VALUES
('user_seeker_1',
  '프론트엔드 개발을 사랑하는 개발자입니다. React와 TypeScript로 5년간 다양한 프로젝트를 진행했습니다.',
  '서울 강남구',
  'IT/기술',
  'Frontend Development',
  'Frontend Developer',
  'senior',
  5,
  'Senior Frontend Developer at TechCorp',
  '[
    {"name": "React", "level": 5, "yearsOfExperience": 5, "lastUsed": "2025-11-01"},
    {"name": "TypeScript", "level": 5, "yearsOfExperience": 4, "lastUsed": "2025-11-01"},
    {"name": "Next.js", "level": 4, "yearsOfExperience": 3, "lastUsed": "2025-11-01"},
    {"name": "JavaScript", "level": 5, "yearsOfExperience": 6, "lastUsed": "2025-11-01"},
    {"name": "CSS", "level": 4, "yearsOfExperience": 5, "lastUsed": "2025-11-01"}
  ]'::jsonb,
  ARRAY['서울', '경기'],
  ARRAY['hybrid', 'remote'],
  ARRAY['협업 중시', '빠른 학습', '문제 해결 능력'],
  '{"salary": 7, "growth": 9, "culture": 8, "stability": 6, "innovation": 9}'::jsonb
),

('user_seeker_2',
  '백엔드 개발과 시스템 설계를 좋아합니다. 스케일러블한 아키텍처 구축 경험이 있습니다.',
  '서울 송파구',
  'IT/기술',
  'Backend Development',
  'Backend Engineer',
  'mid-level',
  3,
  'Backend Engineer at DataCorp',
  '[
    {"name": "Python", "level": 4, "yearsOfExperience": 4, "lastUsed": "2025-11-01"},
    {"name": "Django", "level": 4, "yearsOfExperience": 3, "lastUsed": "2025-11-01"},
    {"name": "PostgreSQL", "level": 3, "yearsOfExperience": 3, "lastUsed": "2025-10-15"},
    {"name": "Docker", "level": 3, "yearsOfExperience": 2, "lastUsed": "2025-11-01"},
    {"name": "Redis", "level": 3, "yearsOfExperience": 2, "lastUsed": "2025-10-20"}
  ]'::jsonb,
  ARRAY['서울'],
  ARRAY['onsite', 'hybrid'],
  ARRAY['꼼꼼함', '분석적 사고', '책임감'],
  '{"salary": 8, "growth": 8, "culture": 7, "stability": 8, "innovation": 7}'::jsonb
),

('user_seeker_3',
  'AI/ML 엔지니어로 자연어 처리와 컴퓨터 비전 분야에 관심이 많습니다.',
  '서울 관악구',
  'IT/기술',
  'AI/ML',
  'AI/ML Engineer',
  'junior',
  2,
  'ML Engineer at AILab',
  '[
    {"name": "Python", "level": 4, "yearsOfExperience": 3, "lastUsed": "2025-11-01"},
    {"name": "TensorFlow", "level": 3, "yearsOfExperience": 2, "lastUsed": "2025-11-01"},
    {"name": "PyTorch", "level": 3, "yearsOfExperience": 2, "lastUsed": "2025-10-25"},
    {"name": "Machine Learning", "level": 3, "yearsOfExperience": 2, "lastUsed": "2025-11-01"},
    {"name": "NLP", "level": 2, "yearsOfExperience": 1, "lastUsed": "2025-10-20"}
  ]'::jsonb,
  ARRAY['서울', '경기'],
  ARRAY['remote', 'hybrid'],
  ARRAY['호기심', '실험 정신', '끈기'],
  '{"salary": 7, "growth": 10, "culture": 6, "stability": 5, "innovation": 10}'::jsonb
),

('user_seeker_4',
  'UI/UX와 프론트엔드 개발을 함께 하는 디자이너 겸 개발자입니다.',
  '경기 성남시',
  'IT/기술',
  'UI/UX Design',
  'UI/UX Designer',
  'mid-level',
  4,
  'UI/UX Designer at DesignStudio',
  '[
    {"name": "Figma", "level": 5, "yearsOfExperience": 4, "lastUsed": "2025-11-01"},
    {"name": "HTML", "level": 4, "yearsOfExperience": 5, "lastUsed": "2025-10-28"},
    {"name": "CSS", "level": 4, "yearsOfExperience": 5, "lastUsed": "2025-10-28"},
    {"name": "JavaScript", "level": 3, "yearsOfExperience": 3, "lastUsed": "2025-10-25"},
    {"name": "React", "level": 2, "yearsOfExperience": 1, "lastUsed": "2025-10-15"}
  ]'::jsonb,
  ARRAY['서울', '경기'],
  ARRAY['hybrid'],
  ARRAY['창의적', '세심함', '사용자 중심 사고'],
  '{"salary": 7, "growth": 8, "culture": 9, "stability": 7, "innovation": 8}'::jsonb
),

('user_seeker_5',
  '풀스택 개발자로 프론트엔드와 백엔드를 모두 다룹니다.',
  '서울 마포구',
  'IT/기술',
  'Full Stack Development',
  'Full Stack Developer',
  'senior',
  6,
  'Senior Full Stack Developer at WebCorp',
  '[
    {"name": "React", "level": 4, "yearsOfExperience": 4, "lastUsed": "2025-11-01"},
    {"name": "Node.js", "level": 4, "yearsOfExperience": 5, "lastUsed": "2025-11-01"},
    {"name": "TypeScript", "level": 4, "yearsOfExperience": 3, "lastUsed": "2025-11-01"},
    {"name": "MongoDB", "level": 3, "yearsOfExperience": 4, "lastUsed": "2025-10-20"},
    {"name": "AWS", "level": 3, "yearsOfExperience": 3, "lastUsed": "2025-10-15"}
  ]'::jsonb,
  ARRAY['서울'],
  ARRAY['remote'],
  ARRAY['자기주도적', '다재다능', '빠른 적응'],
  '{"salary": 8, "growth": 7, "culture": 8, "stability": 7, "innovation": 8}'::jsonb
);

-- ============================================================================
-- Teams
-- ============================================================================

INSERT INTO teams (id, organization_id, name, description, leader_id, team_type, industry, tech_stack, location, location_detail, duration, schedule, total_slots, filled_slots, status, views, applicants_count, deadline) VALUES
('team_1',
  'org_1',
  'AI 기반 헬스케어 서비스 개발 팀',
  'AI와 헬스케어를 결합한 혁신적인 서비스를 만들고 있습니다.

**프로젝트 개요**
- 개인 맞춤형 건강 관리 AI 챗봇
- 건강 데이터 분석 및 시각화
- 의료 전문가 매칭 시스템

**우리 팀은**
- 열정적이고 책임감 있는 분들을 찾습니다
- 수평적인 문화와 자유로운 의견 교환
- 실제 런칭을 목표로 합니다',
  'user_leader_1',
  'startup',
  'IT/기술',
  ARRAY['React', 'Next.js', 'TypeScript', 'Python', 'TensorFlow', 'AWS'],
  'hybrid',
  '서울 강남구',
  '6개월',
  '주 3회, 평일 저녁 7-10시',
  7,
  3,
  'recruiting',
  156,
  12,
  '2025-12-31'
),

('team_2',
  'org_2',
  '온라인 교육 플랫폼 MVP 개발',
  '학습자와 강사를 연결하는 혁신적인 교육 플랫폼을 개발합니다.

**기술 스택**
- Frontend: React, Next.js, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Infrastructure: Vercel, Supabase

**우리가 찾는 사람**
- 교육에 열정이 있는 분
- 빠른 프로토타이핑 능력
- 사용자 피드백 기반 개발 경험',
  'user_leader_2',
  'project',
  'IT/기술',
  ARRAY['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
  'online',
  NULL,
  '3개월',
  '주 2회, 주말 오전 10-1시',
  6,
  2,
  'recruiting',
  89,
  8,
  '2025-11-30'
),

('team_3',
  'org_3',
  '친환경 에너지 모니터링 시스템',
  '태양광 발전 효율을 실시간 모니터링하고 분석하는 시스템을 개발합니다.

**프로젝트 목표**
- IoT 센서 데이터 수집 및 분석
- 실시간 대시보드 구현
- 에너지 효율 최적화 알고리즘

**근무 환경**
- 대전 본사 근무 (주 5일)
- 최신 장비 지원
- 친환경 기술에 대한 교육 지원',
  'user_leader_3',
  'startup',
  '에너지/환경',
  ARRAY['Python', 'Django', 'React', 'PostgreSQL', 'IoT', 'AWS'],
  'offline',
  '대전 유성구',
  '12개월',
  '평일 9-6시',
  8,
  5,
  'recruiting',
  67,
  5,
  '2026-01-31'
),

('team_4',
  NULL,
  'JUNCTION 2025 해커톤 팀',
  '유럽 최대 해커톤 JUNCTION 2025 참가 팀원을 모집합니다!

**해커톤 정보**
- 일정: 2025년 11월 15-17일
- 장소: 핀란드 헬싱키
- 주제: Open (AI, Sustainability, Health 등)

**모집 분야**
- Frontend Developer
- Backend Developer
- Designer
- AI/ML Engineer',
  'user_leader_1',
  'contest',
  'IT/기술',
  ARRAY['React', 'Python', 'Node.js', 'TensorFlow'],
  'offline',
  '핀란드 헬싱키',
  '3일',
  '2025-11-15 ~ 2025-11-17',
  5,
  2,
  'recruiting',
  234,
  23,
  '2025-11-10'
);

-- ============================================================================
-- Team Cultures
-- ============================================================================

INSERT INTO team_cultures (team_id, values, working_style, communication_style, meeting_frequency, decision_making, work_life_balance, learning_opportunities, feedback_culture) VALUES
('team_1',
  ARRAY['빠른 실험과 학습', '사용자 중심 개발', '코드 품질 중시'],
  ARRAY['Agile Sprint (2주)', 'Code Review 필수', '페어 프로그래밍 권장'],
  '슬랙 메신저 + 주 3회 오프라인 미팅',
  '주 3회 (월/수/금 저녁 7시)',
  'Data-driven, 팀원 의견 존중',
  '업무 시간 유연, 저녁 시간 존중',
  '월 1회 기술 세미나, 컨퍼런스 지원',
  '매 Sprint 회고, 1:1 피드백'
),

('team_2',
  ARRAY['학습자 경험 최우선', '빠른 실행', '투명한 소통'],
  ARRAY['주간 스프린트', 'Notion 문서화', '비동기 커뮤니케이션'],
  'Discord + 주 2회 화상 회의',
  '주 2회 (토/일 오전)',
  '리더 최종 결정, 팀원 의견 수렴',
  '주말 위주 활동, 평일 자유',
  '온라인 강의 무료 제공',
  '주간 회고, 피드백 채널 운영'
),

('team_3',
  ARRAY['환경 보호', '기술 혁신', '사회적 가치'],
  ARRAY['전통적 개발 방법론', '정기 미팅', '문서 중심'],
  '이메일 + 주 5회 오프라인 미팅',
  '매일 데일리 스탠드업 + 주간 회의',
  '매니저 결정, 팀 토론',
  '정시 퇴근 원칙, 워라밸 보장',
  '친환경 기술 교육, 외부 세미나',
  '분기별 평가, 상시 피드백'
),

('team_4',
  ARRAY['빠른 실행', '창의성', '팀워크'],
  ARRAY['해커톤 방식', '역할 분담', '빠른 프로토타이핑'],
  'Slack + 카카오톡',
  '필요시 수시',
  '팀 합의',
  '해커톤 기간 집중',
  '해커톤 경험 자체가 학습',
  '해커톤 후 회고'
);

-- ============================================================================
-- Team Benefits
-- ============================================================================

INSERT INTO team_benefits (team_id, salary, equity, work_from_home, flexible_hours, meals, education, equipment, vacation, other) VALUES
('team_1', '협의 (스톡옵션 포함)', true, true, true, true, true, true, '연차 자유 사용', ARRAY['건강검진 지원', '도서 구입비', '컨퍼런스 참가비']),
('team_2', '무급 (프로젝트 성공 시 수익 배분)', false, true, true, false, true, false, '프로젝트 기간 중 없음', ARRAY['온라인 강의 무료', '포트폴리오 구축']),
('team_3', '월 400만원 ~ 600만원', false, false, false, true, true, true, '연 15일', ARRAY['4대보험', '퇴직금', '명절 보너스', '경조사비']),
('team_4', '없음 (참가비 지원)', false, false, false, true, false, false, '없음', ARRAY['항공권 지원', '숙박비 지원', '해커톤 티셔츠']);

-- ============================================================================
-- Team Projects
-- ============================================================================

INSERT INTO team_projects (id, team_id, name, description, progress, status, start_date, end_date, tech_stack, repository_url) VALUES
('proj_1', 'team_1', 'AI 챗봇 MVP 개발', '건강 상담 AI 챗봇 초기 버전', 65, 'in-progress', '2025-10-01', '2025-12-31', ARRAY['React', 'TypeScript', 'OpenAI API'], 'https://github.com/healthai/chatbot-mvp'),
('proj_2', 'team_1', '데이터 수집 시스템', '사용자 건강 데이터 수집 및 전처리', 80, 'in-progress', '2025-09-15', '2025-11-30', ARRAY['Python', 'PostgreSQL', 'FastAPI'], 'https://github.com/healthai/data-collection'),
('proj_3', 'team_1', '의료진 매칭 알고리즘', '증상 기반 의료진 추천 알고리즘', 30, 'planning', '2025-12-01', NULL, ARRAY['Python', 'Machine Learning'], NULL),

('proj_4', 'team_2', '학습 플랫폼 프론트엔드', '학습자/강사 인터페이스', 45, 'in-progress', '2025-10-15', '2025-12-15', ARRAY['React', 'Next.js', 'Tailwind CSS'], 'https://github.com/edutech/platform-frontend'),
('proj_5', 'team_2', '강의 관리 API', '강의 CRUD 및 수강 관리', 60, 'in-progress', '2025-10-01', '2025-11-30', ARRAY['Node.js', 'Express', 'PostgreSQL'], 'https://github.com/edutech/course-api'),

('proj_6', 'team_3', 'IoT 센서 통합', '태양광 패널 센서 데이터 수집', 90, 'in-progress', '2025-06-01', '2025-11-30', ARRAY['Python', 'MQTT', 'InfluxDB'], NULL),
('proj_7', 'team_3', '모니터링 대시보드', '실시간 에너지 모니터링 UI', 70, 'in-progress', '2025-08-01', '2025-12-31', ARRAY['React', 'Chart.js', 'WebSocket'], NULL);

-- ============================================================================
-- Positions
-- ============================================================================

INSERT INTO positions (id, team_id, title, description, required_count, filled_count, required_skills, preferred_skills, responsibilities, urgency, recruitment_reason, expected_start_date, is_active) VALUES
-- Team 1 Positions
('pos_1_1', 'team_1', '프론트엔드 개발자', 'React/Next.js를 활용한 웹 개발', 2, 1,
  ARRAY['React', 'TypeScript', 'Next.js'],
  ARRAY['Tailwind CSS', 'Redux', 'Jest'],
  ARRAY['UI/UX 구현', '상태 관리 및 API 연동', '반응형 디자인 적용', '성능 최적화'],
  4, '챗봇 UI 개발 가속화', '2025-12-01', true
),
('pos_1_2', 'team_1', 'AI/ML 엔지니어', '헬스케어 데이터 분석 모델 개발', 1, 0,
  ARRAY['Python', 'TensorFlow', 'Machine Learning'],
  ARRAY['PyTorch', 'NLP', 'Healthcare Domain'],
  ARRAY['건강 데이터 분석 모델 개발', '챗봇 NLP 모델 구현', '모델 성능 최적화'],
  5, '핵심 AI 기능 개발', '2025-11-20', true
),
('pos_1_3', 'team_1', '백엔드 개발자', 'API 서버 및 데이터 처리', 1, 1,
  ARRAY['Python', 'FastAPI', 'PostgreSQL'],
  ARRAY['Docker', 'AWS', 'Redis'],
  ARRAY['RESTful API 설계 및 구현', '데이터베이스 스키마 설계', '서버 배포 및 운영'],
  3, '인프라 안정화', '2025-12-15', true
),

-- Team 2 Positions
('pos_2_1', 'team_2', 'Frontend Developer', '학습 플랫폼 UI 개발', 2, 1,
  ARRAY['React', 'Next.js', 'TypeScript'],
  ARRAY['Tailwind CSS', 'Framer Motion'],
  ARRAY['학습자/강사 인터페이스 구현', '비디오 플레이어 통합', '반응형 디자인'],
  3, 'MVP 출시', '2025-11-25', true
),
('pos_2_2', 'team_2', 'Backend Developer', '강의 관리 API 개발', 1, 0,
  ARRAY['Node.js', 'Express', 'PostgreSQL'],
  ARRAY['Supabase', 'tRPC', 'GraphQL'],
  ARRAY['강의 CRUD API', '수강 관리 로직', '결제 시스템 통합'],
  4, 'API 완성도 향상', '2025-11-20', true
),

-- Team 3 Positions
('pos_3_1', 'team_3', 'Full Stack Developer', '모니터링 시스템 개발', 2, 2,
  ARRAY['React', 'Python', 'Django', 'PostgreSQL'],
  ARRAY['Docker', 'AWS', 'IoT'],
  ARRAY['프론트엔드 및 백엔드 개발', '데이터 시각화', 'IoT 통신 구현'],
  2, '팀원 퇴사로 인한 공석', '2025-12-01', true
),
('pos_3_2', 'team_3', 'DevOps Engineer', '인프라 구축 및 운영', 1, 1,
  ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
  ARRAY['Terraform', 'Ansible', 'Monitoring'],
  ARRAY['배포 파이프라인 구축', '서버 모니터링', '성능 최적화'],
  3, '운영 안정성 향상', '2025-12-10', true
),

-- Team 4 Positions
('pos_4_1', 'team_4', 'Frontend Developer', '해커톤 프론트엔드 개발', 1, 0,
  ARRAY['React', 'JavaScript'],
  ARRAY['TypeScript', 'Next.js'],
  ARRAY['빠른 프로토타이핑', 'UI 구현', 'API 연동'],
  5, '해커톤 참가', '2025-11-15', true
),
('pos_4_2', 'team_4', 'AI/ML Engineer', '해커톤 AI 모델 개발', 1, 1,
  ARRAY['Python', 'Machine Learning'],
  ARRAY['TensorFlow', 'PyTorch', 'OpenAI API'],
  ARRAY['AI 모델 설계', '데이터 전처리', '모델 최적화'],
  5, '해커톤 참가', '2025-11-15', true
),
('pos_4_3', 'team_4', 'Designer', 'UI/UX 디자인', 1, 1,
  ARRAY['Figma', 'UI Design'],
  ARRAY['Illustration', 'Animation'],
  ARRAY['디자인 시스템 구축', 'UI 프로토타이핑', '사용자 경험 설계'],
  4, '해커톤 참가', '2025-11-15', true
);

-- ============================================================================
-- Applications
-- ============================================================================

INSERT INTO applications (id, team_id, position_id, applicant_id, motivation, relevant_experience, available_time, portfolio_links, match_score, match_details, status, created_at) VALUES
('app_1', 'team_1', 'pos_1_1', 'user_seeker_1',
  '헬스케어 분야에 관심이 많아 지원하게 되었습니다. React 전문성을 바탕으로 사용자 친화적인 UI를 만들고 싶습니다.',
  '5년간 다양한 웹 프로젝트에서 React와 TypeScript를 사용했습니다. 특히 대시보드 UI와 데이터 시각화 경험이 풍부합니다.',
  '{"startDate": "2025-12-01", "hoursPerWeek": 15, "timezone": "Asia/Seoul"}'::jsonb,
  '[
    {"type": "github", "url": "https://github.com/alice", "description": "개인 GitHub 프로필"},
    {"type": "website", "url": "https://alice-portfolio.com", "description": "포트폴리오 사이트"}
  ]'::jsonb,
  87,
  '{
    "jobTitleMatch": 25,
    "requiredSkillsMatch": 20,
    "preferredSkillsMatch": 8,
    "experienceMatch": 15,
    "locationMatch": 10,
    "cultureMatch": 7,
    "personalityMatch": 2
  }'::jsonb,
  'submitted',
  '2025-11-10 14:30:00'
),

('app_2', 'team_1', 'pos_1_2', 'user_seeker_3',
  'AI와 헬스케어를 결합한 프로젝트에 참여하고 싶습니다. NLP 경험을 살려 챗봇 개발에 기여하겠습니다.',
  'ML 엔지니어로 2년간 NLP 프로젝트를 진행했습니다. TensorFlow와 PyTorch 모두 사용 가능합니다.',
  '{"startDate": "2025-11-25", "hoursPerWeek": 20, "timezone": "Asia/Seoul"}'::jsonb,
  '[
    {"type": "github", "url": "https://github.com/charlie", "description": "ML 프로젝트"},
    {"type": "demo", "url": "https://chatbot-demo.com", "description": "챗봇 데모"}
  ]'::jsonb,
  75,
  '{
    "jobTitleMatch": 20,
    "requiredSkillsMatch": 15,
    "preferredSkillsMatch": 5,
    "experienceMatch": 10,
    "locationMatch": 10,
    "cultureMatch": 8,
    "personalityMatch": 7
  }'::jsonb,
  'reviewing',
  '2025-11-08 16:45:00'
),

('app_3', 'team_2', 'pos_2_1', 'user_seeker_1',
  '교육 플랫폼 개발에 관심이 있습니다. React와 Next.js로 멋진 학습 경험을 만들고 싶습니다.',
  '프론트엔드 개발자로 다양한 플랫폼을 개발했습니다. 특히 사용자 인터페이스 디자인에 강점이 있습니다.',
  '{"startDate": "2025-11-20", "hoursPerWeek": 10, "timezone": "Asia/Seoul"}'::jsonb,
  '[
    {"type": "github", "url": "https://github.com/alice", "description": "GitHub 프로필"}
  ]'::jsonb,
  92,
  '{
    "jobTitleMatch": 25,
    "requiredSkillsMatch": 20,
    "preferredSkillsMatch": 10,
    "experienceMatch": 15,
    "locationMatch": 10,
    "cultureMatch": 8,
    "personalityMatch": 4
  }'::jsonb,
  'accepted',
  '2025-11-05 11:20:00'
),

('app_4', 'team_3', 'pos_3_1', 'user_seeker_5',
  '친환경 기술에 관심이 많아 지원합니다. 풀스택 개발 경험을 바탕으로 프로젝트에 기여하겠습니다.',
  '6년간 풀스택 개발자로 근무하며 다양한 기술 스택을 경험했습니다. React와 Django 모두 능숙합니다.',
  '{"startDate": "2025-12-01", "hoursPerWeek": 40, "timezone": "Asia/Seoul"}'::jsonb,
  '[
    {"type": "github", "url": "https://github.com/emma", "description": "프로젝트들"},
    {"type": "website", "url": "https://emma-dev.com", "description": "개발 블로그"}
  ]'::jsonb,
  68,
  '{
    "jobTitleMatch": 18,
    "requiredSkillsMatch": 15,
    "preferredSkillsMatch": 5,
    "experienceMatch": 15,
    "locationMatch": 5,
    "cultureMatch": 7,
    "personalityMatch": 3
  }'::jsonb,
  'interview_scheduled',
  '2025-11-07 09:15:00'
);

-- ============================================================================
-- Waitlist
-- ============================================================================

INSERT INTO waitlist (id, team_id, position_id, applicant_id, applicant_name, match_score, applied_at, team_priority, position_urgency, status, last_activity_at, expires_at, notified) VALUES
('wait_1', 'team_1', 'pos_1_1', 'user_seeker_2', 'Bob Lee', 72, '2025-11-09 10:30:00', NULL, 4, 'active', '2025-11-09 10:30:00', '2025-12-09 10:30:00', false),
('wait_2', 'team_1', 'pos_1_1', 'user_seeker_4', 'David Choi', 65, '2025-11-11 14:20:00', NULL, 4, 'active', '2025-11-11 14:20:00', '2025-12-11 14:20:00', false),
('wait_3', 'team_2', 'pos_2_2', 'user_seeker_2', 'Bob Lee', 88, '2025-11-08 16:00:00', 2, 4, 'active', '2025-11-08 16:00:00', '2025-12-08 16:00:00', false),
('wait_4', 'team_3', 'pos_3_1', 'user_seeker_1', 'Alice Kim', 62, '2025-11-06 11:45:00', NULL, 2, 'active', '2025-11-06 11:45:00', '2025-12-06 11:45:00', false);

-- ============================================================================
-- Match Score Cache (for performance testing)
-- ============================================================================

INSERT INTO match_score_cache (team_id, position_id, user_id, match_score, match_details, calculated_at, expires_at) VALUES
('team_1', 'pos_1_1', 'user_seeker_1', 87,
  '{
    "jobTitleMatch": 25,
    "requiredSkillsMatch": 20,
    "preferredSkillsMatch": 8,
    "experienceMatch": 15,
    "locationMatch": 10,
    "cultureMatch": 7,
    "personalityMatch": 2
  }'::jsonb,
  NOW(), NOW() + INTERVAL '1 hour'
),
('team_1', 'pos_1_2', 'user_seeker_3', 75,
  '{
    "jobTitleMatch": 20,
    "requiredSkillsMatch": 15,
    "preferredSkillsMatch": 5,
    "experienceMatch": 10,
    "locationMatch": 10,
    "cultureMatch": 8,
    "personalityMatch": 7
  }'::jsonb,
  NOW(), NOW() + INTERVAL '1 hour'
);

-- ============================================================================
-- Update Sequences (if needed)
-- ============================================================================

-- Note: UUIDs don't use sequences, but if you add auto-increment IDs,
-- you would need to update sequences here

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Uncomment to verify data after loading

-- SELECT COUNT(*) FROM organizations;
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM user_profiles;
-- SELECT COUNT(*) FROM teams;
-- SELECT COUNT(*) FROM positions;
-- SELECT COUNT(*) FROM applications;
-- SELECT COUNT(*) FROM waitlist;

-- SELECT * FROM active_recruitments;
-- SELECT * FROM user_application_summary WHERE user_id = 'user_seeker_1';

-- ============================================================================
-- End of Seed Data
-- ============================================================================
