import type { VerificationRequest, VerificationResponse, PhoneVerification, DartCompanyInfo } from '@/types'

// Mock 인증 저장소 (실제로는 서버 API 사용)
const verificationStore: Map<string, PhoneVerification> = new Map()

// 휴대폰 본인인증 요청 (NICE, PASS API 연동 필요)
export async function requestPhoneVerification(phoneNumber: string, name: string): Promise<VerificationResponse> {
  try {
    // TODO: 실제 NICE/PASS API 연동
    // const response = await fetch('/api/verification/phone/request', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ phoneNumber, name })
    // })

    // Mock 구현
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString() // 3분

    verificationStore.set(verificationId, {
      id: verificationId,
      phoneNumber,
      code,
      verified: false,
      expiresAt
    })

    console.log(`[Mock] 인증번호: ${code} (실제로는 SMS 발송)`)

    return {
      success: true,
      message: '인증번호가 발송되었습니다.',
      verificationId,
      expiresAt
    }
  } catch (error) {
    console.error('Phone verification request failed:', error)
    return {
      success: false,
      message: '인증번호 발송에 실패했습니다.'
    }
  }
}

// 휴대폰 인증번호 확인
export async function verifyPhoneCode(verificationId: string, code: string): Promise<VerificationResponse> {
  try {
    // TODO: 실제 API 연동
    // const response = await fetch('/api/verification/phone/verify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ verificationId, code })
    // })

    // Mock 구현
    const verification = verificationStore.get(verificationId)

    if (!verification) {
      return {
        success: false,
        message: '유효하지 않은 인증 요청입니다.'
      }
    }

    if (new Date() > new Date(verification.expiresAt)) {
      return {
        success: false,
        message: '인증번호가 만료되었습니다.'
      }
    }

    if (verification.code !== code) {
      return {
        success: false,
        message: '인증번호가 일치하지 않습니다.'
      }
    }

    verification.verified = true
    verificationStore.set(verificationId, verification)

    return {
      success: true,
      message: '본인인증이 완료되었습니다.'
    }
  } catch (error) {
    console.error('Phone verification failed:', error)
    return {
      success: false,
      message: '인증 확인에 실패했습니다.'
    }
  }
}

// DART API - 기업 정보 조회
export async function getDartCompanyInfo(businessNumber: string): Promise<DartCompanyInfo | null> {
  try {
    // TODO: 실제 DART API 연동
    // const apiKey = process.env.NEXT_PUBLIC_DART_API_KEY
    // const response = await fetch(
    //   `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corpCode}`
    // )
    // const data = await response.json()

    // Mock 구현 - 샘플 기업 정보
    const mockCompanies: Record<string, DartCompanyInfo> = {
      '1234567890': {
        corpCode: '00126380',
        corpName: '삼성전자주식회사',
        stockCode: '005930',
        ceoName: '한종희',
        corpCls: 'Y',
        jurirNo: '1301110006246',
        biznNo: '1248100998',
        address: '경기도 수원시 영통구 삼성로 129',
        homePage: 'http://www.samsung.com/sec',
        phoneNumber: '031-200-1114',
        indutyCode: '264',
        estDate: '19690113'
      },
      '1068777029': {
        corpCode: '00164779',
        corpName: '카카오',
        stockCode: '035720',
        ceoName: '홍은택',
        corpCls: 'Y',
        jurirNo: '1301110215067',
        biznNo: '1068777029',
        address: '제주특별자치도 제주시 첨단로 242',
        homePage: 'http://www.kakaocorp.com',
        phoneNumber: '1577-3321',
        indutyCode: '583',
        estDate: '19950216'
      }
    }

    // 사업자번호로 Mock 데이터 반환
    const cleaned = businessNumber.replace(/[^0-9]/g, '')
    return mockCompanies[cleaned] || null

  } catch (error) {
    console.error('DART API request failed:', error)
    return null
  }
}

// 사업자 번호 검증 및 기업 정보 가져오기
export async function verifyBusinessNumber(businessNumber: string, companyName: string): Promise<VerificationResponse & { companyInfo?: DartCompanyInfo }> {
  try {
    const companyInfo = await getDartCompanyInfo(businessNumber)

    if (!companyInfo) {
      return {
        success: false,
        message: '사업자 번호를 확인할 수 없습니다. DART에 등록된 기업인지 확인해주세요.'
      }
    }

    // 회사명이 일치하는지 확인
    if (!companyInfo.corpName.includes(companyName) && !companyName.includes(companyInfo.corpName)) {
      return {
        success: false,
        message: '입력하신 회사명과 등록된 회사명이 일치하지 않습니다.',
        companyInfo
      }
    }

    return {
      success: true,
      message: '기업 인증이 완료되었습니다.',
      companyInfo
    }
  } catch (error) {
    console.error('Business verification failed:', error)
    return {
      success: false,
      message: '기업 인증에 실패했습니다.'
    }
  }
}
