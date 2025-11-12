'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUserPreferences, saveUserPreferences, type UserPreferences } from '@/lib/userPreferences'
import Header from '@/components/Header'
import {
  Plus, X, GripVertical, Save, ArrowLeft, User, Briefcase,
  Heart, Target, Check, Sparkles, Search, Download, Upload, RefreshCw, TrendingUp
} from 'lucide-react'

type TabType = 'personal' | 'interests' | 'conditions'

// 추천 데이터
const recommendedSkills = {
  'IT/소프트웨어': ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Spring', 'Docker', 'Kubernetes', 'AWS'],
  '디자인': ['Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Adobe XD', 'UI/UX', 'Wireframing'],
  '마케팅': ['Google Analytics', 'SEO', 'SNS마케팅', 'Google Ads', 'Facebook Ads', 'Content Marketing'],
}

const recommendedBenefits = [
  '워라벨', '재택근무', '유연근무', '연차자유', '자율출퇴근',
  '4대보험', '퇴직금', '연봉협상가능', '성과급', '인센티브',
  '스톡옵션', '복지포인트', '식대지원', '교통비지원', '통신비지원',
  '자기계발비', '도서구입비', '교육지원', '건강검진', '의료비지원'
]

const recommendedLocations = [
  '서울 강남구', '서울 서초구', '서울 송파구', '서울 영등포구', '서울 마포구',
  '경기 성남시', '경기 수원시', '경기 고양시', '인천', '부산', '대전', '대구'
]

