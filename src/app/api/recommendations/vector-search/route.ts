import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 벡터 유사도 기반 공고 추천 API
 * POST /api/recommendations/vector-search
 *
 * 사용자 프로필 임베딩과 유사한 공고를 검색합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      matchThreshold = 0.5,
      matchCount = 20,
      excludeJobIds = [],
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    // 1. 사용자 임베딩 확인
    const { data: userEmbedding, error: embeddingError } = await supabase
      .from('user_profile_embeddings')
      .select('embedding')
      .eq('user_id', userId)
      .single();

    if (embeddingError || !userEmbedding) {
      return NextResponse.json(
        {
          error: '사용자 임베딩을 찾을 수 없습니다. 먼저 프로필을 분석해주세요.',
          needsEmbedding: true,
        },
        { status: 404 }
      );
    }

    // 2. pgvector 함수로 유사한 공고 검색
    const { data: similarJobs, error: searchError } = await supabase.rpc(
      'get_similar_jobs_for_user',
      {
        target_user_id: userId,
        match_threshold: matchThreshold,
        match_count: matchCount,
      }
    );

    if (searchError) {
      console.error('벡터 검색 오류:', searchError);
      throw new Error(`검색 실패: ${searchError.message}`);
    }

    // 3. 제외할 공고 필터링
    let filteredJobs = similarJobs || [];
    if (excludeJobIds.length > 0) {
      filteredJobs = filteredJobs.filter(
        (job: any) => !excludeJobIds.includes(job.job_id)
      );
    }

    // 4. 추가 공고 정보 조회
    if (filteredJobs.length > 0) {
      const jobIds = filteredJobs.map((job: any) => job.job_id);

      const { data: jobDetails, error: detailsError } = await supabase
        .from('job_postings')
        .select(
          `
          id,
          title,
          description,
          location,
          type,
          salary_min,
          salary_max,
          requirements,
          skills_required,
          industry,
          created_at,
          deadline,
          company_profiles (
            company_name,
            logo_url
          )
        `
        )
        .in('id', jobIds);

      if (detailsError) {
        console.error('공고 상세 조회 오류:', detailsError);
      } else if (jobDetails) {
        // 유사도 점수와 공고 상세 정보 결합
        const enrichedJobs = filteredJobs.map((simJob: any) => {
          const details = jobDetails.find((d) => d.id === simJob.job_id);
          return {
            ...details,
            similarity_score: simJob.similarity_score,
            match_reason: 'vector_embedding',
          };
        });

        return NextResponse.json({
          success: true,
          jobs: enrichedJobs,
          totalCount: enrichedJobs.length,
          matchThreshold,
        });
      }
    }

    return NextResponse.json({
      success: true,
      jobs: filteredJobs,
      totalCount: filteredJobs.length,
      matchThreshold,
    });
  } catch (error) {
    console.error('벡터 검색 API 오류:', error);
    return NextResponse.json(
      {
        error: '벡터 검색에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 특정 공고와 유사한 공고 검색 API
 * GET /api/recommendations/vector-search?jobId={jobId}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const matchThreshold = parseFloat(searchParams.get('matchThreshold') || '0.5');
    const matchCount = parseInt(searchParams.get('matchCount') || '10');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId는 필수입니다.' }, { status: 400 });
    }

    // pgvector 함수로 유사한 공고 검색
    const { data: similarJobs, error: searchError } = await supabase.rpc(
      'get_similar_jobs_to_job',
      {
        target_job_id: jobId,
        match_threshold: matchThreshold,
        match_count: matchCount,
      }
    );

    if (searchError) {
      console.error('유사 공고 검색 오류:', searchError);
      throw new Error(`검색 실패: ${searchError.message}`);
    }

    return NextResponse.json({
      success: true,
      jobs: similarJobs || [],
      totalCount: similarJobs?.length || 0,
    });
  } catch (error) {
    console.error('유사 공고 검색 오류:', error);
    return NextResponse.json(
      {
        error: '유사 공고 검색에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
