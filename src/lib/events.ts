import { supabase } from './supabase'
import { Database } from '@/types/database'

export type Event = Database['public']['Tables']['events']['Row']
// export type EventRegistration = Database['public']['Tables']['event_registrations']['Row']
// export type EventSession = Database['public']['Tables']['event_sessions']['Row']
export type EventRegistration = any
export type EventSession = any

export interface EventWithCompany extends Event {
  company_profiles?: {
    company_name: string
    location?: string
  }
  registration_count?: number
  user_registration?: EventRegistration
}

export interface EventWithDetails extends EventWithCompany {
  event_sessions: EventSession[]
  registrations?: EventRegistration[]
}

export interface EventFormData {
  title: string
  description: string
  event_type: 'job_fair' | 'webinar' | 'networking' | 'workshop' | 'conference' | 'interview_session'
  start_date: string
  end_date: string
  timezone: string
  is_online: boolean
  location_name?: string
  location_address?: string
  meeting_url?: string
  meeting_password?: string
  max_participants?: number
  registration_deadline?: string
  requires_approval: boolean
  registration_fee: number
  tags: string[]
  requirements: string[]
  contact_email?: string
  contact_phone?: string
  image_url?: string
  external_url?: string
}

export interface RegistrationFormData {
  registration_data?: any
}

