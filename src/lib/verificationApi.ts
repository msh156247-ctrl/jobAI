// 이메일 및 휴대폰 인증 API

import { supabase } from './supabase'

/**
 * 이메일 인증 코드 전송
 * Supabase Auth의 OTP 기능 사용
 */
export async function sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: '올바른 이메일 형식이 아닙니다.' }
    }

    // Supabase에서 이메일 OTP 전송
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // 인증만 하고 계정 생성은 하지 않음
      },
    })

    if (error) {
      console.error('Email verification error:', error)
      return { success: false, error: '인증 코드 전송에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Send email verification error:', error)
    return { success: false, error: '인증 코드 전송 중 오류가 발생했습니다.' }
  }
}

/**
 * 이메일 인증 코드 확인
 */
export async function verifyEmailCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Supabase OTP 검증
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email',
    })

    if (error) {
      console.error('Email verification error:', error)
      return { success: false, error: '인증 코드가 올바르지 않습니다.' }
    }

    if (!data.session) {
      return { success: false, error: '인증에 실패했습니다.' }
    }

    // 인증 성공 후 세션 종료 (회원가입 프로세스에서만 인증 용도로 사용)
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Verify email code error:', error)
    return { success: false, error: '인증 코드 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 휴대폰 인증 코드 전송
 * 실제 환경에서는 SMS 서비스 (Twilio, AWS SNS 등) 필요
 * 현재는 Supabase의 phone OTP 기능 사용 (설정 필요)
 */
export async function sendPhoneVerification(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 휴대폰 번호 형식 검증 (010-1234-5678 또는 01012345678)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      return { success: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' }
    }

    // 하이픈 제거하고 국가코드 추가 (+82)
    const formattedPhone = '+82' + phone.replace(/-/g, '').substring(1)

    // Supabase에서 SMS OTP 전송 (Twilio 등 SMS 제공자 설정 필요)
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error('Phone verification error:', error)

      // SMS 제공자가 설정되지 않은 경우 개발 모드로 폴백
      if (process.env.NODE_ENV === 'development') {
        console.warn('SMS provider not configured. Using development mode.')
        // 개발 환경에서는 6자리 랜덤 코드 생성하고 콘솔에 출력
        const devCode = Math.floor(100000 + Math.random() * 900000).toString()
        console.log(`[개발 모드] ${phone}로 전송된 인증 코드: ${devCode}`)

        // LocalStorage에 임시 저장 (개발 전용)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`jobai:phone_otp:${phone}`, devCode)
          localStorage.setItem(`jobai:phone_otp_time:${phone}`, Date.now().toString())
        }

        return { success: true }
      }

      return { success: false, error: '인증 코드 전송에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Send phone verification error:', error)
    return { success: false, error: '인증 코드 전송 중 오류가 발생했습니다.' }
  }
}

/**
 * 휴대폰 인증 코드 확인
 */
export async function verifyPhoneCode(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 개발 모드: LocalStorage에서 코드 확인
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const storedCode = localStorage.getItem(`jobai:phone_otp:${phone}`)
      const storedTime = localStorage.getItem(`jobai:phone_otp_time:${phone}`)

      if (storedCode && storedTime) {
        // 3분(180초) 이내인지 확인
        const elapsed = Date.now() - parseInt(storedTime)
        if (elapsed > 180000) {
          localStorage.removeItem(`jobai:phone_otp:${phone}`)
          localStorage.removeItem(`jobai:phone_otp_time:${phone}`)
          return { success: false, error: '인증 코드가 만료되었습니다.' }
        }

        if (storedCode === code) {
          // 인증 성공 시 삭제
          localStorage.removeItem(`jobai:phone_otp:${phone}`)
          localStorage.removeItem(`jobai:phone_otp_time:${phone}`)
          return { success: true }
        } else {
          return { success: false, error: '인증 코드가 올바르지 않습니다.' }
        }
      }
    }

    // 프로덕션 모드: Supabase OTP 검증
    const formattedPhone = '+82' + phone.replace(/-/g, '').substring(1)

    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: 'sms',
    })

    if (error) {
      console.error('Phone verification error:', error)
      return { success: false, error: '인증 코드가 올바르지 않습니다.' }
    }

    if (!data.session) {
      return { success: false, error: '인증에 실패했습니다.' }
    }

    // 인증 성공 후 세션 종료
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Verify phone code error:', error)
    return { success: false, error: '인증 코드 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 이메일 중복 확인
 */
export async function checkEmailDuplicate(email: string): Promise<{ isDuplicate: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Email duplicate check error:', error)
      return { isDuplicate: false, error: '이메일 중복 확인에 실패했습니다.' }
    }

    return { isDuplicate: !!data }
  } catch (error) {
    console.error('Check email duplicate error:', error)
    return { isDuplicate: false, error: '이메일 중복 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 휴대폰 번호 중복 확인
 */
export async function checkPhoneDuplicate(phone: string): Promise<{ isDuplicate: boolean; error?: string }> {
  try {
    const formattedPhone = phone.replace(/-/g, '')

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Phone duplicate check error:', error)
      return { isDuplicate: false, error: '휴대폰 번호 중복 확인에 실패했습니다.' }
    }

    return { isDuplicate: !!data }
  } catch (error) {
    console.error('Check phone duplicate error:', error)
    return { isDuplicate: false, error: '휴대폰 번호 중복 확인 중 오류가 발생했습니다.' }
  }
}
