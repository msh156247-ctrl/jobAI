'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { getUserPreferences, saveUserPreferences, type UserPreferences } from '@/lib/userPreferences'

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function PreferencesModal({ isOpen, onClose, onSave }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences())
  const [currentTab, setCurrentTab] = useState<'personal' | 'education' | 'career' | 'interests' | 'work'>('personal')

  // 입력 필드용 임시 상태
  const [newSkill, setNewSkill] = useState('')
  const [newPosition, setNewPosition] = useState('')
  const [newIndustry, setNewIndustry] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newBenefit, setNewBenefit] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPreferences(getUserPreferences())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    saveUserPreferences(preferences)
    onSave()
    onClose()
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">관심사 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setCurrentTab('personal')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              currentTab === 'personal'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            개인정보
          </button>
          <button
            onClick={() => setCurrentTab('education')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              currentTab === 'education'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            학력
          </button>
          <button
            onClick={() => setCurrentTab('career')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              currentTab === 'career'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            경력
          </button>
          <button
            onClick={() => setCurrentTab('interests')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              currentTab === 'interests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            관심분야
          </button>
          <button
            onClick={() => setCurrentTab('work')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              currentTab === 'work'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            근무조건
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 개인정보 탭 */}
          {currentTab === 'personal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  value={preferences.personalInfo.name || ''}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, name: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1990"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                <select
                  value={preferences.personalInfo.gender || 'prefer-not-to-say'}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, gender: e.target.value as any }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="prefer-not-to-say">선택 안 함</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>
          )}

          {/* 학력 탭 */}
          {currentTab === 'education' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">최종 학력</label>
                <select
                  value={preferences.education.level}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    education: { ...prev.education, level: e.target.value as any }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2020"
                />
              </div>
            </div>
          )}

          {/* 경력 탭 */}
          {currentTab === 'career' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">경력 수준</label>
                <select
                  value={preferences.career.level}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    career: { ...prev.career, level: e.target.value as any }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="백엔드 개발자"
                />
              </div>
            </div>
          )}

          {/* 관심분야 탭 */}
          {currentTab === 'interests' && (
            <div className="space-y-6">
              {/* 기술 스택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">관심 기술 스택</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="React, Python, Docker..."
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2"
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-blue-900">
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 관심 직무 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">관심 직무</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="프론트엔드, 백엔드, DevOps..."
                  />
                  <button
                    onClick={addPosition}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.positions.map((position, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-2"
                    >
                      {position}
                      <button onClick={() => removePosition(position)} className="hover:text-green-900">
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 관심 산업 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">관심 산업</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="IT, 금융, 제조..."
                  />
                  <button
                    onClick={addIndustry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.industries.map((industry, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center gap-2"
                    >
                      {industry}
                      <button onClick={() => removeIndustry(industry)} className="hover:text-purple-900">
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 선호 지역 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">선호 지역</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="서울, 경기, 부산..."
                  />
                  <button
                    onClick={addLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.locations.map((location, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full flex items-center gap-2"
                    >
                      {location}
                      <button onClick={() => removeLocation(location)} className="hover:text-orange-900">
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 근무조건 탭 */}
          {currentTab === 'work' && (
            <div className="space-y-6">
              {/* 근무 형태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">선호 근무 형태</label>
                <div className="flex flex-wrap gap-2">
                  {['remote', 'onsite', 'dispatch'].map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleWorkType(type)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        preferences.workConditions.types.includes(type)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {type === 'remote' ? '원격' : type === 'onsite' ? '사무실' : '파견'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 희망 연봉 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">희망 연봉 (만원)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="최소 (예: 3000)"
                    />
                  </div>
                  <div>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="최대 (예: 5000)"
                    />
                  </div>
                </div>
              </div>

              {/* 희망 복지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">희망 복지</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="건강보험, 식대, 교통비..."
                  />
                  <button
                    onClick={addBenefit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(preferences.workConditions.benefits || []).map((benefit, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full flex items-center gap-2"
                    >
                      {benefit}
                      <button onClick={() => removeBenefit(benefit)} className="hover:text-teal-900">
                        <X size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
