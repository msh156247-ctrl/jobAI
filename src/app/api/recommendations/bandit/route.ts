import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ThompsonSamplingBandit, BanditArm } from '@/lib/algorithms/thompson-sampling';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Thompson Sampling Bandit 기반 추천 API
 * POST /api/recommendations/bandit
 *
 * 강화학습으로 개인화된 공고를 추천합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, candidateJobIds, count = 10, updatePolicy = false } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    if (!candidateJobIds || candidateJobIds.length === 0) {
      return NextResponse.json(
        { error: '후보 공고 목록(candidateJobIds)이 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. Supabase에서 사용자의 Bandit 정책 로드
    const { data: policies, error: policyError } = await supabase.rpc(
      'get_user_bandit_policy',
      {
        target_user_id: userId,
        job_limit: 1000,
      }
    );

    if (policyError) {
      console.error('정책 조회 오류:', policyError);
    }

    // 2. Bandit 인스턴스 생성
    const bandit = new ThompsonSamplingBandit();

    // 3. 후보 공고들에 대한 Arm 추가
    candidateJobIds.forEach((jobId: string) => {
      const existingPolicy = policies?.find((p: any) => p.job_id === jobId);

      if (existingPolicy) {
        // 기존 정책이 있으면 로드
        bandit.addArm(jobId);
        const arm: BanditArm = {
          jobId,
          alpha: existingPolicy.alpha,
          beta: existingPolicy.beta,
          totalPulls: existingPolicy.total_pulls,
          totalReward: existingPolicy.total_reward,
          lastUpdated: Date.now(),
        };
        bandit['arms'].set(jobId, arm);
      } else {
        // 새로운 공고면 Prior 사용
        bandit.addArm(jobId);
      }
    });

    // 4. Thompson Sampling으로 공고 선택
    const selectedJobIds = bandit.selectArms(Math.min(count, candidateJobIds.length));

    // 5. 선택된 공고 정보 조회
    const { data: jobs, error: jobsError } = await supabase
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
      .in('id', selectedJobIds);

    if (jobsError) {
      console.error('공고 조회 오류:', jobsError);
      throw new Error(`공고 조회 실패: ${jobsError.message}`);
    }

    // 6. 선택 순서대로 정렬
    const sortedJobs = selectedJobIds
      .map((jobId) => {
        const job = jobs?.find((j) => j.id === jobId);
        const arm = bandit.getArmStats(jobId);
        return job
          ? {
              ...job,
              bandit_stats: {
                expected_value: arm ? bandit.getExpectedValue(jobId) : 0,
                total_pulls: arm?.totalPulls || 0,
                average_reward: arm ? bandit.getAverageReward(jobId) : 0,
              },
            }
          : null;
      })
      .filter(Boolean);

    // 7. (선택) 정책 업데이트 - 노출 기록
    if (updatePolicy) {
      for (const jobId of selectedJobIds.slice(0, 3)) {
        // 상위 3개만 기록
        try {
          await supabase.rpc('log_user_behavior', {
            target_user_id: userId,
            target_job_id: jobId,
            action: 'view',
          });
        } catch (error) {
          console.error('행동 로그 기록 실패:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      jobs: sortedJobs,
      algorithm: 'thompson_sampling',
      totalCandidates: candidateJobIds.length,
      selectedCount: selectedJobIds.length,
    });
  } catch (error) {
    console.error('Bandit 추천 API 오류:', error);
    return NextResponse.json(
      {
        error: 'Bandit 추천에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 행동 기록 및 리워드 업데이트 API
 * PUT /api/recommendations/bandit
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId, jobId, action, scrollDepth, dwellTime, sessionId, metadata } =
      await req.json();

    if (!userId || !jobId || !action) {
      return NextResponse.json(
        { error: 'userId, jobId, action은 필수입니다.' },
        { status: 400 }
      );
    }

    // 행동 로그 및 Bandit 정책 업데이트
    const { data: logId, error } = await supabase.rpc('log_user_behavior', {
      target_user_id: userId,
      target_job_id: jobId,
      action: action,
      scroll_depth_value: scrollDepth || null,
      dwell_time_value: dwellTime || null,
      session_id_value: sessionId || null,
      metadata_value: metadata || null,
    });

    if (error) {
      console.error('행동 로그 기록 오류:', error);
      throw new Error(`로그 기록 실패: ${error.message}`);
    }

    // 업데이트된 정책 조회
    const { data: updatedPolicy } = await supabase
      .from('bandit_policies')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    return NextResponse.json({
      success: true,
      logId,
      policy: updatedPolicy || null,
      message: `${action} 행동이 기록되었습니다.`,
    });
  } catch (error) {
    console.error('행동 기록 API 오류:', error);
    return NextResponse.json(
      {
        error: '행동 기록에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자 행동 통계 조회 API
 * GET /api/recommendations/bandit?userId={userId}&days={days}
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    // 행동 통계 조회
    const { data: stats, error: statsError } = await supabase.rpc(
      'get_user_behavior_stats',
      {
        target_user_id: userId,
        days_back: days,
      }
    );

    if (statsError) {
      throw new Error(`통계 조회 실패: ${statsError.message}`);
    }

    // Bandit 정책 조회
    const { data: policies, error: policyError } = await supabase.rpc(
      'get_user_bandit_policy',
      {
        target_user_id: userId,
        job_limit: 20,
      }
    );

    if (policyError) {
      console.error('정책 조회 오류:', policyError);
    }

    // 상위 공고 정보 조회
    let topJobs = [];
    if (policies && policies.length > 0) {
      const topJobIds = policies.slice(0, 10).map((p: any) => p.job_id);
      const { data: jobDetails } = await supabase
        .from('job_postings')
        .select('id, title, company_profiles(company_name)')
        .in('id', topJobIds);

      topJobs = policies.slice(0, 10).map((policy: any) => {
        const job = jobDetails?.find((j) => j.id === policy.job_id);
        const companyProfiles = job?.company_profiles as any;
        return {
          jobId: policy.job_id,
          jobTitle: job?.title,
          companyName: companyProfiles?.company_name || null,
          expectedValue: policy.expected_value,
          totalPulls: policy.total_pulls,
          totalReward: policy.total_reward,
        };
      });
    }

    return NextResponse.json({
      success: true,
      stats: stats?.[0] || {},
      topJobs,
      period: `최근 ${days}일`,
    });
  } catch (error) {
    console.error('통계 조회 API 오류:', error);
    return NextResponse.json(
      {
        error: '통계 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
