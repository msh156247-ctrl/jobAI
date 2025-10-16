'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

interface InsightTagProps {
  jobId: string;
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  userSkills: string[];
  matchScore: number;
  experience?: string;
  education?: string;
}

interface InsightData {
  insight: string;
  tags: string[];
  strengths: string[];
  recommendations: string[];
}

export default function InsightTag({
  jobId,
  jobTitle,
  company,
  requiredSkills,
  userSkills,
  matchScore,
  experience,
  education,
}: InsightTagProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    if (insightData) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          jobTitle,
          company,
          requiredSkills,
          userSkills,
          matchScore,
          experience,
          education,
        }),
      });

      if (!response.ok) {
        throw new Error('인사이트 생성 실패');
      }

      const data: InsightData = await response.json();
      setInsightData(data);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-gradient-to-r from-purple-50 to-blue-50">
      {/* 헤더 */}
      <button
        onClick={fetchInsight}
        disabled={isLoading}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-purple-600" />
          )}
          <span className="font-semibold text-gray-800">
            {isLoading ? 'AI 분석 중...' : 'AI 매칭 인사이트'}
          </span>
        </div>
        <span className="text-sm text-purple-600">
          {isExpanded ? '접기' : '자세히 보기'}
        </span>
      </button>

      {/* 확장 영역 */}
      {isExpanded && insightData && (
        <div className="px-4 py-4 bg-white border-t space-y-4">
          {/* 인사이트 메시지 */}
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 leading-relaxed">{insightData.insight}</p>
          </div>

          {/* 태그 */}
          {insightData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {insightData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 강점 */}
          {insightData.strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span>당신의 강점</span>
              </div>
              <ul className="space-y-1 pl-6">
                {insightData.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-600 list-disc">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 개선 추천 */}
          {insightData.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <AlertCircle className="w-4 h-4" />
                <span>개선 포인트</span>
              </div>
              <ul className="space-y-1 pl-6">
                {insightData.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 list-disc">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
