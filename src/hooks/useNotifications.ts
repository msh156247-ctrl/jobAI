'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  type Notification
} from '@/lib/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const subscriptionRef = useRef<any>(null)

  // 알림 목록 로드
  const loadNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const [notificationList, count] = await Promise.all([
        getUserNotifications(user.id, 50),
        getUnreadNotificationCount(user.id)
      ])

      setNotifications(notificationList)
      setUnreadCount(count)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 읽지 않은 알림 개수만 로드
  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const count = await getUnreadNotificationCount(user.id)
      setUnreadCount(count)
    } catch (err: any) {
      console.error('Error loading unread count:', err)
    }
  }

  // 알림을 읽음으로 표시
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)

      // 로컬 상태 업데이트
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      )

      // 읽지 않은 개수 업데이트
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.id)

      // 로컬 상태 업데이트
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      setUnreadCount(0)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 새 알림 추가 (실시간)
  const addNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])

    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1)
    }

    // 브라우저 알림 표시 (권한이 있을 때만)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    }

    // 소리 재생 (선택사항)
    playNotificationSound()
  }

  // 알림 소리 재생
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // 소리 재생 실패 시 무시 (사용자 상호작용 없이 재생할 수 없는 경우)
      })
    } catch (error) {
      // 소리 파일이 없거나 재생할 수 없는 경우 무시
    }
  }

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  // 실시간 구독 설정
  useEffect(() => {
    if (user) {
      loadNotifications()

      // 실시간 알림 구독
      subscriptionRef.current = subscribeToNotifications(user.id, addNewNotification)
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromNotifications(subscriptionRef.current)
      }
    }
  }, [user])

  // 브라우저 알림 권한 요청 (컴포넌트 마운트 시)
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission
  }
}