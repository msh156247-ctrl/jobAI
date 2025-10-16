'use client'

import { useState } from 'react'
import { deleteFile, formatFileSize, getFileIcon, getFileDownloadUrl, type StoredFile } from '@/lib/files'
import Link from 'next/link'

interface FileListProps {
  files: StoredFile[]
  onFileDelete: (fileId: string) => void
  onFileDownload?: (file: StoredFile) => void
  showActions?: boolean
  className?: string
}

export default function FileList({
  files,
  onFileDelete,
  onFileDownload,
  showActions = true,
  className = ''
}: FileListProps) {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())

  const handleDelete = async (file: StoredFile) => {
    if (!confirm(`"${file.file_name}" 파일을 삭제하시겠습니까?`)) return

    setDeletingFiles(prev => new Set(prev).add(file.id))

    try {
      await deleteFile(file.id, file.user_id)
      onFileDelete(file.id)
    } catch (error: any) {
      alert(error.message || '파일 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingFiles(prev => {
        const next = new Set(prev)
        next.delete(file.id)
        return next
      })
    }
  }

  const handleDownload = async (file: StoredFile) => {
    try {
      if (onFileDownload) {
        onFileDownload(file)
      } else {
        const downloadUrl = await getFileDownloadUrl(file.file_path)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = file.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error: any) {
      alert(error.message || '파일 다운로드 중 오류가 발생했습니다.')
    }
  }

  const getUploadTypeLabel = (uploadType: string) => {
    const labels = {
      resume: '이력서',
      portfolio: '포트폴리오',
      cover_letter: '자기소개서',
      certificate: '자격증/증명서'
    }
    return labels[uploadType as keyof typeof labels] || uploadType
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400">
          <svg className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">업로드된 파일이 없습니다</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-2xl">
                {getFileIcon(file.file_type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file_name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {getUploadTypeLabel(file.upload_type)}
                  </span>
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(file)}
                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                  title="다운로드"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingFiles.has(file.id)}
                  className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  {deletingFiles.has(file.id) ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}