export default function SettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences())
  const [saved, setSaved] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [showRefreshNotice, setShowRefreshNotice] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // 자동 저장 타이머
  const autoSaveTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const previousPreferences = useRef<UserPreferences>(getUserPreferences())

  // 입력 필드용 임시 상태
  const [newSkill, setNewSkill] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newBenefit, setNewBenefit] = useState('')

  // 검색/추천 표시 상태
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)
  const [showBenefitSuggestions, setShowBenefitSuggestions] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  // 드래그 앤 드롭 상태
  const [draggedSkillIndex, setDraggedSkillIndex] = useState<number | null>(null)
  const [draggedPositionIndex, setDraggedPositionIndex] = useState<number | null>(null)
  const [draggedIndustryIndex, setDraggedIndustryIndex] = useState<number | null>(null)
  const [draggedLocationIndex, setDraggedLocationIndex] = useState<number | null>(null)

  useEffect(() => {
    setPreferences(getUserPreferences())
  }, [])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl/Cmd + E: 내보내기
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        handleExportSettings()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [preferences])

  // 프로필 완성도 계산
  const calculateCompleteness = (): number => {
    let completed = 0
    let total = 0

    // 개인정보 (4개 필드)
    total += 4
    if (preferences.personalInfo.name) completed++
    if (preferences.personalInfo.email) completed++
    if (preferences.personalInfo.phone) completed++
    if (preferences.personalInfo.birthYear) completed++

    // 학력 (4개 필드)
    total += 4
    if (preferences.education.level !== 'high-school') completed++
    if (preferences.education.major) completed++
    if (preferences.education.school) completed++
    if (preferences.education.graduationYear) completed++

    // 경력 (2개 필드)
    total += 2
    if (preferences.career.level !== 'all') completed++
    if (preferences.career.years) completed++

    // 관심사 (4개 배열)
    total += 4
    if (preferences.interests.skills.length > 0) completed++
    if (preferences.interests.positions.length > 0) completed++
    if (preferences.interests.industries.length > 0) completed++
    if (preferences.interests.locations.length > 0) completed++

    // 희망 조건 (3개 필드)
    total += 3
    if (preferences.workConditions.types.length > 0) completed++
    if (preferences.workConditions.salaryMin || preferences.workConditions.salaryMax) completed++
    if (preferences.workConditions.benefits && preferences.workConditions.benefits.length > 0) completed++

    return Math.round((completed / total) * 100)
  }

  // 중요 설정 변경 감지
  const hasSignificantChange = (prev: UserPreferences, current: UserPreferences): boolean => {
    return (
      JSON.stringify(prev.interests.skills) !== JSON.stringify(current.interests.skills) ||
      JSON.stringify(prev.interests.positions) !== JSON.stringify(current.interests.positions) ||
      JSON.stringify(prev.interests.industries) !== JSON.stringify(current.interests.industries) ||
      JSON.stringify(prev.interests.locations) !== JSON.stringify(current.interests.locations) ||
      prev.career.level !== current.career.level ||
      JSON.stringify(prev.workConditions.types) !== JSON.stringify(current.workConditions.types)
    )
  }

  // 자동 저장 (3초 후)
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      if (preferences) {
        setAutoSaving(true)
        saveUserPreferences(preferences)

        // 중요 설정 변경 감지
        if (hasSignificantChange(previousPreferences.current, preferences)) {
          setShowRefreshNotice(true)
          setTimeout(() => setShowRefreshNotice(false), 5000)
        }

        previousPreferences.current = preferences
        setTimeout(() => setAutoSaving(false), 1000)
      }
    }, 3000)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [preferences])

  const handleSave = () => {
    saveUserPreferences(preferences)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // 설정 내보내기
  const handleExportSettings = () => {
    const dataStr = JSON.stringify(preferences, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jobai-settings-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // 설정 가져오기
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setPreferences(imported)
        saveUserPreferences(imported)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (error) {
        alert('설정 파일을 불러오는데 실패했습니다.')
      }
    }
    reader.readAsText(file)
    setShowExportMenu(false)
  }

  // 추천 새로고침
  const handleRefreshRecommendations = () => {
    setShowRefreshNotice(false)
    router.push('/')
  }

  // 스킬 관리
  const addSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill.trim()
    if (skillToAdd && !preferences.interests.skills.includes(skillToAdd)) {
      setPreferences(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          skills: [...prev.interests.skills, skillToAdd]
        }
      }))
      setNewSkill('')
      setShowSkillSuggestions(false)
    }
  }

  const removeSkill = (skill: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        skills: prev.interests.skills.filter(s => s !== skill)
      }
    }))
  }

  const handleSkillDragStart = (index: number) => setDraggedSkillIndex(index)
  const handleSkillDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedSkillIndex === null || draggedSkillIndex === index) return

    const skills = [...preferences.interests.skills]
    const draggedSkill = skills[draggedSkillIndex]
    skills.splice(draggedSkillIndex, 1)
    skills.splice(index, 0, draggedSkill)

    setPreferences(prev => ({
      ...prev,
      interests: { ...prev.interests, skills }
    }))
    setDraggedSkillIndex(index)
  }
  const handleSkillDragEnd = () => setDraggedSkillIndex(null)

  // 직무 관리
  const addPosition = () => {
    if (newPosition.trim()) {
      setPreferences(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          positions: [...prev.interests.positions, newPosition.trim()]
        }
      }))
      setNewPosition('')
    }
  }

  const removePosition = (position: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        positions: prev.interests.positions.filter(p => p !== position)
      }
    }))
  }

  const handlePositionDragStart = (index: number) => setDraggedPositionIndex(index)
  const handlePositionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedPositionIndex === null || draggedPositionIndex === index) return

    const positions = [...preferences.interests.positions]
    const draggedPosition = positions[draggedPositionIndex]
    positions.splice(draggedPositionIndex, 1)
    positions.splice(index, 0, draggedPosition)

    setPreferences(prev => ({
      ...prev,
      interests: { ...prev.interests, positions }
    }))
    setDraggedPositionIndex(index)
  }
  const handlePositionDragEnd = () => setDraggedPositionIndex(null)

  // 산업 관리
  const addIndustry = () => {
    if (newIndustry.trim()) {
      setPreferences(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          industries: [...prev.interests.industries, newIndustry.trim()]
        }
      }))
      setNewIndustry('')
    }
  }

  const removeIndustry = (industry: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        industries: prev.interests.industries.filter(i => i !== industry)
      }
    }))
  }

  const handleIndustryDragStart = (index: number) => setDraggedIndustryIndex(index)
  const handleIndustryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndustryIndex === null || draggedIndustryIndex === index) return

    const industries = [...preferences.interests.industries]
    const draggedIndustry = industries[draggedIndustryIndex]
    industries.splice(draggedIndustryIndex, 1)
    industries.splice(index, 0, draggedIndustry)

    setPreferences(prev => ({
      ...prev,
      interests: { ...prev.interests, industries }
    }))
    setDraggedIndustryIndex(index)
  }
  const handleIndustryDragEnd = () => setDraggedIndustryIndex(null)

  // 지역 관리
  const addLocation = (location?: string) => {
    const locationToAdd = location || newLocation.trim()
    if (locationToAdd && !preferences.interests.locations.includes(locationToAdd)) {
      setPreferences(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          locations: [...prev.interests.locations, locationToAdd]
        }
      }))
      setNewLocation('')
      setShowLocationSuggestions(false)
    }
  }

  const removeLocation = (location: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        locations: prev.interests.locations.filter(l => l !== location)
      }
    }))
  }

  const handleLocationDragStart = (index: number) => setDraggedLocationIndex(index)
  const handleLocationDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedLocationIndex === null || draggedLocationIndex === index) return

    const locations = [...preferences.interests.locations]
    const draggedLocation = locations[draggedLocationIndex]
    locations.splice(draggedLocationIndex, 1)
    locations.splice(index, 0, draggedLocation)

    setPreferences(prev => ({
      ...prev,
      interests: { ...prev.interests, locations }
    }))
    setDraggedLocationIndex(index)
  }
  const handleLocationDragEnd = () => setDraggedLocationIndex(null)

  // 복지 관리
  const addBenefit = (benefit?: string) => {
    const benefitToAdd = benefit || newBenefit.trim()
    if (benefitToAdd && !(preferences.workConditions.benefits || []).includes(benefitToAdd)) {
      setPreferences(prev => ({
        ...prev,
        workConditions: {
          ...prev.workConditions,
          benefits: [...(prev.workConditions.benefits || []), benefitToAdd]
        }
      }))
      setNewBenefit('')
      setShowBenefitSuggestions(false)
    }
  }

  const removeBenefit = (benefit: string) => {
    setPreferences(prev => ({
      ...prev,
      workConditions: {
        ...prev.workConditions,
        benefits: (prev.workConditions.benefits || []).filter(b => b !== benefit)
      }
    }))
  }

  const toggleWorkType = (type: string) => {
    setPreferences(prev => {
      const types = prev.workConditions.types.includes(type)
        ? prev.workConditions.types.filter(t => t !== type)
        : [...prev.workConditions.types, type]
      return {
        ...prev,
        workConditions: {
          ...prev.workConditions,
          types
        }
      }
    })
  }

  // 추천 스킬 필터링
  const getSkillSuggestions = () => {
    const allSkills = Object.values(recommendedSkills).flat()
    return allSkills
      .filter(skill =>
        !preferences.interests.skills.includes(skill) &&
        skill.toLowerCase().includes(newSkill.toLowerCase())
      )
      .slice(0, 8)
  }

  // 추천 복지 필터링
  const getBenefitSuggestions = () => {
    return recommendedBenefits
      .filter(benefit =>
        !(preferences.workConditions.benefits || []).includes(benefit) &&
        benefit.toLowerCase().includes(newBenefit.toLowerCase())
      )
      .slice(0, 8)
  }

  // 추천 지역 필터링
  const getLocationSuggestions = () => {
    return recommendedLocations
      .filter(location =>
        !preferences.interests.locations.includes(location) &&
        location.includes(newLocation)
      )
      .slice(0, 8)
  }

  // 스마트 추천: 전공에 따른 기술 스택 추천
  const getSmartSkillSuggestions = (): string[] => {
    const major = preferences.education.major?.toLowerCase() || ''

    if (major.includes('컴퓨터') || major.includes('소프트웨어') || major.includes('전산')) {
      return ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL']
    } else if (major.includes('디자인') || major.includes('시각')) {
      return ['Figma', 'Photoshop', 'Illustrator', 'UI/UX', 'Sketch']
    } else if (major.includes('경영') || major.includes('비즈니스')) {
      return ['Excel', 'PowerPoint', 'Google Analytics', 'SQL', 'Tableau']
    } else if (major.includes('마케팅') || major.includes('광고')) {
      return ['Google Analytics', 'SEO', 'SNS마케팅', 'Content Marketing']
    }

    return []
  }

  // 스마트 추천: 현재 직무에 따른 관심 직무 추천
  const getSmartPositionSuggestions = (): string[] => {
    const currentPosition = preferences.career.currentPosition?.toLowerCase() || ''

    if (currentPosition.includes('백엔드') || currentPosition.includes('backend')) {
      return ['백엔드 개발자', 'API 개발자', 'DevOps 엔지니어', '클라우드 엔지니어']
    } else if (currentPosition.includes('프론트') || currentPosition.includes('frontend')) {
      return ['프론트엔드 개발자', 'UI 개발자', 'React 개발자', '웹 퍼블리셔']
    } else if (currentPosition.includes('풀스택') || currentPosition.includes('fullstack')) {
      return ['풀스택 개발자', '백엔드 개발자', '프론트엔드 개발자', '웹 개발자']
    } else if (currentPosition.includes('디자인')) {
      return ['UI/UX 디자이너', 'Product 디자이너', '그래픽 디자이너', '웹 디자이너']
    }

    return []
  }

  // 전공 기반 추천 표시 여부
  const shouldShowSmartSuggestions = (): boolean => {
    return (
      (!!preferences.education.major && preferences.interests.skills.length === 0) ||
      (!!preferences.career.currentPosition && preferences.interests.positions.length === 0)
    )
  }

  const tabs = [
    { id: 'personal' as TabType, label: '개인정보 & 경력', icon: User },
    { id: 'interests' as TabType, label: '관심사', icon: Heart },
    { id: 'conditions' as TabType, label: '희망 조건', icon: Target },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">설정</h1>
              <p className="text-gray-600">개인정보와 관심사를 설정하세요</p>
            </div>
            <div className="flex items-center gap-3">
              {autoSaving && (
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Sparkles size={16} className="animate-pulse" />
                  자동 저장 중...
                </span>
              )}

              {/* Export/Import Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
                  title="설정 백업/복원"
                >
                  <Download size={20} />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                    <button
                      onClick={handleExportSettings}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                    >
                      <Download size={18} />
                      <span>설정 내보내기</span>
                    </button>
                    <label className="w-full cursor-pointer block">
                      <input
                        type="file"
                        accept="application/json"
                        onChange={handleImportSettings}
                        className="hidden"
                      />
                      <div className="px-4 py-3 hover:bg-gray-50 flex items-center gap-2">
                        <Upload size={18} />
                        <span>설정 가져오기</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Save size={20} />
                저장
              </button>
            </div>
          </div>

          {/* 프로필 완성도 인디케이터 */}
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-900">프로필 완성도</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{calculateCompleteness()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${calculateCompleteness()}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {calculateCompleteness() === 100 ? (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Check size={16} />
                  프로필이 완벽합니다! 더 정확한 추천을 받을 수 있습니다.
                </span>
              ) : calculateCompleteness() >= 70 ? (
                '거의 다 왔습니다! 조금만 더 입력하면 완벽한 추천을 받을 수 있어요.'
              ) : calculateCompleteness() >= 40 ? (
                '좋아요! 더 많은 정보를 입력하면 더 정확한 채용 정보를 추천받을 수 있어요.'
              ) : (
                '프로필을 더 채워주세요. 정보가 많을수록 맞춤 추천이 정확해집니다.'
              )}
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 저장 완료 알림 */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg animate-fade-in flex items-center gap-2">
            <Check size={20} />
            설정이 저장되었습니다
          </div>
        )}

        {/* 추천 새로고침 알림 */}
        {showRefreshNotice && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium">설정이 변경되었습니다</p>
                  <p className="text-sm text-blue-700">메인 페이지에서 새로운 추천을 확인하세요</p>
                </div>
              </div>
              <button
                onClick={handleRefreshRecommendations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                추천 보기
              </button>
            </div>
          </div>
        )}

        {/* 탭 컨텐츠 */}
        <div className="space-y-6">
          {/* 개인정보 & 경력 탭 */}
          {activeTab === 'personal' && (
            <>
              {/* 개인정보 섹션 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={24} className="text-blue-600" />
                  개인정보
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                    <input
                      type="text"
                      value={preferences.personalInfo.name || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <input
                      type="email"
                      value={preferences.personalInfo.email || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                    <input
                      type="tel"
                      value={preferences.personalInfo.phone || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">출생년도</label>
                    <input
                      type="number"
                      value={preferences.personalInfo.birthYear || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, birthYear: parseInt(e.target.value) || undefined }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 1990"
                    />
                  </div>
                </div>
              </div>

              {/* 학력 섹션 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Briefcase size={24} className="text-green-600" />
                  학력
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">최종 학력</label>
                    <select
                      value={preferences.education.level}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        education: { ...prev.education, level: e.target.value as any }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="high-school">고등학교 졸업</option>
                      <option value="associate">전문학사 (2~3년제)</option>
                      <option value="bachelor">학사 (4년제)</option>
                      <option value="master">석사</option>
                      <option value="phd">박사</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전공</label>
                    <input
                      type="text"
                      value={preferences.education.major || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        education: { ...prev.education, major: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 컴퓨터공학"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학교명</label>
                    <input
                      type="text"
                      value={preferences.education.school || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        education: { ...prev.education, school: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 서울대학교"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">졸업년도</label>
                    <input
                      type="number"
                      value={preferences.education.graduationYear || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        education: { ...prev.education, graduationYear: parseInt(e.target.value) || undefined }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 2020"
                    />
                  </div>
                </div>
              </div>

              {/* 경력 섹션 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Briefcase size={24} className="text-purple-600" />
                  경력
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">경력 수준</label>
                    <select
                      value={preferences.career.level}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        career: { ...prev.career, level: e.target.value as any }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">전체</option>
                      <option value="newcomer">신입 (0년)</option>
                      <option value="junior">주니어 (1-3년)</option>
                      <option value="senior">시니어 (4-10년)</option>
                      <option value="lead">리드 (10년 이상)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">경력 년수</label>
                    <input
                      type="number"
                      value={preferences.career.years || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        career: { ...prev.career, years: parseInt(e.target.value) || undefined }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 5 (단위: 년)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 회사</label>
                    <input
                      type="text"
                      value={preferences.career.currentCompany || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        career: { ...prev.career, currentCompany: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 카카오"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 직무</label>
                    <input
                      type="text"
                      value={preferences.career.currentPosition || ''}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        career: { ...prev.career, currentPosition: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 백엔드 개발자"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 관심사 탭 */}
          {activeTab === 'interests' && (
            <>
              {/* AI 스마트 추천 패널 */}
              {shouldShowSmartSuggestions() && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={24} className="text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900">AI 스마트 추천</h3>
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">NEW</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    입력하신 정보를 바탕으로 추천 항목을 자동 생성했습니다. 클릭하여 빠르게 추가하세요!
                  </p>

                  {/* 기술 스택 추천 */}
                  {preferences.education.major && preferences.interests.skills.length === 0 && getSmartSkillSuggestions().length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        💡 <strong>{preferences.education.major}</strong> 전공에 추천하는 기술 스택:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getSmartSkillSuggestions().map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              setPreferences(prev => ({
                                ...prev,
                                interests: {
                                  ...prev.interests,
                                  skills: [...prev.interests.skills, skill]
                                }
                              }))
                            }}
                            className="px-3 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-1"
                          >
                            <Plus size={14} />
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 직무 추천 */}
                  {preferences.career.currentPosition && preferences.interests.positions.length === 0 && getSmartPositionSuggestions().length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        💼 <strong>{preferences.career.currentPosition}</strong> 경력에 추천하는 직무:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getSmartPositionSuggestions().map((position) => (
                          <button
                            key={position}
                            onClick={() => {
                              setPreferences(prev => ({
                                ...prev,
                                interests: {
                                  ...prev.interests,
                                  positions: [...prev.interests.positions, position]
                                }
                              }))
                            }}
                            className="px-3 py-2 bg-white border-2 border-pink-300 text-pink-700 rounded-lg hover:bg-pink-100 transition-all text-sm font-medium shadow-sm hover:shadow-md flex items-center gap-1"
                          >
                            <Plus size={14} />
                            {position}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 관심 기술 스택 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles size={24} className="text-blue-600" />
                  관심 기술 스택
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  드래그하여 우선순위를 변경 • <span className="text-blue-600 font-medium">1번이 가장 높은 우선순위</span>
                </p>
                <div className="relative mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => {
                          setNewSkill(e.target.value)
                          setShowSkillSuggestions(e.target.value.length > 0)
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        onFocus={() => setShowSkillSuggestions(newSkill.length > 0)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="React, Python, Docker... (검색하거나 직접 입력)"
                      />
                    </div>
                    <button
                      onClick={() => addSkill()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                      <Plus size={20} />
                      추가
                    </button>
                  </div>

                  {/* 추천 스킬 드롭다운 */}
                  {showSkillSuggestions && getSkillSuggestions().length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {getSkillSuggestions().map(skill => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                        >
                          <Sparkles size={16} className="text-blue-500" />
                          <span className="font-medium">{skill}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {preferences.interests.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleSkillDragStart(idx)}
                      onDragOver={(e) => handleSkillDragOver(e, idx)}
                      onDragEnd={handleSkillDragEnd}
                      className={`flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg cursor-move hover:bg-blue-100 transition-all ${
                        draggedSkillIndex === idx ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <GripVertical size={20} className="text-gray-400" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-blue-900 font-medium">{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-blue-700" />
                      </button>
                    </div>
                  ))}
                  {preferences.interests.skills.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">관심 기술 스택을 추가해주세요</p>
                      <p className="text-sm mt-2">검색하거나 직접 입력하세요</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 관심 직무 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Briefcase size={24} className="text-green-600" />
                  관심 직무
                </h2>
                <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 프론트엔드, 백엔드, DevOps..."
                  />
                  <button
                    onClick={addPosition}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap shadow-sm"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="space-y-2">
                  {preferences.interests.positions.map((position, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handlePositionDragStart(idx)}
                      onDragOver={(e) => handlePositionDragOver(e, idx)}
                      onDragEnd={handlePositionDragEnd}
                      className={`flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg cursor-move hover:bg-green-100 transition-all ${
                        draggedPositionIndex === idx ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <GripVertical size={20} className="text-gray-400" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-green-900 font-medium">{position}</span>
                      <button
                        onClick={() => removePosition(position)}
                        className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-green-700" />
                      </button>
                    </div>
                  ))}
                  {preferences.interests.positions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">관심 직무를 추가해주세요</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 관심 업종/산업 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Target size={24} className="text-purple-600" />
                  관심 업종/산업
                </h2>
                <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: IT/소프트웨어, 금융, 제조, 유통..."
                  />
                  <button
                    onClick={addIndustry}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 whitespace-nowrap shadow-sm"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="space-y-2">
                  {preferences.interests.industries.map((industry, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleIndustryDragStart(idx)}
                      onDragOver={(e) => handleIndustryDragOver(e, idx)}
                      onDragEnd={handleIndustryDragEnd}
                      className={`flex items-center gap-3 px-4 py-3 bg-purple-50 rounded-lg cursor-move hover:bg-purple-100 transition-all ${
                        draggedIndustryIndex === idx ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <GripVertical size={20} className="text-gray-400" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-purple-900 font-medium">{industry}</span>
                      <button
                        onClick={() => removeIndustry(industry)}
                        className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-purple-700" />
                      </button>
                    </div>
                  ))}
                  {preferences.interests.industries.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Target size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">관심 업종을 추가해주세요</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 선호 지역 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Target size={24} className="text-orange-600" />
                  선호 지역
                </h2>
                <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
                <div className="relative mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => {
                        setNewLocation(e.target.value)
                        setShowLocationSuggestions(e.target.value.length > 0)
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                      onFocus={() => setShowLocationSuggestions(newLocation.length > 0)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 서울, 경기, 부산... (검색하거나 직접 입력)"
                    />
                    <button
                      onClick={() => addLocation()}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                      <Plus size={20} />
                      추가
                    </button>
                  </div>

                  {/* 추천 지역 드롭다운 */}
                  {showLocationSuggestions && getLocationSuggestions().length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {getLocationSuggestions().map(location => (
                        <button
                          key={location}
                          onClick={() => addLocation(location)}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                        >
                          <Sparkles size={16} className="text-orange-500" />
                          <span className="font-medium">{location}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {preferences.interests.locations.map((location, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleLocationDragStart(idx)}
                      onDragOver={(e) => handleLocationDragOver(e, idx)}
                      onDragEnd={handleLocationDragEnd}
                      className={`flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-lg cursor-move hover:bg-orange-100 transition-all ${
                        draggedLocationIndex === idx ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <GripVertical size={20} className="text-gray-400" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white text-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="flex-1 text-orange-900 font-medium">{location}</span>
                      <button
                        onClick={() => removeLocation(location)}
                        className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-orange-700" />
                      </button>
                    </div>
                  ))}
                  {preferences.interests.locations.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Target size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">선호 지역을 추가해주세요</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 희망 조건 탭 */}
          {activeTab === 'conditions' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target size={24} className="text-blue-600" />
                희망 조건
              </h2>

              {/* 근무 형태 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">선호 근무 형태 (복수 선택 가능)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'remote', label: '원격 근무', emoji: '🏠' },
                    { value: 'onsite', label: '사무실 근무', emoji: '🏢' },
                    { value: 'dispatch', label: '파견 근무', emoji: '🚗' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleWorkType(type.value)}
                      className={`px-6 py-4 rounded-lg border-2 transition-all font-medium shadow-sm ${
                        preferences.workConditions.types.includes(type.value)
                          ? 'border-blue-600 bg-blue-50 text-blue-700 scale-105'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.emoji}</div>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 희망 연봉 슬라이더 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  희망 연봉 범위 (단위: 만원)
                </label>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">최소</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(preferences.workConditions.salaryMin || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">만원</div>
                    </div>
                    <div className="text-gray-400">~</div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">최대</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(preferences.workConditions.salaryMax || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">만원</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <input
                        type="range"
                        min="2000"
                        max="10000"
                        step="500"
                        value={preferences.workConditions.salaryMin || 3000}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          workConditions: {
                            ...prev.workConditions,
                            salaryMin: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div>
                      <input
                        type="range"
                        min="2000"
                        max="10000"
                        step="500"
                        value={preferences.workConditions.salaryMax || 5000}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          workConditions: {
                            ...prev.workConditions,
                            salaryMax: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 text-center">
                    💡 2024년 IT 개발자 평균 연봉: 약 5,500만원
                  </div>
                </div>
              </div>

              {/* 희망 복지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">희망 복지 및 혜택</label>
                <div className="relative mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => {
                        setNewBenefit(e.target.value)
                        setShowBenefitSuggestions(e.target.value.length > 0)
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                      onFocus={() => setShowBenefitSuggestions(newBenefit.length > 0)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="워라벨, 재택근무, 교육지원... (검색하거나 직접 입력)"
                    />
                    <button
                      onClick={() => addBenefit()}
                      className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                      <Plus size={20} />
                      추가
                    </button>
                  </div>

                  {/* 추천 복지 드롭다운 */}
                  {showBenefitSuggestions && getBenefitSuggestions().length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-px bg-gray-200">
                        {getBenefitSuggestions().map(benefit => (
                          <button
                            key={benefit}
                            onClick={() => addBenefit(benefit)}
                            className="bg-white px-4 py-3 hover:bg-teal-50 text-left flex items-center gap-2"
                          >
                            <Sparkles size={14} className="text-teal-500" />
                            <span className="text-sm font-medium">{benefit}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(preferences.workConditions.benefits || []).map((benefit, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-teal-100 text-teal-800 rounded-full flex items-center gap-2 font-medium shadow-sm"
                    >
                      {benefit}
                      <button
                        onClick={() => removeBenefit(benefit)}
                        className="hover:text-teal-900 hover:bg-teal-200 rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                {(preferences.workConditions.benefits || []).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">희망하는 복지를 추가해주세요</p>
                    <p className="text-sm mt-2">검색하면 추천 복지를 확인할 수 있습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 저장 버튼 (모바일용) */}
        <div className="mt-8 md:hidden">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
          >
            <Save size={20} />
            저장
          </button>
        </div>

        {/* 퀵 팁 & 키보드 단축키 */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-600" />
            유용한 팁
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">⌨️ 키보드 단축키</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl/Cmd + S</kbd> 설정 저장</li>
                <li><kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl/Cmd + E</kbd> 설정 내보내기</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">💡 프로 팁</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 우선순위가 높을수록 더 정확한 추천을 받을 수 있어요</li>
                <li>• 자동 저장이 활성화되어 있어 데이터가 안전해요</li>
                <li>• 설정은 언제든 내보내기하여 백업할 수 있어요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-12"></div>
      </main>
    </div>
  )
}
