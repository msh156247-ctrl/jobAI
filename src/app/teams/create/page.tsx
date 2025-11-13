'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { ArrowLeft, Plus, X, Save } from 'lucide-react'
import Link from 'next/link'
import type { TeamPosition } from '@/types'

export default function CreateTeamPage() {
  const { user } = useAuth()
  const router = useRouter()

  // 기본 정보
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teamType, setTeamType] = useState<'project' | 'study' | 'startup' | 'contest' | 'opensource'>('project')
  const [industry, setIndustry] = useState('IT/기술')

  // 활동 정보
  const [duration, setDuration] = useState('')
  const [location, setLocation] = useState<'online' | 'offline' | 'hybrid'>('online')
  const [locationDetail, setLocationDetail] = useState('')
  const [schedule, setSchedule] = useState('')
  const [deadline, setDeadline] = useState('')

  // 기술 스택
  const [techStack, setTechStack] = useState<string[]>([])
  const [newTech, setNewTech] = useState('')

  // 포지션
  const [positions, setPositions] = useState<Omit<TeamPosition, 'id' | 'filledCount'>[]>([
    {
      title: '',
      description: '',
      requiredCount: 1,
      requiredSkills: [],
      responsibilities: ['']
    }
  ])

  // 요구사항
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [newRequiredSkill, setNewRequiredSkill] = useState('')
  const [preferredSkills, setPreferredSkills] = useState<string[]>([])
  const [newPreferredSkill, setNewPreferredSkill] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'any'>('any')

  // 태그
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const addTech = () => {
    if (newTech.trim() && !techStack.includes(newTech.trim())) {
      setTechStack([...techStack, newTech.trim()])
      setNewTech('')
    }
  }

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter(t => t !== tech))
  }

  const addRequiredSkill = () => {
    if (newRequiredSkill.trim() && !requiredSkills.includes(newRequiredSkill.trim())) {
      setRequiredSkills([...requiredSkills, newRequiredSkill.trim()])
      setNewRequiredSkill('')
    }
  }

  const removeRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill))
  }

  const addPreferredSkill = () => {
    if (newPreferredSkill.trim() && !preferredSkills.includes(newPreferredSkill.trim())) {
      setPreferredSkills([...preferredSkills, newPreferredSkill.trim()])
      setNewPreferredSkill('')
    }
  }

  const removePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skill))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const addPosition = () => {
    setPositions([
      ...positions,
      {
        title: '',
        description: '',
        requiredCount: 1,
        requiredSkills: [],
        responsibilities: ['']
      }
    ])
  }

  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index))
  }

  const updatePosition = (index: number, field: string, value: any) => {
    const updated = [...positions]
    ;(updated[index] as any)[field] = value
    setPositions(updated)
  }

  const addPositionSkill = (index: number, skill: string) => {
    if (skill.trim()) {
      const updated = [...positions]
      updated[index].requiredSkills.push(skill.trim())
      setPositions(updated)
    }
  }

  const removePositionSkill = (posIndex: number, skillIndex: number) => {
    const updated = [...positions]
    updated[posIndex].requiredSkills.splice(skillIndex, 1)
    setPositions(updated)
  }

  const addResponsibility = (index: number) => {
    const updated = [...positions]
    updated[index].responsibilities.push('')
    setPositions(updated)
  }

  const updateResponsibility = (posIndex: number, respIndex: number, value: string) => {
    const updated = [...positions]
    updated[posIndex].responsibilities[respIndex] = value
    setPositions(updated)
  }

  const removeResponsibility = (posIndex: number, respIndex: number) => {
    const updated = [...positions]
    updated[posIndex].responsibilities.splice(respIndex, 1)
    setPositions(updated)
  }

  const handleSubmit = () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }

    // 유효성 검사
    if (!title.trim()) {
      alert('팀 제목을 입력해주세요.')
      return
    }
    if (!description.trim()) {
      alert('팀 설명을 입력해주세요.')
      return
    }
    if (techStack.length === 0) {
      alert('기술 스택을 최소 1개 이상 추가해주세요.')
      return
    }
    if (positions.length === 0 || !positions[0].title.trim()) {
      alert('최소 1개의 포지션을 추가해주세요.')
      return
    }
    if (requiredSkills.length === 0) {
      alert('필수 역량을 최소 1개 이상 추가해주세요.')
      return
    }

    // 포지션 유효성 검사
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      if (!pos.title.trim()) {
        alert(`포지션 ${i + 1}의 제목을 입력해주세요.`)
        return
      }
      if (!pos.description.trim()) {
        alert(`포지션 ${i + 1}의 설명을 입력해주세요.`)
        return
      }
      if (pos.requiredSkills.length === 0) {
        alert(`포지션 ${i + 1}의 필요 스킬을 추가해주세요.`)
        return
      }
      if (pos.responsibilities.filter(r => r.trim()).length === 0) {
        alert(`포지션 ${i + 1}의 담당 업무를 추가해주세요.`)
        return
      }
    }

    // 팀 데이터 생성
    const totalSlots = positions.reduce((sum, pos) => sum + pos.requiredCount, 0)

    const teamData = {
      id: `team_${Date.now()}`,
      title,
      description,
      leaderId: user.id,
      leaderName: user.name,
      teamType,
      industry,
      techStack,
      positions: positions.map((pos, idx) => ({
        ...pos,
        id: `pos_${Date.now()}_${idx}`,
        filledCount: 0,
        responsibilities: pos.responsibilities.filter(r => r.trim())
      })),
      totalSlots,
      filledSlots: 0,
      duration,
      location,
      locationDetail: location !== 'online' ? locationDetail : undefined,
      schedule: schedule || undefined,
      requiredSkills,
      preferredSkills: preferredSkills.length > 0 ? preferredSkills : undefined,
      experienceLevel,
      views: 0,
      applicantsCount: 0,
      bookmarksCount: 0,
      status: 'recruiting' as const,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined
    }

    // localStorage에 저장
    const stored = localStorage.getItem('jobai:teams')
    const teams = stored ? JSON.parse(stored) : []
    teams.unshift(teamData)
    localStorage.setItem('jobai:teams', JSON.stringify(teams))

    alert('팀 모집글이 등록되었습니다!')
    router.push(`/teams/${teamData.id}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">로그인이 필요합니다.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          팀 목록으로
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 모집글 작성</h1>
          <p className="text-gray-600">함께할 팀원을 모집하세요</p>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: AI 기반 헬스케어 서비스 개발 팀원 모집"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팀 소개 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="팀에 대해 자세히 설명해주세요..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    팀 타입 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={teamType}
                    onChange={(e) => setTeamType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="project">프로젝트</option>
                    <option value="study">스터디</option>
                    <option value="startup">스타트업</option>
                    <option value="contest">대회/해커톤</option>
                    <option value="opensource">오픈소스</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업종 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IT/기술">IT/기술</option>
                    <option value="금융">금융</option>
                    <option value="의료/헬스케어">의료/헬스케어</option>
                    <option value="교육">교육</option>
                    <option value="마케팅">마케팅</option>
                    <option value="디자인">디자인</option>
                    <option value="게임">게임</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="블록체인">블록체인</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 활동 정보 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">활동 정보</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    활동 기간
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 3개월, 6개월, 상시"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    위치
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="online">온라인</option>
                    <option value="offline">오프라인</option>
                    <option value="hybrid">혼합</option>
                  </select>
                </div>
              </div>

              {location !== 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상세 위치
                  </label>
                  <input
                    type="text"
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 서울 강남구"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활동 일정
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 주 2회, 평일 저녁 7-10시"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모집 마감일
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 기술 스택 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              기술 스택 <span className="text-red-500">*</span>
            </h2>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTech()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="기술 스택 입력 (Enter로 추가)"
              />
              <button
                onClick={addTech}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {techStack.map(tech => (
                <span
                  key={tech}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
                >
                  {tech}
                  <button
                    onClick={() => removeTech(tech)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 모집 포지션 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                모집 포지션 <span className="text-red-500">*</span>
              </h2>
              <button
                onClick={addPosition}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                포지션 추가
              </button>
            </div>

            <div className="space-y-6">
              {positions.map((position, posIdx) => (
                <div key={posIdx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">포지션 {posIdx + 1}</h3>
                    {positions.length > 1 && (
                      <button
                        onClick={() => removePosition(posIdx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          포지션명
                        </label>
                        <input
                          type="text"
                          value={position.title}
                          onChange={(e) => updatePosition(posIdx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: 프론트엔드 개발자"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          필요 인원
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={position.requiredCount}
                          onChange={(e) => updatePosition(posIdx, 'requiredCount', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        value={position.description}
                        onChange={(e) => updatePosition(posIdx, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="포지션 설명"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필요 스킬
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addPositionSkill(posIdx, (e.target as HTMLInputElement).value)
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="스킬 입력 (Enter로 추가)"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {position.requiredSkills.map((skill, skillIdx) => (
                          <span
                            key={skillIdx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm flex items-center gap-1"
                          >
                            {skill}
                            <button
                              onClick={() => removePositionSkill(posIdx, skillIdx)}
                              className="text-blue-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        담당 업무
                      </label>
                      <div className="space-y-2">
                        {position.responsibilities.map((resp, respIdx) => (
                          <div key={respIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={resp}
                              onChange={(e) => updateResponsibility(posIdx, respIdx, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="담당 업무"
                            />
                            {position.responsibilities.length > 1 && (
                              <button
                                onClick={() => removeResponsibility(posIdx, respIdx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addResponsibility(posIdx)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          업무 추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 요구사항 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">요구사항</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  필수 역량 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRequiredSkill}
                    onChange={(e) => setNewRequiredSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRequiredSkill()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="필수 역량 입력 (Enter로 추가)"
                  />
                  <button
                    onClick={addRequiredSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => removeRequiredSkill(skill)}
                        className="text-green-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우대 사항
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newPreferredSkill}
                    onChange={(e) => setNewPreferredSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPreferredSkill()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="우대 사항 입력 (Enter로 추가)"
                  />
                  <button
                    onClick={addPreferredSkill}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferredSkills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => removePreferredSkill(skill)}
                        className="text-blue-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  경력 레벨
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">경력 무관</option>
                  <option value="beginner">초급 (0-2년)</option>
                  <option value="intermediate">중급 (3-5년)</option>
                  <option value="advanced">고급 (5년+)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 태그 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">태그</h2>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="태그 입력 (Enter로 추가)"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full flex items-center gap-2"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              등록하기
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
