'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { mockJobs, getCompanyById, type Job } from '@/lib/mockData'
import { getUserPreferences, hasPreferences } from '@/lib/userPreferences'
import { getMergedJobs, initAutoCrawl, getCrawlMetadata, crawlSingleSite, clearAllCrawledData, createCrawlParamsFromPreferences } from '@/lib/jobCrawler'
import { trackBookmark, removeBookmark, trackApply } from '@/lib/jobStats'
import Link from 'next/link'
import Header from '@/components/Header'
import SiteSelector from '@/components/SiteSelector'
import CrawlProgressBar from '@/components/CrawlProgressBar'
import JobCard from '@/components/JobCard'
import NaturalLanguageSearch from '@/components/NaturalLanguageSearch'
import NewsTab from '@/components/NewsTab'
import { Settings, Building2, Bookmark, Search, Filter, Trash2, Newspaper } from 'lucide-react'

interface RecommendedJob extends Job {
  matchScore: number
  matchReasons: string[]
}

type ViewTab = 'jobs' | 'jobseeker' | 'saved' | 'news'

// 업종 카테고리
const industryCategories = {
  'IT/소프트웨어': ['백엔드', '프론트엔드', '풀스택', '모바일', 'DevOps', 'AI/ML', 'DBA', 'QA/테스트', '데이터', '시스템'],
  '디자인': ['UI/UX', '그래픽', '웹디자인', '제품디자인', '영상/모션', '3D', '브랜드'],
  '기획/PM': ['서비스기획', '프로젝트관리', '데이터분석', '상품기획', '전략기획', 'PO'],
  '마케팅': ['디지털마케팅', '콘텐츠마케팅', '브랜드마케팅', '퍼포먼스마케팅', 'SNS마케팅', '그로스해킹', 'SEO'],
  '영업/제휴': ['B2B영업', 'B2C영업', '해외영업', '제휴', '영업관리', '기술영업', '솔루션영업'],
  '경영지원': ['인사', '총무', '재무', '회계', '법무', 'IR'],
  '제조/생산': ['생산관리', '품질관리', '공정관리', '설비관리', '안전관리', '생산기술', '제조공정'],
  '교육': ['강사', '교육기획', '교육운영', '콘텐츠개발', '커리큘럼개발', '온라인교육', '교육컨설팅'],
  '의료/바이오': ['임상연구', '바이오연구', '제약연구', '의료기기', '간호', '의료코디네이터', 'CRA'],
  '금융': ['자산관리', '재무설계', '금융상품개발', '리스크관리', '투자분석', '회계사', '세무사', '애널리스트'],
}

