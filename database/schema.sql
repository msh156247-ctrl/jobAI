-- ============================================================================
-- JobAI Team Matching System - Database Schema
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-13
-- Description: Complete PostgreSQL schema for team recruitment and matching
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organizations Table
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,

  -- Classification
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large')),
  founded_year INTEGER,

  -- Contact
  website TEXT,
  email TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_industry ON organizations(industry);
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Auth (managed by Supabase Auth)
  email TEXT UNIQUE NOT NULL,

  -- Basic Info
  name TEXT NOT NULL,
  phone TEXT,

  -- Role
  role TEXT CHECK (role IN ('seeker', 'employer', 'admin')) NOT NULL DEFAULT 'seeker',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- User Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Basic Info
  profile_image_url TEXT,
  introduction TEXT,
  location TEXT,

  -- Career Info
  industry TEXT,
  sub_industry TEXT,
  job_description TEXT,
  tools TEXT[],

  career_type TEXT CHECK (career_type IN ('newcomer', 'junior', 'mid-level', 'senior', 'expert')),
  career_years INTEGER DEFAULT 0 CHECK (career_years >= 0),
  current_position TEXT,

  -- Skills (stored as JSONB for flexibility)
  -- Format: [{ name, level, yearsOfExperience, lastUsed, proofOfWork }]
  skills JSONB DEFAULT '[]'::jsonb,

  -- Preferences
  preferred_locations TEXT[],
  work_types TEXT[], -- ['remote', 'hybrid', 'onsite']
  salary_min INTEGER,
  salary_max INTEGER,

  -- Personality
  personalities TEXT[],

  -- Priorities (stored as JSONB)
  -- Format: { salary, growth, culture, stability, innovation }
  priorities JSONB,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method TEXT CHECK (verification_method IN ('phone', 'email', 'document')),

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_career_type ON user_profiles(career_type);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);
CREATE INDEX idx_user_profiles_skills ON user_profiles USING GIN (skills);
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Teams Table
-- ----------------------------------------------------------------------------
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),

  -- Classification
  team_type TEXT CHECK (team_type IN ('project', 'study', 'startup', 'contest', 'opensource')) NOT NULL,
  industry TEXT,
  tech_stack TEXT[],

  -- Work Configuration
  location TEXT CHECK (location IN ('online', 'offline', 'hybrid')) NOT NULL,
  location_detail TEXT,
  duration TEXT,
  schedule TEXT,

  -- Recruitment Status
  total_slots INTEGER NOT NULL CHECK (total_slots > 0),
  filled_slots INTEGER DEFAULT 0 CHECK (filled_slots >= 0 AND filled_slots <= total_slots),
  status TEXT CHECK (status IN ('recruiting', 'full', 'closed', 'paused')) DEFAULT 'recruiting',

  -- Analytics
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  applicants_count INTEGER DEFAULT 0 CHECK (applicants_count >= 0),
  bookmarks_count INTEGER DEFAULT 0 CHECK (bookmarks_count >= 0),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_teams_leader ON teams(leader_id);
