/**
 * Time Decay 알고리즘
 * 시간이 지남에 따라 행동의 가중치를 감소시켜
 * 최근 행동에 더 높은 중요도를 부여합니다.
 */

/**
 * 지수 감소 함수
 * weight = base_weight * e^(-λ * Δt)
 *
 * @param baseWeight 기본 가중치
 * @param lambda 감소 비율 (0.05 추천: 약 14일 후 50% 감소)
 * @param deltaTimeInDays 경과 시간 (일 단위)
 * @returns 감소된 가중치
 */
export function calculateTimeDecay(
  baseWeight: number = 1.0,
  lambda: number = 0.05,
  deltaTimeInDays: number
): number {
  if (deltaTimeInDays < 0) {
    throw new Error('경과 시간은 0 이상이어야 합니다.');
  }

  return baseWeight * Math.exp(-lambda * deltaTimeInDays);
}

/**
 * 밀리초를 일수로 변환
 */
export function millisecondsToDays(ms: number): number {
  return ms / (1000 * 60 * 60 * 24);
}

/**
 * 타임스탬프 기반 Time Decay 계산
 *
 * @param baseWeight 기본 가중치
 * @param eventTimestamp 이벤트 발생 시간 (ms)
 * @param currentTimestamp 현재 시간 (ms, 기본값: Date.now())
 * @param lambda 감소 비율
 * @returns 감소된 가중치
 */
export function calculateTimeDecayFromTimestamp(
  baseWeight: number,
  eventTimestamp: number,
  currentTimestamp: number = Date.now(),
  lambda: number = 0.05
): number {
  const deltaMs = currentTimestamp - eventTimestamp;
  const deltaDays = millisecondsToDays(deltaMs);
  return calculateTimeDecay(baseWeight, lambda, deltaDays);
}

/**
 * 행동 타입별 기본 가중치
 */
export const BehaviorWeights = {
  VIEW: 1.0,
  SAVE: 2.0,
  APPLY: 3.0,
  REJECT: -2.0,
  SCROLL_50: 0.5,
  SCROLL_75: 0.75,
  SCROLL_100: 1.0,
  DWELL_30S: 0.5,
  DWELL_60S: 1.0,
  DWELL_120S: 1.5,
} as const;

/**
 * Scroll Depth에 따른 가중치 계산
 */
export function getScrollDepthWeight(scrollPercentage: number): number {
  if (scrollPercentage >= 100) return BehaviorWeights.SCROLL_100;
  if (scrollPercentage >= 75) return BehaviorWeights.SCROLL_75;
  if (scrollPercentage >= 50) return BehaviorWeights.SCROLL_50;
  return 0;
}

/**
 * Dwell Time에 따른 가중치 계산
 */
export function getDwellTimeWeight(dwellTimeInSeconds: number): number {
  if (dwellTimeInSeconds >= 120) return BehaviorWeights.DWELL_120S;
  if (dwellTimeInSeconds >= 60) return BehaviorWeights.DWELL_60S;
  if (dwellTimeInSeconds >= 30) return BehaviorWeights.DWELL_30S;
  return 0;
}

/**
 * 행동 로그 인터페이스 (확장)
 */
export interface EnhancedBehaviorLog {
  userId: string;
  jobId: string;
  actionType: 'view' | 'save' | 'apply' | 'reject';
  timestamp: number;
  scrollDepth?: number; // 0-100
  dwellTime?: number; // seconds
  metadata?: Record<string, any>;
}

/**
 * 행동 점수 계산 (Time Decay + Scroll Depth + Dwell Time)
 */
export function calculateBehaviorScore(
  log: EnhancedBehaviorLog,
  currentTimestamp: number = Date.now(),
  lambda: number = 0.05
): number {
  // 1. 기본 행동 가중치
  let baseWeight = 0;
  switch (log.actionType) {
    case 'view':
      baseWeight = BehaviorWeights.VIEW;
      break;
    case 'save':
      baseWeight = BehaviorWeights.SAVE;
      break;
    case 'apply':
      baseWeight = BehaviorWeights.APPLY;
      break;
    case 'reject':
      baseWeight = BehaviorWeights.REJECT;
      break;
  }

  // 2. Scroll Depth 보너스
  if (log.scrollDepth !== undefined) {
    baseWeight += getScrollDepthWeight(log.scrollDepth);
  }

  // 3. Dwell Time 보너스
  if (log.dwellTime !== undefined) {
    baseWeight += getDwellTimeWeight(log.dwellTime);
  }

  // 4. Time Decay 적용
  const decayedWeight = calculateTimeDecayFromTimestamp(
    baseWeight,
    log.timestamp,
    currentTimestamp,
    lambda
  );

  return decayedWeight;
}

/**
 * 여러 행동 로그의 총 점수 계산
 */
export function calculateTotalBehaviorScore(
  logs: EnhancedBehaviorLog[],
  currentTimestamp: number = Date.now(),
  lambda: number = 0.05
): number {
  return logs.reduce((total, log) => {
    return total + calculateBehaviorScore(log, currentTimestamp, lambda);
  }, 0);
}

/**
 * 공고별 행동 점수 집계
 */
export function aggregateJobScores(
  logs: EnhancedBehaviorLog[],
  currentTimestamp: number = Date.now(),
  lambda: number = 0.05
): Map<string, number> {
  const jobScores = new Map<string, number>();

  logs.forEach((log) => {
    const score = calculateBehaviorScore(log, currentTimestamp, lambda);
    const currentScore = jobScores.get(log.jobId) || 0;
    jobScores.set(log.jobId, currentScore + score);
  });

  return jobScores;
}

/**
 * Time Decay 시뮬레이션 (테스트용)
 */
export function simulateTimeDecay(
  baseWeight: number,
  lambda: number,
  maxDays: number
): { day: number; weight: number }[] {
  const results: { day: number; weight: number }[] = [];

  for (let day = 0; day <= maxDays; day++) {
    const weight = calculateTimeDecay(baseWeight, lambda, day);
    results.push({ day, weight });
  }

  return results;
}

/**
 * Lambda 값 추천
 * - 0.01: 매우 느린 감소 (약 70일 후 50% 감소)
 * - 0.05: 보통 감소 (약 14일 후 50% 감소) ✅ 추천
 * - 0.1: 빠른 감소 (약 7일 후 50% 감소)
 * - 0.2: 매우 빠른 감소 (약 3.5일 후 50% 감소)
 */
export const RecommendedLambda = {
  VERY_SLOW: 0.01,
  SLOW: 0.03,
  MODERATE: 0.05,
  FAST: 0.1,
  VERY_FAST: 0.2,
} as const;

/**
 * 특정 일수 후 가중치가 목표 비율이 되도록 Lambda 계산
 *
 * @param targetDays 목표 일수
 * @param targetRatio 목표 비율 (0-1, 예: 0.5 = 50%)
 * @returns 계산된 Lambda 값
 */
export function calculateLambdaForTarget(targetDays: number, targetRatio: number = 0.5): number {
  if (targetRatio <= 0 || targetRatio >= 1) {
    throw new Error('목표 비율은 0과 1 사이여야 합니다.');
  }
  if (targetDays <= 0) {
    throw new Error('목표 일수는 0보다 커야 합니다.');
  }

  // ln(targetRatio) = -λ * targetDays
  // λ = -ln(targetRatio) / targetDays
  return -Math.log(targetRatio) / targetDays;
}
