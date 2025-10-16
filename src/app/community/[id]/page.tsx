'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPostById, incrementViews, togglePostLike, getComments, getReplies, createComment, categories } from '@/lib/communityData'
import type { CommunityPost, CommunityComment } from '@/types'
import Header from '@/components/Header'
import { useToast } from '@/components/Toast'
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, User, Clock, Send } from 'lucide-react'
import { formatRelativeTime } from '@/utils/format'
import Link from 'next/link'

export default function CommunityPostPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadPost(params.id as string)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadPost = (postId: string) => {
    const foundPost = getPostById(postId)

    if (!foundPost) {
      showToast('error', '게시글을 찾을 수 없습니다.')
      router.push('/community')
      return
    }

    setPost(foundPost)
    incrementViews(postId)

    // 댓글 로드
    const postComments = getComments(postId)
    setComments(postComments)
  }

  const handleLike = () => {
    if (!user) {
      showToast('error', '로그인이 필요합니다.')
      return
    }

    if (!post) return

    const liked = togglePostLike(post.id, user.id)
    setIsLiked(liked)

    // 게시글 다시 로드
    const updatedPost = getPostById(post.id)
    if (updatedPost) {
      setPost(updatedPost)
    }

    showToast('success', liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.')
  }

  const handleSubmitComment = () => {
    if (!user) {
      showToast('error', '로그인이 필요합니다.')
      return
    }

    if (!post || !commentContent.trim()) {
      showToast('error', '댓글 내용을 입력해주세요.')
      return
    }

    const newComment = createComment({
      postId: post.id,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      content: commentContent.trim()
    })

    setComments([...comments, newComment])
    setCommentContent('')
    showToast('success', '댓글이 작성되었습니다.')

    // 게시글 댓글 수 업데이트
    const updatedPost = getPostById(post.id)
    if (updatedPost) {
      setPost(updatedPost)
    }
  }

  const handleSubmitReply = (parentId: string) => {
    if (!user) {
      showToast('error', '로그인이 필요합니다.')
      return
    }

    if (!post || !replyContent.trim()) {
      showToast('error', '답글 내용을 입력해주세요.')
      return
    }

    createComment({
      postId: post.id,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      content: replyContent.trim(),
      parentId
    })

    setReplyContent('')
    setReplyTo(null)
    showToast('success', '답글이 작성되었습니다.')

    // 댓글 다시 로드
    const postComments = getComments(post.id)
    setComments(postComments)
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

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
      free: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>목록으로</span>
        </button>

        {/* 게시글 */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-4">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${getCategoryColor(post.category)}`}>
              {getCategoryLabel(post.category)}
            </span>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{post.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* 작성자 */}
          <div className="flex items-center gap-3 pb-4 mb-6 border-b">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-400" />
              <span className="font-medium text-gray-900">{post.authorName}</span>
              {post.authorRole === 'employer' && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">기업</span>
              )}
            </div>
          </div>

          {/* 내용 */}
          <div className="prose prose-blue max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* 태그 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 액션 */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLiked
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp size={20} />
              <span>좋아요 {post.likes}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare size={20} />
              <span>댓글 {post.commentsCount}</span>
            </div>
          </div>
        </div>

        {/* 댓글 작성 */}
        {user ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">댓글 작성</h3>
            <div className="flex gap-3">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={3}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed self-end"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-blue-800 mb-3">로그인하고 댓글을 작성해보세요!</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              로그인
            </Link>
          </div>
        )}

        {/* 댓글 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            댓글 {comments.length}개
          </h3>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">첫 댓글을 작성해보세요!</p>
          ) : (
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.authorName}</span>
                      {comment.authorRole === 'employer' && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">기업</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>

                  {user && replyTo !== comment.id && (
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      답글 달기
                    </button>
                  )}

                  {/* 답글 작성 */}
                  {replyTo === comment.id && (
                    <div className="mt-3 ml-6 p-4 bg-gray-50 rounded-lg">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setReplyTo(null)
                            setReplyContent('')
                          }}
                          className="px-4 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim()}
                          className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          답글 작성
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 대댓글 목록 */}
                  {getReplies(comment.id).map(reply => (
                    <div key={reply.id} className="ml-6 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{reply.authorName}</span>
                          {reply.authorRole === 'employer' && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">기업</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
