'use client';

import { useEffect, useRef, useCallback } from 'react';
import { BehaviorTracker } from '@/lib/tracking/behavior-tracker';

/**
 * Enhanced Behavior Tracking Hook
 * Scroll Depth와 Dwell Time을 자동으로 추적합니다.
 */
interface UseEnhancedTrackingOptions {
  jobId: string;
  jobTitle?: string;
  company?: string;
  enableScrollTracking?: boolean;
  enableDwellTracking?: boolean;
}

interface TrackingMetrics {
  scrollDepth: number;
  dwellTime: number;
  maxScrollDepth: number;
}

export function useEnhancedTracking({
  jobId,
  jobTitle,
  company,
  enableScrollTracking = true,
  enableDwellTracking = true,
}: UseEnhancedTrackingOptions) {
  const tracker = BehaviorTracker.getInstance();
  const metricsRef = useRef<TrackingMetrics>({
    scrollDepth: 0,
    dwellTime: 0,
    maxScrollDepth: 0,
  });
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Scroll Depth 계산
   */
  const calculateScrollDepth = useCallback((): number => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const scrollableHeight = documentHeight - windowHeight;
    if (scrollableHeight <= 0) return 100;

    const scrollPercentage = (scrollTop / scrollableHeight) * 100;
    return Math.min(Math.round(scrollPercentage), 100);
  }, []);

  /**
   * Scroll 이벤트 핸들러
   */
  const handleScroll = useCallback(() => {
    if (!enableScrollTracking) return;

    const currentScrollDepth = calculateScrollDepth();
    metricsRef.current.scrollDepth = currentScrollDepth;

    // 최대 스크롤 깊이 업데이트
    if (currentScrollDepth > metricsRef.current.maxScrollDepth) {
      metricsRef.current.maxScrollDepth = currentScrollDepth;
    }
  }, [calculateScrollDepth, enableScrollTracking]);

  /**
   * Dwell Time 업데이트 (1초마다)
   */
  useEffect(() => {
    if (!enableDwellTracking) return;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
      metricsRef.current.dwellTime = Math.round(elapsed);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableDwellTracking]);

  /**
   * Scroll 이벤트 리스너 등록
   */
  useEffect(() => {
    if (!enableScrollTracking) return;

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 초기 스크롤 깊이 계산
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, enableScrollTracking]);

  /**
   * 페이지 진입 시 job_view 이벤트 추적
   */
  useEffect(() => {
    tracker.trackJobView(jobId, jobTitle, company);
  }, [jobId, jobTitle, company, tracker]);

  /**
   * 페이지 이탈 시 최종 메트릭 전송
   */
  useEffect(() => {
    const sendFinalMetrics = () => {
      const metrics = metricsRef.current;

      tracker.track('job_view', jobId, {
        jobTitle,
        company,
        scrollDepth: metrics.maxScrollDepth,
        dwellTime: metrics.dwellTime,
        isFinalMetric: true,
      });

      // 개발 환경에서 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enhanced Tracking] Final Metrics:', {
          jobId,
          scrollDepth: metrics.maxScrollDepth,
          dwellTime: metrics.dwellTime,
        });
      }
    };

    // beforeunload 이벤트로 페이지 이탈 감지
    window.addEventListener('beforeunload', sendFinalMetrics);

    // Visibility API로 탭 전환 감지
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendFinalMetrics();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      sendFinalMetrics();
      window.removeEventListener('beforeunload', sendFinalMetrics);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [jobId, jobTitle, company, tracker]);

  /**
   * 현재 메트릭 조회
   */
  const getMetrics = useCallback((): TrackingMetrics => {
    return { ...metricsRef.current };
  }, []);

  /**
   * 수동 이벤트 추적 함수들
   */
  const trackApply = useCallback(() => {
    tracker.track('job_apply', jobId, {
      jobTitle,
      scrollDepth: metricsRef.current.maxScrollDepth,
      dwellTime: metricsRef.current.dwellTime,
    });
  }, [jobId, jobTitle, tracker]);

  const trackSave = useCallback(() => {
    tracker.track('job_save', jobId, {
      jobTitle,
      scrollDepth: metricsRef.current.maxScrollDepth,
      dwellTime: metricsRef.current.dwellTime,
    });
  }, [jobId, jobTitle, tracker]);

  const trackReject = useCallback((reason?: string) => {
    tracker.track('job_reject', jobId, {
      jobTitle,
      reason,
      scrollDepth: metricsRef.current.maxScrollDepth,
      dwellTime: metricsRef.current.dwellTime,
    });
  }, [jobId, jobTitle, tracker]);

  return {
    metrics: metricsRef.current,
    getMetrics,
    trackApply,
    trackSave,
    trackReject,
  };
}

/**
 * 사용 예시:
 *
 * function JobDetailPage({ jobId }: { jobId: string }) {
 *   const { metrics, trackApply, trackSave } = useEnhancedTracking({
 *     jobId,
 *     jobTitle: "백엔드 개발자",
 *     company: "카카오",
 *     enableScrollTracking: true,
 *     enableDwellTracking: true,
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={trackApply}>지원하기</button>
 *       <button onClick={trackSave}>저장하기</button>
 *     </div>
 *   );
 * }
 */
