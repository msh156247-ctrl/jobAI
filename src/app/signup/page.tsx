'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, Role } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { Eye, EyeOff, X, Plus } from 'lucide-react'
import { INDUSTRIES, REGIONS, REGION_CATEGORIES, EDUCATION_LEVELS, PERSONALITY_KEYWORDS, SKILL_LEVELS, SUB_INDUSTRIES, CITY_DISTRICTS, WORK_TYPES } from '@/lib/constants'
import type { Skill, CareerHistory } from '@/contexts/ProfileContext'
import { sendEmailVerification, verifyEmailCode as verifyEmailCodeApi, sendPhoneVerification, verifyPhoneCode as verifyPhoneCodeApi, checkEmailDuplicate, checkPhoneDuplicate } from '@/lib/verificationApi'
import { searchSchools, searchCertifications, searchLanguageTests } from '@/lib/searchApi'
import type { School, Certification, LanguageTest } from '@/lib/searchApi'
import { validatePassword as validatePasswordStrength, getPasswordStrengthColor } from '@/utils/passwordValidator'
import { ClientRateLimiter } from '@/lib/security/rate-limiter'
import { InputValidator } from '@/lib/security/input-validator'

type Step = 1 | 2 | 3 | 4 | 5

export default function SignUpPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { updateProfile, updateCompanyMeta } = useProfile()

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<Role>('seeker')

  // Step 2: 약관 동의
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  // Step 3: 기본 정보
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [location, setLocation] = useState('')

  // 학력 정보
  const [educations, setEducations] = useState<Array<{
    level: string
    schoolName: string
    major?: string
    startYear: string
    endYear: string
  }>>([])
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [tempEducation, setTempEducation] = useState({ level: 'high_school', schoolName: '', major: '', startYear: '', endYear: '' })
  const [schoolSearchResults, setSchoolSearchResults] = useState<School[]>([])
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false)

  // 자격증
  const [certifications, setCertifications] = useState<Array<{
    name: string
    score?: string
    date: string
  }>>([])
  const [showCertForm, setShowCertForm] = useState(false)
  const [tempCert, setTempCert] = useState({ name: '', score: '', date: '' })
  const [certSearchResults, setCertSearchResults] = useState<Certification[]>([])
  const [showCertDropdown, setShowCertDropdown] = useState(false)

  // 어학 점수
  const [languageScores, setLanguageScores] = useState<Array<{
    name: string
    score: string
    date: string
  }>>([])
  const [showLanguageForm, setShowLanguageForm] = useState(false)
  const [tempLanguage, setTempLanguage] = useState({ name: '', score: '', date: '' })
  const [langSearchResults, setLangSearchResults] = useState<LanguageTest[]>([])
  const [showLangDropdown, setShowLangDropdown] = useState(false)

  // 인증 상태
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [emailTimer, setEmailTimer] = useState(0)
  const [phoneTimer, setPhoneTimer] = useState(0)

  // Step 4: 구직자 정보
  const [desiredJob, setDesiredJob] = useState('')
  const [careerType, setCareerType] = useState<'newcomer' | 'experienced'>('newcomer')
  const [graduationDate, setGraduationDate] = useState('')
  const [careerYears, setCareerYears] = useState(0)
  const [careerHistories, setCareerHistories] = useState<CareerHistory[]>([])
  const [preferredLocations, setPreferredLocations] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [personalities, setPersonalities] = useState<string[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [workTypes, setWorkTypes] = useState<Array<'full_time' | 'contract' | 'intern' | 'part_time' | 'freelance' | 'remote' | 'hybrid'>>(['full_time'])
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')

  // Step 4: 기업 정보
  const [businessNumber, setBusinessNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressDistrict, setAddressDistrict] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [website, setWebsite] = useState('')
  const [companyLocked, setCompanyLocked] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)

  // 비밀번호 강도 검증
  const passwordValidation = password ? validatePasswordStrength(password) : null

  // 이메일 인증 요청
  const requestEmailVerification = async () => {
    if (!email || emailTimer > 0) return

    setLoading(true)
    setError('')

    // 이메일 유효성 검증
    const emailValidation = InputValidator.validateEmail(email)
    if (!emailValidation.valid) {
      setError(emailValidation.message || '올바른 이메일을 입력해주세요.')
      setLoading(false)
      return
    }

    // 이메일 중복 확인
    const duplicateCheck = await checkEmailDuplicate(email)
    if (duplicateCheck.error) {
      setError(duplicateCheck.error)
      setLoading(false)
      return
    }
    if (duplicateCheck.isDuplicate) {
      setError('이미 사용 중인 이메일입니다.')
      setLoading(false)
      return
    }

    // 인증 코드 전송
    const result = await sendEmailVerification(email)
    setLoading(false)

    if (!result.success) {
      setError(result.error || '인증 코드 전송에 실패했습니다.')
      return
    }

    // 타이머 시작
    setEmailTimer(180)
    setEmailVerified(false)
    setEmailCode('')

    const interval = setInterval(() => {
      setEmailTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 휴대폰 인증 요청
  const requestPhoneVerification = async () => {
    if (!phone || phoneTimer > 0) return

    setLoading(true)
    setError('')

    // 휴대폰 번호 유효성 검증
    const phoneValidation = InputValidator.validatePhone(phone)
    if (!phoneValidation.valid) {
      setError(phoneValidation.message || '올바른 휴대폰 번호를 입력해주세요.')
      setLoading(false)
      return
    }

    // 휴대폰 번호 중복 확인
    const duplicateCheck = await checkPhoneDuplicate(phone)
    if (duplicateCheck.error) {
      setError(duplicateCheck.error)
      setLoading(false)
      return
    }
    if (duplicateCheck.isDuplicate) {
      setError('이미 사용 중인 휴대폰 번호입니다.')
      setLoading(false)
      return
    }

    // 인증 코드 전송
    const result = await sendPhoneVerification(phone)
    setLoading(false)

    if (!result.success) {
      setError(result.error || '인증 코드 전송에 실패했습니다.')
      return
    }

    // 타이머 시작
    setPhoneTimer(180)
    setPhoneVerified(false)
    setPhoneCode('')

    const interval = setInterval(() => {
      setPhoneTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 인증 코드 확인
  const verifyEmailCode = async () => {
    if (!emailCode) {
      setError('인증 코드를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    const result = await verifyEmailCodeApi(email, emailCode)
    setLoading(false)

    if (!result.success) {
      setError(result.error || '이메일 인증에 실패했습니다.')
      return
    }

    setEmailVerified(true)
    setEmailTimer(0)
  }

  const verifyPhoneCode = async () => {
    if (!phoneCode) {
      setError('인증 코드를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    const result = await verifyPhoneCodeApi(phone, phoneCode)
    setLoading(false)

    if (!result.success) {
      setError(result.error || '휴대폰 인증에 실패했습니다.')
      return
    }

    setPhoneVerified(true)
    setPhoneTimer(0)
  }

  // 학교 검색
  const handleSchoolSearch = async (query: string) => {
    setTempEducation({ ...tempEducation, schoolName: query })
    if (query.length > 0) {
      const results = await searchSchools(query)
      setSchoolSearchResults(results)
      setShowSchoolDropdown(true)
    } else {
      setShowSchoolDropdown(false)
    }
  }

  const selectSchool = (school: School) => {
    setTempEducation({ ...tempEducation, schoolName: school.name })
    setShowSchoolDropdown(false)
  }

  // 학력 추가
  const addEducation = () => {
    if (!tempEducation.schoolName || !tempEducation.startYear || !tempEducation.endYear) {
      setError('학력 정보를 모두 입력해주세요.')
      return
    }
    setEducations([...educations, { ...tempEducation }])
    setTempEducation({ level: 'high_school', schoolName: '', major: '', startYear: '', endYear: '' })
    setShowEducationForm(false)
    setShowSchoolDropdown(false)
    setError('')
  }

  // 자격증 검색
  const handleCertSearch = async (query: string) => {
    setTempCert({ ...tempCert, name: query })
    if (query.length > 0) {
      const results = await searchCertifications(query)
      setCertSearchResults(results)
      setShowCertDropdown(true)
    } else {
      setShowCertDropdown(false)
    }
  }

  const selectCertification = (cert: Certification) => {
    setTempCert({ ...tempCert, name: cert.name })
    setShowCertDropdown(false)
  }

  // 자격증 추가
  const addCertification = () => {
    if (!tempCert.name || !tempCert.date) {
      setError('자격증 정보를 입력해주세요.')
      return
    }
    setCertifications([...certifications, { ...tempCert }])
    setTempCert({ name: '', score: '', date: '' })
    setShowCertForm(false)
    setShowCertDropdown(false)
    setError('')
  }

  // 어학 시험 검색
  const handleLanguageSearch = async (query: string) => {
    setTempLanguage({ ...tempLanguage, name: query })
    if (query.length > 0) {
      const results = await searchLanguageTests(query)
      setLangSearchResults(results)
      setShowLangDropdown(true)
    } else {
      setShowLangDropdown(false)
    }
  }

  const selectLanguageTest = (test: LanguageTest) => {
    setTempLanguage({ ...tempLanguage, name: test.name })
    setShowLangDropdown(false)
  }

  // 어학 점수 추가
  const addLanguageScore = () => {
    if (!tempLanguage.name || !tempLanguage.score || !tempLanguage.date) {
      setError('어학 점수 정보를 모두 입력해주세요.')
      return
    }
    setLanguageScores([...languageScores, { ...tempLanguage }])
    setTempLanguage({ name: '', score: '', date: '' })
    setShowLanguageForm(false)
    setShowLangDropdown(false)
    setError('')
  }

  // 사업자번호 조회
  const lookupCompany = () => {
    if (!businessNumber) return

    if (businessNumber === '123-45-67890') {
      setCompanyName('테스트 주식회사')
      setAddressCity('서울')
      setAddressDistrict('강남구')
      setAddressDetail('테헤란로 123')
      setCompanyLocked(true)
    } else {
      setShowManualInput(true)
    }
  }

  // 경력 추가
  const addCareerHistory = () => {
    setCareerHistories([...careerHistories, {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    }])
  }

  const updateCareerHistory = (index: number, field: keyof CareerHistory, value: string) => {
    const updated = [...careerHistories]
    updated[index] = { ...updated[index], [field]: value }
    setCareerHistories(updated)
  }

  const removeCareerHistory = (index: number) => {
    setCareerHistories(careerHistories.filter((_, i) => i !== index))
  }

  // 스킬 추가
  const addSkill = () => {
    if (!skillInput.trim()) return
    setSkills([...skills, { name: skillInput, level: 'beginner', description: '' }])
    setSkillInput('')
  }

  const updateSkillLevel = (index: number, level: 'beginner' | 'intermediate' | 'advanced') => {
    const updated = [...skills]
    updated[index] = { ...updated[index], level }
    setSkills(updated)
  }

  const updateSkillDescription = (index: number, description: string) => {
    const updated = [...skills]
    updated[index] = { ...updated[index], description }
    setSkills(updated)
  }

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  // 단계별 검증
  const validateStep1 = () => {
    if (!role) {
      setError('역할을 선택해주세요.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!termsAgreed || !privacyAgreed) {
      setError('모든 약관에 동의해주세요.')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!name || !email || !phone || !password || !passwordConfirm) {
      setError('모든 필수 항목을 입력해주세요.')
      return false
    }

    // 새로운 비밀번호 검증 로직
    const pwdValidation = validatePasswordStrength(password)
    if (!pwdValidation.valid) {
      setError(pwdValidation.errors[0] || '비밀번호가 유효하지 않습니다.')
      return false
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return false
    }
    if (!emailVerified) {
      setError('이메일 인증을 완료해주세요.')
      return false
    }
    if (!phoneVerified) {
      setError('휴대폰 인증을 완료해주세요.')
      return false
    }
    return true
  }

  const validateStep4 = () => {
    if (role === 'seeker') {
      if (!desiredJob) {
        setError('희망직무를 입력해주세요.')
        return false
      }
      if (careerType === 'experienced' && careerHistories.length === 0) {
        setError('경력 사항을 최소 1개 이상 입력해주세요.')
        return false
      }
      if (preferredLocations.length === 0) {
        setError('희망 근무지를 최소 1개 이상 선택해주세요.')
        return false
      }
    } else {
      if (!businessNumber || !companyName || !addressCity || !addressDistrict) {
        setError('모든 기업 정보를 입력해주세요.')
        return false
      }
    }
    return true
  }

  // 다음 단계로
  const nextStep = () => {
    setError('')

    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    if (currentStep === 3 && !validateStep3()) return
    if (currentStep === 4 && !validateStep4()) {
      return
    }

    if (currentStep === 4) {
      handleSignUp()
    } else {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  // 회원가입 처리
  const handleSignUp = async () => {
    setLoading(true)
    setError('')

    try {
      // Rate limiting 체크 (이메일 기반)
      try {
        ClientRateLimiter.checkSignupLimit(email)
      } catch (rateLimitError) {
        setError(rateLimitError instanceof Error ? rateLimitError.message : '회원가입 시도 횟수를 초과했습니다.')
        setLoading(false)
        return
      }

      const { user } = await signUp(email, password, name, role, phone)
      refreshUser()

      // 프로필 저장
      if (role === 'seeker') {
        updateProfile({
          name,
          email,
          phone,
          location,
          educations: educations as any,
          certifications: certifications as any,
          languageScores: languageScores as any,
          industry: desiredJob,
          careerType,
          careerYears,
          careerHistories,
          preferredLocations,
          bio,
          skills,
          personalities,
          workTypes: workTypes.includes('remote') ? ['remote'] : workTypes.includes('hybrid') ? ['dispatch'] : ['onsite'],
          salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        })
      } else {
        const fullAddress = `${addressCity} ${addressDistrict}${addressDetail ? ' ' + addressDetail : ''}`
        updateCompanyMeta({
          businessNumber,
          companyName,
          address: fullAddress,
          website,
        })
      }

      setCurrentStep(5)
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 완료 후 홈으로 (추천 페이지)
  const goToHome = () => {
    router.push('/')
  }


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <div className="mt-4 flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-2 w-12 rounded-full ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            {currentStep === 1 && '역할 선택'}
            {currentStep === 2 && '약관 동의'}
            {currentStep === 3 && '기본 정보 입력'}
            {currentStep === 4 && '추가 정보 입력'}
            {currentStep === 5 && '가입 완료'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: 역할 선택 */}
        {currentStep === 1 && (
          <div className="bg-white p-8 shadow rounded-lg space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">어떤 역할로 가입하시겠습니까?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('seeker')}
                  className={`py-8 border-2 rounded-lg font-medium transition-all ${
                    role === 'seeker'
                      ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-4xl mb-2">👤</div>
                  <div className="text-xl">구직자</div>
                  <div className="text-sm mt-2 text-gray-500">일자리를 찾고 있어요</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`py-8 border-2 rounded-lg font-medium transition-all ${
                    role === 'employer'
                      ? 'border-blue-600 bg-blue-50 text-blue-600 scale-105'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-4xl mb-2">🏢</div>
                  <div className="text-xl">채용 담당자</div>
                  <div className="text-sm mt-2 text-gray-500">인재를 찾고 있어요</div>
                </button>
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              다음
            </button>
          </div>
        )}

        {/* Step 2: 약관 동의 */}
        {currentStep === 2 && (
          <div className="bg-white p-8 shadow rounded-lg space-y-6">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium">이용약관 동의 (필수)</span>
              </label>
              <div className="mt-2 border rounded p-4 text-xs text-gray-600 h-32 overflow-y-auto bg-gray-50">
                <p className="font-semibold mb-2">제1조 (목적)</p>
                <p className="mb-4">
                  본 약관은 JobAI가 제공하는 모든 서비스의 이용조건 및 절차, 회원과 당사의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
                <p className="font-semibold mb-2">제2조 (정의)</p>
                <p className="mb-4">
                  1. "서비스"란 구직자와 기업을 연결하는 플랫폼 서비스를 의미합니다.<br />
                  2. "회원"이란 당사와 서비스 이용계약을 체결하고 회원 ID를 부여받은 자를 말합니다.
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium">개인정보처리방침 동의 (필수)</span>
              </label>
              <div className="mt-2 border rounded p-4 text-xs text-gray-600 h-32 overflow-y-auto bg-gray-50">
                <p className="font-semibold mb-2">1. 개인정보의 수집 및 이용 목적</p>
                <p className="mb-4">
                  회원 가입, 서비스 제공, 구직/구인 매칭, 본인 확인, 고객 상담 등을 위해 개인정보를 수집합니다.
                </p>
                <p className="font-semibold mb-2">2. 수집하는 개인정보 항목</p>
                <p className="mb-4">
                  필수: 이름, 이메일, 휴대폰번호, 비밀번호<br />
                  선택: 경력사항, 학력, 자격증, 희망 근무 조건 등
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={nextStep}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 기본 정보 */}
        {currentStep === 3 && (
          <div className="bg-white p-8 shadow rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 *
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailVerified}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  placeholder="example@email.com"
                />
                <button
                  type="button"
                  onClick={requestEmailVerification}
                  disabled={emailVerified || emailTimer > 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 disabled:bg-gray-300 whitespace-nowrap"
                >
                  {emailVerified ? '✓ 인증완료' : emailTimer > 0 ? formatTime(emailTimer) : '인증요청'}
                </button>
              </div>
              {emailTimer > 0 && !emailVerified && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="인증번호 입력 (데모: 654321)"
                  />
                  <button
                    type="button"
                    onClick={verifyEmailCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                휴대폰 번호 *
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={phoneVerified}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  placeholder="010-1234-5678"
                />
                <button
                  type="button"
                  onClick={requestPhoneVerification}
                  disabled={phoneVerified || phoneTimer > 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 disabled:bg-gray-300 whitespace-nowrap"
                >
                  {phoneVerified ? '✓ 인증완료' : phoneTimer > 0 ? formatTime(phoneTimer) : '인증요청'}
                </button>
              </div>
              {phoneTimer > 0 && !phoneVerified && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="인증번호 입력 (데모: 123456)"
                  />
                  <button
                    type="button"
                    onClick={verifyPhoneCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 * (8자 이상, 숫자, 특수문자 포함)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                  placeholder="비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* 비밀번호 강도 표시 */}
              {passwordValidation && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">비밀번호 강도:</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getPasswordStrengthColor(passwordValidation.strength).bg} ${getPasswordStrengthColor(passwordValidation.strength).text}`}>
                      {getPasswordStrengthColor(passwordValidation.strength).label}
                    </span>
                  </div>
                  {/* 에러 메시지 */}
                  {passwordValidation.errors.length > 0 && (
                    <div className="space-y-1">
                      {passwordValidation.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-red-600">✗ {error}</p>
                      ))}
                    </div>
                  )}
                  {/* 제안사항 */}
                  {passwordValidation.suggestions.length > 0 && (
                    <div className="space-y-1">
                      {passwordValidation.suggestions.map((suggestion, idx) => (
                        <p key={idx} className="text-xs text-blue-600">💡 {suggestion}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 *
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                  placeholder="비밀번호 재입력"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-xs mt-1 text-red-600">✗ 비밀번호가 일치하지 않습니다</p>
              )}
              {passwordConfirm && password === passwordConfirm && (
                <p className="text-xs mt-1 text-green-600">✓ 비밀번호가 일치합니다</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                거주 지역
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요</option>
                {Object.entries(REGION_CATEGORIES).map(([category, regions]) => (
                  <optgroup key={category} label={category}>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  학력
                </label>
                {!showEducationForm && (
                  <button
                    type="button"
                    onClick={() => setShowEducationForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    추가
                  </button>
                )}
              </div>

              {educations.length > 0 && (
                <div className="border rounded-lg divide-y mb-2">
                  {educations.map((edu, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {EDUCATION_LEVELS.find(e => e.value === edu.level)?.label} - {edu.schoolName}
                        </div>
                        {edu.major && <div className="text-xs text-gray-600">{edu.major}</div>}
                        <div className="text-xs text-gray-500">{edu.startYear} ~ {edu.endYear}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEducations(educations.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showEducationForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
                  <div>
                    <label className="block text-sm font-medium mb-1">학력 구분 *</label>
                    <select
                      value={tempEducation.level}
                      onChange={(e) => setTempEducation({ ...tempEducation, level: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">학교명 *</label>
                    <input
                      type="text"
                      value={tempEducation.schoolName}
                      onChange={(e) => handleSchoolSearch(e.target.value)}
                      onFocus={() => tempEducation.schoolName && setShowSchoolDropdown(true)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="학교명을 입력하세요"
                    />
                    {showSchoolDropdown && schoolSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {schoolSearchResults.map((school) => (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => selectSchool(school)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
                          >
                            <span>{school.name}</span>
                            {school.location && <span className="text-xs text-gray-500">{school.location}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {tempEducation.level !== 'high_school' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">전공</label>
                      <input
                        type="text"
                        value={tempEducation.major || ''}
                        onChange={(e) => setTempEducation({ ...tempEducation, major: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="컴퓨터공학"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">입학년도 *</label>
                      <input
                        type="text"
                        value={tempEducation.startYear}
                        onChange={(e) => setTempEducation({ ...tempEducation, startYear: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">졸업년도 *</label>
                      <input
                        type="text"
                        value={tempEducation.endYear}
                        onChange={(e) => setTempEducation({ ...tempEducation, endYear: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="2024"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addEducation}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEducationForm(false)
                        setTempEducation({ level: 'high_school', schoolName: '', major: '', startYear: '', endYear: '' })
                        setError('')
                      }}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {!showEducationForm && educations.length === 0 && (
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-gray-400">
                  학력 정보를 추가해주세요
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  자격증
                </label>
                {!showCertForm && (
                  <button
                    type="button"
                    onClick={() => setShowCertForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    추가
                  </button>
                )}
              </div>

              {certifications.length > 0 && (
                <div className="border rounded-lg divide-y mb-2">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{cert.name}</div>
                        <div className="text-xs text-gray-600">
                          {cert.score && `점수: ${cert.score} | `}취득일: {cert.date}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showCertForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-green-50">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">자격증명 *</label>
                    <input
                      type="text"
                      value={tempCert.name}
                      onChange={(e) => handleCertSearch(e.target.value)}
                      onFocus={() => tempCert.name && setShowCertDropdown(true)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="자격증명을 입력하세요"
                    />
                    {showCertDropdown && certSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {certSearchResults.map((cert) => (
                          <button
                            key={cert.id}
                            type="button"
                            onClick={() => selectCertification(cert)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            <div className="font-medium">{cert.name}</div>
                            <div className="text-xs text-gray-500">{cert.category} · {cert.issuer}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">점수 (선택)</label>
                    <input
                      type="text"
                      value={tempCert.score || ''}
                      onChange={(e) => setTempCert({ ...tempCert, score: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="90점"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">취득일 *</label>
                    <input
                      type="date"
                      value={tempCert.date}
                      onChange={(e) => setTempCert({ ...tempCert, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCertification}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCertForm(false)
                        setTempCert({ name: '', score: '', date: '' })
                        setError('')
                      }}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {!showCertForm && certifications.length === 0 && (
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-gray-400">
                  자격증 정보를 추가해주세요
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  어학 점수
                </label>
                {!showLanguageForm && (
                  <button
                    type="button"
                    onClick={() => setShowLanguageForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    추가
                  </button>
                )}
              </div>

              {languageScores.length > 0 && (
                <div className="border rounded-lg divide-y mb-2">
                  {languageScores.map((lang, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{lang.name}</div>
                        <div className="text-xs text-gray-600">
                          점수: {lang.score} | 취득일: {lang.date}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLanguageScores(languageScores.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showLanguageForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-purple-50">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">시험명 *</label>
                    <input
                      type="text"
                      value={tempLanguage.name}
                      onChange={(e) => handleLanguageSearch(e.target.value)}
                      onFocus={() => tempLanguage.name && setShowLangDropdown(true)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="어학시험명을 입력하세요"
                    />
                    {showLangDropdown && langSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {langSearchResults.map((test) => (
                          <button
                            key={test.id}
                            type="button"
                            onClick={() => selectLanguageTest(test)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            <div className="font-medium">{test.name}</div>
                            {test.maxScore && <div className="text-xs text-gray-500">최고점: {test.maxScore}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">점수 *</label>
                    <input
                      type="text"
                      value={tempLanguage.score}
                      onChange={(e) => setTempLanguage({ ...tempLanguage, score: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="900점, N1, 110점 등"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">취득일 *</label>
                    <input
                      type="date"
                      value={tempLanguage.date}
                      onChange={(e) => setTempLanguage({ ...tempLanguage, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addLanguageScore}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLanguageForm(false)
                        setTempLanguage({ name: '', score: '', date: '' })
                        setError('')
                      }}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {!showLanguageForm && languageScores.length === 0 && (
                <div className="border border-dashed rounded-lg p-4 text-center text-sm text-gray-400">
                  어학 점수 정보를 추가해주세요
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={nextStep}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 구직자 추가 정보 */}
        {currentStep === 4 && role === 'seeker' && (
          <div className="bg-white p-8 shadow rounded-lg space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희망직무 *
              </label>
              <input
                type="text"
                value={desiredJob}
                onChange={(e) => setDesiredJob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="예: 백엔드 개발자, 프론트엔드 개발자, 데이터 분석가"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                경력 구분 *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCareerType('newcomer')
                    setCareerYears(0)
                    setCareerHistories([])
                  }}
                  className={`py-3 border-2 rounded-lg font-medium ${
                    careerType === 'newcomer'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  신입
                </button>
                <button
                  type="button"
                  onClick={() => setCareerType('experienced')}
                  className={`py-3 border-2 rounded-lg font-medium ${
                    careerType === 'experienced'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-700'
                  }`}
                >
                  경력
                </button>
              </div>
            </div>

            {careerType === 'newcomer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  졸업 예정일
                </label>
                <input
                  type="month"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="2025-02"
                />
                <p className="text-xs text-gray-500 mt-1">졸업 예정자는 졸업 예정일을 입력해주세요</p>
              </div>
            )}

            {careerType === 'experienced' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    총 경력 연수 *
                  </label>
                  <input
                    type="number"
                    value={careerYears}
                    onChange={(e) => setCareerYears(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      경력 사항 *
                    </label>
                    <button
                      type="button"
                      onClick={addCareerHistory}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + 추가
                    </button>
                  </div>
                  {careerHistories.map((career, idx) => (
                    <div key={idx} className="border rounded-lg p-4 mb-3 relative bg-gray-50">
                      <button
                        type="button"
                        onClick={() => removeCareerHistory(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={career.company}
                          onChange={(e) => updateCareerHistory(idx, 'company', e.target.value)}
                          placeholder="회사명"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          value={career.position}
                          onChange={(e) => updateCareerHistory(idx, 'position', e.target.value)}
                          placeholder="직책"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="month"
                            value={career.startDate}
                            onChange={(e) => updateCareerHistory(idx, 'startDate', e.target.value)}
                            placeholder="시작일"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <input
                            type="month"
                            value={career.endDate}
                            onChange={(e) => updateCareerHistory(idx, 'endDate', e.target.value)}
                            placeholder="종료일"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <textarea
                          value={career.description}
                          onChange={(e) => updateCareerHistory(idx, 'description', e.target.value)}
                          placeholder="담당 업무 (선택)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                희망 근무지 * (복수 선택 가능)
              </label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {Object.entries(REGION_CATEGORIES).map(([category, regions]) => (
                  <div key={category} className="mb-3">
                    <div className="font-medium text-sm text-gray-700 mb-2">{category}</div>
                    <div className="grid grid-cols-3 gap-2 pl-2">
                      {regions.map((region) => (
                        <label key={region} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={preferredLocations.includes(region)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferredLocations([...preferredLocations, region])
                              } else {
                                setPreferredLocations(preferredLocations.filter((l) => l !== region))
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span>{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {preferredLocations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferredLocations.map((loc) => (
                    <span key={loc} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자기소개
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="간단한 자기소개를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성격 키워드 (최대 5개)
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {PERSONALITY_KEYWORDS.map((keyword) => (
                  <label key={keyword} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={personalities.includes(keyword)}
                      onChange={(e) => {
                        if (e.target.checked && personalities.length < 5) {
                          setPersonalities([...personalities, keyword])
                        } else if (!e.target.checked) {
                          setPersonalities(personalities.filter((p) => p !== keyword))
                        }
                      }}
                      disabled={!personalities.includes(keyword) && personalities.length >= 5}
                      className="h-4 w-4"
                    />
                    <span>{keyword}</span>
                  </label>
                ))}
              </div>
              {personalities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {personalities.map((p) => (
                    <span key={p} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                보유 기술/스킬
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="스킬명 입력 후 추가"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                >
                  추가
                </button>
              </div>
              {skills.length > 0 && (
                <div className="space-y-3">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="border rounded-lg p-3 relative bg-gray-50">
                      <button
                        type="button"
                        onClick={() => removeSkill(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                      <div className="space-y-2 pr-8">
                        <div className="font-medium text-sm">{skill.name}</div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">숙련도</label>
                          <div className="flex gap-2">
                            {SKILL_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                type="button"
                                onClick={() => updateSkillLevel(idx, level.value as any)}
                                className={`px-3 py-1 rounded text-sm ${
                                  skill.level === level.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={skill.description}
                          onChange={(e) => updateSkillDescription(idx, e.target.value)}
                          placeholder="간단한 설명 (선택)"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                희망 근무 형태 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WORK_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`py-2 px-3 border-2 rounded-lg font-medium text-center cursor-pointer text-sm ${
                      workTypes.includes(type.value as any)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={workTypes.includes(type.value as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWorkTypes([...workTypes, type.value as any])
                        } else {
                          setWorkTypes(workTypes.filter(w => w !== type.value))
                        }
                      }}
                      className="hidden"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희망 연봉 (만원)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="최소 (예: 3000)"
                />
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="최대 (예: 5000)"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '처리 중...' : '가입하기'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 기업 담당자 추가 정보 */}
        {currentStep === 4 && role === 'employer' && (
          <div className="bg-white p-8 shadow rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자등록번호 *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  disabled={companyLocked}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  placeholder="123-45-67890"
                />
                <button
                  type="button"
                  onClick={lookupCompany}
                  disabled={companyLocked}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  조회
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">데모: 123-45-67890 입력 시 자동 입력됩니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회사명 *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={companyLocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                placeholder="주식회사 OO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소 *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={addressCity}
                  onChange={(e) => {
                    setAddressCity(e.target.value)
                    setAddressDistrict('')
                  }}
                  disabled={companyLocked}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">시/도 선택</option>
                  {Object.keys(CITY_DISTRICTS).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <select
                  value={addressDistrict}
                  onChange={(e) => setAddressDistrict(e.target.value)}
                  disabled={companyLocked || !addressCity}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">구/군 선택</option>
                  {addressCity && CITY_DISTRICTS[addressCity]?.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                disabled={companyLocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                placeholder="상세 주소 (선택)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                웹사이트
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://example.com"
              />
            </div>

            {companyLocked && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                ✓ 사업자 정보가 확인되었습니다.
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '처리 중...' : '가입하기'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: 완료 */}
        {currentStep === 5 && (
          <div className="bg-white p-8 shadow rounded-lg text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900">회원가입 완료!</h3>
            <p className="text-gray-600">
              JobAI에 오신 것을 환영합니다.<br />
              {role === 'seeker' ? '이제 원하는 채용 공고를 찾아보세요!' : '이제 채용 공고를 등록하고 인재를 찾아보세요!'}
            </p>
            <button
              onClick={goToHome}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              시작하기
            </button>
          </div>
        )}


        {/* 수동 입력 팝업 */}
        {showManualInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">사업자 정보를 찾을 수 없습니다</h3>
              <p className="text-sm text-gray-600 mb-4">
                사업자등록번호를 확인할 수 없습니다. 직접 입력하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowManualInput(false)
                    setCompanyLocked(false)
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  직접 입력
                </button>
                <button
                  onClick={() => {
                    setShowManualInput(false)
                    setBusinessNumber('')
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep < 5 && (
          <p className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              로그인
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}