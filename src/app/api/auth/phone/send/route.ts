import { NextRequest, NextResponse } from 'next/server'

// 인증 코드 저장소 (실제 프로덕션에서는 Redis 사용 권장)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()

// SMS 전송 함수 (실제 프로덕션에서는 Twilio, AWS SNS, 네이버 클라우드 SMS 등 사용)
async function sendSMS(to: string, message: string) {
  // 데모용: 콘솔에 출력
  console.log(`📱 SMS to ${to}:`, message)
  // 실제 구현 시:
  // await smsService.send({ to, message })
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { success: false, error: '휴대폰 번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 휴대폰 번호 형식 검증 (하이픈 포함/미포함 모두 허용)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/-/g, '')

    // 6자리 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 3 * 60 * 1000 // 3분

    // 저장
    verificationCodes.set(normalizedPhone, { code, expiresAt })

    // SMS 발송
    await sendSMS(
      normalizedPhone,
      `[JobAI] 인증번호: ${code}\n3분 이내에 입력해주세요.`
    )

    // 데모용: 코드를 응답에 포함 (실제 프로덕션에서는 제거)
    console.log(`✅ Verification code for ${normalizedPhone}: ${code}`)

    return NextResponse.json({
      success: true,
      message: '인증 코드가 SMS로 전송되었습니다.',
      // 데모용 (실제로는 제거)
      demoCode: code
    })

  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { success: false, error: '인증 코드 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 만료된 코드 정리 (5분마다)
setInterval(() => {
  const now = Date.now()
  for (const [phone, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(phone)
    }
  }
}, 5 * 60 * 1000)

// export를 위한 verificationCodes (검증 시 사용)
export { verificationCodes }
