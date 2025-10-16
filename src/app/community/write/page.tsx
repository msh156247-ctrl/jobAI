'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createPost, categories } from '@/lib/communityData'
import Header from '@/components/Header'
import RequireAuth from '@/components/RequireAuth'
import { useToast } from '@/components/Toast'
import { X } from 'lucide-react'

export default function CommunityWritePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()

  const [category, setCategory] = useState<string>('qna')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showToast('error', '로그인이 필요합니다.')
      return
    }

    if (!title.trim()) {
      showToast('error', '제목을 입력해주세요.')
      return
    }

    if (!content.trim()) {
      showToast('error', '내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const newPost = createPost({
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        category: category as 'qna' | 'career' | 'interview' | 'salary' | 'company' | 'education' | 'conference' | 'study' | 'free',
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined
      })

      showToast('success', '게시글이 작성되었습니다.')
      router.push(`/community/${newPost.id}`)
    } catch {
      showToast('error', '게시글 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">게시글 작성</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.filter(cat => cat.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {title.length} / 100
                </p>
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력하세요&#10;&#10;마크다운 문법을 지원합니다.&#10;- **굵게**&#10;- *기울임*&#10;- [링크](url)"
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {content.length} 자
                </p>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그 (최대 5개)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="태그 입력 후 Enter"
                    maxLength={20}
                    disabled={tags.length >= 5}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={tags.length >= 5 || !tagInput.trim()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>

                {/* 태그 목록 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>게시글 작성 가이드</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>명확하고 구체적인 제목을 작성해주세요</li>
                  <li>욕설, 비방, 광고성 게시글은 삭제될 수 있습니다</li>
                  <li>개인정보(연락처, 주소 등)는 공개하지 마세요</li>
                  <li>타인의 지적재산권을 침해하지 마세요</li>
                </ul>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '작성 중...' : '게시글 작성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
