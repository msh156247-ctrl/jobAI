// Interview scheduling and management utilities
import { supabase } from './supabase'
import { AIInterviewAssistant, AIInterviewQuestion } from './ai'

export interface InterviewSchedule {
  id: string
  application_id: string
  interviewer_id?: string
  candidate_id: string
  job_id: string
  interview_type: 'phone_screening' | 'technical' | 'behavioral' | 'final' | 'group'
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  scheduled_date: string
  duration_minutes: number
  location?: string
  is_online: boolean
  interview_questions?: AIInterviewQuestion[]
  candidate_answers?: any
  interviewer_notes?: string
  overall_rating?: number
  ai_generated: boolean
  ai_evaluation?: any
  reminder_sent_at?: string
  created_at: string
  updated_at: string
}

export interface InterviewWithDetails extends InterviewSchedule {
  applications: {
    id: string
    status: string
  }
  jobs: {
    id: string
    title: string
    company_id: string
    company_profiles: {
      company_name: string
    }
  }
  candidates: {
    id: string
    full_name: string
    email: string
  }
  interviewers?: {
    id: string
    full_name: string
    email: string
  }
}

export interface CreateInterviewData {
  application_id: string
  interviewer_id?: string
  interview_type: InterviewSchedule['interview_type']
  scheduled_date: string
  duration_minutes?: number
  location?: string
  is_online?: boolean
  generate_ai_questions?: boolean
}

export interface RescheduleInterviewData {
  scheduled_date: string
  location?: string
  reason?: string
}