CREATE INDEX idx_teams_type ON teams(team_type);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_location ON teams(location);
CREATE INDEX idx_teams_tech_stack ON teams USING GIN (tech_stack);
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Team Cultures Table
-- ----------------------------------------------------------------------------
CREATE TABLE team_cultures (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,

  -- Culture Details
  values TEXT[],
  working_style TEXT[],
  communication_style TEXT,
  meeting_frequency TEXT,
  decision_making TEXT,

  -- Work Environment
  work_life_balance TEXT,
  learning_opportunities TEXT,
  feedback_culture TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_team_cultures_updated_at BEFORE UPDATE ON team_cultures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Team Benefits Table
-- ----------------------------------------------------------------------------
CREATE TABLE team_benefits (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,

  -- Compensation
  salary TEXT,
  equity BOOLEAN DEFAULT FALSE,
  bonus TEXT,

  -- Flexibility
  work_from_home BOOLEAN DEFAULT FALSE,
  flexible_hours BOOLEAN DEFAULT FALSE,

  -- Perks
  meals BOOLEAN DEFAULT FALSE,
  snacks BOOLEAN DEFAULT FALSE,
  equipment BOOLEAN DEFAULT FALSE,

  -- Development
  education BOOLEAN DEFAULT FALSE,
  conferences BOOLEAN DEFAULT FALSE,
  books BOOLEAN DEFAULT FALSE,

  -- Time Off
  vacation TEXT,
  sick_leave TEXT,

  -- Other
  other TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_team_benefits_updated_at BEFORE UPDATE ON team_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Team Projects Table
-- ----------------------------------------------------------------------------
CREATE TABLE team_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  -- Project Info
  name TEXT NOT NULL,
  description TEXT,

  -- Progress
  progress INTEGER CHECK (progress BETWEEN 0 AND 100) DEFAULT 0,
  status TEXT CHECK (status IN ('planning', 'in-progress', 'completed', 'on-hold')) DEFAULT 'planning',

  -- Timeline
  start_date DATE,
  end_date DATE,

  -- Details
  tech_stack TEXT[],
  repository_url TEXT,
  demo_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_projects_team ON team_projects(team_id);
CREATE INDEX idx_team_projects_status ON team_projects(status);
CREATE TRIGGER update_team_projects_updated_at BEFORE UPDATE ON team_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Positions Table
-- ----------------------------------------------------------------------------
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  -- Position Info
  title TEXT NOT NULL,
  description TEXT,

  -- Recruitment
  required_count INTEGER NOT NULL CHECK (required_count > 0),
  filled_count INTEGER DEFAULT 0 CHECK (filled_count >= 0 AND filled_count <= required_count),

  -- Requirements
  required_skills TEXT[],
  preferred_skills TEXT[],
  responsibilities TEXT[],

  -- Urgency
  urgency INTEGER CHECK (urgency BETWEEN 1 AND 5) DEFAULT 3,
  recruitment_reason TEXT,
  expected_start_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_positions_team ON positions(team_id);
CREATE INDEX idx_positions_active ON positions(is_active);
CREATE INDEX idx_positions_required_skills ON positions USING GIN (required_skills);
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Applications Table
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Application Content
  motivation TEXT,
  relevant_experience TEXT,

  -- Availability (stored as JSONB)
  -- Format: { startDate, hoursPerWeek, timezone }
  available_time JSONB,

  -- Portfolio (stored as JSONB)
  -- Format: [{ type, url, description }]
  portfolio_links JSONB DEFAULT '[]'::jsonb,

  -- Custom Q&A (stored as JSONB)
  -- Format: [{ question, answer }]
  custom_answers JSONB DEFAULT '[]'::jsonb,

  -- Matching Score
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),

  -- Match Details (stored as JSONB)
  -- Format: { jobTitleMatch, requiredSkillsMatch, ..., recommendations }
  match_details JSONB,

  -- Status
  status TEXT CHECK (status IN ('submitted', 'reviewing', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'submitted',

  -- Evaluation (stored as JSONB)
  -- Format: { technicalFit, cultureFit, portfolio, communication, overallScore, decision, internalNotes }
  evaluation JSONB,
  evaluated_by UUID REFERENCES users(id),
  evaluated_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_applications_team ON applications(team_id);
CREATE INDEX idx_applications_position ON applications(position_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Waitlist Table
-- ----------------------------------------------------------------------------
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,

  -- Priority Factors
  match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_priority INTEGER CHECK (team_priority BETWEEN 1 AND 10),
  position_urgency INTEGER DEFAULT 5 CHECK (position_urgency BETWEEN 1 AND 10),

  -- Status Management
  status TEXT CHECK (status IN ('active', 'dormant', 'expired', 'converted', 'removed')) DEFAULT 'active',
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),

  -- Notification
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(team_id, position_id, applicant_id)
);

CREATE INDEX idx_waitlist_team_position ON waitlist(team_id, position_id);
CREATE INDEX idx_waitlist_applicant ON waitlist(applicant_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_expires_at ON waitlist(expires_at);
CREATE INDEX idx_waitlist_match_score ON waitlist(match_score DESC);
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Waitlist History Table (for Analytics)
-- ----------------------------------------------------------------------------
CREATE TABLE waitlist_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waitlist_id UUID REFERENCES waitlist(id) ON DELETE CASCADE,

  -- Change Details
  action TEXT CHECK (action IN ('added', 'converted', 'expired', 'removed', 'status_changed', 'priority_updated')) NOT NULL,
  previous_status TEXT,
  new_status TEXT,

  -- Context
  changed_by UUID REFERENCES users(id),
  reason TEXT,

  -- Additional Data (stored as JSONB)
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_waitlist_history_waitlist ON waitlist_history(waitlist_id);
CREATE INDEX idx_waitlist_history_action ON waitlist_history(action);
CREATE INDEX idx_waitlist_history_created_at ON waitlist_history(created_at DESC);

-- ----------------------------------------------------------------------------
-- Match Score Cache Table (for Performance)
-- ----------------------------------------------------------------------------
CREATE TABLE match_score_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Match Score
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100) NOT NULL,

  -- Match Details (stored as JSONB)
  -- Format: { jobTitleMatch, requiredSkillsMatch, preferredSkillsMatch, ... }
  match_details JSONB NOT NULL,

  -- Cache Management
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),

  -- Constraints
  UNIQUE(team_id, position_id, user_id)
);

