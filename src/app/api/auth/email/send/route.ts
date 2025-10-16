import { NextRequest, NextResponse } from 'next/server'

// 인증 코드 저장소 (실제 프로덕션에서는 Redis 사용 권장)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()

// 이메일 전송 함수 (실제 프로덕션에서는 SendGrid, AWS SES 등 사용)
async function sendEmail(to: string, subject: string, body: string) {
  // 데모용: 콘솔에 출력
  console.log(`📧 Email to ${to}:`, subject, body)
  // 실제 구현 시:
  // await emailService.send({ to, subject, html: body })
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 6자리 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 3 * 60 * 1000 // 3분

    // 저장
    verificationCodes.set(email, { code, expiresAt })

    // 이메일 발송
    await sendEmail(
      email,
      'JobAI 이메일 인증',
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">JobAI 이메일 인증</h2>
          <p>안녕하세요, JobAI입니다.</p>
          <p>아래의 인증 코드를 입력하여 이메일 인증을 완료해주세요.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; letter-spacing: 4px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            이 인증 코드는 3분간 유효합니다.<br/>
            본인이 요청하지 않았다면 이 메일을 무시하세요.
          </p>
        </div>
      `
    )

    // 데모용: 코드를 응답에 포함 (실제 프로덕션에서는 제거)
    console.log(`✅ Verification code for ${email}: ${code}`)

    return NextResponse.json({
      success: true,
      message: '인증 코드가 이메일로 전송되었습니다.',
      // 데모용 (실제로는 제거)
      demoCode: code
    })

  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: '인증 코드 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 만료된 코드 정리 (5분마다)
setInterval(() => {
  const now = Date.now()
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(email)
    }
  }
}, 5 * 60 * 1000)

// export를 위한 verificationCodes (검증 시 사용)
export { verificationCodes }
