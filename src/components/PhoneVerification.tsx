'use client'

import { useState } from 'react'
import { requestPhoneVerification, verifyPhoneCode } from '@/services/verification'
import { useToast } from './Toast'

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void
  name: string
}

export default function PhoneVerification({ onVerified, name }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const { showToast } = useToast()

  const handleRequestCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast('error', '올바른 휴대폰 번호를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await requestPhoneVerification(phoneNumber, name)

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        setTimeLeft(180) // 3분
        showToast('success', result.message)

        // 타이머 시작
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        showToast('error', result.message)
      }
    } catch (error) {
      showToast('error', '인증번호 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationId || !code) {
      showToast('error', '인증번호를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await verifyPhoneCode(verificationId, code)

      if (result.success) {
        showToast('success', result.message)
        onVerified(phoneNumber)
      } else {
        showToast('error', result.message)
      }
    } catch (error) {
      showToast('error', '인증 확인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          휴대폰 번호
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="01012345678"
            maxLength={11}
            disabled={!!verificationId}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleRequestCode}
            disabled={loading || !!verificationId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
          >
            {verificationId ? '발송완료' : '인증번호 발송'}
          </button>
        </div>
      </div>

      {verificationId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            인증번호 {timeLeft > 0 && (
              <span className="text-red-600 text-sm ml-2">
                ({formatTime(timeLeft)})
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="6자리 숫자"
              maxLength={6}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleVerifyCode}
              disabled={loading || timeLeft === 0 || code.length !== 6}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 whitespace-nowrap"
            >
              인증 확인
            </button>
          </div>
          {timeLeft === 0 && (
            <p className="text-sm text-red-600 mt-2">
              인증번호가 만료되었습니다. 다시 요청해주세요.
            </p>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          💡 본인인증을 완료하면 신뢰도가 높아져 더 많은 채용 기회를 받을 수 있습니다.
        </p>
      </div>
    </div>
  )
}