CREATE INDEX idx_match_cache_team_position ON match_score_cache(team_id, position_id);
CREATE INDEX idx_match_cache_user ON match_score_cache(user_id);
CREATE INDEX idx_match_cache_expiry ON match_score_cache(expires_at);

-- ============================================================================
-- Views
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Active Recruitments View
-- ----------------------------------------------------------------------------
CREATE VIEW active_recruitments AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.team_type,
  t.industry,
  t.location,
  p.id AS position_id,
  p.title AS position_title,
  p.required_count,
  p.filled_count,
  p.urgency,
  (p.required_count - p.filled_count) AS open_slots,
  COUNT(DISTINCT a.id) AS applicants_count,
  COUNT(DISTINCT w.id) AS waitlist_count
FROM teams t
INNER JOIN positions p ON t.id = p.team_id
LEFT JOIN applications a ON p.id = a.position_id AND a.status IN ('submitted', 'reviewing', 'interview_scheduled')
LEFT JOIN waitlist w ON p.id = w.position_id AND w.status = 'active'
WHERE t.status = 'recruiting'
  AND p.is_active = TRUE
  AND p.filled_count < p.required_count
GROUP BY t.id, t.name, t.team_type, t.industry, t.location, p.id, p.title, p.required_count, p.filled_count, p.urgency;

-- ----------------------------------------------------------------------------
-- User Application Summary View
-- ----------------------------------------------------------------------------
CREATE VIEW user_application_summary AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  COUNT(DISTINCT a.id) AS total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'submitted' THEN a.id END) AS pending_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'reviewing' THEN a.id END) AS reviewing_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) AS accepted_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) AS rejected_applications,
  COUNT(DISTINCT w.id) AS waitlist_count,
  MAX(a.created_at) AS last_application_date
FROM users u
LEFT JOIN applications a ON u.id = a.applicant_id
LEFT JOIN waitlist w ON u.id = w.applicant_id AND w.status = 'active'
GROUP BY u.id, u.name;

-- ============================================================================
-- Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Calculate Waitlist Priority
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_waitlist_priority(
  p_match_score INTEGER,
  p_applied_at TIMESTAMP WITH TIME ZONE,
  p_team_priority INTEGER DEFAULT NULL,
  p_position_urgency INTEGER DEFAULT 5
)
RETURNS NUMERIC AS $$
DECLARE
  match_score_weight NUMERIC := 0.50;
  time_weight NUMERIC := 0.30;
  team_priority_weight NUMERIC := 0.15;
  urgency_weight NUMERIC := 0.05;

  match_score_value NUMERIC;
  time_value NUMERIC;
  team_priority_value NUMERIC;
  urgency_value NUMERIC;

  days_waiting NUMERIC;
