'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ResumeAnalyzer, ResumeAnalysis } from '@/lib/ai'
import { Upload, FileText, Brain, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react'

interface ResumeAnalyzerProps {
  onAnalysisComplete?: (analysis: ResumeAnalysis) => void
}

export default function ResumeAnalyzerComponent({ onAnalysisComplete }: ResumeAnalyzerProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('doc')) {
      setError('PDF 또는 Word 문서만 업로드 가능합니다.')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setError('파일 크기는 5MB 이하만 가능합니다.')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const analyzeResume = async () => {
    if (!file || !user) return

    setLoading(true)
    setError('')

    try {
      // Extract text from file
      const resumeText = await ResumeAnalyzer.extractResumeText(file)

      // Analyze resume
      const analysisResult = await ResumeAnalyzer.analyzeResume(resumeText, user.id)

      setAnalysis(analysisResult)
      onAnalysisComplete?.(analysisResult)
    } catch (err: any) {
      setError(err.message || '이력서 분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getMarketabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarketabilityBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const reset = () => {
    setFile(null)
    setAnalysis(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Brain className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">AI 이력서 분석</h2>
      </div>

      {!analysis ? (
        <div>
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  <button
                    onClick={reset}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  파일 크기: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  이력서를 드래그하여 업로드하거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  PDF, DOC, DOCX 파일 지원 (최대 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />

            {!file && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                파일 선택
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {file && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={analyzeResume}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    분석 중...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    이력서 분석하기
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analysis Results Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">분석 완료</h3>
            </div>
            <button
              onClick={reset}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              새 분석하기
            </button>
          </div>

          {/* Marketability Score */}
          <div className={`${getMarketabilityBg(analysis.marketability)} p-4 rounded-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className={`h-6 w-6 mr-2 ${getMarketabilityColor(analysis.marketability)}`} />
                <span className="font-semibold text-gray-900">시장성 점수</span>
              </div>
              <span className={`text-2xl font-bold ${getMarketabilityColor(analysis.marketability)}`}>
                {analysis.marketability}/100
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  analysis.marketability >= 80 ? 'bg-green-600' :
                  analysis.marketability >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${analysis.marketability}%` }}
              ></div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">요약</h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">보유 스킬</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.length > 0 ? (
                  analysis.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">스킬 정보를 찾을 수 없습니다.</p>
                )}
              </div>
            </div>

            {/* Experience */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">경력 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">경력 연수:</span>
                  <span className="font-medium">{analysis.experience.years}년</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">레벨:</span>
                  <span className="font-medium capitalize">{analysis.experience.level}</span>
                </div>
                {analysis.experience.companies.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">경력 회사:</span>
                    <div className="text-sm text-gray-700">
                      {analysis.experience.companies.slice(0, 3).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">강점</h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Areas */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">개선 영역</h4>
              <ul className="space-y-1">
                {analysis.improvementAreas.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Info */}
          {(analysis.languages.length > 0 || analysis.certifications.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.languages.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">언어</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">자격증</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {(analysis.education.degree || analysis.education.university) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">학력</h4>
              <div className="text-sm text-gray-700 space-y-1">
                {analysis.education.university && (
                  <div>대학교: {analysis.education.university}</div>
                )}
                {analysis.education.degree && (
                  <div>학위: {analysis.education.degree}</div>
                )}
                {analysis.education.field && (
                  <div>전공: {analysis.education.field}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}