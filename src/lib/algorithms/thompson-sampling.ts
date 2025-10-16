/**
 * Thompson Sampling Multi-Armed Bandit
 *
 * 강화학습 기반 추천 시스템
 * - Beta 분포를 사용한 불확실성 모델링
 * - Explore-Exploit 균형 자동 조절
 * - 사용자 행동 기반 리워드 학습
 */

/**
 * Bandit Arm (각 공고)
 */
export interface BanditArm {
  jobId: string;
  alpha: number; // 성공 횟수 + 1 (Beta 분포 파라미터)
  beta: number;  // 실패 횟수 + 1 (Beta 분포 파라미터)
  totalPulls: number; // 총 노출 횟수
  totalReward: number; // 총 리워드 합계
  lastUpdated: number; // 마지막 업데이트 시간
}

/**
 * 리워드 타입별 점수
 */
export const RewardScores = {
  VIEW: 0.1,      // 조회만 함
  CLICK: 1.0,     // 클릭
  SAVE: 1.5,      // 저장
  APPLY: 3.0,     // 지원
  REJECT: -2.0,   // 거부
} as const;

/**
 * Thompson Sampling Bandit 클래스
 */
export class ThompsonSamplingBandit {
  private arms: Map<string, BanditArm>;

  constructor(arms: BanditArm[] = []) {
    this.arms = new Map();
    arms.forEach((arm) => this.arms.set(arm.jobId, arm));
  }

