import type { CommunityPost, CommunityComment } from '@/types'

// Mock 커뮤니티 게시글
export const mockPosts: CommunityPost[] = [
  {
    id: 'post_1',
    authorId: 'user_1',
    authorName: '취준생김철수',
    authorRole: 'seeker',
    category: 'interview',
    title: '대기업 면접 질문 모음 (삼성, 네이버, 카카오)',
    content: `최근 대기업 면접을 보면서 받았던 질문들을 정리해봤어요.

**삼성전자**
- 자신의 강점과 약점은?
- 팀 프로젝트에서 갈등이 생겼을 때 어떻게 해결했나?
- 5년 후 자신의 모습은?

**네이버**
- React와 Vue의 차이점은?
- 브라우저 렌더링 과정 설명
- 프로젝트에서 성능 최적화한 경험

**카카오**
- 서비스 개선 아이디어 제시
- 기술 블로그 운영하는지?
- 최근 관심있는 기술 트렌드

모두 화이팅하세요!`,
    tags: ['면접', '대기업', '취업준비'],
    views: 1234,
    likes: 89,
    commentsCount: 23,
    createdAt: '2025-09-25T10:30:00Z'
  },
  {
    id: 'post_2',
    authorId: 'user_2',
    authorName: '개발자박영희',
    authorRole: 'seeker',
    category: 'salary',
    title: '프론트엔드 개발자 연봉 정보 공유 (경력 3년)',
    content: `경력 3년차 프론트엔드 개발자 연봉 정보 공유합니다.

**스택**
- React, TypeScript, Next.js
- 반응형 웹, 성능 최적화 경험

**연봉 협상 결과**
- A사: 5,500만원
- B사: 6,000만원
- C사: 6,500만원 (최종 합격)

연봉 협상할 때는 본인의 기술 스택과 경험을 구체적으로 어필하는 게 중요한 것 같아요!`,
    tags: ['연봉', '프론트엔드', '연봉협상'],
    views: 2341,
    likes: 156,
    commentsCount: 45,
    createdAt: '2025-09-24T14:20:00Z'
  },
  {
    id: 'post_3',
    authorId: 'user_3',
    authorName: 'HR매니저이순신',
    authorRole: 'employer',
    category: 'qna',
    title: '[채용담당자] 이력서 작성 팁 공유합니다',
    content: `10년차 채용담당자입니다. 이력서 보면서 느낀 점 공유드려요.

**좋은 이력서**
✅ 구체적인 수치와 성과
✅ 기술 스택과 프로젝트 연결
✅ 문제 해결 과정 서술
✅ 간결하고 읽기 쉬운 구조

**아쉬운 이력서**
❌ 두루뭉술한 표현
❌ 기술 나열만
❌ 맞춤법/띄어쓰기 오류
❌ 너무 긴 자기소개서

이력서는 본인을 어필하는 마케팅 자료입니다!`,
    tags: ['이력서', '채용', 'HR'],
    views: 3421,
    likes: 234,
    commentsCount: 67,
    createdAt: '2025-09-23T09:15:00Z'
  },
  {
    id: 'post_4',
    authorId: 'user_4',
    authorName: '신입개발자최민수',
    authorRole: 'seeker',
    category: 'career',
    title: '부트캠프 수료 후 취업 성공 후기',
    content: `6개월 부트캠프를 마치고 스타트업에 취업했습니다!

**공부 과정**
- HTML/CSS/JavaScript 기초 (1개월)
- React 심화 (2개월)
- 팀 프로젝트 (2개월)
- 포트폴리오 정리 (1개월)

**취업 준비**
- 매일 알고리즘 1문제씩
- 기술 블로그 작성
- GitHub 꾸준히 관리
- 네트워킹 참여

**팁**
- 포트폴리오는 2-3개만 제대로
- 면접 전 회사 조사 필수
- 기술 면접은 모르면 솔직하게

포기하지 마세요!`,
    tags: ['부트캠프', '취업후기', '신입'],
    views: 4567,
    likes: 345,
    commentsCount: 89,
    createdAt: '2025-09-22T16:45:00Z'
  },
  {
    id: 'post_5',
    authorId: 'user_5',
    authorName: '스타트업대표정재호',
    authorRole: 'employer',
    category: 'company',
    title: '스타트업에서 원하는 개발자상',
    content: `스타트업 대표로서 함께 일하고 싶은 개발자 특징을 공유합니다.

**우리가 찾는 개발자**
1. **주도적인 사람**
   - 문제를 스스로 찾고 해결
   - 개선 아이디어 제안

2. **빠른 학습 능력**
   - 새로운 기술 습득
   - 변화에 유연한 대응

3. **커뮤니케이션**
   - 기획자/디자이너와 협업
   - 명확한 의사소통

4. **비즈니스 이해**
   - 왜 이 기능을 만드는지
   - 사용자 관점 이해

경력보다 태도와 잠재력을 봅니다!`,
    tags: ['스타트업', '채용', '개발자'],
    views: 2890,
    likes: 178,
    commentsCount: 52,
    createdAt: '2025-09-21T11:30:00Z'
  }
]

