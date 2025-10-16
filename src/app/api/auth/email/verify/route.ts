import { NextRequest, NextResponse } from 'next/server'

// 인증 코드 저장소 (send/route.ts와 동일한 저장소 사용)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: '이메일과 인증 코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const stored = verificationCodes.get(email)

    if (!stored) {
      return NextResponse.json(
        { success: false, error: '인증 코드를 먼저 요청해주세요.' },
        { status: 400 }
      )
    }

    // 만료 확인
    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(email)
      return NextResponse.json(
        { success: false, error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      )
    }

    // 코드 확인
    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 인증 성공 후 코드 삭제
    verificationCodes.delete(email)

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.'
    })

  } catch (error) {
    console.error('Email verify error:', error)
    return NextResponse.json(
      { success: false, error: '인증 코드 확인에 실패했습니다.' },
      { status: 500 }
    )
  }
}

export { verificationCodes }
