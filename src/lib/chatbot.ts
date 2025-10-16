// AI Chatbot support system
import { supabase } from './supabase'

export interface ChatConversation {
  id: string
  user_id: string
  conversation_type: 'job_search' | 'resume_help' | 'interview_prep' | 'career_advice' | 'general'
  status: 'active' | 'closed' | 'transferred_to_human'
  title?: string
  context?: any
  created_at: string
  updated_at: string
  last_activity_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: 'user' | 'ai' | 'system'
  message_text: string
  message_type: 'text' | 'quick_reply' | 'file' | 'action'
  ai_confidence?: number
  ai_model?: string
  ai_processing_time_ms?: number
  metadata?: any
  is_helpful?: boolean
  created_at: string
}

export interface QuickReply {
  text: string
  payload: string
}

export interface ChatResponse {
  message: string
  type: 'text' | 'quick_reply' | 'action'
  quickReplies?: QuickReply[]
  confidence: number
  suggestions?: string[]
  metadata?: any
}

// Create new chat conversation
export async function createChatConversation(
  userId: string,
  conversationType: ChatConversation['conversation_type'] = 'general',
  initialMessage?: string,
  context?: any
): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('create_chat_conversation', {
        user_uuid: userId,
        conversation_type_param: conversationType,
        initial_message: initialMessage,
        context_data: context
      } as any)

    if (error) throw error

    return data
  } catch (error) {
    console.error('Failed to create chat conversation:', error)
    throw error
  }
}

// Get user conversations
export async function getUserConversations(userId: string): Promise<ChatConversation[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get conversations:', error)
    return []
  }
}

// Get conversation messages
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get messages:', error)
    return []
  }
}

// Send message and get AI response
export async function sendMessage(
  conversationId: string,
  message: string,
  messageType: 'text' | 'quick_reply' | 'action' = 'text'
): Promise<ChatMessage> {
  try {
    // Save user message
    const { data: userMessage, error: userError } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender_type: 'user',
        message_text: message,
        message_type: messageType
      }] as any)
      .select()
      .single()

    if (userError) throw userError

    // Get AI response
    const aiResponse = await getAIResponse(conversationId, message)

    // Save AI message
    const { data: aiMessage, error: aiError } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender_type: 'ai',
        message_text: aiResponse.message,
        message_type: aiResponse.type,
        ai_confidence: aiResponse.confidence,
        ai_model: 'chatbot-v1',
        metadata: {
          quickReplies: aiResponse.quickReplies,
          suggestions: aiResponse.suggestions,
          ...aiResponse.metadata
        }
      }] as any)
      .select()
      .single()

    if (aiError) throw aiError

    return aiMessage
  } catch (error) {
    console.error('Failed to send message:', error)
    throw error
  }
}

