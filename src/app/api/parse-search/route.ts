import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface ParsedFilters {
  skills?: string[]
  location?: string
  workType?: string
  experienceMin?: number
  experienceMax?: number
  salaryMin?: number
  salaryMax?: number
  keywords?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `당신은 채용 공고 검색 쿼리를 파싱하는 AI입니다.
사용자의 자연어 검색 쿼리를 받아서 구조화된 필터로 변환합니다.

다음 필터 형식으로 응답하세요:
- skills: 기술 스택 배열 (예: ["React", "TypeScript", "Node.js"])
- location: 근무 지역 (예: "서울", "경기", "부산" 등)
- workType: 근무 형태 (onsite: 사무실, remote: 원격, dispatch: 파견 중 하나)
- experienceMin: 최소 경력 (년)
- experienceMax: 최대 경력 (년)
- salaryMin: 최소 연봉 (만원 단위)
- salaryMax: 최대 연봉 (만원 단위)
- keywords: 기타 키워드 배열

반드시 JSON 형식으로만 응답하세요. 설명이나 추가 텍스트 없이 JSON만 반환하세요.

예시:
입력: "신입 백엔드 개발자 리모트 가능한 곳"
출력: {"skills": ["백엔드"], "workType": "remote", "experienceMin": 0, "experienceMax": 2}

입력: "3년차 프론트엔드 React 서울"
출력: {"skills": ["프론트엔드", "React"], "location": "서울", "experienceMin": 3, "experienceMax": 5}

입력: "연봉 5000만원 이상 DevOps 엔지니어"
출력: {"skills": ["DevOps"], "salaryMin": 5000}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    let parsedFilters: ParsedFilters
    try {
      parsedFilters = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText)
      // 파싱 실패 시 빈 필터 반환
      parsedFilters = {}
    }

    // 필터 값 검증 및 정규화
    const normalizedFilters: ParsedFilters = {}

    if (parsedFilters.skills && Array.isArray(parsedFilters.skills)) {
      normalizedFilters.skills = parsedFilters.skills.filter(s => typeof s === 'string')
    }

    if (parsedFilters.location && typeof parsedFilters.location === 'string') {
      normalizedFilters.location = parsedFilters.location
    }

    if (parsedFilters.workType) {
      const validWorkTypes = ['onsite', 'remote', 'dispatch']
      // 한글 -> 영문 변환
      const workTypeMap: Record<string, string> = {
        '사무실': 'onsite',
        '출근': 'onsite',
        '원격': 'remote',
        '리모트': 'remote',
        '재택': 'remote',
        '파견': 'dispatch'
      }
      const workType = workTypeMap[parsedFilters.workType] || parsedFilters.workType
      if (validWorkTypes.includes(workType)) {
        normalizedFilters.workType = workType
      }
    }

    if (typeof parsedFilters.experienceMin === 'number' && parsedFilters.experienceMin >= 0) {
      normalizedFilters.experienceMin = parsedFilters.experienceMin
    }

    if (typeof parsedFilters.experienceMax === 'number' && parsedFilters.experienceMax >= 0) {
      normalizedFilters.experienceMax = parsedFilters.experienceMax
    }

    if (typeof parsedFilters.salaryMin === 'number' && parsedFilters.salaryMin >= 0) {
      normalizedFilters.salaryMin = parsedFilters.salaryMin
    }

    if (typeof parsedFilters.salaryMax === 'number' && parsedFilters.salaryMax >= 0) {
      normalizedFilters.salaryMax = parsedFilters.salaryMax
    }

    if (parsedFilters.keywords && Array.isArray(parsedFilters.keywords)) {
      normalizedFilters.keywords = parsedFilters.keywords.filter(k => typeof k === 'string')
    }

    return NextResponse.json({
      query,
      filters: normalizedFilters
    })

  } catch (error) {
    console.error('Error parsing search query:', error)
    return NextResponse.json(
      { error: 'Failed to parse search query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
