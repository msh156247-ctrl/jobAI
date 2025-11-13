/**
 * ============================================================================
 * JobAI Team Matching System - Database Migration Script
 * ============================================================================
 * Version: 1.0.0
 * Date: 2025-11-13
 * Description: Migrate data from localStorage to Supabase PostgreSQL
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'
import type {
  TeamRecruitment,
  TeamApplication,
  WaitlistEntry
} from '@/types'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for migration

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================================================
// Migration Stats
// ============================================================================

interface MigrationStats {
  startTime: Date
  endTime?: Date
  organizations: { success: number; failed: number; errors: string[] }
  teams: { success: number; failed: number; errors: string[] }
  positions: { success: number; failed: number; errors: string[] }
  team_cultures: { success: number; failed: number; errors: string[] }
  team_benefits: { success: number; failed: number; errors: string[] }
  team_projects: { success: number; failed: number; errors: string[] }
  applications: { success: number; failed: number; errors: string[] }
  waitlist: { success: number; failed: number; errors: string[] }
}

const stats: MigrationStats = {
  startTime: new Date(),
  organizations: { success: 0, failed: 0, errors: [] },
  teams: { success: 0, failed: 0, errors: [] },
  positions: { success: 0, failed: 0, errors: [] },
  team_cultures: { success: 0, failed: 0, errors: [] },
  team_benefits: { success: 0, failed: 0, errors: [] },
  team_projects: { success: 0, failed: 0, errors: [] },
  applications: { success: 0, failed: 0, errors: [] },
  waitlist: { success: 0, failed: 0, errors: [] }
}

// ============================================================================
// Helper Functions
// ============================================================================

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = {
    info: '📘',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[level]

  console.log(`[${timestamp}] ${prefix} ${message}`)
}

function trackError(category: keyof Omit<MigrationStats, 'startTime' | 'endTime'>, error: string) {
  stats[category].failed++
  stats[category].errors.push(error)
}

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * Load data from localStorage (browser environment)
 * Note: This requires running in a browser context with access to localStorage
 */
function loadFromLocalStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available. Run this script in a browser environment.')
  }

  const teams = JSON.parse(localStorage.getItem('jobai_teams') || '[]') as TeamRecruitment[]
  const applications = JSON.parse(localStorage.getItem('jobai_team_applications') || '[]') as TeamApplication[]
  const waitlist = JSON.parse(localStorage.getItem('jobai_team_waitlist') || '[]') as WaitlistEntry[]

  log(`Loaded ${teams.length} teams, ${applications.length} applications, ${waitlist.length} waitlist entries`, 'info')

  return { teams, applications, waitlist }
}

/**
 * Load data from JSON file (Node.js environment)
 */