BEGIN
  -- Match score (0-100) -> 0-50 points
  match_score_value := (100 - p_match_score) * match_score_weight;

  -- Time waiting (older applications = higher priority)
  days_waiting := EXTRACT(EPOCH FROM (NOW() - p_applied_at)) / 86400;
  time_value := LEAST(days_waiting * 0.5, 30) * time_weight;

  -- Team priority (1-10, 1=highest) -> 0-15 points
  team_priority_value := COALESCE(p_team_priority, 5) * team_priority_weight;

  -- Position urgency (1-10, 1=most urgent) -> 0-5 points
  urgency_value := p_position_urgency * urgency_weight;

  -- Lower score = higher priority
  RETURN match_score_value + time_value + team_priority_value + urgency_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- Process Waitlist on Vacancy
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_waitlist_on_vacancy(
  p_team_id UUID,
  p_position_id UUID
)
RETURNS TABLE(
  waitlist_entry_id UUID,
  applicant_id UUID,
  applicant_name TEXT,
  match_score INTEGER,
  priority_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.applicant_id,
    w.applicant_name,
    w.match_score,
    calculate_waitlist_priority(
      w.match_score,
      w.applied_at,
      w.team_priority,
      w.position_urgency
    ) AS priority_score
  FROM waitlist w
  WHERE w.team_id = p_team_id
    AND w.position_id = p_position_id
    AND w.status = 'active'
    AND w.expires_at > NOW()
  ORDER BY priority_score ASC, w.applied_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Auto-expire Waitlist Entries (called by cron job)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_old_waitlist_entries()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Mark expired entries
  UPDATE waitlist
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Log to history
  INSERT INTO waitlist_history (waitlist_id, action, previous_status, new_status, reason, metadata)
  SELECT
    id,
    'expired',
    'active',
    'expired',
    'Automatic expiration after 30 days',
    jsonb_build_object('expired_at', NOW())
  FROM waitlist
  WHERE status = 'expired'
    AND updated_at >= NOW() - INTERVAL '1 minute';

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Mark Dormant Waitlist Entries (called by cron job)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_dormant_waitlist_entries()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Mark dormant entries (no activity for 14 days)
  UPDATE waitlist
  SET status = 'dormant',
      updated_at = NOW()
  WHERE status = 'active'
    AND last_activity_at < NOW() - INTERVAL '14 days';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Log to history
  INSERT INTO waitlist_history (waitlist_id, action, previous_status, new_status, reason, metadata)
  SELECT
    id,
    'status_changed',
    'active',
    'dormant',
    'No activity for 14 days',
    jsonb_build_object('last_activity', last_activity_at)
  FROM waitlist
  WHERE status = 'dormant'
    AND updated_at >= NOW() - INTERVAL '1 minute';

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Auto-update Team filled_slots on Application acceptance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_team_filled_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Increment filled_slots for position and team
    UPDATE positions
    SET filled_count = filled_count + 1
    WHERE id = NEW.position_id;

    UPDATE teams
    SET filled_slots = filled_slots + 1
    WHERE id = NEW.team_id;

    -- Check if team or position is now full
    UPDATE teams
    SET status = 'full'
    WHERE id = NEW.team_id
      AND filled_slots >= total_slots;

  ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    -- Decrement filled_slots if acceptance is revoked
    UPDATE positions
    SET filled_count = GREATEST(filled_count - 1, 0)
    WHERE id = NEW.position_id;

    UPDATE teams
    SET filled_slots = GREATEST(filled_slots - 1, 0),
        status = 'recruiting'
    WHERE id = NEW.team_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_filled_slots
AFTER UPDATE OF status ON applications
FOR EACH ROW
EXECUTE FUNCTION update_team_filled_slots();

-- ----------------------------------------------------------------------------
-- Log Waitlist Changes to History
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_waitlist_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO waitlist_history (waitlist_id, action, new_status, metadata)
    VALUES (NEW.id, 'added', NEW.status, jsonb_build_object('match_score', NEW.match_score));

  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO waitlist_history (waitlist_id, action, previous_status, new_status)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status);

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_waitlist_change
AFTER INSERT OR UPDATE ON waitlist
FOR EACH ROW
EXECUTE FUNCTION log_waitlist_change();

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Full-text search indexes
CREATE INDEX idx_teams_name_trgm ON teams USING gin (name gin_trgm_ops);
CREATE INDEX idx_teams_description_trgm ON teams USING gin (description gin_trgm_ops);
CREATE INDEX idx_positions_title_trgm ON positions USING gin (title gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX idx_applications_team_status ON applications(team_id, status);
CREATE INDEX idx_applications_position_status ON applications(position_id, status);
CREATE INDEX idx_waitlist_team_position_status ON waitlist(team_id, position_id, status);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations that post team recruitments';
COMMENT ON TABLE users IS 'All system users (job seekers and employers)';
COMMENT ON TABLE user_profiles IS 'Detailed profiles for job seekers';
COMMENT ON TABLE teams IS 'Team recruitment postings';
COMMENT ON TABLE team_cultures IS 'Team culture and working style details';
COMMENT ON TABLE team_benefits IS 'Team benefits and perks';
COMMENT ON TABLE team_projects IS 'Projects associated with teams';
COMMENT ON TABLE positions IS 'Specific positions/roles within teams';
COMMENT ON TABLE applications IS 'Job applications from users to positions';
COMMENT ON TABLE waitlist IS 'Waitlist for full positions';
COMMENT ON TABLE waitlist_history IS 'Audit log for waitlist changes';
COMMENT ON TABLE match_score_cache IS 'Cached matching scores for performance';

-- ============================================================================
-- Initial Data / Seed Data Placeholder
-- ============================================================================

-- Note: Seed data should be loaded separately via seed.sql file

-- ============================================================================
-- Schema Version
-- ============================================================================

CREATE TABLE schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial schema with 12 core tables');

-- ============================================================================
-- End of Schema
-- ============================================================================
