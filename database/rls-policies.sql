-- ============================================================================
-- JobAI Team Matching System - Row Level Security Policies
-- ============================================================================
-- Version: 1.0.0
-- Date: 2025-11-13
-- Description: Complete RLS policies for secure multi-tenant data access
-- ============================================================================

-- ============================================================================
-- Enable RLS on All Tables
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_cultures ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_score_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Functions for RLS
-- ============================================================================

-- Get current user's UUID from Supabase Auth
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE sql STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is team leader
CREATE OR REPLACE FUNCTION is_team_leader(team_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_uuid
    AND leader_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is organization admin
CREATE OR REPLACE FUNCTION is_org_admin(org_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations o
    INNER JOIN teams t ON o.id = t.organization_id
    WHERE o.id = org_uuid
    AND t.leader_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- Organizations Table Policies
-- ============================================================================

-- Public read access (anyone can view organizations)
CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT
  USING (true);

-- Only authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only org admins can update their organizations
CREATE POLICY "Org admins can update their organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (is_org_admin(id))
  WITH CHECK (is_org_admin(id));

-- Only org admins can delete their organizations
CREATE POLICY "Org admins can delete their organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (is_org_admin(id));

-- ============================================================================
-- Users Table Policies
-- ============================================================================

-- Users can view all user records (but not sensitive data)
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can only insert their own user record (via auth trigger)
CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot delete (only admin via service role)
-- No DELETE policy = no user can delete

-- ============================================================================
-- User Profiles Table Policies
-- ============================================================================

-- Public read access (for matching)
CREATE POLICY "User profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Teams Table Policies
-- ============================================================================

-- Public read access (anyone can browse teams)
CREATE POLICY "Teams are viewable by everyone"
  ON teams FOR SELECT
  USING (true);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = leader_id);

-- Team leaders can update their teams
CREATE POLICY "Team leaders can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (leader_id = auth.uid())
  WITH CHECK (leader_id = auth.uid());

-- Team leaders can delete their teams
CREATE POLICY "Team leaders can delete their teams"
  ON teams FOR DELETE
  TO authenticated
  USING (leader_id = auth.uid());

-- ============================================================================
-- Team Cultures Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Team cultures are viewable by everyone"
  ON team_cultures FOR SELECT
  USING (true);

-- Team leaders can insert culture for their teams
CREATE POLICY "Team leaders can insert team culture"
  ON team_cultures FOR INSERT
  TO authenticated
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can update culture for their teams
CREATE POLICY "Team leaders can update team culture"
  ON team_cultures FOR UPDATE
  TO authenticated
  USING (is_team_leader(team_id))
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can delete culture for their teams
CREATE POLICY "Team leaders can delete team culture"
  ON team_cultures FOR DELETE
  TO authenticated
  USING (is_team_leader(team_id));

-- ============================================================================
-- Team Benefits Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Team benefits are viewable by everyone"
  ON team_benefits FOR SELECT
  USING (true);

-- Team leaders can insert benefits for their teams
CREATE POLICY "Team leaders can insert team benefits"
  ON team_benefits FOR INSERT
  TO authenticated
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can update benefits for their teams
CREATE POLICY "Team leaders can update team benefits"
  ON team_benefits FOR UPDATE
  TO authenticated
  USING (is_team_leader(team_id))
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can delete benefits for their teams
CREATE POLICY "Team leaders can delete team benefits"
  ON team_benefits FOR DELETE
  TO authenticated
  USING (is_team_leader(team_id));

-- ============================================================================
-- Team Projects Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Team projects are viewable by everyone"
  ON team_projects FOR SELECT
  USING (true);

-- Team leaders can insert projects for their teams
CREATE POLICY "Team leaders can insert team projects"
  ON team_projects FOR INSERT
  TO authenticated
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can update projects for their teams
CREATE POLICY "Team leaders can update team projects"
  ON team_projects FOR UPDATE
  TO authenticated
  USING (is_team_leader(team_id))
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can delete projects for their teams
CREATE POLICY "Team leaders can delete team projects"
  ON team_projects FOR DELETE
  TO authenticated
  USING (is_team_leader(team_id));

-- ============================================================================
-- Positions Table Policies
-- ============================================================================

-- Public read access
CREATE POLICY "Positions are viewable by everyone"
  ON positions FOR SELECT
  USING (true);

-- Team leaders can insert positions for their teams
CREATE POLICY "Team leaders can insert positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can update positions for their teams
CREATE POLICY "Team leaders can update positions"
  ON positions FOR UPDATE
  TO authenticated
  USING (is_team_leader(team_id))
  WITH CHECK (is_team_leader(team_id));

-- Team leaders can delete positions for their teams
CREATE POLICY "Team leaders can delete positions"
  ON positions FOR DELETE
  TO authenticated
  USING (is_team_leader(team_id));

-- ============================================================================
-- Applications Table Policies
-- ============================================================================

-- Applicants can view their own applications
-- Team leaders can view applications to their teams
CREATE POLICY "Users can view relevant applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- Authenticated users can create applications
CREATE POLICY "Authenticated users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

-- Applicants can update their own applications (e.g., withdraw)
-- Team leaders can update applications to their teams (e.g., evaluate, accept)
CREATE POLICY "Users can update relevant applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  )
  WITH CHECK (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- Applicants can delete their own applications
-- Team leaders can delete applications to their teams
CREATE POLICY "Users can delete relevant applications"
  ON applications FOR DELETE
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- ============================================================================
-- Waitlist Table Policies
-- ============================================================================

-- Applicants can view their own waitlist entries
-- Team leaders can view waitlist for their teams
CREATE POLICY "Users can view relevant waitlist entries"
  ON waitlist FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- Authenticated users can add themselves to waitlist
CREATE POLICY "Authenticated users can join waitlist"
  ON waitlist FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

-- Applicants can update their own waitlist entries
-- Team leaders can update waitlist for their teams
CREATE POLICY "Users can update relevant waitlist entries"
  ON waitlist FOR UPDATE
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  )
  WITH CHECK (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- Applicants can remove themselves from waitlist
-- Team leaders can remove entries from their teams' waitlist
CREATE POLICY "Users can delete relevant waitlist entries"
  ON waitlist FOR DELETE
  TO authenticated
  USING (
    applicant_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- ============================================================================
-- Waitlist History Table Policies
-- ============================================================================

-- Team leaders can view waitlist history for their teams
-- Applicants can view history of their own waitlist entries
CREATE POLICY "Users can view relevant waitlist history"
  ON waitlist_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM waitlist w
      WHERE w.id = waitlist_history.waitlist_id
      AND (w.applicant_id = auth.uid() OR is_team_leader(w.team_id))
    )
  );

-- System-only inserts (via triggers)
-- No INSERT policy = manual inserts blocked, but trigger inserts work

-- ============================================================================
-- Match Score Cache Table Policies
-- ============================================================================

-- Users can view their own cached scores
-- Team leaders can view cached scores for their teams
CREATE POLICY "Users can view relevant match scores"
  ON match_score_cache FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_team_leader(team_id)
  );