async function loadFromJSON(filePath: string) {
  const fs = await import('fs')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  log(`Loaded from ${filePath}`, 'info')

  return {
    teams: data.teams || [],
    applications: data.applications || [],
    waitlist: data.waitlist || []
  }
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migrate Organizations
 * Note: Extract unique organizations from teams
 */
async function migrateOrganizations(teams: TeamRecruitment[]) {
  log('Migrating organizations...', 'info')

  // Extract unique organizations
  const organizationsMap = new Map<string, any>()

  for (const team of teams) {
    if (!team.organizationId) continue

    if (!organizationsMap.has(team.organizationId)) {
      organizationsMap.set(team.organizationId, {
        id: team.organizationId,
        name: team.organizationName || 'Unknown Organization',
        description: team.organizationDescription || null,
        industry: team.industry,
        size: 'startup', // Default
        website: team.organizationWebsite || null
      })
    }
  }

  const organizations = Array.from(organizationsMap.values())

  for (const org of organizations) {
    try {
      const { error } = await supabase
        .from('organizations')
        .upsert(org, { onConflict: 'id' })

      if (error) throw error

      stats.organizations.success++
      log(`✓ Organization: ${org.name}`, 'success')
    } catch (error) {
      const errorMsg = `Failed to migrate organization ${org.id}: ${error}`
      trackError('organizations', errorMsg)
      log(errorMsg, 'error')
    }
  }

  log(`Organizations migration completed: ${stats.organizations.success} success, ${stats.organizations.failed} failed`, 'info')
}

/**
 * Migrate Teams
 */
async function migrateTeams(teams: TeamRecruitment[]) {
  log('Migrating teams...', 'info')

  for (const team of teams) {
    try {
      const teamData = {
        id: team.id,
        organization_id: team.organizationId || null,
        name: team.title,
        description: team.description,
        leader_id: team.leaderId,
        team_type: team.teamType,
        industry: team.industry,
        tech_stack: team.techStack,
        location: team.location,
        location_detail: team.locationDetail,
        duration: team.duration,
        schedule: team.schedule,
        total_slots: team.totalSlots,
        filled_slots: team.filledSlots,
        status: team.status || 'recruiting',
        views: team.views || 0,
        applicants_count: team.applicantsCount || 0,
        bookmarks_count: team.bookmarksCount || 0,
        deadline: team.deadline || null
      }

      const { error } = await supabase
        .from('teams')
        .upsert(teamData, { onConflict: 'id' })

      if (error) throw error

      stats.teams.success++
      log(`✓ Team: ${team.title}`, 'success')

      // Migrate related data
      await migrateTeamCulture(team)
      await migrateTeamBenefits(team)
      await migrateTeamProjects(team)
      await migratePositions(team)

    } catch (error) {
      const errorMsg = `Failed to migrate team ${team.id}: ${error}`
      trackError('teams', errorMsg)
      log(errorMsg, 'error')
    }
  }

  log(`Teams migration completed: ${stats.teams.success} success, ${stats.teams.failed} failed`, 'info')
}

/**
 * Migrate Team Cultures
 */
async function migrateTeamCulture(team: TeamRecruitment) {
  if (!team.culture) return

  try {
    const cultureData = {
      team_id: team.id,
      values: team.culture.values || [],
      working_style: team.culture.workingStyle || [],
      communication_style: team.culture.communicationStyle || null,
      meeting_frequency: team.culture.meetingFrequency || null,
      decision_making: team.culture.decisionMaking || null,
      work_life_balance: team.culture.workLifeBalance || null,
      learning_opportunities: team.culture.learningOpportunities || null,
      feedback_culture: team.culture.feedbackCulture || null
    }

    const { error } = await supabase
      .from('team_cultures')
      .upsert(cultureData, { onConflict: 'team_id' })

    if (error) throw error

    stats.team_cultures.success++
  } catch (error) {
    const errorMsg = `Failed to migrate team culture for ${team.id}: ${error}`
    trackError('team_cultures', errorMsg)
    log(errorMsg, 'warn')
  }
}

/**
 * Migrate Team Benefits
 */
async function migrateTeamBenefits(team: TeamRecruitment) {
  if (!team.benefits) return

  try {
    const benefitsData = {
      team_id: team.id,
      salary: team.benefits.salary || null,
      equity: team.benefits.equity || false,
      bonus: team.benefits.bonus || null,
      work_from_home: team.benefits.workFromHome || false,
      flexible_hours: team.benefits.flexibleHours || false,
      meals: team.benefits.meals || false,
      snacks: team.benefits.snacks || false,
      equipment: team.benefits.equipment || false,
      education: team.benefits.education || false,
      conferences: team.benefits.conferences || false,
      books: team.benefits.books || false,
      vacation: team.benefits.vacation || null,
      sick_leave: team.benefits.sickLeave || null,
      other: team.benefits.other || []
    }

    const { error } = await supabase
      .from('team_benefits')
      .upsert(benefitsData, { onConflict: 'team_id' })

    if (error) throw error

    stats.team_benefits.success++
  } catch (error) {
    const errorMsg = `Failed to migrate team benefits for ${team.id}: ${error}`
    trackError('team_benefits', errorMsg)
    log(errorMsg, 'warn')
  }
}

/**
 * Migrate Team Projects
 */
async function migrateTeamProjects(team: TeamRecruitment) {
  if (!team.currentProjects || team.currentProjects.length === 0) return

  for (const project of team.currentProjects) {
    try {
      const projectData = {
        id: project.id,
        team_id: team.id,
        name: project.name,
        description: project.description || null,
        progress: project.progress || 0,
        status: project.status || 'planning',
        start_date: project.startDate || null,
        end_date: project.endDate || null,
        tech_stack: project.techStack || [],
        repository_url: project.repositoryUrl || null,
        demo_url: project.demoUrl || null
      }

      const { error } = await supabase
        .from('team_projects')
        .upsert(projectData, { onConflict: 'id' })

      if (error) throw error

      stats.team_projects.success++
    } catch (error) {
      const errorMsg = `Failed to migrate project ${project.id} for team ${team.id}: ${error}`
      trackError('team_projects', errorMsg)
      log(errorMsg, 'warn')
    }
  }
}

/**
 * Migrate Positions
 */
async function migratePositions(team: TeamRecruitment) {
  if (!team.positions || team.positions.length === 0) return

  for (const position of team.positions) {
    try {
      const positionData = {
        id: position.id,
        team_id: team.id,
        title: position.title,
        description: position.description || null,
        required_count: position.requiredCount,
        filled_count: position.filledCount,
        required_skills: position.requiredSkills || [],
        preferred_skills: position.preferredSkills || [],
        responsibilities: position.responsibilities || [],
        urgency: position.urgency || 3,
        recruitment_reason: position.recruitmentReason || null,
        expected_start_date: position.expectedStartDate || null,
        is_active: position.isActive !== false // Default true
      }

      const { error } = await supabase
        .from('positions')
        .upsert(positionData, { onConflict: 'id' })

      if (error) throw error

      stats.positions.success++
    } catch (error) {
      const errorMsg = `Failed to migrate position ${position.id} for team ${team.id}: ${error}`
      trackError('positions', errorMsg)
      log(errorMsg, 'warn')
    }
  }
}

/**
 * Migrate Applications
 */
async function migrateApplications(applications: TeamApplication[]) {
  log('Migrating applications...', 'info')

  for (const app of applications) {
    try {
      const applicationData = {
        id: app.id,
        team_id: app.teamId,
        position_id: app.positionId,
        applicant_id: app.applicantId,
        motivation: app.motivation || null,
        relevant_experience: app.relevantExperience || null,
        available_time: app.availableTime || null,
        portfolio_links: app.portfolioLinks || [],
        custom_answers: app.customAnswers || [],
        match_score: app.matchScore || 0,
        match_details: app.matchDetails || null,
        status: app.status || 'submitted',
        evaluation: app.evaluation || null,
        evaluated_by: app.evaluatedBy || null,
        evaluated_at: app.evaluatedAt || null,
        created_at: app.createdAt || new Date().toISOString()
      }

      const { error } = await supabase
        .from('applications')
        .upsert(applicationData, { onConflict: 'id' })

      if (error) throw error

      stats.applications.success++
      log(`✓ Application: ${app.id}`, 'success')
    } catch (error) {
      const errorMsg = `Failed to migrate application ${app.id}: ${error}`
      trackError('applications', errorMsg)
      log(errorMsg, 'error')
    }
  }

  log(`Applications migration completed: ${stats.applications.success} success, ${stats.applications.failed} failed`, 'info')
}

/**
 * Migrate Waitlist
 */
async function migrateWaitlist(waitlist: WaitlistEntry[]) {
  log('Migrating waitlist...', 'info')

  for (const entry of waitlist) {
    try {
      const waitlistData = {
        id: entry.id,
        team_id: entry.teamId,
        position_id: entry.positionId,
        applicant_id: entry.applicantId,
        applicant_name: entry.applicantName,
        match_score: entry.matchScore,
        applied_at: entry.appliedAt || new Date().toISOString(),
        team_priority: entry.teamPriority || null,
        position_urgency: entry.positionUrgency || 5,
        status: entry.status || 'active',
        last_activity_at: entry.lastActivityAt || new Date().toISOString(),
        expires_at: entry.expiresAt || null,
        notified: entry.notified || false,
        notified_at: entry.notifiedAt || null,
        created_at: entry.createdAt || new Date().toISOString()
      }

      const { error } = await supabase
        .from('waitlist')
        .upsert(waitlistData, { onConflict: 'id' })

      if (error) throw error

      stats.waitlist.success++
      log(`✓ Waitlist entry: ${entry.id}`, 'success')
    } catch (error) {
      const errorMsg = `Failed to migrate waitlist entry ${entry.id}: ${error}`
      trackError('waitlist', errorMsg)
      log(errorMsg, 'error')
    }
  }

  log(`Waitlist migration completed: ${stats.waitlist.success} success, ${stats.waitlist.failed} failed`, 'info')
}

// ============================================================================
// Export Data Function
// ============================================================================

/**
 * Export localStorage data to JSON file
 * Run this in browser console to export data
 */
export function exportLocalStorageToJSON() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    throw new Error('This function must be run in a browser environment')
  }

  const data = {
    teams: JSON.parse(localStorage.getItem('jobai_teams') || '[]'),
    applications: JSON.parse(localStorage.getItem('jobai_team_applications') || '[]'),
    waitlist: JSON.parse(localStorage.getItem('jobai_team_waitlist') || '[]'),
    exportedAt: new Date().toISOString()
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `jobai-data-export-${Date.now()}.json`
  a.click()

  URL.revokeObjectURL(url)

  log('Data exported successfully', 'success')
  return data
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Run the complete migration
 *
 * Usage:
 * - Browser: await runMigration('localStorage')
 * - Node.js: await runMigration('file', './data-export.json')
 */
export async function runMigration(
  source: 'localStorage' | 'file',
  filePath?: string
) {
  log('='.repeat(80), 'info')
  log('JobAI Database Migration Started', 'info')
  log('='.repeat(80), 'info')

  try {
    // Load data
    let data: { teams: TeamRecruitment[]; applications: TeamApplication[]; waitlist: WaitlistEntry[] }

    if (source === 'localStorage') {
      data = loadFromLocalStorage()
    } else if (source === 'file' && filePath) {
      data = await loadFromJSON(filePath)
    } else {
      throw new Error('Invalid source or missing filePath')
    }

    // Run migrations in order
    await migrateOrganizations(data.teams)
    await migrateTeams(data.teams)
    await migrateApplications(data.applications)
    await migrateWaitlist(data.waitlist)

    stats.endTime = new Date()

    // Print summary
    log('='.repeat(80), 'info')
    log('Migration Summary', 'info')
    log('='.repeat(80), 'info')
    log(`Duration: ${((stats.endTime.getTime() - stats.startTime.getTime()) / 1000).toFixed(2)}s`, 'info')
    log('', 'info')

    for (const [category, result] of Object.entries(stats)) {
      if (category === 'startTime' || category === 'endTime') continue

      const { success, failed, errors } = result as { success: number; failed: number; errors: string[] }
      const total = success + failed

      if (total === 0) continue

      const status = failed === 0 ? '✅' : '⚠️'
      log(`${status} ${category}: ${success}/${total} successful`, failed === 0 ? 'success' : 'warn')

      if (errors.length > 0 && errors.length <= 5) {
        errors.forEach(error => log(`  - ${error}`, 'error'))
      } else if (errors.length > 5) {
        log(`  - ${errors.length} errors (first 5 shown):`, 'error')
        errors.slice(0, 5).forEach(error => log(`  - ${error}`, 'error'))
      }
    }

    log('='.repeat(80), 'info')
    log('Migration Completed!', 'success')
    log('='.repeat(80), 'info')

    return stats

  } catch (error) {
    log(`Migration failed: ${error}`, 'error')
    throw error
  }
}

// ============================================================================
// CLI Entry Point (for Node.js usage)
// ============================================================================

if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2)
  const filePath = args[0]

  if (!filePath) {
    console.error('Usage: ts-node migrate.ts <path-to-json-file>')
    process.exit(1)
  }

  runMigration('file', filePath)
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