// Get AI response (with fallback logic)
async function getAIResponse(conversationId: string, userMessage: string): Promise<ChatResponse> {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_AI_API_URL || '/api/ai'

  try {
    // Get conversation context
    const [conversation, messages] = await Promise.all([
      supabase.from('chat_conversations').select('*').eq('id', conversationId).single(),
      supabase.from('chat_messages').select('*').eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }).limit(10)
    ])

    const response = await fetch(`${API_ENDPOINT}/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        conversation_type: (conversation as any).data?.conversation_type,
        context: (conversation as any).data?.context,
        history: (messages as any).data || []
      })
    })

    if (!response.ok) {
      throw new Error('AI API response failed')
    }

    const aiResponse: ChatResponse = await response.json()
    return aiResponse
  } catch (error) {
    console.error('AI response failed, using fallback:', error)

    // Fallback to rule-based responses
    return getFallbackResponse(userMessage)
  }
}

// Fallback rule-based chatbot responses
function getFallbackResponse(message: string): ChatResponse {
  const lowerMessage = message.toLowerCase()

  // Job search related
  if (lowerMessage.includes('채용') || lowerMessage.includes('구직') || lowerMessage.includes('취업')) {
    return {
      message: '채용 정보를 찾고 계시는군요! 다음 중 어떤 도움이 필요하신가요?',
      type: 'quick_reply',
      confidence: 0.8,
      quickReplies: [
        { text: '채용공고 검색', payload: 'search_jobs' },
        { text: 'AI 맞춤 추천', payload: 'ai_recommendations' },
        { text: '지원 현황 확인', payload: 'application_status' }
      ]
    }
  }

  // Resume related
  if (lowerMessage.includes('이력서') || lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
    return {
      message: '이력서 관련 도움을 드릴게요. 어떤 부분이 궁금하신가요?',
      type: 'quick_reply',
      confidence: 0.8,
      quickReplies: [
        { text: '이력서 분석', payload: 'analyze_resume' },
        { text: '이력서 작성 팁', payload: 'resume_tips' },
        { text: '스킬 추천', payload: 'skill_recommendations' }
      ]
    }
  }

  // Interview related
  if (lowerMessage.includes('면접') || lowerMessage.includes('interview')) {
    return {
      message: '면접 준비에 도움을 드릴게요! 다음 중 필요한 것을 선택해주세요.',
      type: 'quick_reply',
      confidence: 0.8,
      quickReplies: [
        { text: '면접 질문 연습', payload: 'practice_interview' },
        { text: '면접 일정 확인', payload: 'interview_schedule' },
        { text: '면접 준비 팁', payload: 'interview_tips' }
      ]
    }
  }

  // Career advice
  if (lowerMessage.includes('커리어') || lowerMessage.includes('진로') || lowerMessage.includes('career')) {
    return {
      message: '커리어 고민이 있으시군요. 어떤 부분에서 도움이 필요하신지 알려주세요.',
      type: 'quick_reply',
      confidence: 0.7,
      quickReplies: [
        { text: '커리어 패스 상담', payload: 'career_path' },
        { text: '스킬 발전 방향', payload: 'skill_development' },
        { text: '이직 준비', payload: 'job_change_prep' }
      ]
    }
  }

  // Greetings
  if (lowerMessage.includes('안녕') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    return {
      message: '안녕하세요! JobAI 채용 도우미입니다. 어떤 도움이 필요하신가요?',
      type: 'quick_reply',
      confidence: 0.9,
      quickReplies: [
        { text: '채용공고 검색', payload: 'search_jobs' },
        { text: '이력서 도움', payload: 'resume_help' },
        { text: '면접 준비', payload: 'interview_prep' },
        { text: '커리어 상담', payload: 'career_advice' }
      ]
    }
  }

  // Default response
  return {
    message: '죄송해요, 정확히 이해하지 못했어요. 좀 더 구체적으로 설명해주시거나, 아래 옵션 중 하나를 선택해주세요.',
    type: 'quick_reply',
    confidence: 0.3,
    quickReplies: [
      { text: '채용공고 찾기', payload: 'search_jobs' },
      { text: '이력서 도움', payload: 'resume_help' },
      { text: '면접 준비', payload: 'interview_prep' },
      { text: '상담원 연결', payload: 'human_support' }
    ],
    suggestions: [
      '더 구체적으로 질문해보세요',
      '키워드를 포함해서 질문해보세요',
      '예시: "React 개발자 채용공고를 찾고 싶어요"'
    ]
  }
}

// Handle quick reply actions
export async function handleQuickReply(
  conversationId: string,
  payload: string,
  userId: string
): Promise<ChatResponse> {
  switch (payload) {
    case 'search_jobs':
      return {
        message: '어떤 종류의 채용공고를 찾고 계신가요? 직무나 기술 스택을 알려주세요.',
        type: 'text',
        confidence: 1.0,
        suggestions: ['예: Frontend 개발자', '예: React, Node.js 개발자', '예: 마케팅 관리자']
      }

    case 'ai_recommendations':
      return {
        message: 'AI가 분석한 맞춤 채용 추천을 확인해보세요! 프로필 정보를 기반으로 최적의 채용공고를 찾아드립니다.',
        type: 'action',
        confidence: 1.0,
        metadata: { action: 'open_recommendations', url: '/ai-recommendations' }
      }

    case 'analyze_resume':
      return {
        message: '이력서를 업로드하시면 AI가 분석해서 개선점을 알려드릴게요. 이력서 파일을 첨부해주세요.',
        type: 'action',
        confidence: 1.0,
        metadata: { action: 'upload_resume' }
      }

    case 'resume_tips':
      return {
        message: '효과적인 이력서 작성 팁을 알려드릴게요:\n\n1. 핵심 경험과 성과를 수치로 표현하세요\n2. 지원 직무와 관련된 키워드를 포함하세요\n3. 간결하고 명확한 문장을 사용하세요\n4. 최신 경험을 먼저 배치하세요\n\n더 자세한 가이드를 확인하시겠어요?',
        type: 'quick_reply',
        confidence: 1.0,
        quickReplies: [
          { text: '자세한 가이드', payload: 'detailed_resume_guide' },
          { text: '이력서 분석 받기', payload: 'analyze_resume' }
        ]
      }

    case 'practice_interview':
      return {
        message: '면접 연습을 도와드릴게요! 어떤 종류의 면접을 준비하고 계신가요?',
        type: 'quick_reply',
        confidence: 1.0,
        quickReplies: [
          { text: '기술 면접', payload: 'tech_interview' },
          { text: '인성 면접', payload: 'behavioral_interview' },
          { text: '임원 면접', payload: 'executive_interview' }
        ]
      }

    case 'interview_schedule':
      return {
        message: '면접 일정을 확인해드릴게요. 예정된 면접이나 지원 현황을 보시겠어요?',
        type: 'action',
        confidence: 1.0,
        metadata: { action: 'check_schedule', url: '/dashboard' }
      }

    case 'human_support':
      return {
        message: '상담원 연결을 요청하셨습니다. 잠시만 기다려주세요. 평균 대기시간은 3-5분입니다.',
        type: 'text',
        confidence: 1.0,
        metadata: { transferToHuman: true }
      }

    default:
      return {
        message: '선택하신 옵션에 대한 자세한 도움을 준비 중입니다. 조금만 기다려주세요.',
        type: 'text',
        confidence: 0.5
      }
  }
}

// Mark message as helpful/unhelpful
export async function markMessageHelpful(messageId: string, isHelpful: boolean): Promise<void> {
  try {
    const { error } = await (supabase
      .from('chat_messages') as any)
      .update({ is_helpful: isHelpful })
      .eq('id', messageId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to mark message helpful:', error)
    throw error
  }
}

// Close conversation
export async function closeConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('chat_conversations') as any)
      .update({
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to close conversation:', error)
    throw error
  }
}

// Get conversation by ID
export async function getConversation(conversationId: string): Promise<ChatConversation | null> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to get conversation:', error)
    return null
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  try {
    const { error } = await (supabase
      .from('chat_conversations') as any)
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to update conversation title:', error)
    throw error
  }
}

// Search conversations
export async function searchConversations(
  userId: string,
  query: string,
  type?: ChatConversation['conversation_type']
): Promise<ChatConversation[]> {
  try {
    let queryBuilder = supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)

    if (type) {
      queryBuilder = queryBuilder.eq('conversation_type', type)
    }

    const { data, error } = await queryBuilder
      .order('last_activity_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to search conversations:', error)
    return []
  }
}

// Generate conversation summary
export async function generateConversationSummary(conversationId: string): Promise<string> {
  try {
    const messages = await getConversationMessages(conversationId)

    if (messages.length === 0) {
      return '대화 없음'
    }

    // Simple rule-based summary for now
    const userMessages = messages.filter(m => m.sender_type === 'user')
    const lastMessage = messages[messages.length - 1]

    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].message_text
      if (firstUserMessage.length > 50) {
        return firstUserMessage.substring(0, 50) + '...'
      }
      return firstUserMessage
    }

    return lastMessage.message_text.substring(0, 50) + '...'
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return '요약 생성 실패'
  }
}

// Chat analytics for admin/insights
// TEMPORARILY DISABLED DUE TO TypeScript COMPILATION ISSUES
export async function getChatAnalytics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<any> {
  return null
  /* try {
    const startDate = new Date()
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    const conversations: any = await supabase
      .from('chat_conversations')
      .select('conversation_type, status, created_at')
      .gte('created_at', startDate.toISOString())

    const messages: any = await supabase
      .from('chat_messages')
      .select('sender_type, ai_confidence, is_helpful, created_at')
      .gte('created_at', startDate.toISOString())

    const analyticsData: any = {}
    analyticsData.totalConversations = conversations.data?.length || 0
    analyticsData.conversationsByType = {} as Record<string, number>
    analyticsData.totalMessages = messages.data?.length || 0
    analyticsData.userMessages = messages.data?.filter((m: any) => m.sender_type === 'user').length || 0
    analyticsData.aiMessages = messages.data?.filter((m: any) => m.sender_type === 'ai').length || 0
    analyticsData.helpfulRating = 0
    analyticsData.averageConfidence = 0

    // Group conversations by type
    (conversations as any).data?.forEach((conv: any) => {
      analyticsData.conversationsByType[conv.conversation_type] =
        (analyticsData.conversationsByType[conv.conversation_type] || 0) + 1
    })

    // Calculate helpful rating
    const ratedMessages = (messages as any).data?.filter((m: any) => m.is_helpful !== null) || []
    if (ratedMessages.length > 0) {
      const helpfulMessages = ratedMessages.filter((m: any) => m.is_helpful === true).length
      analyticsData.helpfulRating = (helpfulMessages / ratedMessages.length) * 100
    }

    // Calculate average confidence
    const aiMessagesWithConfidence = (messages as any).data?.filter((m: any) =>
      m.sender_type === 'ai' && m.ai_confidence !== null
    ) || []

    if (aiMessagesWithConfidence.length > 0) {
      const totalConfidence = aiMessagesWithConfidence.reduce((sum: number, m: any) =>
        sum + (m.ai_confidence || 0), 0
      )
      analyticsData.averageConfidence = (totalConfidence / aiMessagesWithConfidence.length) * 100
    }

    return analyticsData
  } catch (error) {
    console.error('Failed to get chat analytics:', error)
    return null
  } */
}