// 세부 업종별 기술 스택
const techStackBySubIndustry: Record<string, string[]> = {
  '백엔드': ['Java', 'Spring', 'Node.js', 'Python', 'Django', 'Flask', 'Go', 'Kotlin', 'C#', '.NET'],
  '프론트엔드': ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Webpack', 'Tailwind'],
  '풀스택': ['React', 'Node.js', 'TypeScript', 'Next.js', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker'],
  '모바일': ['Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android', 'Xcode', 'Firebase'],
  'DevOps': ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Jenkins', 'GitLab CI', 'Terraform', 'Ansible'],
  'AI/ML': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Keras', 'OpenCV'],
  'DBA': ['Oracle', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQL Server', 'MariaDB'],
  'QA/테스트': ['Selenium', 'Jest', 'Cypress', 'JUnit', 'TestNG', 'Postman', 'JMeter'],
  '데이터': ['Python', 'SQL', 'Tableau', 'Power BI', 'Spark', 'Hadoop', 'Kafka', 'Airflow'],
  '시스템': ['Linux', 'Windows Server', 'Unix', 'Shell Script', 'Networking', 'Security'],
  'UI/UX': ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'Zeplin', 'InVision'],
  '그래픽': ['Photoshop', 'Illustrator', 'InDesign', 'CorelDRAW', 'Canva'],
  '웹디자인': ['Figma', 'Sketch', 'HTML/CSS', 'Responsive Design', 'Wireframing'],
  '제품디자인': ['Figma', 'Sketch', 'Principle', 'Framer', 'User Research'],
  '영상/모션': ['After Effects', 'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'Cinema 4D'],
  '3D': ['Blender', '3ds Max', 'Maya', 'Cinema 4D', 'ZBrush', 'Substance Painter'],
  '브랜드': ['Illustrator', 'Photoshop', 'InDesign', 'Brand Strategy', 'Typography'],
  '서비스기획': ['Product Management', 'User Research', 'Wireframing', 'SQL', 'GA', 'Mixpanel'],
  '프로젝트관리': ['JIRA', 'Confluence', 'Asana', 'Trello', 'MS Project', 'Agile', 'Scrum'],
  '데이터분석': ['SQL', 'Python', 'R', 'Excel', 'Tableau', 'Power BI', 'Google Analytics'],
  '상품기획': ['Market Research', 'Excel', 'PowerPoint', 'SQL', 'Product Strategy'],
  '전략기획': ['Business Strategy', 'Excel', 'PowerPoint', 'Market Analysis', 'Financial Modeling'],
  'PO': ['Product Management', 'Agile', 'Scrum', 'User Stories', 'Backlog Management'],
  '디지털마케팅': ['Google Ads', 'Facebook Ads', 'Google Analytics', 'SEO', 'SEM', 'Conversion Optimization'],
  '콘텐츠마케팅': ['Content Writing', 'SEO', 'Storytelling', 'WordPress', 'Canva'],
  '브랜드마케팅': ['Brand Strategy', 'Market Research', 'Creative Direction', 'Campaign Management'],
  '퍼포먼스마케팅': ['Google Ads', 'Facebook Ads', 'Data Analysis', 'A/B Testing', 'Conversion Tracking'],
  'SNS마케팅': ['Instagram', 'Facebook', 'Twitter', 'TikTok', 'Content Creation', 'Community Management'],
  '그로스해킹': ['Analytics', 'A/B Testing', 'SQL', 'Python', 'Growth Strategy', 'User Acquisition'],
  'SEO': ['Keyword Research', 'Google Search Console', 'SEMrush', 'Ahrefs', 'Technical SEO'],
}

// 복지 키워드 옵션
const benefitOptions = [
  '워라벨', '재택근무', '유연근무', '연차자유', '자율출퇴근',
  '4대보험', '퇴직금', '연봉협상가능', '성과급', '인센티브',
  '스톡옵션', '복지포인트', '식대지원', '교통비지원', '통신비지원',
  '자기계발비', '도서구입비', '교육지원', '어학지원', '자격증지원',
  '건강검진', '의료비지원', '경조사지원', '휴양시설', '사내카페',
  '간식제공', '석식제공', '회식비지원', '동호회지원', '야근택시'
]

// 지역 옵션
const locationOptions = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '강남구', '서초구', '송파구', '영등포구', '마포구', '종로구', '중구',
  '성남시', '수원시', '안양시', '용인시', '고양시', '부천시', '판교'
]

// 우선순위 조건 옵션
const priorityOptions = [
  { id: 'salary', label: '연봉' },
  { id: 'location', label: '근무지' },
  { id: 'workType', label: '근무 형태' },
  { id: 'techStack', label: '기술 스택' },
  { id: 'experience', label: '경력' },
  { id: 'company', label: '회사 규모' },
  { id: 'benefits', label: '복지' },
  { id: 'industry', label: '업종' },
]

function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [preferences, setPreferences] = useState(getUserPreferences())
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [jobs, setJobs] = useState<RecommendedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState<ViewTab>('jobs')
  const [crawlMetadata, setCrawlMetadata] = useState<ReturnType<typeof getCrawlMetadata>>(null)

  // 검색 필터 상태
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [filterLocation, setFilterLocation] = useState<string>('')
  const [filterSalary, setFilterSalary] = useState<string>('') // 통합된 연봉 필터
  const [filterExperience, setFilterExperience] = useState<string>('') // 통합된 경력 필터
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>('')
  const [filterCompanySize, setFilterCompanySize] = useState<string>('')
  const [filterEducation, setFilterEducation] = useState<string>('')
  const [filterTechStack, setFilterTechStack] = useState<string[]>([]) // 다중 선택
  const [filterBenefits, setFilterBenefits] = useState<string[]>([]) // 다중 선택
  const [sortOption, setSortOption] = useState<string>('latest')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // AI 모드 및 자연어 검색
  const [aiMode, setAiMode] = useState(false)
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const [parsedSearchFilters, setParsedSearchFilters] = useState<{
    skills?: string[]
    location?: string
    workType?: string
    experienceMin?: number
    experienceMax?: number
    salaryMin?: number
    salaryMax?: number
    keywords?: string[]
  } | null>(null)

  // 우선순위 조정
  const [priorityList, setPriorityList] = useState<string[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // 경력/경험 설명
  const [experienceDescription, setExperienceDescription] = useState<string>('')
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false)

  // 크롤링 상태
  const [crawlingStatus, setCrawlingStatus] = useState<{
    site: string
    progress: number
    isActive: boolean
  } | null>(null)

  // URL 파라미터로 필터 동기화
  const updateURLParams = () => {
    const params = new URLSearchParams()

    if (searchKeyword) params.set('q', searchKeyword)
    if (filterLocation) params.set('location', filterLocation)
    if (filterSalary) params.set('salary', filterSalary)
    if (filterExperience) params.set('experience', filterExperience)
    if (filterEmploymentType) params.set('workType', filterEmploymentType)
    if (selectedIndustry) params.set('industry', selectedIndustry)
    if (selectedSubIndustry) params.set('subIndustry', selectedSubIndustry)
    if (filterTechStack.length > 0) params.set('skills', filterTechStack.join(','))
    if (filterBenefits.length > 0) params.set('benefits', filterBenefits.join(','))
    if (sortOption !== 'latest') params.set('sort', sortOption)
    if (aiMode) params.set('aiMode', 'true')

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newURL, { scroll: false })
  }

  // URL 파라미터에서 필터 로드 (초기 로드 시)
  useEffect(() => {
    if (!searchParams) return

    const q = searchParams.get('q')
    const location = searchParams.get('location')
    const salary = searchParams.get('salary')
    const experience = searchParams.get('experience')
    const workType = searchParams.get('workType')
    const industry = searchParams.get('industry')
    const subIndustry = searchParams.get('subIndustry')
    const skills = searchParams.get('skills')
    const benefits = searchParams.get('benefits')
    const sort = searchParams.get('sort')
    const aiModeParam = searchParams.get('aiMode')

    if (q) setSearchKeyword(q)
    if (location) setFilterLocation(location)
    if (salary) setFilterSalary(salary)
    if (experience) setFilterExperience(experience)
    if (workType) setFilterEmploymentType(workType)
    if (industry) setSelectedIndustry(industry)
    if (subIndustry) setSelectedSubIndustry(subIndustry)
    if (skills) setFilterTechStack(skills.split(','))
    if (benefits) setFilterBenefits(benefits.split(','))
    if (sort) setSortOption(sort)
    if (aiModeParam === 'true') setAiMode(true)
  }, []) // 초기 로드 시에만 실행

  // 필터 변경 시 URL 업데이트
  useEffect(() => {
    updateURLParams()
  }, [
    searchKeyword,
    filterLocation,
    filterSalary,
    filterExperience,
    filterEmploymentType,
    selectedIndustry,
    selectedSubIndustry,
    filterTechStack,
    filterBenefits,
    sortOption,
    aiMode
  ])

  // 저장된 공고 불러오기 & 설정 변경 감지
  useEffect(() => {
    const saved = localStorage.getItem('jobai_saved_jobs')
    if (saved) {
      setSavedJobs(JSON.parse(saved))
    }

    // 크롤링 메타데이터만 로드 (자동 크롤링은 비활성화)
    setCrawlMetadata(getCrawlMetadata())

    // 설정 페이지에서 돌아왔을 때 preferences 다시 로드
    const handleFocus = () => {
      setPreferences(getUserPreferences())
      setCrawlMetadata(getCrawlMetadata())
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // 공고 저장/해제
  const toggleSave = (jobId: string, sourceUrl?: string) => {
    setSavedJobs(prev => {
      const isCurrentlySaved = prev.includes(jobId)
      const newSaved = isCurrentlySaved
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
      localStorage.setItem('jobai_saved_jobs', JSON.stringify(newSaved))

      // 통계 추적
      if (!isCurrentlySaved && sourceUrl) {
        const source = getSourceSiteName(sourceUrl) || 'unknown'
        trackBookmark(jobId, source)
      } else if (isCurrentlySaved) {
        removeBookmark(jobId)
      }

      return newSaved
    })
  }

  const isSaved = (jobId: string) => savedJobs.includes(jobId)

  // 추천 점수 계산
  const calculateMatchScore = (job: Job): RecommendedJob => {
    let score = 50 // 기본 점수
    const reasons: string[] = []

    // 설정이 없으면 기본 점수만 반환
    if (!hasPreferences()) {
      return {
        ...job,
        matchScore: 50,
        matchReasons: ['전체 공고']
      }
    }

    const prefs = preferences

    // 스킬 매칭 (30점)
    if (prefs.interests.skills.length > 0) {
      const matchedSkills = job.skills.filter(skill =>
        prefs.interests.skills.some(ps =>
          ps.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(ps.toLowerCase())
        )
      )
      if (matchedSkills.length > 0) {
        score += Math.min(30, matchedSkills.length * 10)
        reasons.push(`관심 스킬 ${matchedSkills.length}개 일치`)
      }
    }

    // 직무 매칭 (25점)
    if (prefs.interests.positions.length > 0) {
      const titleLower = job.title.toLowerCase()
      const matched = prefs.interests.positions.some(pos =>
        titleLower.includes(pos.toLowerCase())
      )
      if (matched) {
        score += 25
        reasons.push('관심 직무 일치')
      }
    }

    // 지역 매칭 (15점)
    if (prefs.interests.locations.length > 0) {
      const matched = prefs.interests.locations.some(loc =>
        job.location.includes(loc)
      )
      if (matched) {
        score += 15
        reasons.push('선호 지역 일치')
      }
    }

    // 근무 형태 매칭 (10점)
    if (prefs.workConditions.types.length > 0) {
      if (prefs.workConditions.types.includes(job.workType)) {
        score += 10
        reasons.push('선호 근무 형태')
      }
    }

    // 연봉 범위 매칭 (10점)
    if (prefs.workConditions.salaryMin && prefs.workConditions.salaryMax) {
      const isInRange = job.salary.max >= prefs.workConditions.salaryMin &&
                       job.salary.min <= prefs.workConditions.salaryMax
      if (isInRange) {
        score += 10
        reasons.push('희망 연봉 범위')
      }
    }

    return {
      ...job,
      matchScore: Math.min(100, score),
      matchReasons: reasons.length > 0 ? reasons : ['일반 추천']
    }
  }

  // 공고 로드 및 추천 점수 계산
  useEffect(() => {
    setLoading(true)
    const allJobs = getMergedJobs(mockJobs)
    const recommendedJobs = allJobs
      .map(calculateMatchScore)
      .sort((a, b) => b.matchScore - a.matchScore)

    setJobs(recommendedJobs)
    setLoading(false)
  }, [preferences])

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'onsite': return '사무실'
      case 'dispatch': return '파견'
      case 'remote': return '원격'
      default: return type
    }
  }

  // sourceUrl에서 사이트 이름 추출
  const getSourceSiteName = (sourceUrl?: string) => {
    if (!sourceUrl) return null
    if (sourceUrl.includes('saramin.co.kr')) return '사람인'
    if (sourceUrl.includes('jobkorea.co.kr')) return '잡코리아'
    if (sourceUrl.includes('wanted.co.kr')) return '원티드'
    if (sourceUrl.includes('incruit.com')) return '인크루트'
    if (sourceUrl.includes('jobplanet.co.kr')) return '잡플래닛'
    return null
  }

  // 사이트별 배지 색상
  const getSourceSiteBadgeColor = (siteName: string | null) => {
    switch (siteName) {
      case '사람인': return 'bg-blue-100 text-blue-700 border-blue-200'
      case '잡코리아': return 'bg-green-100 text-green-700 border-green-200'
      case '원티드': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case '인크루트': return 'bg-purple-100 text-purple-700 border-purple-200'
      case '잡플래닛': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // 저장한 공고 필터링
  const savedJobsList = jobs.filter(job => isSaved(job.id))

  // 검색 필터 적용
  const filteredJobs = jobs.filter(job => {
    // 키워드 검색
    if (searchKeyword && !job.title.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !job.company.toLowerCase().includes(searchKeyword.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false
    }

    // 업종 필터
    if (selectedIndustry && !job.industry.includes(selectedIndustry)) {
      return false
    }

    // 세부 업종 필터
    if (selectedSubIndustry && !job.industry.includes(selectedSubIndustry) &&
        !job.title.includes(selectedSubIndustry)) {
      return false
    }

    // 지역 필터
    if (filterLocation && !job.location.includes(filterLocation)) {
      return false
    }

    // 연봉 필터 (최소 연봉보다 높으면 검색)
    if (filterSalary && job.salary.max < parseInt(filterSalary)) {
      return false
    }

    // 경력 필터 (최대 경력 이하만 검색)
    if (filterExperience && job.experience && job.experience.min > parseInt(filterExperience)) {
      return false
    }

    // 근무 형태 필터
    if (filterEmploymentType && job.workType !== filterEmploymentType) {
      return false
    }

    // 기술 스택 필터 (다중 선택 - AND 조건)
    if (filterTechStack.length > 0 && !filterTechStack.every(tech =>
      job.skills.some(skill => skill.toLowerCase().includes(tech.toLowerCase()))
    )) {
      return false
    }

    // 복지/키워드 필터 (다중 선택 - OR 조건)
    if (filterBenefits.length > 0 && job.keywords && !filterBenefits.some(benefit =>
      job.keywords?.some(keyword => keyword.includes(benefit))
    )) {
      return false
    }

    // 추출된 키워드로 검색
    if (extractedKeywords.length > 0) {
      const matchesKeyword = extractedKeywords.some(keyword =>
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(keyword.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(keyword.toLowerCase()))
      )
      if (!matchesKeyword) return false
    }

    return true
  }).sort((a, b) => {
    // 정렬 옵션 적용
    switch (sortOption) {
      case 'latest':
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      case 'salary_high':
        return b.salary.max - a.salary.max
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      case 'match_score':
        return b.matchScore - a.matchScore
      default:
        return 0
    }
  })

  // 필터 초기화
  const resetFilters = () => {
    setSelectedIndustry('')
    setSelectedSubIndustry('')
    setSearchKeyword('')
    setFilterLocation('')
    setFilterSalary('')
    setFilterExperience('')
    setFilterEmploymentType('')
    setFilterCompanySize('')
    setFilterEducation('')
    setFilterTechStack([])
    setFilterBenefits([])
    setSortOption('latest')
    setPriorityList([])
    setExperienceDescription('')
    setExtractedKeywords([])
    setNaturalLanguageQuery('')
    setParsedSearchFilters(null)
  }

  // 자연어 검색 핸들러
  const handleNaturalLanguageSearch = (query: string, filters: any) => {
    setNaturalLanguageQuery(query)
    setParsedSearchFilters(filters)

    // 파싱된 필터를 기존 필터 상태에 적용
    if (filters.location) {
      setFilterLocation(filters.location)
    }
    if (filters.workType) {
      setFilterEmploymentType(filters.workType)
    }
    if (filters.skills && filters.skills.length > 0) {
      setFilterTechStack(filters.skills)
    }
    if (filters.keywords && filters.keywords.length > 0) {
      setSearchKeyword(filters.keywords.join(' '))
    }
  }

  // AI 모드 토글
  const toggleAiMode = () => {
    setAiMode(prev => !prev)
  }

  // LLM을 사용한 키워드 추출
  const extractKeywordsFromDescription = async () => {
    if (!experienceDescription.trim()) {
      alert('경력/경험 설명을 입력해주세요')
      return
    }

    setIsExtractingKeywords(true)
    try {
      const response = await fetch('/api/ai/extract-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: experienceDescription })
      })

      const data = await response.json()
      if (data.keywords && data.keywords.length > 0) {
        setExtractedKeywords(data.keywords)
      } else {
        alert('키워드를 추출할 수 없습니다')
      }
    } catch (error) {
      console.error('키워드 추출 실패:', error)
      alert('키워드 추출 중 오류가 발생했습니다')
    } finally {
      setIsExtractingKeywords(false)
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetItem: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetItem) {
      setDraggedItem(null)
      return
    }

    const newList = [...priorityList]
    const draggedIndex = newList.indexOf(draggedItem)
    const targetIndex = newList.indexOf(targetItem)

    // 배열에서 드래그된 아이템 제거
    newList.splice(draggedIndex, 1)
    // 타겟 위치에 삽입
    newList.splice(targetIndex, 0, draggedItem)

    setPriorityList(newList)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const togglePriority = (priorityId: string) => {
    setPriorityList(prev => {
      if (prev.includes(priorityId)) {
        return prev.filter(id => id !== priorityId)
      } else if (prev.length < 5) {
        return [...prev, priorityId]
      }
      return prev
    })
  }

  // 수동 크롤링 실행
  const handleManualCrawl = async (siteName: string) => {
    setCrawlingStatus({ site: siteName, progress: 0, isActive: true })

    // 진행률 애니메이션
    const totalSteps = 100
    const progressInterval = setInterval(() => {
      setCrawlingStatus(prev => {
        if (!prev) return null
        const newProgress = Math.min(prev.progress + 10, 90)
        return { ...prev, progress: newProgress }
      })
    }, 200)

    try {
      // 사용자 선호도에서 크롤링 파라미터 생성
      const crawlParams = createCrawlParamsFromPreferences(preferences)
      console.log('크롤링 파라미터:', crawlParams)

      // 실제 크롤링 실행
      await crawlSingleSite(siteName, crawlParams)

      // 진행률 100%로 설정
      clearInterval(progressInterval)
      setCrawlingStatus({ site: siteName, progress: 100, isActive: false })

      // 크롤링 완료 후 데이터 새로고침
      const allJobs = getMergedJobs(mockJobs)
      const recommendedJobs = allJobs
        .map(calculateMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore)
      setJobs(recommendedJobs)
      setCrawlMetadata(getCrawlMetadata())

      // 상태 초기화
      setTimeout(() => {
        setCrawlingStatus(null)
      }, 2000)
    } catch (error) {
      clearInterval(progressInterval)
      console.error('크롤링 실패:', error)
      setCrawlingStatus(null)
      alert('크롤링에 실패했습니다.')
    }
  }

  // 마감일 지난 데이터 삭제
  const handleDeleteExpiredJobs = () => {
    const today = new Date()
    const filtered = jobs.filter(job => new Date(job.deadline) > today)
    setJobs(filtered)

    alert(`마감일이 지난 ${jobs.length - filtered.length}개의 공고를 삭제했습니다.`)
  }

  // 모든 크롤링 데이터 삭제
  const handleClearAllData = () => {
    if (confirm('모든 크롤링 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearAllCrawledData()

      // 데이터 새로고침
      const allJobs = getMergedJobs(mockJobs)
      const recommendedJobs = allJobs
        .map(calculateMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore)
      setJobs(recommendedJobs)
      setCrawlMetadata(getCrawlMetadata())

      alert('모든 크롤링 데이터가 삭제되었습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 animate-fade-in-down flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {hasPreferences() ? '🎯 맞춤 추천 공고' : '📋 전체 채용공고'}
            </h1>
            <p className="text-gray-600">
              {hasPreferences()
                ? '설정하신 관심사를 기반으로 추천합니다'
                : '관심사를 설정하면 맞춤 추천을 받을 수 있습니다'}
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings size={20} />
            설정
          </Link>
        </div>


        {/* 탭 네비게이션 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setCurrentTab('jobs')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                currentTab === 'jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 size={20} />
              추천 공고
            </button>
            <button
              onClick={() => setCurrentTab('saved')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                currentTab === 'saved'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bookmark size={20} />
              저장한 공고 ({savedJobsList.length})
            </button>
            <button
              onClick={() => setCurrentTab('news')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                currentTab === 'news'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Newspaper size={20} />
              기업 뉴스
            </button>
          </div>
        </div>

        {/* 추천 공고 탭 */}
        {currentTab === 'jobs' && (
          <>
            {/* 구직 사이트 크롤링 버튼 */}
            <SiteSelector
              onCrawl={handleManualCrawl}
              isDisabled={crawlingStatus?.isActive || false}
              activeSite={crawlingStatus?.site}
            />

            {/* 크롤링 진행 상태 */}
            {crawlingStatus && (
              <CrawlProgressBar
                site={crawlingStatus.site}
                progress={crawlingStatus.progress}
                isActive={crawlingStatus.isActive}
                totalJobs={filteredJobs.length}
              />
            )}

            {/* 자연어 검색 */}
            <NaturalLanguageSearch
              onSearch={handleNaturalLanguageSearch}
              aiMode={aiMode}
              onToggleAiMode={toggleAiMode}
            />

              {/* 검색 필터 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter size={20} className="text-gray-600" />
                  <h4 className="text-md font-semibold text-gray-900">검색 필터</h4>
                  <span className="text-sm text-gray-500 ml-auto">{filteredJobs.length}개의 공고</span>
                </div>

                {/* 키워드 검색 */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="회사명, 직무, 키워드 검색..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 기본 필터 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <select
                    value={selectedIndustry}
                    onChange={(e) => {
                      setSelectedIndustry(e.target.value)
                      setSelectedSubIndustry('')
                      setFilterTechStack([])
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체 업종</option>
                    {Object.keys(industryCategories).map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSubIndustry}
                    onChange={(e) => {
                      setSelectedSubIndustry(e.target.value)
                      setFilterTechStack([])
                    }}
                    disabled={!selectedIndustry}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">세부 업종</option>
                    {selectedIndustry && industryCategories[selectedIndustry as keyof typeof industryCategories]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>

                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체 지역</option>
                    {locationOptions.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>

                  <select
                    value={filterEmploymentType}
                    onChange={(e) => setFilterEmploymentType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체 근무형태</option>
                    <option value="onsite">사무실</option>
                    <option value="remote">원격</option>
                    <option value="dispatch">파견</option>
                  </select>

                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="latest">최신순</option>
                    <option value="deadline">마감임박순</option>
                    <option value="salary_high">연봉높은순</option>
                    {hasPreferences() && <option value="match_score">매칭도순</option>}
                  </select>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                      showAdvancedFilters ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Filter size={16} />
                    고급 검색 {showAdvancedFilters ? '▲' : '▼'}
                  </button>
                </div>

                {/* 고급 검색 필터 */}
                {showAdvancedFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 space-y-4">
                    <h5 className="text-sm font-semibold text-gray-900">고급 검색 옵션</h5>

                    {/* 연봉 및 경력 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="최소 연봉 (만원)"
                        value={filterSalary}
                        onChange={(e) => setFilterSalary(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />

                      <input
                        type="number"
                        placeholder="경력 (최대 년수)"
                        value={filterExperience}
                        onChange={(e) => setFilterExperience(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* 기술 스택 (다중 선택) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">기술 스택</label>
                      {selectedSubIndustry && techStackBySubIndustry[selectedSubIndustry] ? (
                        <div className="flex flex-wrap gap-2">
                          {techStackBySubIndustry[selectedSubIndustry].map(tech => (
                            <button
                              key={tech}
                              onClick={() => setFilterTechStack(prev =>
                                prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
                              )}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                filterTechStack.includes(tech)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {tech}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-300">
                          세부 업종을 먼저 선택해주세요
                        </p>
                      )}
                      {filterTechStack.length > 0 && (
                        <p className="text-xs text-gray-600 mt-2">
                          선택됨: {filterTechStack.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* 복지 키워드 (다중 선택) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">복지 키워드</label>
                      <div className="flex flex-wrap gap-2">
                        {benefitOptions.map(benefit => (
                          <button
                            key={benefit}
                            onClick={() => setFilterBenefits(prev =>
                              prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
                            )}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              filterBenefits.includes(benefit)
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {benefit}
                          </button>
                        ))}
                      </div>
                      {filterBenefits.length > 0 && (
                        <p className="text-xs text-gray-600 mt-2">
                          선택됨: {filterBenefits.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* 기타 필터 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={filterCompanySize}
                        onChange={(e) => setFilterCompanySize(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">기업규모 (전체)</option>
                        <option value="startup">스타트업 (1-50명)</option>
                        <option value="small">중소기업 (51-300명)</option>
                        <option value="medium">중견기업 (301-1000명)</option>
                        <option value="large">대기업 (1000명+)</option>
                      </select>

                      <select
                        value={filterEducation}
                        onChange={(e) => setFilterEducation(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">학력 (전체)</option>
                        <option value="none">학력무관</option>
                        <option value="high">고졸</option>
                        <option value="associate">전문학사</option>
                        <option value="bachelor">학사</option>
                        <option value="master">석사</option>
                        <option value="doctor">박사</option>
                      </select>
                    </div>

                    {/* 우선순위 조정 */}
                    <div className="border-t border-gray-300 pt-4">
                      <h6 className="text-sm font-semibold text-gray-900 mb-3">희망 조건 우선순위 (최대 5개)</h6>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {priorityOptions.map(option => (
                          <button
                            key={option.id}
                            onClick={() => togglePriority(option.id)}
                            disabled={priorityList.length >= 5 && !priorityList.includes(option.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              priorityList.includes(option.id)
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {priorityList.length > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-gray-300">
                          <p className="text-xs text-gray-600 mb-2">드래그하여 순서 조정 (위가 높은 우선순위)</p>
                          <div className="space-y-2">
                            {priorityList.map((priorityId, index) => {
                              const option = priorityOptions.find(o => o.id === priorityId)
                              return (
                                <div
                                  key={priorityId}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, priorityId)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, priorityId)}
                                  onDragEnd={handleDragEnd}
                                  className={`flex items-center gap-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg cursor-move hover:bg-purple-100 transition-colors ${
                                    draggedItem === priorityId ? 'opacity-50' : ''
                                  }`}
                                >
                                  <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                                  <span className="text-sm font-medium text-gray-900">{option?.label}</span>
                                  <button
                                    onClick={() => togglePriority(priorityId)}
                                    className="ml-auto text-red-600 hover:text-red-800 text-xs"
                                  >
                                    제거
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 경력/경험 설명 */}
                    <div className="border-t border-gray-300 pt-4">
                      <h6 className="text-sm font-semibold text-gray-900 mb-2">경력 및 경험 설명</h6>
                      <p className="text-xs text-gray-600 mb-2">
                        귀하의 경력이나 관련 업종 경험을 자유롭게 설명해주세요. AI가 키워드를 추출하여 검색에 활용합니다.
                      </p>
                      <textarea
                        value={experienceDescription}
                        onChange={(e) => setExperienceDescription(e.target.value)}
                        placeholder="예: 3년간 React와 Node.js를 활용한 풀스택 개발 경험이 있습니다. AWS 클라우드 인프라 구축 및 CI/CD 파이프라인 구성 경험도 있습니다."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none"
                        rows={4}
                      />
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={extractKeywordsFromDescription}
                          disabled={isExtractingKeywords || !experienceDescription.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                        >
                          {isExtractingKeywords ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              분석 중...
                            </>
                          ) : (
                            '키워드 추출'
                          )}
                        </button>
                        {extractedKeywords.length > 0 && (
                          <button
                            onClick={() => setExtractedKeywords([])}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                          >
                            키워드 초기화
                          </button>
                        )}
                      </div>
                      {extractedKeywords.length > 0 && (
                        <div className="mt-3 bg-white p-3 rounded-lg border border-green-300">
                          <p className="text-xs font-semibold text-green-700 mb-2">추출된 키워드:</p>
                          <div className="flex flex-wrap gap-2">
                            {extractedKeywords.map((keyword, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                  >
                    <Filter size={16} />
                    필터 초기화
                  </button>
                  <button
                    onClick={handleDeleteExpiredJobs}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    마감 공고 삭제
                  </button>
                  <button
                    onClick={handleClearAllData}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    모든 데이터 삭제
                  </button>
                </div>
              </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">공고를 불러오는 중...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {filteredJobs.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={isSaved(job.id)}
                    onToggleSave={toggleSave}
                    onApply={trackApply}
                    showPreferences={hasPreferences()}
                    index={index}
                  />
                ))}
              </div>
            )}

            {/* 공고 없음 */}
            {!loading && filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {jobs.length === 0 ? '현재 채용 공고가 없습니다' : '검색 조건에 맞는 공고가 없습니다'}
                </p>
                {jobs.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* 저장한 공고 탭 */}
        {currentTab === 'saved' && (
          <>
            {savedJobsList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Bookmark className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600 mb-2">저장한 공고가 없습니다</p>
                <p className="text-sm text-gray-500">관심있는 공고를 저장해보세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {savedJobsList.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={true}
                    onToggleSave={toggleSave}
                    onApply={trackApply}
                    showPreferences={hasPreferences()}
                    index={index}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 기업 뉴스 탭 */}
        {currentTab === 'news' && (
          <NewsTab />
        )}
      </main>

    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  )
}
