'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserPreferences, saveUserPreferences, type UserPreferences } from '@/lib/userPreferences'
import Header from '@/components/Header'
import { Plus, X, GripVertical, Save, ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences())
  const [saved, setSaved] = useState(false)

  // 입력 필드용 임시 상태
  const [newSkill, setNewSkill] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newBenefit, setNewBenefit] = useState('')

  // 드래그 앤 드롭 상태
  const [draggedSkillIndex, setDraggedSkillIndex] = useState<number | null>(null)
  const [draggedPositionIndex, setDraggedPositionIndex] = useState<number | null>(null)
  const [draggedIndustryIndex, setDraggedIndustryIndex] = useState<number | null>(null)
  const [draggedLocationIndex, setDraggedLocationIndex] = useState<number | null>(null)

  useEffect(() => {
    setPreferences(getUserPreferences())
  }, [])

  const handleSave = () => {
    saveUserPreferences(preferences)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // 스킬 관리
  const addSkill = () => {
    if (newSkill.trim()) {
      setPreferences(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          skills: [...prev.interests.skills, newSkill.trim()]
        }
      }))
      setNewSkill('')
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

  const handleSkillDragStart = (index: number) => {
    setDraggedSkillIndex(index)
  }

  const handleSkillDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedSkillIndex === null || draggedSkillIndex === index) return

    const skills = [...preferences.interests.skills]
    const draggedSkill = skills[draggedSkillIndex]
    skills.splice(draggedSkillIndex, 1)
    skills.splice(index, 0, draggedSkill)

    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        skills
      }
    }))
    setDraggedSkillIndex(index)
  }

  const handleSkillDragEnd = () => {
    setDraggedSkillIndex(null)
  }

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

  const handlePositionDragStart = (index: number) => {
    setDraggedPositionIndex(index)
  }

  const handlePositionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedPositionIndex === null || draggedPositionIndex === index) return

    const positions = [...preferences.interests.positions]
    const draggedPosition = positions[draggedPositionIndex]
    positions.splice(draggedPositionIndex, 1)
    positions.splice(index, 0, draggedPosition)

    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        positions
      }
    }))
    setDraggedPositionIndex(index)
  }

  const handlePositionDragEnd = () => {
    setDraggedPositionIndex(null)
  }

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

  const handleIndustryDragStart = (index: number) => {
    setDraggedIndustryIndex(index)
  }

  const handleIndustryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndustryIndex === null || draggedIndustryIndex === index) return

    const industries = [...preferences.interests.industries]
    const draggedIndustry = industries[draggedIndustryIndex]
    industries.splice(draggedIndustryIndex, 1)
    industries.splice(index, 0, draggedIndustry)

    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        industries
      }
    }))
    setDraggedIndustryIndex(index)
  }

  const handleIndustryDragEnd = () => {
    setDraggedIndustryIndex(null)
  }

  // 지역 관리
  const addLocation = () => {
    if (newLocation.trim()) {
      setPreferences(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          locations: [...prev.interests.locations, newLocation.trim()]
        }
      }))
      setNewLocation('')
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

  const handleLocationDragStart = (index: number) => {
    setDraggedLocationIndex(index)
  }

  const handleLocationDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedLocationIndex === null || draggedLocationIndex === index) return

    const locations = [...preferences.interests.locations]
    const draggedLocation = locations[draggedLocationIndex]
    locations.splice(draggedLocationIndex, 1)
    locations.splice(index, 0, draggedLocation)

    setPreferences(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        locations
      }
    }))
    setDraggedLocationIndex(index)
  }

  const handleLocationDragEnd = () => {
    setDraggedLocationIndex(null)
  }

  // 복지 관리
  const addBenefit = () => {
    if (newBenefit.trim()) {
      setPreferences(prev => ({
        ...prev,
        workConditions: {
          ...prev.workConditions,
          benefits: [...(prev.workConditions.benefits || []), newBenefit.trim()]
        }
      }))
      setNewBenefit('')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">설정</h1>
              <p className="text-gray-600">개인정보와 관심사를 설정하세요</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={20} />
            저장
          </button>
        </div>

        {/* 저장 완료 알림 */}
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg animate-fade-in">
            ✓ 설정이 저장되었습니다
          </div>
        )}

        <div className="space-y-8">
          {/* 개인정보 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">개인정보</h2>
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
                  placeholder="1990"
                />
              </div>
            </div>
          </div>

          {/* 학력 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">학력</h2>
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
                  <option value="associate">전문학사</option>
                  <option value="bachelor">학사</option>
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
                  placeholder="컴퓨터공학"
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
                  placeholder="서울대학교"
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
                  placeholder="2020"
                />
              </div>
            </div>
          </div>

          {/* 경력 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">경력</h2>
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
                  <option value="newcomer">신입</option>
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
                  placeholder="5"
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
                  placeholder="카카오"
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
                  placeholder="백엔드 개발자"
                />
              </div>
            </div>
          </div>

          {/* 관심 기술 스택 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">관심 기술 스택</h2>
            <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="React, Python, Docker..."
              />
              <button
                onClick={addSkill}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={20} />
                추가
              </button>
            </div>
            <div className="space-y-2">
              {preferences.interests.skills.map((skill, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleSkillDragStart(idx)}
                  onDragOver={(e) => handleSkillDragOver(e, idx)}
                  onDragEnd={handleSkillDragEnd}
                  className={`flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg cursor-move hover:bg-blue-100 transition-colors ${
                    draggedSkillIndex === idx ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 w-8">{idx + 1}</span>
                  <span className="flex-1 text-blue-800 font-medium">{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                  >
                    <X size={18} className="text-blue-600" />
                  </button>
                </div>
              ))}
              {preferences.interests.skills.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  관심 기술 스택을 추가해주세요
                </p>
              )}
            </div>
          </div>

          {/* 관심 직무 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">관심 직무</h2>
            <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="프론트엔드, 백엔드, DevOps..."
              />
              <button
                onClick={addPosition}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
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
                  className={`flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg cursor-move hover:bg-green-100 transition-colors ${
                    draggedPositionIndex === idx ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 w-8">{idx + 1}</span>
                  <span className="flex-1 text-green-800 font-medium">{position}</span>
                  <button
                    onClick={() => removePosition(position)}
                    className="p-1 hover:bg-green-200 rounded transition-colors"
                  >
                    <X size={18} className="text-green-600" />
                  </button>
                </div>
              ))}
              {preferences.interests.positions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  관심 직무를 추가해주세요
                </p>
              )}
            </div>
          </div>

          {/* 관심 업종/산업 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">관심 업종/산업</h2>
            <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="IT/소프트웨어, 금융, 제조, 유통, 서비스..."
              />
              <button
                onClick={addIndustry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
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
                  className={`flex items-center gap-3 px-4 py-3 bg-purple-50 rounded-lg cursor-move hover:bg-purple-100 transition-colors ${
                    draggedIndustryIndex === idx ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 w-8">{idx + 1}</span>
                  <span className="flex-1 text-purple-800 font-medium">{industry}</span>
                  <button
                    onClick={() => removeIndustry(industry)}
                    className="p-1 hover:bg-purple-200 rounded transition-colors"
                  >
                    <X size={18} className="text-purple-600" />
                  </button>
                </div>
              ))}
              {preferences.interests.industries.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  관심 업종을 추가해주세요
                </p>
              )}
            </div>
          </div>

          {/* 선호 지역 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">선호 지역</h2>
            <p className="text-sm text-gray-600 mb-4">드래그하여 우선순위를 변경할 수 있습니다</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="서울, 경기, 부산..."
              />
              <button
                onClick={addLocation}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={20} />
                추가
              </button>
            </div>
            <div className="space-y-2">
              {preferences.interests.locations.map((location, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleLocationDragStart(idx)}
                  onDragOver={(e) => handleLocationDragOver(e, idx)}
                  onDragEnd={handleLocationDragEnd}
                  className={`flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-lg cursor-move hover:bg-orange-100 transition-colors ${
                    draggedLocationIndex === idx ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 w-8">{idx + 1}</span>
                  <span className="flex-1 text-orange-800 font-medium">{location}</span>
                  <button
                    onClick={() => removeLocation(location)}
                    className="p-1 hover:bg-orange-200 rounded transition-colors"
                  >
                    <X size={18} className="text-orange-600" />
                  </button>
                </div>
              ))}
              {preferences.interests.locations.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  선호 지역을 추가해주세요
                </p>
              )}
            </div>
          </div>

          {/* 희망 조건 섹션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">희망 조건</h2>

            {/* 근무 형태 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">선호 근무 형태</label>
              <div className="flex flex-wrap gap-3">
                {['remote', 'onsite', 'dispatch'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleWorkType(type)}
                    className={`px-6 py-3 rounded-lg border-2 transition-colors font-medium ${
                      preferences.workConditions.types.includes(type)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    {type === 'remote' ? '원격' : type === 'onsite' ? '사무실' : '파견'}
                  </button>
                ))}
              </div>
            </div>

            {/* 희망 연봉 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">희망 연봉 (만원)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">최소</label>
                  <input
                    type="number"
                    value={preferences.workConditions.salaryMin || ''}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      workConditions: {
                        ...prev.workConditions,
                        salaryMin: parseInt(e.target.value) || undefined
                      }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 3000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">최대</label>
                  <input
                    type="number"
                    value={preferences.workConditions.salaryMax || ''}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      workConditions: {
                        ...prev.workConditions,
                        salaryMax: parseInt(e.target.value) || undefined
                      }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 5000"
                  />
                </div>
              </div>
            </div>

            {/* 희망 복지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">희망 복지</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="건강보험, 식대, 교통비, 재택근무..."
                />
                <button
                  onClick={addBenefit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={20} />
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(preferences.workConditions.benefits || []).map((benefit, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-teal-100 text-teal-800 rounded-full flex items-center gap-2 font-medium"
                  >
                    {benefit}
                    <button onClick={() => removeBenefit(benefit)} className="hover:text-teal-900">
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
              {(preferences.workConditions.benefits || []).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  희망하는 복지를 추가해주세요
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 하단 저장 버튼 (모바일용) */}
        <div className="mt-8 md:hidden">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save size={20} />
            저장
          </button>
        </div>
      </main>
    </div>
  )
}
