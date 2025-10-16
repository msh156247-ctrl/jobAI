'use client'

import { useState, useRef } from 'react'
import { uploadFile, saveFileRecord, validateFile, formatFileSize, getFileIcon, type StoredFile } from '@/lib/files'

interface FileUploadProps {
  userId: string
  uploadType: 'resume' | 'portfolio' | 'cover_letter' | 'certificate'
  onUploadComplete: (file: StoredFile) => void
  onUploadError: (error: string) => void
  maxFiles?: number
  className?: string
}

const uploadTypeLabels = {
  resume: '이력서',
  portfolio: '포트폴리오',
  cover_letter: '자기소개서',
  certificate: '자격증/증명서'
}

export default function FileUpload({
  userId,
  uploadType,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0] // 현재는 단일 파일만 지원

    // 파일 유효성 검사
    const validation = validateFile(file, uploadType)
    if (!validation.valid) {
      onUploadError(validation.error!)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      // 파일 업로드
      const uploadResult = await uploadFile(file, userId, uploadType)

      // 데이터베이스에 저장
      const savedFile = await saveFileRecord(userId, uploadResult, uploadType, file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        onUploadComplete(savedFile)
      }, 500)

    } catch (error: any) {
      setIsUploading(false)
      setUploadProgress(0)
      onUploadError(error.message || '파일 업로드 중 오류가 발생했습니다.')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const getAcceptedFileTypes = () => {
    const types = {
      resume: '.pdf,.doc,.docx',
      portfolio: '.pdf,.jpg,.jpeg,.png,.webp',
      cover_letter: '.pdf,.doc,.docx,.txt',
      certificate: '.pdf,.jpg,.jpeg,.png,.webp'
    }
    return types[uploadType]
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedFileTypes()}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={isUploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'}
        `}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="text-blue-600">
              <svg className="animate-spin h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">업로드 중...</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-gray-400">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                {uploadTypeLabels[uploadType]} 업로드
              </p>
              <p className="text-sm text-gray-500 mt-1">
                파일을 여기로 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-xs text-gray-400 mt-2">
                지원 형식: {getAcceptedFileTypes().replace(/\./g, '').toUpperCase()} | 최대 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}