'use client';

import { useState } from 'react';
import {
  FileText,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface ReviewResult {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedSentences: { original: string; improved: string }[];
  keywordAnalysis: {
    presentKeywords: string[];
    missingKeywords: string[];
  };
}

interface CoverLetterReviewerProps {
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
}

export default function CoverLetterReviewer({
  jobTitle = '',
  company = '',
  jobDescription = '',
}: CoverLetterReviewerProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [currentJobTitle, setCurrentJobTitle] = useState(jobTitle);
  const [currentCompany, setCurrentCompany] = useState(company);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (!coverLetter.trim()) {
      setError('자기소개서를 입력해주세요.');
      return;
    }

    if (!currentJobTitle || !currentCompany) {
      setError('지원 직무와 회사명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const response = await fetch('/api/ai/review-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter,
          jobTitle: currentJobTitle,
          company: currentCompany,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '리뷰 생성 실패');
      }

      const data: ReviewResult = await response.json();
      setReviewResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '우수':
        return 'text-green-700 bg-green-100';
      case '양호':
        return 'text-blue-700 bg-blue-100';
      case '보통':
        return 'text-yellow-700 bg-yellow-100';
      case '미흡':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-2xl font-bold">AI 자기소개서 리뷰어</h1>
        </div>
        <p className="text-purple-100">
          GPT-4 기반 AI가 당신의 자기소개서를 분석하고 구체적인 개선 방안을 제시합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회사명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentCompany}
              onChange={(e) => setCurrentCompany(e.target.value)}
              placeholder="예: 카카오"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지원 직무 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentJobTitle}
              onChange={(e) => setCurrentJobTitle(e.target.value)}
              placeholder="예: 백엔드 개발자"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            자기소개서 <span className="text-red-500">*</span>
            <span className="text-gray-400 text-xs ml-2">
              ({coverLetter.length} / 5000자)
            </span>
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="자기소개서를 입력해주세요..."
            rows={12}
            maxLength={5000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <button
          onClick={handleReview}
          disabled={isLoading || !coverLetter.trim() || !currentJobTitle || !currentCompany}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI 분석 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AI 리뷰 받기</span>
            </>
          )}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 리뷰 결과 */}
      {reviewResult && (
        <div className="space-y-6">
          {/* 점수 및 등급 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className={`w-8 h-8 ${getScoreColor(reviewResult.score)}`} />
                <div>
                  <h2 className="text-2xl font-bold">종합 점수</h2>
                  <p className="text-sm text-gray-500">채용 가능성 평가</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(reviewResult.score)}`}>
                  {reviewResult.score}점
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${getGradeColor(reviewResult.grade)}`}
                >
                  {reviewResult.grade}
                </span>
              </div>
            </div>

            {/* 점수 바 */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${reviewResult.score}%` }}
              ></div>
            </div>
          </div>

          {/* 강점 */}
          {reviewResult.strengths.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-800">강점</h3>
              </div>
              <ul className="space-y-3">
                {reviewResult.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 text-lg flex-shrink-0">✓</span>
                    <p className="text-gray-700">{strength}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 약점 */}
          {reviewResult.weaknesses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold text-gray-800">개선이 필요한 부분</h3>
              </div>
              <ul className="space-y-3">
                {reviewResult.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-orange-500 text-lg flex-shrink-0">!</span>
                    <p className="text-gray-700">{weakness}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 개선 제안 */}
          {reviewResult.suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-800">개선 제안</h3>
              </div>
              <ul className="space-y-3">
                {reviewResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-blue-500 text-lg flex-shrink-0">💡</span>
                    <p className="text-gray-700">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 개선 문장 예시 */}
          {reviewResult.improvedSentences.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-800">문장 개선 예시</h3>
              </div>
              <div className="space-y-4">
                {reviewResult.improvedSentences.map((sentence, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-red-600 mb-1">Before:</p>
                      <p className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                        {sentence.original}
                      </p>
                    </div>
                    <div className="flex items-center justify-center my-2">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-1">After:</p>
                      <p className="text-sm text-gray-800 bg-green-50 p-2 rounded font-medium">
                        {sentence.improved}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 키워드 분석 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">키워드 분석</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 현재 키워드 */}
              {reviewResult.keywordAnalysis.presentKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-700">포함된 핵심 키워드</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reviewResult.keywordAnalysis.presentKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 추가 권장 키워드 */}
              {reviewResult.keywordAnalysis.missingKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-700">추가하면 좋을 키워드</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reviewResult.keywordAnalysis.missingKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                      >
                        + {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
