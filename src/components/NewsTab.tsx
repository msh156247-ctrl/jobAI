'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Search, Filter, Newspaper } from 'lucide-react'
import NewsCard from './NewsCard'
import type { NewsArticle } from '@/lib/news/types'
import { fetchNews, refreshNews } from '@/lib/news'

export default function NewsTab() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 필터
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSource, setSelectedSource] = useState('')

  // 초기 로드 제거 - 사용자가 새로고침 버튼을 클릭해야 뉴스 로드

  const loadNews = async () => {
    setLoading(true)
    try {
      const data = await fetchNews()
      setArticles(data.articles)
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const data = await refreshNews()
      setArticles(data.articles)
    } catch (error) {
      console.error('Failed to refresh news:', error)
      alert('뉴스를 새로고침하는 데 실패했습니다.')
    } finally {
      setRefreshing(false)
    }
  }

  // 필터링
  const filteredArticles = articles.filter(article => {
    if (searchKeyword && !article.title.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !article.content.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false
    }
    if (selectedCategory && (!article.category || article.category !== selectedCategory)) {
      return false
    }
    if (selectedSource && article.source !== selectedSource) {
      return false
    }
    return true
  })

  // 주제 카테고리
  const categories = ['정치', '경제', '사회', 'IT/과학', '문화', '스포츠', '국제', '연예', '생활/건강']

  // 주요 언론사 (실제 RSS 피드가 구성된 언론사만 표시)
  const sources = [
    '연합뉴스',
    'KBS',
    'MBC',
    'SBS',
    '한겨레',
    '경향신문',
    '한국경제',
    '매일경제',
    '전자신문',
    'ZDNet'
  ]

  return (
    <div>
      {/* 새로고침 버튼 */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">뉴스</h3>
            <p className="text-sm text-gray-600">국내 주요 언론사의 최신 뉴스를 한눈에 확인하세요</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h4 className="text-md font-semibold text-gray-900">검색 필터</h4>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredArticles.length}개의 기사
          </span>
        </div>

        {/* 키워드 검색 */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="제목, 내용 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 필터 옵션 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주제</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">전체 주제</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">출처</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">전체 언론사</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 필터 초기화 */}
        {(searchKeyword || selectedCategory || selectedSource) && (
          <button
            onClick={() => {
              setSearchKeyword('')
              setSelectedCategory('')
              setSelectedSource('')
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 뉴스 기사 목록 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Newspaper size={20} />
          최신 뉴스
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">뉴스를 불러오는 중...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Newspaper className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 mb-2">표시할 뉴스가 없습니다</p>
          <p className="text-sm text-gray-500">필터를 변경하거나 새로고침 해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {filteredArticles.map((article, index) => (
            <NewsCard key={article.id} article={article} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
