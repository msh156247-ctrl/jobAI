import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge';

interface InsightRequest {
  jobId: string;
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  userSkills: string[];
  matchScore: number;
  experience?: string;
  education?: string;
}

interface InsightResponse {
  insight: string;
  tags: string[];
  strengths: string[];
  recommendations: string[];
}

/**
 * AI 매칭 인사이트 생성 API
 * POST /api/ai/insights
 *
 * 사용자의 스킬과 공고의 요구사항을 분석하여
 * 자연어로 매칭 이유를 설명합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const body: InsightRequest = await req.json();
    const {
      jobTitle,
      company,
      requiredSkills,
      userSkills,
      matchScore,
      experience = '',
      education = '',
    } = body;

    // 필수 필드 검증
    if (!jobTitle || !company || !requiredSkills || !userSkills) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 매칭 스킬 계산
    const matchingSkills = userSkills.filter((skill) =>
      requiredSkills.some((req) => req.toLowerCase().includes(skill.toLowerCase()))
    );
    const missingSkills = requiredSkills.filter(
      (skill) => !matchingSkills.some((ms) => ms.toLowerCase().includes(skill.toLowerCase()))
    );

    // AI 프롬프트 구성
    const prompt = `
당신은 IT 채용 전문가입니다. 다음 정보를 바탕으로 구직자에게 이 공고가 왜 적합한지 설명해주세요.

[공고 정보]
- 직무: ${jobTitle}
- 회사: ${company}
- 요구 스킬: ${requiredSkills.join(', ')}
- 매칭 점수: ${matchScore}%

[구직자 정보]
- 보유 스킬: ${userSkills.join(', ')}
- 경력: ${experience || '정보 없음'}
- 학력: ${education || '정보 없음'}

[분석 결과]
- 일치하는 스킬: ${matchingSkills.join(', ') || '없음'}
- 부족한 스킬: ${missingSkills.join(', ') || '없음'}

다음 JSON 형식으로 응답해주세요:
{
  "insight": "2-3문장으로 이 공고가 적합한 이유를 설명 (자연스러운 한국어)",
  "tags": ["강점1", "강점2", "강점3"],
  "strengths": ["구체적 강점 1", "구체적 강점 2"],
  "recommendations": ["개선 방향 1", "개선 방향 2"]
}

친근하고 격려하는 톤으로 작성해주세요.
`;

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 빠르고 저렴한 모델
      messages: [
        {
          role: 'system',
          content:
            '당신은 친절하고 전문적인 IT 채용 컨설턴트입니다. 구직자가 자신감을 가질 수 있도록 격려하면서도 현실적인 조언을 제공합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    const insightData: InsightResponse = JSON.parse(result);

    return NextResponse.json(insightData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('AI Insight 생성 오류:', error);
    return NextResponse.json(
      {
        error: 'AI 인사이트 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
