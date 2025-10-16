import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 기업용 AI 후보자 매칭 API
 * POST /api/employer/candidates
 *
 * 공고에 적합한 후보자를 벡터 유사도 기반으로 추천합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      jobId,
      matchThreshold = 0.5,
      matchCount = 20,
      minExperience,
      requiredSkills,
    } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId는 필수입니다.' }, { status: 400 });
    }

    // 1. 공고 임베딩 확인
    const { data: jobEmbedding, error: embeddingError } = await supabase
      .from('job_embeddings')
      .select('embedding')
      .eq('job_id', jobId)
      .single();

    if (embeddingError || !jobEmbedding) {
      return NextResponse.json(
        {
          error: '공고 임베딩을 찾을 수 없습니다. 먼저 공고를 분석해주세요.',
          needsEmbedding: true,
        },
        { status: 404 }
      );
    }

    // 2. pgvector 함수로 적합한 후보자 검색
    const { data: matchingCandidates, error: searchError } = await supabase.rpc(
      'get_matching_candidates_for_job',
      {
        target_job_id: jobId,
        match_threshold: matchThreshold,
        match_count: matchCount * 2, // 필터링 후 충분한 수를 유지하기 위해 2배 조회
      }
    );

    if (searchError) {
      console.error('후보자 검색 오류:', searchError);
      throw new Error(`검색 실패: ${searchError.message}`);
    }

    if (!matchingCandidates || matchingCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        candidates: [],
        totalCount: 0,
        message: '매칭되는 후보자가 없습니다.',
      });
    }

    // 3. 추가 필터링 (경력, 스킬)
    let filteredCandidates = matchingCandidates;

    // 최소 경력 필터
    if (minExperience !== undefined && minExperience > 0) {
      const { data: profilesWithExperience } = await supabase
        .from('profiles')
        .select('id, experience_years')
        .in(
          'id',
          filteredCandidates.map((c: any) => c.user_id)
        )
        .gte('experience_years', minExperience);

      const experiencedUserIds = new Set(
        profilesWithExperience?.map((p) => p.id) || []
      );
      filteredCandidates = filteredCandidates.filter((c: any) =>
        experiencedUserIds.has(c.user_id)
      );
    }

    // 필수 스킬 필터
    if (requiredSkills && requiredSkills.length > 0) {
      filteredCandidates = filteredCandidates.filter((candidate: any) => {
        const candidateSkills = candidate.skills || [];
        return requiredSkills.some((reqSkill: string) =>
          candidateSkills.some((candSkill: string) =>
            candSkill.toLowerCase().includes(reqSkill.toLowerCase())
          )
        );
      });
    }

    // matchCount만큼만 반환
    filteredCandidates = filteredCandidates.slice(0, matchCount);

    // 4. 추가 프로필 정보 조회
    if (filteredCandidates.length > 0) {
      const userIds = filteredCandidates.map((c: any) => c.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          email,
          bio,
          skills,
          experience_years,
          education,
          location,
          avatar_url,
          updated_at
        `
        )
        .in('id', userIds);

      if (profileError) {
        console.error('프로필 조회 오류:', profileError);
      } else if (profiles) {
        // 유사도 점수와 프로필 정보 결합
        const enrichedCandidates = filteredCandidates.map((candidate: any) => {
          const profile = profiles.find((p) => p.id === candidate.user_id);
          return {
            userId: candidate.user_id,
            similarityScore: candidate.similarity_score,
            matchPercentage: Math.round(candidate.similarity_score * 100),
            profile: profile || null,
          };
        });

        // 유사도 점수로 정렬
        enrichedCandidates.sort((a: any, b: any) => b.similarityScore - a.similarityScore);

        return NextResponse.json({
          success: true,
          candidates: enrichedCandidates,
          totalCount: enrichedCandidates.length,
          matchThreshold,
        });
      }
    }

    return NextResponse.json({
      success: true,
      candidates: filteredCandidates.map((c: any) => ({
        userId: c.user_id,
        similarityScore: c.similarity_score,
        matchPercentage: Math.round(c.similarity_score * 100),
        fullName: c.full_name,
        email: c.email,
        skills: c.skills,
      })),
      totalCount: filteredCandidates.length,
      matchThreshold,
    });
  } catch (error) {
    console.error('후보자 매칭 API 오류:', error);
    return NextResponse.json(
      {
        error: '후보자 매칭에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 기업의 모든 공고에 대한 후보자 통계 조회
 * GET /api/employer/candidates?companyId={companyId}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId는 필수입니다.' }, { status: 400 });
    }

    // 1. 회사의 모든 공고 조회
    const { data: jobs, error: jobsError } = await supabase
      .from('job_postings')
      .select('id, title, status, created_at')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (jobsError) {
      throw new Error(`공고 조회 실패: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalJobs: 0,
          totalCandidates: 0,
          jobStats: [],
        },
      });
    }

    // 2. 각 공고별 후보자 수 조회
    const jobStats = await Promise.all(
      jobs.map(async (job) => {
        const { data: candidates, error } = await supabase.rpc(
          'get_matching_candidates_for_job',
          {
            target_job_id: job.id,
            match_threshold: 0.5,
            match_count: 100,
          }
        );

        return {
          jobId: job.id,
          jobTitle: job.title,
          candidateCount: candidates?.length || 0,
          topCandidates: (candidates || []).slice(0, 3).map((c: any) => ({
            userId: c.user_id,
            fullName: c.full_name,
            matchPercentage: Math.round(c.similarity_score * 100),
          })),
        };
      })
    );

    const totalCandidates = jobStats.reduce((sum, stat) => sum + stat.candidateCount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs: jobs.length,
        totalCandidates,
        avgCandidatesPerJob: Math.round(totalCandidates / jobs.length),
        jobStats,
      },
    });
  } catch (error) {
    console.error('후보자 통계 조회 오류:', error);
    return NextResponse.json(
      {
        error: '통계 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
