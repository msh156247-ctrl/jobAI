'use client'

import { useState } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'

export type PriorityItem = {
  id: string
  label: string
  field: string
  weight: number
  enabled: boolean
}

// 사용 가능한 조건 옵션
export const AVAILABLE_CRITERIA = {
  jobseeker: [
    { field: 'desiredJob', label: '희망 직무', defaultWeight: 25 },
    { field: 'skills', label: '보유 스킬', defaultWeight: 25 },
    { field: 'industry', label: '희망 업종', defaultWeight: 15 },
    { field: 'location', label: '희망 근무지', defaultWeight: 15 },
    { field: 'salary', label: '희망 연봉', defaultWeight: 10 },
    { field: 'workType', label: '근무 형태', defaultWeight: 5 },
    { field: 'career', label: '경력 조건', defaultWeight: 5 },
    { field: 'companySize', label: '회사 규모', defaultWeight: 3 },
    { field: 'welfare', label: '복지 혜택', defaultWeight: 2 },
  ],
  employer: [
    { field: 'skills', label: '요구 스킬', defaultWeight: 30 },
    { field: 'career', label: '경력 요구사항', defaultWeight: 25 },
    { field: 'education', label: '학력 요구사항', defaultWeight: 15 },
    { field: 'location', label: '근무 가능 지역', defaultWeight: 10 },
    { field: 'salary', label: '희망 연봉', defaultWeight: 10 },
    { field: 'workType', label: '근무 형태', defaultWeight: 5 },
    { field: 'language', label: '어학 능력', defaultWeight: 5 },
  ],
}

interface PrioritySettingsProps {
  userType: 'jobseeker' | 'employer'
  priorities: PriorityItem[]
  onPrioritiesChange: (priorities: PriorityItem[]) => void
}

