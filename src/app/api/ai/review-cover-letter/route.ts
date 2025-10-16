import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge';

interface ReviewRequest {
  coverLetter: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
}

interface ReviewResponse {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedSentences: { original: string; improved: string }[];
  keywordAnalysis: {
    presentKeywords: string[];
    missingKeywords: string[];
  };
}

/**
 * AI 자기소개서 리뷰 API
 * POST /api/ai/review-cover-letter
 *
 * GPT-4를 활용하여 자기소개서를 분석하고
 * 점수, 강점, 약점, 개선 제안을 제공합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ReviewRequest = await req.json();
    const { coverLetter, jobTitle, company, jobDescription = '' } = body;

    // 입력 검증
    if (!coverLetter || coverLetter.trim().length === 0) {
      return NextResponse.json(
        { error: '자기소개서 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (coverLetter.length < 50) {
      return NextResponse.json(
        { error: '자기소개서가 너무 짧습니다. 최소 50자 이상 작성해주세요.' },
        { status: 400 }
      );
    }

    if (coverLetter.length > 5000) {
      return NextResponse.json(
        { error: '자기소개서가 너무 깁니다. 5000자 이하로 작성해주세요.' },
        { status: 400 }
      );
    }

    if (!jobTitle || !company) {
      return NextResponse.json(
        { error: '지원 직무와 회사명을 입력해주세요.' },
        { status: 400 }
      );
    }

    // AI 프롬프트 구성
    const prompt = `
당신은 IT 업계에서 15년 경력의 HR 전문가이자 채용 담당자입니다.
다음 자기소개서를 면밀히 분석하고 채용 담당자의 시각에서 평가해주세요.

[지원 정보]
- 회사: ${company}
- 직무: ${jobTitle}
${jobDescription ? `- 직무 설명: ${jobDescription}` : ''}

[자기소개서]
${coverLetter}

---

다음 기준으로 분석하고 **반드시 JSON 형식으로만** 응답해주세요:

1. **점수 (score)**: 0-100점 (채용 가능성을 고려한 종합 점수)
2. **등급 (grade)**: "우수", "양호", "보통", "미흡" 중 하나
3. **강점 (strengths)**: 3-5개의 구체적인 강점 (한 문장씩)
4. **약점 (weaknesses)**: 2-4개의 개선이 필요한 부분 (한 문장씩)
5. **개선 제안 (suggestions)**: 3-5개의 실질적인 개선 방법 (구체적으로)
6. **개선 문장 (improvedSentences)**: 2-3개의 문장을 골라 개선 예시 제시
   - original: 원래 문장
   - improved: 개선된 문장
7. **키워드 분석 (keywordAnalysis)**:
   - presentKeywords: 자기소개서에 잘 포함된 핵심 키워드 3-5개
   - missingKeywords: 추가하면 좋을 키워드 2-4개

평가 기준:
- 구체성: 추상적 표현 대신 구체적 경험과 숫자가 있는가?
- 직무 관련성: 지원 직무와 연관성이 있는가?
- 성과 중심: 단순 업무 나열이 아닌 성과와 기여를 설명하는가?
- 가독성: 문단 구성, 맞춤법, 논리적 흐름이 적절한가?
- 차별화: 다른 지원자와 구별되는 특별한 경험이나 역량이 있는가?

응답 형식 (JSON):
{
  "score": 75,
  "grade": "양호",
  "strengths": ["강점 1", "강점 2", "강점 3"],
  "weaknesses": ["약점 1", "약점 2"],
  "suggestions": ["제안 1", "제안 2", "제안 3"],
  "improvedSentences": [
    {
      "original": "원래 문장",
      "improved": "개선된 문장"
    }
  ],
  "keywordAnalysis": {
    "presentKeywords": ["키워드1", "키워드2"],
    "missingKeywords": ["추가 키워드1", "추가 키워드2"]
  }
}
`;

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // 더 정교한 분석을 위해 gpt-4-turbo 사용
      messages: [
        {
          role: 'system',
          content:
            '당신은 IT 채용 전문가입니다. 자기소개서를 정확하고 건설적으로 평가하며, 지원자가 개선할 수 있도록 구체적인 피드백을 제공합니다. 항상 JSON 형식으로 응답합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    const reviewData: ReviewResponse = JSON.parse(result);

    // 응답 검증
    if (
      typeof reviewData.score !== 'number' ||
      reviewData.score < 0 ||
      reviewData.score > 100
    ) {
      throw new Error('잘못된 점수 형식입니다.');
    }

    return NextResponse.json(reviewData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('자기소개서 리뷰 오류:', error);
    return NextResponse.json(
      {
        error: '자기소개서 리뷰 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
