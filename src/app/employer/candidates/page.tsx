'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Star,
  Mail,
  MapPin,
  Award,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  userId: string;
  similarityScore: number;
  matchPercentage: number;
  profile: {
    full_name: string;
    email: string;
    bio?: string;
    skills: string[];
    experience_years?: number;
    education?: string;
    location?: string;
    avatar_url?: string;
  } | null;
}

interface JobWithCandidates {
  jobId: string;
  jobTitle: string;
  candidates: Candidate[];
  isExpanded: boolean;
}

export default function EmployerCandidatesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobs, setJobs] = useState<JobWithCandidates[]>([]);
  const [matchThreshold, setMatchThreshold] = useState(0.6);

  useEffect(() => {
    if (!user || profile?.role !== 'employer') {
      router.push('/login');
      return;
    }

    loadJobs();
  }, [user, profile, router]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      // Mock 데이터 (실제로는 Supabase에서 조회)
      const mockJobs: JobWithCandidates[] = [
        {
          jobId: 'job-1',
          jobTitle: '백엔드 개발자 (Node.js)',
          candidates: [],
          isExpanded: false,
        },
        {
          jobId: 'job-2',
          jobTitle: '프론트엔드 개발자 (React)',
          candidates: [],
          isExpanded: false,
        },
        {
          jobId: 'job-3',
          jobTitle: 'DevOps 엔지니어',
          candidates: [],
          isExpanded: false,
        },
      ];

      setJobs(mockJobs);
    } catch (error) {
      console.error('공고 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatesForJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/employer/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          matchThreshold,
          matchCount: 20,
        }),
      });

      if (!response.ok) {
        throw new Error('후보자 로드 실패');
      }

      const data = await response.json();

      setJobs((prev) =>
        prev.map((job) =>
          job.jobId === jobId
            ? { ...job, candidates: data.candidates || [], isExpanded: true }
            : job
        )
      );
    } catch (error) {
      console.error('후보자 로드 오류:', error);
    }
  };

  const toggleJob = (jobId: string) => {
    const job = jobs.find((j) => j.jobId === jobId);
    if (!job) return;

    if (!job.isExpanded && job.candidates.length === 0) {
      loadCandidatesForJob(jobId);
    } else {
      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === jobId ? { ...j, isExpanded: !j.isExpanded } : j
        )
      );
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-semibold hover:text-blue-600">
                JobAI
              </Link>
              <nav className="flex space-x-8">
                <Link href="/jobs/create" className="text-gray-600 hover:text-blue-600">
                  공고 등록
                </Link>
                <Link
                  href="/employer/candidates"
                  className="text-blue-600 font-medium border-b-2 border-blue-600"
                >
                  AI 후보자 매칭
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">AI 후보자 매칭</h1>
              </div>
              <p className="text-gray-600">
                벡터 임베딩 기반으로 공고에 가장 적합한 후보자를 찾아드립니다.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">활성 공고</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">총 매칭 후보자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + job.candidates.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">평균 매칭률</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.length > 0
                    ? Math.round(
                        jobs.reduce(
                          (sum, job) =>
                            sum +
                            (job.candidates.length > 0
                              ? job.candidates.reduce(
                                  (s, c) => s + c.matchPercentage,
                                  0
                                ) / job.candidates.length
                              : 0),
                          0
                        ) / jobs.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              최소 매칭 점수: {Math.round(matchThreshold * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={matchThreshold * 100}
              onChange={(e) => setMatchThreshold(parseInt(e.target.value) / 100)}
              className="flex-1"
            />
            <button
              onClick={loadJobs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              적용
            </button>
          </div>
        </div>

        {/* Job List with Candidates */}
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.jobId} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Job Header */}
              <button
                onClick={() => toggleJob(job.jobId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{job.jobTitle}</h3>
                    <p className="text-sm text-gray-500">
                      {job.candidates.length}명의 매칭 후보자
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    job.isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Candidates List */}
              {job.isExpanded && (
                <div className="border-t border-gray-200">
                  {job.candidates.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>매칭되는 후보자가 없습니다.</p>
                      <p className="text-sm mt-1">매칭 점수를 낮춰보세요.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {job.candidates.map((candidate) => (
                        <div
                          key={candidate.userId}
                          className="px-6 py-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Avatar */}
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-gray-400" />
                              </div>

                              {/* Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {candidate.profile?.full_name || '익명'}
                                  </h4>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getMatchColor(
                                      candidate.matchPercentage
                                    )}`}
                                  >
                                    {candidate.matchPercentage}% 매칭
                                  </span>
                                </div>

                                {candidate.profile?.bio && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {candidate.profile.bio.substring(0, 100)}...
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  {candidate.profile?.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-4 h-4" />
                                      <span>{candidate.profile.email}</span>
                                    </div>
                                  )}
                                  {candidate.profile?.experience_years && (
                                    <div className="flex items-center gap-1">
                                      <Award className="w-4 h-4" />
                                      <span>{candidate.profile.experience_years}년 경력</span>
                                    </div>
                                  )}
                                  {candidate.profile?.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{candidate.profile.location}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Skills */}
                                {candidate.profile?.skills &&
                                  candidate.profile.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {candidate.profile.skills.slice(0, 5).map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                      {candidate.profile.skills.length > 5 && (
                                        <span className="text-xs text-gray-500">
                                          +{candidate.profile.skills.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 ml-4">
                              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                                프로필 보기
                              </button>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                                연락하기
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
