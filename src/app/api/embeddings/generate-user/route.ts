import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 사용자 프로필 임베딩 생성 API
 * POST /api/embeddings/generate-user
 *
 * 사용자 프로필을 OpenAI 임베딩으로 변환하여 Supabase에 저장합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, skills, experience, education, preferredIndustries, bio } =
      await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    // 1. 사용자 프로필을 텍스트로 결합
    const profileText = createProfileText({
      skills,
      experience,
      education,
      preferredIndustries,
      bio,
    });

    // 2. OpenAI 임베딩 생성
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: profileText,
      encoding_format: 'float',
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 3. Supabase에 저장 (upsert)
    const { data, error } = await supabase
      .from('user_profile_embeddings')
      .upsert(
        {
          user_id: userId,
          embedding: embedding,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase 저장 오류:', error);
      throw new Error(`임베딩 저장 실패: ${error.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        userId,
        embeddingId: data.id,
        dimension: embedding.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('사용자 임베딩 생성 오류:', error);
    return NextResponse.json(
      {
        error: '사용자 임베딩 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자 프로필을 임베딩용 텍스트로 변환
 */
function createProfileText(profile: {
  skills?: string[];
  experience?: string;
  education?: string;
  preferredIndustries?: string[];
  bio?: string;
}): string {
  const parts: string[] = [];

  // 스킬 (가장 중요)
  if (profile.skills && profile.skills.length > 0) {
    parts.push(`보유 스킬: ${profile.skills.join(', ')}`);
  }

  // 경력
  if (profile.experience) {
    parts.push(`경력: ${profile.experience}`);
  }

  // 학력
  if (profile.education) {
    parts.push(`학력: ${profile.education}`);
  }

  // 선호 업종
  if (profile.preferredIndustries && profile.preferredIndustries.length > 0) {
    parts.push(`관심 업종: ${profile.preferredIndustries.join(', ')}`);
  }

  // 자기소개
  if (profile.bio) {
    const shortBio = profile.bio.substring(0, 300);
    parts.push(`소개: ${shortBio}`);
  }

  return parts.join('\n');
}
