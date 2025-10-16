'use client'

import { useState } from 'react'
import { verifyBusinessNumber } from '@/services/verification'
import type { DartCompanyInfo } from '@/types'
import { useToast } from './Toast'

interface BusinessVerificationProps {
  onVerified: (companyInfo: DartCompanyInfo) => void
  companyName: string
}

export default function BusinessVerification({ onVerified, companyName }: BusinessVerificationProps) {
  const [businessNumber, setBusinessNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<DartCompanyInfo | null>(null)
  const { showToast } = useToast()

  const formatBusinessNumber = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 10)}`
  }

  const handleVerify = async () => {
    const cleaned = businessNumber.replace(/[^0-9]/g, '')

    if (cleaned.length !== 10) {
      showToast('error', '올바른 사업자 번호를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await verifyBusinessNumber(cleaned, companyName)

      if (result.success && result.companyInfo) {
        setCompanyInfo(result.companyInfo)
        showToast('success', result.message)
        onVerified(result.companyInfo)
      } else {
        showToast('error', result.message)
        setCompanyInfo(result.companyInfo || null)
      }
    } catch (error) {
      showToast('error', '기업 인증에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사업자 등록번호
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(formatBusinessNumber(e.target.value))}
            placeholder="123-45-67890"
            maxLength={12}
            disabled={!!companyInfo}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleVerify}
            disabled={loading || !!companyInfo}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
          >
            {loading ? '확인 중...' : companyInfo ? '인증완료' : 'DART 인증'}
          </button>
        </div>
      </div>

      {companyInfo && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-800">DART 인증 완료</span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex">
              <span className="w-24 text-gray-600">회사명:</span>
              <span className="font-medium text-gray-900">{companyInfo.corpName}</span>
            </div>
            {companyInfo.ceoName && (
              <div className="flex">
                <span className="w-24 text-gray-600">대표자:</span>
                <span className="text-gray-900">{companyInfo.ceoName}</span>
              </div>
            )}
            {companyInfo.address && (
              <div className="flex">
                <span className="w-24 text-gray-600">주소:</span>
                <span className="text-gray-900">{companyInfo.address}</span>
              </div>
            )}
            {companyInfo.stockCode && (
              <div className="flex">
                <span className="w-24 text-gray-600">종목코드:</span>
                <span className="text-gray-900">{companyInfo.stockCode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
        <p className="text-sm text-blue-800 font-medium">
          💡 DART 인증이란?
        </p>
        <p className="text-sm text-blue-700">
          금융감독원 전자공시시스템(DART)에 등록된 기업 정보를 통해
          실제 존재하는 기업임을 확인하는 절차입니다.
        </p>
        <p className="text-sm text-blue-700">
          인증된 기업은 구직자들에게 더 신뢰받을 수 있습니다.
        </p>
      </div>
    </div>
  )
}
