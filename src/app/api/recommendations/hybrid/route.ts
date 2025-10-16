import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 하이브리드 추천 시스템
 * POST /api/recommendations/hybrid
 *
 * Vector Embedding + Thompson Sampling Bandit을 결합한 추천
 *
 * 전략:
 * 1. Vector Embedding으로 후보 공고 필터링 (상위 50개)
 * 2. Thompson Sampling으로 최종 추천 (상위 20개)
 * 3. Exploration-Exploitation 균형 자동 조절
 */
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      count = 20,
      vectorWeight = 0.6,
      banditWeight = 0.4,
      matchThreshold = 0.5,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    // 1단계: Vector Embedding으로 후보 공고 필터링
    const vectorCandidateCount = Math.min(count * 3, 50); // 3배수 조회
    const vectorResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/recommendations/vector-search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          userId,
          matchThreshold,
          matchCount: vectorCandidateCount,
        }),
      }
    ).catch(() => null);

    let vectorJobs: any[] = [];
    if (vectorResponse && vectorResponse.ok) {
      const vectorData = await vectorResponse.json();
      vectorJobs = vectorData.jobs || [];
    }

    // Vector가 실패하면 폴백: 최근 공고 조회
    if (vectorJobs.length === 0) {
      const { data: fallbackJobs } = await supabase
        .from('job_postings')
        .select('id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(vectorCandidateCount);

      vectorJobs = fallbackJobs || [];
    }

    if (vectorJobs.length === 0) {
      return NextResponse.json({
        success: true,
        jobs: [],
        message: '추천할 공고가 없습니다.',
      });
    }

    // 2단계: Thompson Sampling으로 최종 선택
    const candidateJobIds = vectorJobs.map((job) => job.id || job.job_id);

    const banditResponse = await fetch(
      `${req.nextUrl.origin}/api/recommendations/bandit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          candidateJobIds,
          count,
          updatePolicy: true, // 노출 기록
        }),
      }
    );

    if (!banditResponse.ok) {
      throw new Error('Bandit 추천 실패');
    }

    const banditData = await banditResponse.json();
    const banditJobs = banditData.jobs || [];

    // 3단계: 하이브리드 점수 계산
    const hybridJobs = banditJobs.map((job: any) => {
      const vectorJob = vectorJobs.find((v) => v.id === job.id || v.job_id === job.id);
      const vectorScore = vectorJob?.similarity_score || 0;
      const banditScore = job.bandit_stats?.expected_value || 0;

      const hybridScore = vectorScore * vectorWeight + banditScore * banditWeight;

      return {
        ...job,
        scores: {
          vector: vectorScore,
          bandit: banditScore,
          hybrid: hybridScore,
        },
        algorithm: 'hybrid',
      };
    });

    // 하이브리드 점수로 재정렬
    hybridJobs.sort((a: any, b: any) => b.scores.hybrid - a.scores.hybrid);

    return NextResponse.json({
      success: true,
      jobs: hybridJobs,
      algorithm: 'hybrid',
      weights: {
        vector: vectorWeight,
        bandit: banditWeight,
      },
      stats: {
        vectorCandidates: vectorJobs.length,
        banditSelected: banditJobs.length,
        finalCount: hybridJobs.length,
      },
    });
  } catch (error) {
    console.error('하이브리드 추천 API 오류:', error);
    return NextResponse.json(
      {
        error: '하이브리드 추천에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 추천 알고리즘 성능 비교 API
 * GET /api/recommendations/hybrid/compare?userId={userId}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    const count = 10;

    // 병렬로 3가지 알고리즘 실행
    const [vectorResult, banditResult, hybridResult] = await Promise.allSettled([
      // Vector만
      fetch(`${req.nextUrl.origin}/api/recommendations/vector-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, matchCount: count }),
      }).then((res) => (res.ok ? res.json() : null)),

      // Bandit만
      fetch(`${req.nextUrl.origin}/api/recommendations/bandit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          candidateJobIds: [], // 전체 공고에서 선택하도록
          count,
        }),
      }).then((res) => (res.ok ? res.json() : null)),

      // Hybrid
      fetch(`${req.nextUrl.origin}/api/recommendations/hybrid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, count }),
      }).then((res) => (res.ok ? res.json() : null)),
    ]);

    return NextResponse.json({
      success: true,
      comparison: {
        vector: {
          status: vectorResult.status,
          jobCount: vectorResult.status === 'fulfilled' ? vectorResult.value?.jobs?.length || 0 : 0,
          jobs: vectorResult.status === 'fulfilled' ? vectorResult.value?.jobs?.slice(0, 5) : [],
        },
        bandit: {
          status: banditResult.status,
          jobCount: banditResult.status === 'fulfilled' ? banditResult.value?.jobs?.length || 0 : 0,
          jobs: banditResult.status === 'fulfilled' ? banditResult.value?.jobs?.slice(0, 5) : [],
        },
        hybrid: {
          status: hybridResult.status,
          jobCount: hybridResult.status === 'fulfilled' ? hybridResult.value?.jobs?.length || 0 : 0,
          jobs: hybridResult.status === 'fulfilled' ? hybridResult.value?.jobs?.slice(0, 5) : [],
        },
      },
    });
  } catch (error) {
    console.error('알고리즘 비교 오류:', error);
    return NextResponse.json(
      {
        error: '알고리즘 비교에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
