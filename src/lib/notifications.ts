import { supabase } from './supabase'
import { Database } from '@/types/database'

export type Notification = Database['public']['Tables']['notifications']['Row']

export interface NotificationWithDetails extends Notification {
  profiles?: {
    full_name: string | null
    email: string
  } | null
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  metadata?: any
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title: title.trim(),
        message: message.trim(),
        type,
        metadata: metadata || null,
        is_read: false
      }
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await (supabase
    .from('notifications') as any)
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await (supabase
    .from('notifications') as any)
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count || 0
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}

// 지원 상태 변경 알림 생성
export async function createApplicationStatusNotification(
  userId: string,
  jobTitle: string,
  companyName: string,
  newStatus: string
) {
  const statusMessages = {
    pending: {
      title: '지원 접수 완료',
      message: `${companyName}의 "${jobTitle}" 채용공고에 지원이 접수되었습니다.`,
      type: 'application_submitted'
    },
    reviewed: {
      title: '서류 전형 통과! 🎉',
      message: `${companyName}의 "${jobTitle}" 서류 전형을 통과하셨습니다!`,
      type: 'application_reviewed'
    },
    interview: {
      title: '면접 일정 예정 📞',
      message: `${companyName}의 "${jobTitle}" 면접이 예정되어 있습니다.`,
      type: 'interview_scheduled'
    },
    accepted: {
      title: '최종 합격! 축하합니다! 🎉',
      message: `${companyName}의 "${jobTitle}"에 최종 합격하셨습니다!`,
      type: 'application_accepted'
    },
    rejected: {
      title: '지원 결과 안내',
      message: `${companyName}의 "${jobTitle}" 지원 결과를 확인해주세요.`,
      type: 'application_rejected'
    }
  }

  const notification = statusMessages[newStatus as keyof typeof statusMessages]
  if (notification) {
    await createNotification(
      userId,
      notification.title,
      notification.message,
      notification.type,
      { jobTitle, companyName, status: newStatus }
    )
  }
}

// 새 메시지 알림 생성
export async function createNewMessageNotification(
  recipientId: string,
  senderName: string,
  jobTitle: string,
  messagePreview: string
) {
  const title = '새 메시지 도착 💬'
  const message = `${senderName}님이 "${jobTitle}" 관련해서 메시지를 보냈습니다: "${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}"`

  await createNotification(
    recipientId,
    title,
    message,
    'new_message',
    { senderName, jobTitle, messagePreview }
  )
}

// 새 지원자 알림 생성 (기업용)
export async function createNewApplicationNotification(
  companyUserId: string,
  applicantName: string,
  jobTitle: string
) {
  const title = '새 지원자 도착! 📋'
  const message = `${applicantName}님이 "${jobTitle}" 공고에 지원했습니다.`

  await createNotification(
    companyUserId,
    title,
    message,
    'new_application',
    { applicantName, jobTitle }
  )
}

// 실시간 알림 구독
export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Notification)
      }
    )
    .subscribe()
}

// 구독 해제
export function unsubscribeFromNotifications(subscription: any) {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}

// 알림 타입별 아이콘 반환
export function getNotificationIcon(type: string): string {
  const iconMap = {
    application_submitted: '📝',
    application_reviewed: '✅',
    interview_scheduled: '📞',
    application_accepted: '🎉',
    application_rejected: '📄',
    new_message: '💬',
    new_application: '📋',
    system: '🔔',
    default: '📢'
  }
  return iconMap[type as keyof typeof iconMap] || iconMap.default
}

// 알림 타입별 색상 반환
export function getNotificationColor(type: string): string {
  const colorMap = {
    application_submitted: 'text-blue-600',
    application_reviewed: 'text-green-600',
    interview_scheduled: 'text-purple-600',
    application_accepted: 'text-green-600',
    application_rejected: 'text-red-600',
    new_message: 'text-blue-600',
    new_application: 'text-orange-600',
    system: 'text-gray-600'
  }
  return colorMap[type as keyof typeof colorMap] || 'text-gray-600'
}