// Create interview schedule
export async function createInterviewSchedule(
  interviewData: CreateInterviewData
): Promise<InterviewSchedule> {
  try {
    // Get application details to extract candidate_id and job_id
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        user_id,
        job_id,
        jobs (
          id,
          title,
          company_id
        )
      `)
      .eq('id', interviewData.application_id)
      .single()

    if (appError || !application) {
      throw new Error('지원서를 찾을 수 없습니다.')
    }

    // Prepare interview schedule data
    const scheduleData = {
      application_id: interviewData.application_id,
      interviewer_id: interviewData.interviewer_id,
      candidate_id: (application as any).user_id,
      job_id: (application as any).job_id,
      interview_type: interviewData.interview_type,
      scheduled_date: interviewData.scheduled_date,
      duration_minutes: interviewData.duration_minutes || 60,
      location: interviewData.location,
      is_online: interviewData.is_online !== false, // default to online
      ai_generated: interviewData.generate_ai_questions || false,
      status: 'scheduled'
    }

    // Create interview schedule
    const { data: interview, error } = await supabase
      .from('interview_schedules')
      .insert([scheduleData] as any)
      .select()
      .single()

    if (error) throw error

    // Generate AI questions if requested
    if (interviewData.generate_ai_questions) {
      try {
        const questions = await AIInterviewAssistant.generateInterviewQuestions(
          (application as any).job_id,
          (application as any).user_id,
          10
        )

        // Update interview with generated questions
        await (supabase
          .from('interview_schedules') as any)
          .update({ interview_questions: questions })
          .eq('id', (interview as any).id)

        ;(interview as any).interview_questions = questions
      } catch (questionError) {
        console.error('AI question generation failed:', questionError)
        // Continue without AI questions
      }
    }

    // Update application status
    await (supabase
      .from('applications') as any)
      .update({
        status: 'interview_scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewData.application_id)

    return interview as any
  } catch (error) {
    console.error('Failed to create interview schedule:', error)
    throw error
  }
}

// Get interview schedule by ID
export async function getInterviewSchedule(scheduleId: string): Promise<InterviewWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        applications (
          id,
          status
        ),
        jobs (
          id,
          title,
          company_id,
          company_profiles (
            company_name
          )
        ),
        candidates:profiles!interview_schedules_candidate_id_fkey (
          id,
          full_name,
          email
        ),
        interviewers:profiles!interview_schedules_interviewer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', scheduleId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to get interview schedule:', error)
    return null
  }
}

// Get interviews for a candidate
export async function getCandidateInterviews(candidateId: string): Promise<InterviewWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        applications (
          id,
          status
        ),
        jobs (
          id,
          title,
          company_id,
          company_profiles (
            company_name
          )
        ),
        interviewers:profiles!interview_schedules_interviewer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('candidate_id', candidateId)
      .order('scheduled_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get candidate interviews:', error)
    return []
  }
}

// Get interviews for an interviewer
export async function getInterviewerSchedule(interviewerId: string): Promise<InterviewWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        applications (
          id,
          status
        ),
        jobs (
          id,
          title,
          company_id,
          company_profiles (
            company_name
          )
        ),
        candidates:profiles!interview_schedules_candidate_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('interviewer_id', interviewerId)
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get interviewer schedule:', error)
    return []
  }
}

// Get company interviews
export async function getCompanyInterviews(companyId: string): Promise<InterviewWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        applications (
          id,
          status
        ),
        jobs!inner (
          id,
          title,
          company_id,
          company_profiles (
            company_name
          )
        ),
        candidates:profiles!interview_schedules_candidate_id_fkey (
          id,
          full_name,
          email
        ),
        interviewers:profiles!interview_schedules_interviewer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('jobs.company_id', companyId)
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get company interviews:', error)
    return []
  }
}

// Update interview status
export async function updateInterviewStatus(
  scheduleId: string,
  status: InterviewSchedule['status'],
  notes?: string,
  rating?: number
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (notes) updateData.interviewer_notes = notes
    if (rating) updateData.overall_rating = rating

    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update(updateData)
      .eq('id', scheduleId)

    if (error) throw error

    // Update application status based on interview result
    if (status === 'completed') {
      const interview = await getInterviewSchedule(scheduleId)
      if (interview) {
        let applicationStatus = 'interview_completed'

        if (rating) {
          applicationStatus = rating >= 4 ? 'interview_passed' : 'interview_failed'
        }

        await (supabase
          .from('applications') as any)
          .update({
            status: applicationStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', (interview as any).application_id)
      }
    }
  } catch (error) {
    console.error('Failed to update interview status:', error)
    throw error
  }
}

// Reschedule interview
export async function rescheduleInterview(
  scheduleId: string,
  rescheduleData: RescheduleInterviewData
): Promise<void> {
  try {
    const updateData = {
      scheduled_date: rescheduleData.scheduled_date,
      location: rescheduleData.location,
      status: 'rescheduled' as const,
      updated_at: new Date().toISOString()
    }

    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update(updateData)
      .eq('id', scheduleId)

    if (error) throw error

    // TODO: Send notification to candidate and interviewer
  } catch (error) {
    console.error('Failed to reschedule interview:', error)
    throw error
  }
}

// Cancel interview
export async function cancelInterview(scheduleId: string, reason?: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update({
        status: 'cancelled',
        interviewer_notes: reason || 'Interview cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    if (error) throw error

    // Update application status
    const interview = await getInterviewSchedule(scheduleId)
    if (interview) {
      await (supabase
        .from('applications') as any)
        .update({
          status: 'interview_cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', interview.application_id)
    }
  } catch (error) {
    console.error('Failed to cancel interview:', error)
    throw error
  }
}

// Confirm interview attendance
export async function confirmInterviewAttendance(scheduleId: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to confirm interview:', error)
    throw error
  }
}

// Start interview (mark as in progress)
export async function startInterview(scheduleId: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to start interview:', error)
    throw error
  }
}

// Complete interview with evaluation
export async function completeInterview(
  scheduleId: string,
  evaluation: {
    rating: number
    notes: string
    answers?: any
    ai_evaluation?: any
  }
): Promise<void> {
  try {
    const updateData = {
      status: 'completed' as const,
      overall_rating: evaluation.rating,
      interviewer_notes: evaluation.notes,
      candidate_answers: evaluation.answers,
      ai_evaluation: evaluation.ai_evaluation,
      updated_at: new Date().toISOString()
    }

    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update(updateData)
      .eq('id', scheduleId)

    if (error) throw error

    // Update application status based on rating
    const interview = await getInterviewSchedule(scheduleId)
    if (interview) {
      const applicationStatus = evaluation.rating >= 4 ? 'interview_passed' : 'interview_failed'

      await (supabase
        .from('applications') as any)
        .update({
          status: applicationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', (interview as any).application_id)
    }
  } catch (error) {
    console.error('Failed to complete interview:', error)
    throw error
  }
}

// Get upcoming interviews (for reminders)
export async function getUpcomingInterviews(hours: number = 24): Promise<InterviewWithDetails[]> {
  try {
    const now = new Date()
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('interview_schedules')
      .select(`
        *,
        applications (
          id,
          status
        ),
        jobs (
          id,
          title,
          company_id,
          company_profiles (
            company_name
          )
        ),
        candidates:profiles!interview_schedules_candidate_id_fkey (
          id,
          full_name,
          email
        ),
        interviewers:profiles!interview_schedules_interviewer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .gte('scheduled_date', now.toISOString())
      .lte('scheduled_date', futureTime.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .is('reminder_sent_at', null)
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get upcoming interviews:', error)
    return []
  }
}

// Mark reminder as sent
export async function markReminderSent(scheduleId: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('interview_schedules') as any)
      .update({
        reminder_sent_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to mark reminder sent:', error)
    throw error
  }
}

// Generate automated interview questions
export async function generateInterviewQuestions(
  jobId: string,
  candidateId?: string,
  interviewType: InterviewSchedule['interview_type'] = 'technical',
  questionCount: number = 10
): Promise<AIInterviewQuestion[]> {
  try {
    const questions = await AIInterviewAssistant.generateInterviewQuestions(
      jobId,
      candidateId,
      questionCount
    )

    // Filter questions based on interview type
    const filteredQuestions = questions.filter(q => {
      switch (interviewType) {
        case 'phone_screening':
          return ['behavioral', 'company_culture'].includes(q.type)
        case 'technical':
          return ['technical', 'situational'].includes(q.type)
        case 'behavioral':
          return ['behavioral', 'situational'].includes(q.type)
        case 'final':
          return ['company_culture', 'behavioral'].includes(q.type)
        default:
          return true
      }
    })

    return filteredQuestions.slice(0, questionCount)
  } catch (error) {
    console.error('Failed to generate interview questions:', error)

    // Return default questions based on type
    return AIInterviewAssistant['getDefaultInterviewQuestions'](questionCount)
  }
}

// Evaluate interview answer using AI
export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  jobContext?: any
): Promise<{
  score: number
  feedback: string[]
  suggestions: string[]
}> {
  try {
    return await AIInterviewAssistant.evaluateAnswer(question, answer, jobContext)
  } catch (error) {
    console.error('Failed to evaluate answer:', error)

    // Basic fallback evaluation
    return {
      score: 50,
      feedback: ['답변이 기록되었습니다.'],
      suggestions: ['더 구체적인 예시를 포함해보세요.']
    }
  }
}

