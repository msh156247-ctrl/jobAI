// 이메일 및 휴대폰 인증 API

import { supabase } from './supabase'

/**
 * 이메일 인증 코드 전송
 * 자체 API 사용
 */
export async function sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || '인증 코드 전송에 실패했습니다.' }
    }

    // 데모용: 콘솔에 인증 코드 출력
    if (data.demoCode) {
      console.log(`📧 이메일 인증 코드: ${data.demoCode}`)
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
    const response = await fetch('/api/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || '인증 코드가 올바르지 않습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Verify email code error:', error)
    return { success: false, error: '인증 코드 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 휴대폰 인증 코드 전송
 * 자체 API 사용
 */
export async function sendPhoneVerification(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/phone/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || '인증 코드 전송에 실패했습니다.' }
    }

    // 데모용: 콘솔에 인증 코드 출력
    if (data.demoCode) {
      console.log(`📱 SMS 인증 코드: ${data.demoCode}`)
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
    const response = await fetch('/api/auth/phone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || '인증 코드가 올바르지 않습니다.' }
    }

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
