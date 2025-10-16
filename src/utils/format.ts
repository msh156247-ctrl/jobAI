// 날짜 포맷팅
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

// 상대 시간 포맷팅 (예: "3일 전", "2시간 전")
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}일 전`
  if (diffHours > 0) return `${diffHours}시간 전`
  if (diffMins > 0) return `${diffMins}분 전`
  return '방금 전'
}

// 숫자를 천 단위 구분자로 포맷팅
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

// 연봉을 포맷팅 (예: 3000 -> "3,000만원")
export function formatSalary(amount?: number): string {
  if (!amount) return '협의'
  return `${formatNumber(amount)}만원`
}

// 연봉 범위를 포맷팅
export function formatSalaryRange(min?: number, max?: number): string {
  if (!min && !max) return '협의'
  if (!max) return `${formatNumber(min!)}만원 이상`
  if (!min) return `${formatNumber(max)}만원 이하`
  return `${formatNumber(min)} ~ ${formatNumber(max)}만원`
}

// 경력 년수를 텍스트로 포맷팅
export function formatExperience(years: number, type: 'newcomer' | 'experienced'): string {
  if (type === 'newcomer') return '신입'
  if (years === 0) return '경력무관'
  return `경력 ${years}년`
}

// 학력 레벨을 한글로 변환
export function formatEducationLevel(level: string): string {
  const levelMap: Record<string, string> = {
    high_school: '고등학교 졸업',
    associate: '전문대 졸업',
    bachelor: '대학교 졸업',
    master: '석사',
    doctorate: '박사'
  }
  return levelMap[level] || level
}

// 고용 형태를 한글로 변환
export function formatEmploymentType(type: string): string {
  const typeMap: Record<string, string> = {
    'full-time': '정규직',
    'part-time': '계약직',
    'contract': '파견직',
    'internship': '인턴'
  }
  return typeMap[type] || type
}

// 지원 상태를 한글로 변환
export function formatApplicationStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '지원 완료',
    reviewing: '서류 검토중',
    interview: '면접 예정',
    accepted: '합격',
    rejected: '불합격'
  }
  return statusMap[status] || status
}

// 지원 상태별 색상 클래스 반환
export function getStatusColorClass(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-gray-600 bg-gray-100',
    reviewing: 'text-blue-600 bg-blue-100',
    interview: 'text-purple-600 bg-purple-100',
    accepted: 'text-green-600 bg-green-100',
    rejected: 'text-red-600 bg-red-100'
  }
  return colorMap[status] || 'text-gray-600 bg-gray-100'
}

// 전화번호 포맷팅 (예: 01012345678 -> 010-1234-5678)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return phone
}

// 사업자 번호 포맷팅 (예: 1234567890 -> 123-45-67890)
export function formatBusinessNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{5})$/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return number
}
