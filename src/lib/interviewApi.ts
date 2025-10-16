import { supabase } from './supabase'

export interface InterviewSlot {
  id: string
  datetime: string
  duration: number
  isBooked: boolean
  jobId?: string
}

// 면접 슬롯 생성 (14일치)
export function getInterviewSlots(jobId: string): InterviewSlot[] {
  const slots: InterviewSlot[] = []
  const today = new Date()

  // 14일간의 슬롯 생성
  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(today)
    currentDate.setDate(today.getDate() + day)

    // 주말 제외 (토요일, 일요일)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue
    }

    // 하루에 7개 시간대: 09:00, 10:00, 11:00, 14:00, 15:00, 16:00, 17:00
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

    times.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number)
      const slotDate = new Date(currentDate)
      slotDate.setHours(hours, minutes, 0, 0)

      // 70% 확률로 사용 가능하도록 랜덤 설정
      const isAvailable = Math.random() > 0.3

      slots.push({
        id: `slot-${jobId}-${slotDate.getTime()}`,
        datetime: slotDate.toISOString(),
        duration: 60, // 1시간
        isBooked: !isAvailable,
        jobId,
      })
    })
  }

  return slots
}

// 면접 슬롯 예약
export function bookInterviewSlot(slotId: string) {
  // LocalStorage에 예약 정보 저장
  const bookings = JSON.parse(localStorage.getItem('interview_bookings') || '{}')
  bookings[slotId] = {
    bookedAt: new Date().toISOString(),
    status: 'booked',
  }
  localStorage.setItem('interview_bookings', JSON.stringify(bookings))
}

// ICS 파일 생성 (캘린더 등록용)
export function generateICS(slot: InterviewSlot, job: any): string {
  const startDate = new Date(slot.datetime)
  const endDate = new Date(startDate.getTime() + slot.duration * 60000)

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JobAI//Interview Scheduler//EN',
    'BEGIN:VEVENT',
    `UID:${slot.id}@jobai.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${job.companyName || job.company} - ${job.title} 면접`,
    `DESCRIPTION:${job.title} 포지션 면접 일정입니다.`,
    'LOCATION:온라인/오프라인 (상세 정보는 이메일 참조)',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:면접 30분 전 알림',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return icsContent
}

// ICS 파일 다운로드
export function downloadICS(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

// 실제 Supabase 연동 버전 (선택사항 - 나중에 구현)
export async function getInterviewSlotsFromDB(jobId: string) {
  const { data, error } = await supabase
    .from('interview_slots')
    .select('*')
    .eq('job_id', jobId)
    .eq('is_booked', false)
    .gte('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })

  if (error) {
    // 테이블이 없으면 로컬 생성 함수 사용
    if (error.code === '42P01') {
      return getInterviewSlots(jobId)
    }
    throw error
  }

  return data
}

export async function bookInterviewSlotInDB(slotId: string, userId: string) {
  const { data, error } = await (supabase
    .from('interview_slots') as any)
    .update({ is_booked: true, booked_by: userId, booked_at: new Date().toISOString() })
    .eq('id', slotId)
    .select()
    .single()

  if (error) {
    // 테이블이 없으면 로컬 저장 함수 사용
    if (error.code === '42P01') {
      bookInterviewSlot(slotId)
      return
    }
    throw error
  }

  return data
}
