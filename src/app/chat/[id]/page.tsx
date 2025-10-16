'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  getChatRoomWithPermission,
  getChatMessages,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  ChatRoomWithDetails,
  MessageWithSender
} from '@/lib/chat'
import Link from 'next/link'

interface ChatPageProps {
  params: {
    id: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [chatRoom, setChatRoom] = useState<ChatRoomWithDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<ReturnType<typeof subscribeToMessages> | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && profile) {
      loadChatRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, params.id])

  useEffect(() => {
    if (chatRoom) {
      loadMessages()
      setupRealtimeSubscription()
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromMessages(subscriptionRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatRoom = async () => {
    if (!user) return

    try {
      setLoading(true)
      const room = await getChatRoomWithPermission(params.id, user.id)

      if (!room) {
        setError('채팅룸을 찾을 수 없거나 접근 권한이 없습니다.')
        return
      }

      setChatRoom(room)
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅룸을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const messageList = await getChatMessages(params.id)
      setMessages(messageList)
    } catch (err) {
      console.error('Error loading messages:', err instanceof Error ? err.message : err)
    }
  }

  const setupRealtimeSubscription = () => {
    subscriptionRef.current = subscribeToMessages(params.id, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user || !chatRoom || sending) return

    setSending(true)
    try {
      await sendMessage(params.id, user.id, newMessage.trim())
      setNewMessage('')
    } catch (err) {
      alert(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getChatPartnerName = () => {
    if (!chatRoom?.applications) return '알 수 없음'

    if (profile?.role === 'employer') {
      return chatRoom.applications.profiles?.full_name || chatRoom.applications.profiles?.email || '지원자'
    } else {
      return chatRoom.applications.jobs?.company_profiles?.company_name || '회사'
    }
  }

  const getJobTitle = () => {
    return chatRoom?.applications?.jobs?.title || '채용공고'
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()

    if (date.toDateString() === today.toDateString()) {
      return '오늘'
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === yesterday.toDateString()) {
      return '어제'
    }

    return date.toLocaleDateString('ko-KR')
  }

  const shouldShowDateSeparator = (currentMessage: MessageWithSender, previousMessage: MessageWithSender | null) => {
    if (!previousMessage) return true

    const currentDate = new Date(currentMessage.created_at).toDateString()
    const previousDate = new Date(previousMessage.created_at).toDateString()

    return currentDate !== previousDate
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!user || error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error || '채팅룸을 불러올 수 없습니다.'}</p>
          <Link href="/chat" className="text-blue-600 hover:text-blue-800">
            채팅 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  if (!chatRoom) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/chat"
                className="text-gray-600 hover:text-gray-900"
              >
                ← 채팅 목록
              </Link>
              <div className="border-l border-gray-300 h-6"></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getChatPartnerName()}
                </h2>
                <p className="text-sm text-gray-600">{getJobTitle()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-600">● 온라인</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-gray-500">
                  첫 번째 메시지를 보내서 대화를 시작해보세요!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const previousMessage = index > 0 ? messages[index - 1] : null
                const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                const isOwnMessage = message.sender_id === user.id

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {formatMessageDate(message.created_at)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs lg:max-w-md">
                        {!isOwnMessage && (
                          <div className="text-sm text-gray-500 mb-1">
                            {message.profiles?.full_name || message.profiles?.email || '사용자'}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 shadow'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div
                          className={`text-xs text-gray-500 mt-1 ${
                            isOwnMessage ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 메시지 입력 폼 */}
          <div className="bg-white border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '전송 중...' : '전송'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}