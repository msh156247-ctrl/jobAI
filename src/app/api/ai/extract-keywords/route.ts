import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * POST /api/ai/extract-keywords
 * 경력/경험 설명에서 키워드를 추출합니다
 */
export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: '설명을 입력해주세요' },
        { status: 400 }
      )
    }

    // OpenAI API를 사용하여 키워드 추출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `당신은 채용 공고 분석 전문가입니다. 사용자의 경력 및 경험 설명에서 채용 공고 검색에 유용한 핵심 키워드를 추출하세요.

키워드 추출 규칙:
1. 기술 스택 (예: React, Python, AWS, Docker)
2. 직무 관련 용어 (예: 백엔드, 프론트엔드, 데이터 분석)
3. 업계/도메인 (예: 핀테크, 커머스, 헬스케어)
4. 주요 경험/역할 (예: 팀 리드, 프로젝트 관리, 시스템 설계)
5. 자격증/학위 (예: 정보처리기사, SQLD)

주의사항:
- 너무 일반적인 단어는 제외 (예: "개발", "업무", "경험")
- 구체적이고 검색 가능한 키워드만 추출
- 최대 10개까지만 추출
- 배열 형태로 반환 (JSON 배열만)
- 설명이 없다면 빈 배열 반환

응답 형식: ["키워드1", "키워드2", "키워드3"]`
        },
        {
          role: 'user',
          content: description
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const content = completion.choices[0]?.message?.content?.trim()

    if (!content) {
      return NextResponse.json({ keywords: [] })
    }

    try {
      // JSON 파싱
      const keywords = JSON.parse(content)

      if (!Array.isArray(keywords)) {
        return NextResponse.json({ keywords: [] })
      }

      // 최대 10개로 제한
      const limitedKeywords = keywords.slice(0, 10)

      return NextResponse.json({
        keywords: limitedKeywords,
        originalDescription: description
      })
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // JSON 파싱 실패 시 단순 텍스트에서 키워드 추출 시도
      const fallbackKeywords = content
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 10)

      return NextResponse.json({
        keywords: fallbackKeywords,
        originalDescription: description
      })
    }

  } catch (error) {
    console.error('Keyword extraction error:', error)

    // OpenAI API 키가 없거나 에러가 발생한 경우 간단한 키워드 추출
    const { description } = await request.json()

    // 간단한 키워드 추출 (백업)
    const simpleKeywords = extractSimpleKeywords(description)

    return NextResponse.json({
      keywords: simpleKeywords,
      fallback: true
    })
  }
}

/**
 * 간단한 키워드 추출 (OpenAI 없이)
 */
function extractSimpleKeywords(description: string): string[] {
  const techKeywords = [
    'React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript',
    'Node.js', 'Python', 'Java', 'Spring', 'Django', 'Flask',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'Git', 'CI/CD', 'DevOps', 'Agile', 'Scrum',
    '백엔드', '프론트엔드', '풀스택', '데이터', 'AI', 'ML',
    '모바일', 'iOS', 'Android', 'Swift', 'Kotlin'
  ]

  const found: string[] = []

  techKeywords.forEach(keyword => {
    if (description.toLowerCase().includes(keyword.toLowerCase())) {
      found.push(keyword)
    }
  })

  // 숫자 + 년 패턴 추출 (경력)
  const yearMatch = description.match(/(\d+)\s*년/g)
  if (yearMatch) {
    found.push(...yearMatch)
  }

  return found.slice(0, 10)
}