  /**
   * 새로운 Arm 추가
   */
  addArm(jobId: string): void {
    if (this.arms.has(jobId)) return;

    this.arms.set(jobId, {
      jobId,
      alpha: 1, // Prior: Beta(1, 1) = Uniform
      beta: 1,
      totalPulls: 0,
      totalReward: 0,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Beta 분포에서 샘플링
   * Beta(alpha, beta) 분포를 따르는 난수 생성
   */
  private betaSample(alpha: number, beta: number): number {
    // Gamma 분포를 이용한 Beta 샘플링
    const gamma1 = this.gammaSample(alpha, 1);
    const gamma2 = this.gammaSample(beta, 1);
    return gamma1 / (gamma1 + gamma2);
  }

  /**
   * Gamma 분포에서 샘플링
   * Marsaglia and Tsang's Method (2000)
   */
  private gammaSample(shape: number, scale: number): number {
    if (shape < 1) {
      // shape < 1일 때: Gamma(shape, scale) = Gamma(shape+1, scale) * U^(1/shape)
      const u = Math.random();
      return this.gammaSample(shape + 1, scale) * Math.pow(u, 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.normalSample(0, 1);
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();
      const xSquared = x * x;

      if (u < 1 - 0.331 * xSquared * xSquared) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * xSquared + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * 정규 분포에서 샘플링 (Box-Muller Transform)
   */
  private normalSample(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  /**
   * Thompson Sampling으로 Arm 선택
   * @param count 선택할 Arm 개수
   * @returns 선택된 공고 ID 배열 (확률 높은 순)
   */
  selectArms(count: number): string[] {
    if (this.arms.size === 0) return [];

    // 각 Arm에서 Beta 분포 샘플링
    const samples = Array.from(this.arms.values()).map((arm) => ({
      jobId: arm.jobId,
      sample: this.betaSample(arm.alpha, arm.beta),
      arm,
    }));

    // 샘플 값이 높은 순으로 정렬
    samples.sort((a, b) => b.sample - a.sample);

    // 상위 count개 반환
    return samples.slice(0, count).map((s) => s.jobId);
  }

  /**
   * 리워드 업데이트
   * @param jobId 공고 ID
   * @param reward 리워드 점수
   */
  updateReward(jobId: string, reward: number): void {
    const arm = this.arms.get(jobId);
    if (!arm) {
      console.warn(`Arm not found: ${jobId}`);
      return;
    }

    // 리워드 정규화 (0~1 범위로)
    const normalizedReward = Math.max(0, Math.min(1, (reward + 2) / 5)); // -2~3 -> 0~1

    // Beta 분포 파라미터 업데이트
    if (reward > 0) {
      arm.alpha += reward; // 성공
    } else {
      arm.beta += Math.abs(reward); // 실패
    }

    arm.totalPulls += 1;
    arm.totalReward += reward;
    arm.lastUpdated = Date.now();

    this.arms.set(jobId, arm);
  }

  /**
   * 여러 행동의 리워드 일괄 업데이트
   */
  updateMultipleRewards(updates: { jobId: string; reward: number }[]): void {
    updates.forEach(({ jobId, reward }) => this.updateReward(jobId, reward));
  }

  /**
   * Arm 통계 조회
   */
  getArmStats(jobId: string): BanditArm | null {
    return this.arms.get(jobId) || null;
  }

  /**
   * 모든 Arm 통계 조회
   */
  getAllArms(): BanditArm[] {
    return Array.from(this.arms.values());
  }

  /**
   * 평균 리워드 계산 (성과 지표)
   */
  getAverageReward(jobId: string): number {
    const arm = this.arms.get(jobId);
    if (!arm || arm.totalPulls === 0) return 0;
    return arm.totalReward / arm.totalPulls;
  }

  /**
   * Expected Value (기댓값) 계산
   * E[Beta(alpha, beta)] = alpha / (alpha + beta)
   */
  getExpectedValue(jobId: string): number {
    const arm = this.arms.get(jobId);
    if (!arm) return 0;
    return arm.alpha / (arm.alpha + arm.beta);
  }

  /**
   * 상위 N개 Arm 조회 (기댓값 기준)
   */
  getTopArms(count: number): BanditArm[] {
    const arms = Array.from(this.arms.values());
    arms.sort((a, b) => {
      const expA = a.alpha / (a.alpha + a.beta);
      const expB = b.alpha / (b.alpha + b.beta);
      return expB - expA;
    });
    return arms.slice(0, count);
  }

  /**
   * Arm 제거
   */
  removeArm(jobId: string): void {
    this.arms.delete(jobId);
  }

  /**
   * 모든 Arm 초기화
   */
  reset(): void {
    this.arms.clear();
  }

  /**
   * Arm 데이터 직렬화 (저장용)
   */
  serialize(): BanditArm[] {
    return Array.from(this.arms.values());
  }

  /**
   * Arm 데이터 역직렬화 (로드용)
   */
  static deserialize(data: BanditArm[]): ThompsonSamplingBandit {
    return new ThompsonSamplingBandit(data);
  }

  /**
   * 시뮬레이션: 여러 시나리오 테스트
   */
  static simulate(
    armCount: number,
    iterations: number,
    rewardFunction: (armId: number) => number
  ): {
    totalReward: number;
    armStats: BanditArm[];
    regret: number;
  } {
    const bandit = new ThompsonSamplingBandit();

    // Arm 초기화
    for (let i = 0; i < armCount; i++) {
      bandit.addArm(`arm-${i}`);
    }

    let totalReward = 0;
    const optimalRewards: number[] = [];
    const actualRewards: number[] = [];

    // 시뮬레이션 실행
    for (let i = 0; i < iterations; i++) {
      // Thompson Sampling으로 Arm 선택
      const selectedArms = bandit.selectArms(1);
      const selectedJobId = selectedArms[0];
      const armId = parseInt(selectedJobId.split('-')[1]);

      // 리워드 획득
      const reward = rewardFunction(armId);
      bandit.updateReward(selectedJobId, reward);

      totalReward += reward;
      actualRewards.push(reward);

      // 최적 Arm 리워드 계산 (Regret 측정용)
      const optimalReward = Math.max(
        ...Array.from({ length: armCount }, (_, i) => rewardFunction(i))
      );
      optimalRewards.push(optimalReward);
    }

    // Regret 계산 (최적 대비 손실)
    const regret = optimalRewards.reduce((sum, opt, i) => sum + (opt - actualRewards[i]), 0);

    return {
      totalReward,
      armStats: bandit.getAllArms(),
      regret,
    };
  }
}

/**
 * 행동 타입을 리워드 점수로 변환
 */
export function actionToReward(
  actionType: 'view' | 'click' | 'save' | 'apply' | 'reject'
): number {
  switch (actionType) {
    case 'view':
      return RewardScores.VIEW;
    case 'click':
      return RewardScores.CLICK;
    case 'save':
      return RewardScores.SAVE;
    case 'apply':
      return RewardScores.APPLY;
    case 'reject':
      return RewardScores.REJECT;
    default:
      return 0;
  }
}

/**
 * 사용자별 Bandit 인스턴스 관리
 */
export class UserBanditManager {
  private bandits: Map<string, ThompsonSamplingBandit>;

  constructor() {
    this.bandits = new Map();
  }

  getBandit(userId: string): ThompsonSamplingBandit {
    if (!this.bandits.has(userId)) {
      this.bandits.set(userId, new ThompsonSamplingBandit());
    }
    return this.bandits.get(userId)!;
  }

  saveBandit(userId: string, bandit: ThompsonSamplingBandit): void {
    this.bandits.set(userId, bandit);
  }

  removeBandit(userId: string): void {
    this.bandits.delete(userId);
  }
}
