'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createChatConversation,
  getConversationMessages,
  sendMessage,
  handleQuickReply,
  markMessageHelpful,
  ChatMessage,
  QuickReply
} from '@/lib/chatbot'
import {
  MessageCircle,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  Maximize2,
  Bot,
  User,
  FileText,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface ChatBotProps {
  initialMessage?: string
  conversationType?: 'job_search' | 'resume_help' | 'interview_prep' | 'career_advice' | 'general'
  context?: any
}

export default function ChatBot({
  initialMessage,
  conversationType = 'general',
  context
}: ChatBotProps) {
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const initializeChat = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Create new conversation
      const newConversationId = await createChatConversation(
        user.id,
        conversationType,
        initialMessage,
        context
      )

      setConversationId(newConversationId)

      // Load initial messages (including the initial message if provided)
      const initialMessages = await getConversationMessages(newConversationId)
      setMessages(initialMessages)

      // If no initial message was provided, send a greeting
      if (!initialMessage) {
        await sendWelcomeMessage(newConversationId)
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendWelcomeMessage = async (convId: string) => {
    try {
      setTyping(true)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate typing delay

      await sendMessage(convId, '안녕하세요! JobAI 채용 도우미입니다. 어떤 도움이 필요하신가요?')

      // Reload messages
      const updatedMessages = await getConversationMessages(convId)
      setMessages(updatedMessages)
    } catch (error) {
      console.error('Failed to send welcome message:', error)
    } finally {
      setTyping(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputMessage.trim() || !conversationId || !user) return

    const messageText = inputMessage.trim()
    setInputMessage('')

    try {
      setTyping(true)

      // Add user message optimistically
      const tempMessage: ChatMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: conversationId,
        sender_type: 'user',
        message_text: messageText,
        message_type: 'text',
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, tempMessage])

      // Send message and get response
      await sendMessage(conversationId, messageText)

      // Reload all messages to get the latest updates
      const updatedMessages = await getConversationMessages(conversationId)
      setMessages(updatedMessages)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== 'temp-' + Date.now()))
    } finally {
      setTyping(false)
    }
  }

  const handleQuickReplyClick = async (reply: QuickReply) => {
    if (!conversationId) return

    try {
      setTyping(true)

      // Add user message for the quick reply
      const tempMessage: ChatMessage = {
        id: 'temp-' + Date.now(),
        conversation_id: conversationId,
        sender_type: 'user',
        message_text: reply.text,
        message_type: 'quick_reply',
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, tempMessage])

      // Handle the quick reply action
      const response = await handleQuickReply(conversationId, reply.payload, user!.id)

      // Add AI response
      const aiMessage: ChatMessage = {
        id: 'ai-' + Date.now(),
        conversation_id: conversationId,
        sender_type: 'ai',
        message_text: response.message,
        message_type: response.type,
        ai_confidence: response.confidence,
        metadata: {
          quickReplies: response.quickReplies,
          suggestions: response.suggestions,
          ...response.metadata
        },
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev.slice(0, -1), tempMessage, aiMessage])
    } catch (error) {
      console.error('Failed to handle quick reply:', error)
    } finally {
      setTyping(false)
    }
  }

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      await markMessageHelpful(messageId, isHelpful)

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_helpful: isHelpful } : msg
        )
      )
    } catch (error) {
      console.error('Failed to mark feedback:', error)
    }
  }

  const handleActionClick = (action: string, url?: string) => {
    if (url) {
      if (url.startsWith('http')) {
        window.open(url, '_blank')
      } else {
        window.location.href = url
      }
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender_type === 'user'
    const isSystem = message.sender_type === 'system'

    return (
      <div key={message.id} className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
          {!isUser && !isSystem && (
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
          )}

          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-100 text-gray-600 text-sm'
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p>{message.message_text}</p>

            {/* Quick Replies */}
            {message.metadata?.quickReplies && (
              <div className="mt-3 space-y-1">
                {message.metadata.quickReplies.map((reply: QuickReply, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReplyClick(reply)}
                    className="block w-full text-left px-2 py-1 text-sm bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {message.metadata?.action && (
              <div className="mt-3">
                <button
                  onClick={() => handleActionClick(message.metadata.action, message.metadata.url)}
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {message.metadata.action === 'upload_resume' && <FileText className="h-3 w-3 mr-1" />}
                  {message.metadata.url && <ExternalLink className="h-3 w-3 mr-1" />}
                  {message.metadata.action === 'open_recommendations' && '추천 보기'}
                  {message.metadata.action === 'upload_resume' && '이력서 업로드'}
                  {message.metadata.action === 'check_schedule' && '일정 확인'}
                </button>
              </div>
            )}

            {/* Suggestions */}
            {message.metadata?.suggestions && (
              <div className="mt-2 text-xs text-gray-500">
                {message.metadata.suggestions.map((suggestion: string, index: number) => (
                  <div key={index}>• {suggestion}</div>
                ))}
              </div>
            )}
          </div>

          {isUser && (
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          )}
        </div>

        {/* Feedback for AI messages */}
        {!isUser && !isSystem && message.sender_type === 'ai' && (
          <div className="flex items-center justify-start mt-2 ml-10 space-x-2">
            <button
              onClick={() => handleFeedback(message.id, true)}
              className={`p-1 rounded ${
                message.is_helpful === true
                  ? 'text-green-600 bg-green-100'
                  : 'text-gray-400 hover:text-green-600'
              }`}
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback(message.id, false)}
              className={`p-1 rounded ${
                message.is_helpful === false
                  ? 'text-red-600 bg-red-100'
                  : 'text-gray-400 hover:text-red-600'
              }`}
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
            {message.ai_confidence && (
              <span className="text-xs text-gray-400">
                신뢰도: {Math.round(message.ai_confidence * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            if (!conversationId) {
              initializeChat()
            }
          }}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${
          isMinimized ? 'w-80' : 'w-96'
        } ${isMinimized ? 'h-16' : 'h-96'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">JobAI 도우미</h4>
              {typing && <span className="text-xs text-gray-500 animate-pulse">입력 중...</span>}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    {typing && (
                      <div className="flex items-start space-x-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading || typing}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading || typing}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  AI 도우미가 24/7 도움을 드립니다
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}