// Interview statistics for companies
export async function getInterviewStats(companyId: string): Promise<{
  total: number
  completed: number
  upcoming: number
  cancelled: number
  averageRating: number
  byType: Record<InterviewSchedule['interview_type'], number>
}> {
  try {
    const interviews = await getCompanyInterviews(companyId)

    const stats = {
      total: interviews.length,
      completed: interviews.filter(i => i.status === 'completed').length,
      upcoming: interviews.filter(i =>
        ['scheduled', 'confirmed'].includes(i.status) &&
        new Date(i.scheduled_date) > new Date()
      ).length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
      averageRating: 0,
      byType: {
        phone_screening: 0,
        technical: 0,
        behavioral: 0,
        final: 0,
        group: 0
      } as Record<InterviewSchedule['interview_type'], number>
    }

    // Calculate average rating
    const completedWithRating = interviews.filter(i => i.status === 'completed' && i.overall_rating)
    if (completedWithRating.length > 0) {
      const totalRating = completedWithRating.reduce((sum, i) => sum + (i.overall_rating || 0), 0)
      stats.averageRating = totalRating / completedWithRating.length
    }

    // Count by type
    interviews.forEach(interview => {
      stats.byType[interview.interview_type]++
    })

    return stats
  } catch (error) {
    console.error('Failed to get interview stats:', error)
    return {
      total: 0,
      completed: 0,
      upcoming: 0,
      cancelled: 0,
      averageRating: 0,
      byType: {
        phone_screening: 0,
        technical: 0,
        behavioral: 0,
        final: 0,
        group: 0
      }
    }
  }
}

// Time slot availability check
export async function checkInterviewSlotAvailability(
  interviewerId: string,
  date: string,
  durationMinutes: number = 60
): Promise<boolean> {
  try {
    const startTime = new Date(date)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

    const { data, error } = await supabase
      .from('interview_schedules')
      .select('scheduled_date, duration_minutes')
      .eq('interviewer_id', interviewerId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('scheduled_date', startTime.toISOString())
      .lte('scheduled_date', endTime.toISOString())

    if (error) throw error

    // Check for conflicts
    return !data || data.length === 0
  } catch (error) {
    console.error('Failed to check slot availability:', error)
    return false
  }
}

// Suggest available time slots
export async function suggestAvailableSlots(
  interviewerId: string,
  preferredDate: string,
  durationMinutes: number = 60,
  maxSuggestions: number = 5
): Promise<string[]> {
  try {
    const preferredDateTime = new Date(preferredDate)
    const suggestions: string[] = []

    // Try slots within the same day first
    const startHour = 9 // 9 AM
    const endHour = 18 // 6 PM

    for (let hour = startHour; hour < endHour && suggestions.length < maxSuggestions; hour++) {
      const slotDate = new Date(preferredDateTime)
      slotDate.setHours(hour, 0, 0, 0)

      const available = await checkInterviewSlotAvailability(
        interviewerId,
        slotDate.toISOString(),
        durationMinutes
      )

      if (available) {
        suggestions.push(slotDate.toISOString())
      }
    }

    // If not enough slots on preferred date, try next few days
    if (suggestions.length < maxSuggestions) {
      for (let dayOffset = 1; dayOffset <= 7 && suggestions.length < maxSuggestions; dayOffset++) {
        for (let hour = startHour; hour < endHour && suggestions.length < maxSuggestions; hour++) {
          const slotDate = new Date(preferredDateTime)
          slotDate.setDate(slotDate.getDate() + dayOffset)
          slotDate.setHours(hour, 0, 0, 0)

          // Skip weekends
          if (slotDate.getDay() === 0 || slotDate.getDay() === 6) continue

          const available = await checkInterviewSlotAvailability(
            interviewerId,
            slotDate.toISOString(),
            durationMinutes
          )

          if (available) {
            suggestions.push(slotDate.toISOString())
          }
        }
      }
    }

    return suggestions
  } catch (error) {
    console.error('Failed to suggest available slots:', error)
    return []
  }
}