// Get published events with optional filters
export async function getEvents(filters?: {
  event_type?: string
  is_online?: boolean
  tags?: string[]
  date_from?: string
  date_to?: string
  limit?: number
}): Promise<EventWithCompany[]> {
  let query = supabase
    .from('events')
    .select(`
      *,
      company_profiles:company_id (
        company_name,
        location
      )
    `)
    .eq('status', 'published')
    .gte('end_date', new Date().toISOString())

  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type)
  }

  if (filters?.is_online !== undefined) {
    query = query.eq('is_online', filters.is_online)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  if (filters?.date_from) {
    query = query.gte('start_date', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('start_date', filters.date_to)
  }

  const { data, error } = await query
    .order('start_date', { ascending: true })
    .limit(filters?.limit || 50)

  if (error) throw error

  // Get registration counts
  if (data && data.length > 0) {
    const eventIds = (data as any).map((event: any) => event.id)
    const { data: registrationCounts } = await supabase
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .in('status', ['approved', 'attended'])

    // Add registration counts to events
    return (data as any).map((event: any) => ({
      ...event,
      registration_count: (registrationCounts as any)?.filter((r: any) => r.event_id === event.id).length || 0
    }))
  }

  return data || []
}

// Get single event with full details
export async function getEvent(eventId: string, userId?: string): Promise<EventWithDetails | null> {
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      company_profiles:company_id (
        company_name,
        location
      ),
      event_sessions (*)
    `)
    .eq('id', eventId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Get registration count
  const { data: registrationCounts } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)

  const registrationCount = (registrationCounts as any)?.filter((r: any) => ['approved', 'attended'].includes(r.status)).length || 0

  // Get user's registration if userId provided
  let userRegistration: EventRegistration | undefined
  if (userId) {
    const { data: userReg } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    userRegistration = userReg || undefined
  }

  return {
    ...(event as any),
    registration_count: registrationCount,
    user_registration: userRegistration,
    registrations: registrationCounts
  }
}

// Get company's events
export async function getCompanyEvents(companyId: string): Promise<EventWithCompany[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      company_profiles:company_id (
        company_name,
        location
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get registration counts for each event
  if (data && data.length > 0) {
    const eventIds = (data as any).map((event: any) => event.id)
    const { data: registrationCounts } = await supabase
      .from('event_registrations')
      .select('event_id, status')
      .in('event_id', eventIds)

    return (data as any).map((event: any) => ({
      ...event,
      registration_count: (registrationCounts as any)?.filter(
        (r: any) => r.event_id === event.id && ['approved', 'attended'].includes(r.status)
      ).length || 0
    }))
  }

  return data || []
}

// Create new event
export async function createEvent(companyId: string, eventData: EventFormData): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        company_id: companyId,
        title: eventData.title.trim(),
        description: eventData.description?.trim() || null,
        event_type: eventData.event_type,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        timezone: eventData.timezone,
        is_online: eventData.is_online,
        location_name: eventData.location_name?.trim() || null,
        location_address: eventData.location_address?.trim() || null,
        meeting_url: eventData.meeting_url?.trim() || null,
        meeting_password: eventData.meeting_password?.trim() || null,
        max_participants: eventData.max_participants || null,
        registration_deadline: eventData.registration_deadline || null,
        requires_approval: eventData.requires_approval,
        registration_fee: eventData.registration_fee,
        tags: eventData.tags,
        requirements: eventData.requirements,
        contact_email: eventData.contact_email?.trim() || null,
        contact_phone: eventData.contact_phone?.trim() || null,
        image_url: eventData.image_url?.trim() || null,
        external_url: eventData.external_url?.trim() || null,
        status: 'draft'
      }
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// Update event
export async function updateEvent(eventId: string, eventData: Partial<EventFormData>): Promise<Event> {
  const updateData: any = {}

  Object.keys(eventData).forEach(key => {
    const value = eventData[key as keyof EventFormData]
    if (value !== undefined) {
      updateData[key] = typeof value === 'string' && value.trim ? value.trim() : value
    }
  })

  if (Object.keys(updateData).length === 0) {
    throw new Error('No data to update')
  }

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await (supabase
    .from('events') as any)
    .update(updateData)
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// Delete event
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

// Publish event
export async function publishEvent(eventId: string): Promise<Event> {
  const { data, error } = await (supabase
    .from('events') as any)
    .update({ status: 'published' })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// Register for event
export async function registerForEvent(
  eventId: string,
  userId: string,
  registrationData?: any
): Promise<EventRegistration> {
  // Check if user can register
  const { data: canRegister, error: checkError } = await supabase
    .rpc('can_register_for_event', {
      event_uuid: eventId,
      user_uuid: userId
    } as any)

  if (checkError) throw checkError
  if (!canRegister) {
    throw new Error('이 이벤트에 등록할 수 없습니다.')
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .insert([
      {
        event_id: eventId,
        user_id: userId,
        registration_data: registrationData || null,
        status: 'pending'
      }
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// Update registration status (for organizers)
export async function updateRegistrationStatus(
  registrationId: string,
  status: 'pending' | 'approved' | 'rejected' | 'attended' | 'no_show' | 'cancelled',
  adminNotes?: string
): Promise<EventRegistration> {
  const updateData: any = { status }
  if (adminNotes) updateData.admin_notes = adminNotes.trim()
  if (status === 'approved') updateData.approved_at = new Date().toISOString()
  if (status === 'attended') updateData.attended_at = new Date().toISOString()

  const { data, error } = await (supabase
    .from('event_registrations') as any)
    .update(updateData)
    .eq('id', registrationId)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// Get user's event registrations
export async function getUserEventRegistrations(userId: string): Promise<(EventRegistration & {
  events: EventWithCompany
})[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      events (
        *,
        company_profiles:company_id (
          company_name,
          location
        )
      )
    `)
    .eq('user_id', userId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get event registrations (for organizers)
export async function getEventRegistrations(eventId: string): Promise<(EventRegistration & {
  profiles: {
    full_name: string | null
    email: string
  }
})[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get trending events
export async function getTrendingEvents(limit: number = 6): Promise<EventWithCompany[]> {
  const { data, error } = await supabase
    .from('event_stats')
    .select(`
      event_id,
      title,
      company_id,
      event_type,
      start_date,
      total_registrations,
      approved_registrations,
      events!inner (
        *,
        company_profiles:company_id (
          company_name,
          location
        )
      )
    `)
    .eq('events.status', 'published')
    .gte('events.start_date', new Date().toISOString())
    .order('total_registrations', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data as any)?.map((item: any) => ({
    ...item.events,
    registration_count: item.total_registrations
  })) || []
}

// Utility functions
export function formatEventDate(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startStr = start.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })

  const startTime = start.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const endTime = end.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (start.toDateString() === end.toDateString()) {
    return `${startStr} ${startTime} - ${endTime}`
  } else {
    const endStr = end.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
    return `${startStr} ${startTime} - ${endStr} ${endTime}`
  }
}

export function getEventTypeLabel(type: string): string {
  const labels = {
    job_fair: '채용 박람회',
    webinar: '웨비나',
    networking: '네트워킹',
    workshop: '워크샵',
    conference: '컨퍼런스',
    interview_session: '면접 세션'
  }
  return labels[type as keyof typeof labels] || type
}

export function getEventStatusLabel(status: string): string {
  const labels = {
    draft: '초안',
    published: '공개',
    ongoing: '진행 중',
    completed: '완료',
    cancelled: '취소'
  }
  return labels[status as keyof typeof labels] || status
}

export function getRegistrationStatusLabel(status: string): string {
  const labels = {
    pending: '대기 중',
    approved: '승인됨',
    rejected: '거절됨',
    attended: '참석함',
    no_show: '불참',
    cancelled: '취소됨'
  }
  return labels[status as keyof typeof labels] || status
}