'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPosts, categories } from '@/lib/communityData'
import type { CommunityPost } from '@/types'
import Link from 'next/link'
import Header from '@/components/Header'
import { MessageSquare, Eye, ThumbsUp, PenSquare, Clock, User } from 'lucide-react'
import { formatRelativeTime } from '@/utils/format'

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPosts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  const loadPosts = () => {
    const allPosts = getPosts(selectedCategory)
    setPosts(allPosts)
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getCategoryLabel = (value: string) => {
    return categories.find(cat => cat.value === value)?.label || value
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      qna: 'bg-blue-100 text-blue-800',
      career: 'bg-green-100 text-green-800',
      interview: 'bg-purple-100 text-purple-800',
      salary: 'bg-yellow-100 text-yellow-800',
      company: 'bg-pink-100 text-pink-800',
      education: 'bg-orange-100 text-orange-800',
      conference: 'bg-indigo-100 text-indigo-800',
      study: 'bg-teal-100 text-teal-800',
      free: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getRoleBadge = (role: 'seeker' | 'employer') => {
    return role === 'employer' ? (
      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">기업</span>
    ) : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">커뮤니티</h1>
              <p className="text-gray-600 mt-1">취업과 커리어에 관한 이야기를 나눠보세요</p>
            </div>
            {user && (
              <Link
                href="/community/write"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PenSquare size={20} />
                <span>글쓰기</span>
              </Link>
            )}
          </div>

          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-1">
                <p className="text-blue-800 font-medium">로그인하고 커뮤니티에 참여하세요!</p>
                <p className="text-blue-700 text-sm mt-1">
                  게시글 작성, 댓글, 좋아요 기능을 사용하려면 로그인이 필요합니다.
                </p>
              </div>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
              >
                로그인
              </Link>
            </div>
          )}
        </div>

        {/* 카테고리 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* 카테고리 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="제목, 내용, 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">게시글이 없습니다.</p>
              {user && (
                <Link
                  href="/community/write"
                  className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  첫 게시글 작성하기
                </Link>
              )}
            </div>
          ) : (
            filteredPosts.map(post => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    {getRoleBadge(post.authorRole)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>

                {/* 제목 */}
                <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>

                {/* 내용 미리보기 */}
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {post.content}
                </p>

                {/* 태그 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 푸터 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User size={16} />
                    <span>{post.authorName}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={16} />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={16} />
                      <span>{post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