export default function PrioritySettings({
  userType,
  priorities,
  onPrioritiesChange,
}: PrioritySettingsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const availableCriteria = AVAILABLE_CRITERIA[userType]
  const usedFields = new Set(priorities.map(p => p.field))
  const unusedCriteria = availableCriteria.filter(c => !usedFields.has(c.field))

  // 드래그 시작
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPriorities = [...priorities]
    const draggedItem = newPriorities[draggedIndex]
    newPriorities.splice(draggedIndex, 1)
    newPriorities.splice(index, 0, draggedItem)

    setDraggedIndex(index)
    onPrioritiesChange(recalculateWeights(newPriorities))
  }

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // 가중치 재계산 (순서에 따라)
  const recalculateWeights = (items: PriorityItem[]): PriorityItem[] => {
    const enabledItems = items.filter(item => item.enabled)
    const totalWeight = 100
    const baseWeight = totalWeight / enabledItems.length

    return items.map((item, index) => {
      if (!item.enabled) return { ...item, weight: 0 }

      // 상위 항목일수록 더 높은 가중치 (첫 번째 항목이 가장 높음)
      const multiplier = 1 + (enabledItems.length - enabledItems.indexOf(item) - 1) * 0.2
      return {
        ...item,
        weight: Math.round(baseWeight * multiplier),
      }
    })
  }

  // 항목 추가
  const handleAddCriteria = (criteria: typeof availableCriteria[0]) => {
    const newItem: PriorityItem = {
      id: `${criteria.field}-${Date.now()}`,
      label: criteria.label,
      field: criteria.field,
      weight: criteria.defaultWeight,
      enabled: true,
    }

    const newPriorities = [...priorities, newItem]
    onPrioritiesChange(recalculateWeights(newPriorities))
    setShowAddMenu(false)
  }

  // 항목 제거
  const handleRemove = (index: number) => {
    const newPriorities = priorities.filter((_, i) => i !== index)
    onPrioritiesChange(recalculateWeights(newPriorities))
  }

  // 활성화/비활성화 토글
  const handleToggle = (index: number) => {
    const newPriorities = [...priorities]
    newPriorities[index].enabled = !newPriorities[index].enabled
    onPrioritiesChange(recalculateWeights(newPriorities))
  }

  // 가중치 편집 시작
  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditValue(priorities[index].weight.toString())
  }

  // 가중치 편집 완료
  const finishEditing = () => {
    if (editingIndex === null) return

    const newWeight = parseInt(editValue)
    if (isNaN(newWeight) || newWeight < 0 || newWeight > 100) {
      setEditingIndex(null)
      setEditValue('')
      return
    }

    const newPriorities = [...priorities]
    newPriorities[editingIndex].weight = newWeight
    onPrioritiesChange(newPriorities)
    setEditingIndex(null)
    setEditValue('')
  }

  // 가중치 편집 취소
  const cancelEditing = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  // 총 가중치 계산
  const totalWeight = priorities.filter(p => p.enabled).reduce((sum, p) => sum + p.weight, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {userType === 'jobseeker' ? '희망 조건 우선순위' : '채용 조건 우선순위'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            드래그하여 순서를 변경하세요. 위에 있을수록 더 높은 점수를 받습니다.
          </p>
        </div>
        {unusedCriteria.length > 0 && (
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>조건 추가</span>
          </button>
        )}
      </div>

      {/* 추가 메뉴 */}
      {showAddMenu && unusedCriteria.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {unusedCriteria.map((criteria) => (
              <button
                key={criteria.field}
                onClick={() => handleAddCriteria(criteria)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm"
              >
                {criteria.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 우선순위 리스트 */}
      <div className="space-y-2">
        {priorities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">조건을 추가해주세요</p>
          </div>
        ) : (
          priorities.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg transition-all ${
                draggedIndex === index
                  ? 'border-blue-500 shadow-lg scale-105'
                  : item.enabled
                  ? 'border-gray-300 hover:border-blue-400'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              {/* 드래그 핸들 */}
              <button
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                aria-label="순서 변경"
              >
                <GripVertical size={20} />
              </button>

              {/* 순위 표시 */}
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                {index + 1}
              </div>

              {/* 라벨 */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {item.enabled && (
                    <>
                      {editingIndex === index ? (
                        // 편집 모드
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finishEditing()
                              if (e.key === 'Escape') cancelEditing()
                            }}
                            autoFocus
                            className="w-16 px-2 py-1 text-xs font-medium border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">점</span>
                        </div>
                      ) : (
                        // 표시 모드 (클릭하여 편집)
                        <button
                          onClick={() => startEditing(index)}
                          className="group flex items-center gap-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded transition-colors"
                          title="클릭하여 편집"
                        >
                          <span>{item.weight}점</span>
                          {totalWeight > 0 && (
                            <span className="text-green-600">
                              ({Math.round((item.weight / totalWeight) * 100)}%)
                            </span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 토글 스위치 */}
              <button
                onClick={() => handleToggle(index)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  item.enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={item.enabled ? '비활성화' : '활성화'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    item.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* 삭제 버튼 */}
              <button
                onClick={() => handleRemove(index)}
                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label="삭제"
              >
                <X size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 총합 및 도움말 표시 */}
      {priorities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <span className="font-medium text-blue-900">총 가중치</span>
              <p className="text-xs text-blue-700 mt-1">
                활성화된 조건들의 가중치 합계
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-600">
                {totalWeight}점
              </span>
              <p className="text-xs text-blue-700 mt-1">
                (100점)
              </p>
            </div>
          </div>

          {/* 도움말 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p>💡 <strong>가중치 편집:</strong> 점수 부분을 클릭하면 직접 수정할 수 있습니다</p>
            <p>💡 <strong>드래그 정렬:</strong> 항목을 드래그하여 순서를 변경하면 자동으로 가중치가 재계산됩니다</p>
            <p>💡 <strong>퍼센트:</strong> 전체 가중치 중 해당 조건이 차지하는 비율입니다</p>
          </div>
        </div>
      )}
    </div>
  )
}