// Mock 댓글
export const mockComments: CommunityComment[] = [
  {
    id: 'comment_1',
    postId: 'post_1',
    authorId: 'user_10',
    authorName: '취준생A',
    authorRole: 'seeker',
    content: '정말 유용한 정보 감사합니다! 다음주 면접인데 도움이 많이 될 것 같아요.',
    likes: 12,
    createdAt: '2025-09-25T11:00:00Z'
  },
  {
    id: 'comment_2',
    postId: 'post_1',
    authorId: 'user_11',
    authorName: '개발자B',
    authorRole: 'seeker',
    content: '네이버는 기술 질문이 많이 나오는 편이죠. CS 지식도 탄탄하게 준비하세요!',
    likes: 8,
    createdAt: '2025-09-25T12:30:00Z'
  },
  {
    id: 'comment_3',
    postId: 'post_2',
    authorId: 'user_12',
    authorName: '경력자C',
    authorRole: 'seeker',
    content: '저도 비슷한 경력인데 참고하겠습니다. 연봉 협상 팁 더 알려주실 수 있나요?',
    likes: 5,
    createdAt: '2025-09-24T15:00:00Z'
  }
]

// LocalStorage 키
const POSTS_KEY = 'jobai:community:posts'
const COMMENTS_KEY = 'jobai:community:comments'

// 게시글 목록 가져오기
export function getPosts(category?: string): CommunityPost[] {
  const stored = localStorage.getItem(POSTS_KEY)
  const posts = stored ? JSON.parse(stored) : mockPosts

  if (category && category !== 'all') {
    return posts.filter((post: CommunityPost) => post.category === category)
  }

  return posts.sort((a: CommunityPost, b: CommunityPost) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// 게시글 상세 가져오기
export function getPostById(id: string): CommunityPost | null {
  const posts = getPosts()
  return posts.find(post => post.id === id) || null
}

// 게시글 작성
export function createPost(post: Omit<CommunityPost, 'id' | 'views' | 'likes' | 'commentsCount' | 'createdAt'>): CommunityPost {
  const posts = getPosts()
  const newPost: CommunityPost = {
    ...post,
    id: `post_${Date.now()}`,
    views: 0,
    likes: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString()
  }

  posts.unshift(newPost)
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))

  return newPost
}

// 게시글 조회수 증가
export function incrementViews(postId: string): void {
  const posts = getPosts()
  const post = posts.find(p => p.id === postId)

  if (post) {
    post.views += 1
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
  }
}

// 게시글 좋아요
export function togglePostLike(postId: string, userId: string): boolean {
  const likesKey = `jobai:community:post_likes:${postId}`
  const stored = localStorage.getItem(likesKey)
  const likes = stored ? JSON.parse(stored) : []

  const index = likes.indexOf(userId)
  let isLiked = false

  if (index > -1) {
    likes.splice(index, 1)
  } else {
    likes.push(userId)
    isLiked = true
  }

  localStorage.setItem(likesKey, JSON.stringify(likes))

  // 게시글 좋아요 수 업데이트
  const posts = getPosts()
  const post = posts.find(p => p.id === postId)

  if (post) {
    post.likes = likes.length
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
  }

  return isLiked
}

// 댓글 목록 가져오기
export function getComments(postId: string): CommunityComment[] {
  const stored = localStorage.getItem(COMMENTS_KEY)
  const comments = stored ? JSON.parse(stored) : mockComments

  return comments
    .filter((comment: CommunityComment) => comment.postId === postId && !comment.parentId)
    .sort((a: CommunityComment, b: CommunityComment) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
}

// 대댓글 가져오기
export function getReplies(commentId: string): CommunityComment[] {
  const stored = localStorage.getItem(COMMENTS_KEY)
  const comments = stored ? JSON.parse(stored) : mockComments

  return comments
    .filter((comment: CommunityComment) => comment.parentId === commentId)
    .sort((a: CommunityComment, b: CommunityComment) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
}

// 댓글 작성
export function createComment(comment: Omit<CommunityComment, 'id' | 'likes' | 'createdAt'>): CommunityComment {
  const stored = localStorage.getItem(COMMENTS_KEY)
  const comments = stored ? JSON.parse(stored) : mockComments

  const newComment: CommunityComment = {
    ...comment,
    id: `comment_${Date.now()}`,
    likes: 0,
    createdAt: new Date().toISOString()
  }

  comments.push(newComment)
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments))

  // 게시글 댓글 수 업데이트
  const posts = getPosts()
  const post = posts.find(p => p.id === comment.postId)

  if (post) {
    post.commentsCount += 1
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
  }

  return newComment
}

// 카테고리 목록
export const categories = [
  { value: 'all', label: '전체' },
  { value: 'qna', label: 'Q&A' },
  { value: 'career', label: '커리어' },
  { value: 'interview', label: '면접후기' },
  { value: 'salary', label: '연봉정보' },
  { value: 'company', label: '회사생활' },
  { value: 'education', label: '교육 및 강의' },
  { value: 'conference', label: '컨퍼런스' },
  { value: 'study', label: '스터디' },
  { value: 'free', label: '자유게시판' }
]
