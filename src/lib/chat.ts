import { supabase } from './supabase'
import { Database } from '@/types/database'
import { createNewMessageNotification } from './notifications'

export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export interface ChatRoomWithDetails extends ChatRoom {
  applications: {
    id: string
    user_id: string
    job_id: string
    jobs: {
      title: string
      company_profiles: {
        company_name: string
      } | null
    } | null
    profiles: {
      full_name: string | null
      email: string
    } | null
  } | null
}

export interface MessageWithSender extends Message {
  profiles: {
    full_name: string | null
    email: string
  } | null
}

// 채팅룸 생성 또는 기존 룸 조회 (사용자 간 직접 채팅)
export async function getOrCreateChatRoom(companyUserId: string, applicantUserId: string): Promise<ChatRoom> {
  // 두 사용자 간의 기존 채팅룸 확인
  const { data: existingRoom } = await supabase
    .from('chat_rooms')
    .select(`
      *,
      applications (
        user_id,
        jobs (
          company_profiles (
            user_id
          )
        )
      )
    `)
    .or(`applications.user_id.eq.${applicantUserId},applications.jobs.company_profiles.user_id.eq.${companyUserId}`)
    .single()

  if (existingRoom) {
    return existingRoom
  }

  // 지원서를 기반으로 채팅룸 생성하기 위해 지원자의 지원 내역 조회
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      user_id,
      jobs (
        company_profiles (
          user_id
        )
      )
    `)
    .eq('user_id', applicantUserId)
    .eq('jobs.company_profiles.user_id', companyUserId)
    .limit(1)
    .single()

  if (!application) {
    throw new Error('해당 사용자 간의 지원 관계를 찾을 수 없습니다.')
  }

  // 새 채팅룸 생성
  const { data: newRoom, error } = await supabase
    .from('chat_rooms')
    .insert([{ application_id: (application as any).id }] as any)
    .select()
    .single()

  if (error) throw error
  return newRoom
}

// 지원서 기반 채팅룸 생성 또는 조회 (기존 함수 유지)
export async function getOrCreateChatRoomByApplication(applicationId: string): Promise<ChatRoom> {
  // 기존 채팅룸 확인
  const { data: existingRoom } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('application_id', applicationId)
    .single()

  if (existingRoom) {
    return existingRoom
  }

  // 새 채팅룸 생성
  const { data: newRoom, error } = await supabase
    .from('chat_rooms')
    .insert([{ application_id: applicationId }] as any)
    .select()
    .single()

  if (error) throw error
  return newRoom
}

// 사용자의 채팅룸 목록 조회
export async function getUserChatRooms(userId: string, userRole: 'seeker' | 'employer'): Promise<ChatRoomWithDetails[]> {
  let query = supabase
    .from('chat_rooms')
    .select(`
      *,
      applications (
        id,
        user_id,
        job_id,
        jobs (
          title,
          company_profiles (
            company_name
          )
        ),
        profiles (
          full_name,
          email
        )
      )
    `)

  if (userRole === 'seeker') {
    // 구직자의 경우: 자신이 지원한 지원서의 채팅룸
    query = query.eq('applications.user_id', userId)
  } else {
    // 기업의 경우: 자신의 공고에 지원한 지원서의 채팅룸
    query = query.eq('applications.jobs.company_profiles.user_id', userId)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

// 특정 채팅룸의 메시지 조회
export async function getChatMessages(roomId: string): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// 메시지 전송
export async function sendMessage(roomId: string, senderId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        room_id: roomId,
        sender_id: senderId,
        content: content.trim()
      }
    ] as any)
    .select()
    .single()

  if (error) throw error

  // 채팅룸의 updated_at 업데이트
  await (supabase
    .from('chat_rooms') as any)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId)

  // 채팅룸 정보 조회하여 알림 생성
  try {
    const { data: roomData } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        applications (
          user_id,
          jobs (
            title,
            company_profiles (
              user_id,
              company_name
            )
          ),
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq('id', roomId)
      .single()

    if ((roomData as any)?.applications) {
      const application = (roomData as any).applications
      const recipientId = senderId === (application as any).user_id
        ? (application as any).jobs?.company_profiles?.user_id
        : (application as any).user_id

      if (recipientId) {
        // 발신자 정보 조회
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', senderId)
          .single()

        const senderName = (senderProfile as any)?.full_name || (senderProfile as any)?.email || '사용자'
        const jobTitle = (application as any).jobs?.title || '채용공고'

        await createNewMessageNotification(
          recipientId,
          senderName,
          jobTitle,
          content.trim()
        )
      }
    }
  } catch (notificationError) {
    // 알림 생성 실패해도 메시지 전송은 성공으로 처리
    console.error('Failed to create notification:', notificationError)
  }

  return data
}

// 채팅룸 정보 조회 (권한 확인 포함)
export async function getChatRoomWithPermission(roomId: string, userId: string): Promise<ChatRoomWithDetails | null> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select(`
      *,
      applications (
        id,
        user_id,
        job_id,
        jobs (
          title,
          company_id,
          company_profiles (
            company_name,
            user_id
          )
        ),
        profiles (
          full_name,
          email
        )
      )
    `)
    .eq('id', roomId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // 권한 확인
  const application = (data as any).applications
  if (!application) return null

  const isApplicant = (application as any).user_id === userId
  const isCompany = (application as any).jobs?.company_profiles?.user_id === userId

  if (!isApplicant && !isCompany) {
    return null // 권한 없음
  }

  return data
}

// 실시간 메시지 구독
export function subscribeToMessages(roomId: string, callback: (message: MessageWithSender) => void) {
  return supabase
    .channel(`messages:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      async (payload) => {
        // 새 메시지에 대한 sender 정보 조회
        const { data: messageWithSender } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (messageWithSender) {
          callback(messageWithSender)
        }
      }
    )
    .subscribe()
}

// 구독 해제
export function unsubscribeFromMessages(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}