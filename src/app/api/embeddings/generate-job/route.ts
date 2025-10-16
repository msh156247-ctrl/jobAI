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
 * 공고 임베딩 생성 API
 * POST /api/embeddings/generate-job
 *
 * 공고 정보를 OpenAI 임베딩으로 변환하여 Supabase에 저장합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const { jobId, jobTitle, description, requirements, skills, industry } = await req.json();

    if (!jobId || !jobTitle) {
      return NextResponse.json(
        { error: 'jobId와 jobTitle은 필수입니다.' },
        { status: 400 }
      );
    }

    // 1. 공고 정보를 텍스트로 결합
    const jobText = createJobText({
      jobTitle,
      description,
      requirements,
      skills,
      industry,
    });

    // 2. OpenAI 임베딩 생성
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: jobText,
      encoding_format: 'float',
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 3. Supabase에 저장 (upsert: 있으면 업데이트, 없으면 생성)
    const { data, error } = await supabase
      .from('job_embeddings')
      .upsert(
        {
          job_id: jobId,
          embedding: embedding,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'job_id',
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
        jobId,
        embeddingId: data.id,
        dimension: embedding.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('임베딩 생성 오류:', error);
    return NextResponse.json(
      {
        error: '임베딩 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 공고 정보를 임베딩용 텍스트로 변환
 */
function createJobText(job: {
  jobTitle: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  industry?: string;
}): string {
  const parts: string[] = [];

  // 직무명 (가장 중요)
  parts.push(`직무: ${job.jobTitle}`);

  // 업종
  if (job.industry) {
    parts.push(`업종: ${job.industry}`);
  }

  // 스킬 (중요도 높음)
  if (job.skills && job.skills.length > 0) {
    parts.push(`요구 스킬: ${job.skills.join(', ')}`);
  }

  // 자격 요건
  if (job.requirements && job.requirements.length > 0) {
    parts.push(`자격 요건: ${job.requirements.join(', ')}`);
  }

  // 설명 (요약)
  if (job.description) {
    const shortDescription = job.description.substring(0, 500);
    parts.push(`설명: ${shortDescription}`);
  }

  return parts.join('\n');
}

/**
 * 배치 임베딩 생성 API
 * POST /api/embeddings/generate-job (배치 모드)
 */
export async function PUT(req: NextRequest) {
  try {
    const { limit = 100 } = await req.json();

    // 1. 임베딩이 없는 공고 조회
    const { data: jobs, error: fetchError } = await supabase
      .from('job_postings')
      .select('id, title, description, requirements, skills_required, industry')
      .is('deleted_at', null)
      .limit(limit);

    if (fetchError) {
      throw new Error(`공고 조회 실패: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: '처리할 공고가 없습니다.',
        processedCount: 0,
      });
    }

    // 2. 기존 임베딩 확인
    const { data: existingEmbeddings } = await supabase
      .from('job_embeddings')
      .select('job_id')
      .in(
        'job_id',
        jobs.map((j) => j.id)
      );

    const existingJobIds = new Set(existingEmbeddings?.map((e) => e.job_id) || []);

    // 3. 임베딩이 없는 공고만 필터링
    const jobsToProcess = jobs.filter((job) => !existingJobIds.has(job.id));

    if (jobsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: '모든 공고에 이미 임베딩이 존재합니다.',
        processedCount: 0,
      });
    }

    // 4. 배치 임베딩 생성
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const job of jobsToProcess) {
      try {
        const jobText = createJobText({
          jobTitle: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills_required,
          industry: job.industry,
        });

        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: jobText,
          encoding_format: 'float',
        });

        const embedding = embeddingResponse.data[0].embedding;

        const { error: insertError } = await supabase.from('job_embeddings').insert({
          job_id: job.id,
          embedding: embedding,
        });

        if (insertError) {
          throw insertError;
        }

        successCount++;
        results.push({ jobId: job.id, status: 'success' });
      } catch (error) {
        failCount++;
        results.push({
          jobId: job.id,
          status: 'failed',
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: jobsToProcess.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('배치 임베딩 생성 오류:', error);
    return NextResponse.json(
      {
        error: '배치 임베딩 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