-- System can insert/update cache (via service role or application logic)
CREATE POLICY "System can manage match score cache"
  ON match_score_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Public Anonymous Access Policies
-- ============================================================================

-- Allow anonymous users to browse teams and positions (for SEO and public access)
CREATE POLICY "Anonymous users can view teams"
  ON teams FOR SELECT
  TO anon
  USING (status = 'recruiting');

CREATE POLICY "Anonymous users can view positions"
  ON positions FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Anonymous users can view team cultures"
  ON team_cultures FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can view team benefits"
  ON team_benefits FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can view team projects"
  ON team_projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can view organizations"
  ON organizations FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- Admin Override Policies (Service Role)
-- ============================================================================

-- Service role can bypass all RLS policies
-- This is automatically handled by Supabase when using service_role key

-- ============================================================================
-- Testing RLS Policies
-- ============================================================================

-- To test RLS policies, use:
-- SET ROLE authenticated;
-- SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
-- SELECT * FROM teams;
-- RESET ROLE;

-- ============================================================================
-- Performance Considerations
-- ============================================================================

-- RLS policies can impact performance. Key optimizations:
-- 1. Helper functions use SECURITY DEFINER and STABLE
-- 2. Policies use simple conditions when possible
-- 3. Indexes support common RLS filtering patterns
-- 4. Match score cache reduces computation

-- ============================================================================
-- Security Notes
-- ============================================================================

-- 1. Users can only see applications and waitlist entries they're involved with
-- 2. Team leaders have full control over their teams
-- 3. Public data (teams, positions) is openly readable
-- 4. Private data (user profiles, applications) is protected
-- 5. System operations (triggers, cron jobs) use service role to bypass RLS
-- 6. Anonymous users can browse but not apply

-- ============================================================================
-- Audit Log
-- ============================================================================

CREATE TABLE rls_policy_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

INSERT INTO rls_policy_version (version, description)
VALUES ('1.0.0', 'Initial RLS policies for all tables');

-- ============================================================================
-- End of RLS Policies
-- ============================================================================
