'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, type PriorityItem } from '@/contexts/ProfileContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Save, Upload, X } from 'lucide-react'
import Header from '@/components/Header'
import RequireAuth from '@/components/RequireAuth'
import PrioritySettings from '@/components/PrioritySettings'
import { uploadProfileImage, deleteProfileImage } from '@/lib/storageApi'
import { useToast } from '@/components/Toast'

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, companyMeta, updateProfile, updateCompanyMeta } = useProfile()
  const router = useRouter()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 구직자 프로필
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [introduction, setIntroduction] = useState('')

  // 기업 프로필
  const [logoUrl, setLogoUrl] = useState('')
  const [description, setDescription] = useState('')

  // 우선순위 설정
  const [priorities, setPriorities] = useState<PriorityItem[]>([])

  useEffect(() => {
    if (user?.role === 'seeker' && profile) {
      setProfileImageUrl(profile.profileImageUrl || '')
      setIntroduction(profile.introduction || '')
      setPriorities(profile.priorities || [])
    } else if (user?.role === 'employer' && companyMeta) {
      setLogoUrl(companyMeta.logoUrl || '')
      setDescription(companyMeta.description || '')
      setPriorities(companyMeta.priorities || [])
    }
  }, [user, profile, companyMeta])

  // 이미지 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)

    const result = await uploadProfileImage(user.id, file)

    if (result.success && result.url) {
      if (user.role === 'seeker') {
        setProfileImageUrl(result.url)
      } else {
        setLogoUrl(result.url)
      }
      showToast('success', '이미지가 업로드되었습니다.')
    } else {
      showToast('error', result.error || '이미지 업로드에 실패했습니다.')
    }

    setUploading(false)
  }

  // 이미지 삭제 핸들러
  const handleImageDelete = async () => {
    if (!user) return

    const confirmed = window.confirm('프로필 이미지를 삭제하시겠습니까?')
    if (!confirmed) return

    const result = await deleteProfileImage(user.id)

    if (result.success) {
      if (user.role === 'seeker') {
        setProfileImageUrl('')
      } else {
        setLogoUrl('')
      }
      showToast('success', '이미지가 삭제되었습니다.')
    } else {
      showToast('error', result.error || '이미지 삭제에 실패했습니다.')
    }
  }

  const handleSave = () => {
    if (user?.role === 'seeker') {
      updateProfile({
        ...profile!,
        profileImageUrl,
        introduction,
        priorities,
      })
    } else if (user?.role === 'employer') {
      updateCompanyMeta({
        ...companyMeta!,
        logoUrl,
        description,
        priorities,
      })
    }
    setSuccess('프로필이 저장되었습니다!')
    setEditing(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const isSeeker = user?.role === 'seeker'

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {isSeeker ? '내 프로필' : '회사 프로필'}
            </h1>
            <div className="flex space-x-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    <Save size={20} />
                    <span>저장</span>
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  편집
                </button>
              )}
            </div>
          </div>

          {/* 성공 메시지 */}
          {success && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* 구직자 프로필 */}
          {isSeeker && (
            <div className="px-6 py-6 space-y-6">
              {/* 프로필 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로필 이미지
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {profileImageUrl ? (
                      <Image
                        src={profileImageUrl}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        priority
                      />
                    ) : (
                      <Camera size={40} className="text-gray-400" />
                    )}
                  </div>
                  {editing && (
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        <Upload size={16} />
                        <span>{uploading ? '업로드 중...' : '이미지 업로드'}</span>
                      </button>
                      {profileImageUrl && (
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                        >
                          <X size={16} />
                          <span>이미지 삭제</span>
                        </button>
                      )}
                      <p className="text-xs text-gray-500">
                        JPG, PNG, WEBP 형식, 최대 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">이름</label>
                    <p className="mt-1 text-base">{profile?.name || user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">이메일</label>
                    <p className="mt-1 text-base">{profile?.email || user.email}</p>
                  </div>
                  {profile?.phone && (
                    <div>
                      <label className="block text-sm text-gray-600">연락처</label>
                      <p className="mt-1 text-base">{profile.phone}</p>
                    </div>
                  )}
                  {profile?.location && (
                    <div>
                      <label className="block text-sm text-gray-600">거주지</label>
                      <p className="mt-1 text-base">{profile.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 소개글 */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  자기소개
                </label>
                {editing ? (
                  <textarea
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={6}
                    placeholder="자신을 소개하는 글을 작성해주세요..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {introduction || '소개글이 없습니다. 편집 버튼을 눌러 작성해주세요.'}
                    </p>
                  </div>
                )}
              </div>

              {/* 학력 */}
              {profile?.educations && profile.educations.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">학력</h3>
                  <div className="space-y-3">
                    {profile.educations.map((edu, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="font-medium">{edu.schoolName}</div>
                        {edu.major && <div className="text-sm text-gray-600">{edu.major}</div>}
                        <div className="text-sm text-gray-500">
                          {edu.startYear} - {edu.endYear}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 자격증 */}
              {profile?.certifications && profile.certifications.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">자격증</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {profile.certifications.map((cert, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium">{cert.name}</div>
                        {cert.score && <div className="text-sm text-gray-600">{cert.score}</div>}
                        <div className="text-sm text-gray-500">{cert.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 보유 기술 */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">보유 기술</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm"
                      >
                        {skill.name} ({skill.level === 'beginner' ? '하' : skill.level === 'intermediate' ? '중' : '상'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 우선순위 설정 섹션 (구직자) */}
          {isSeeker && (
            <div className="px-6 py-6 border-t">
              <PrioritySettings
                userType="jobseeker"
                priorities={priorities}
                onPrioritiesChange={setPriorities}
              />
            </div>
          )}

          {/* 기업 프로필 */}
          {!isSeeker && (
            <div className="px-6 py-6 space-y-6">
              {/* 회사 로고 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회사 로고
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden border">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Company Logo"
                        width={128}
                        height={128}
                        className="w-full h-full object-contain p-2"
                        priority
                      />
                    ) : (
                      <Camera size={40} className="text-gray-400" />
                    )}
                  </div>
                  {editing && (
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        <Upload size={16} />
                        <span>{uploading ? '업로드 중...' : '로고 업로드'}</span>
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                        >
                          <X size={16} />
                          <span>로고 삭제</span>
                        </button>
                      )}
                      <p className="text-xs text-gray-500">
                        JPG, PNG, WEBP 형식, 최대 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 회사 기본 정보 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">회사 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600">회사명</label>
                    <p className="mt-1 text-base">{companyMeta?.companyName}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">사업자번호</label>
                    <p className="mt-1 text-base">{companyMeta?.businessNumber}</p>
                  </div>
                  {companyMeta?.industry && (
                    <div>
                      <label className="block text-sm text-gray-600">업종</label>
                      <p className="mt-1 text-base">{companyMeta.industry}</p>
                    </div>
                  )}
                  {companyMeta?.website && (
                    <div>
                      <label className="block text-sm text-gray-600">웹사이트</label>
                      <a
                        href={companyMeta.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-base text-blue-600 hover:underline"
                      >
                        {companyMeta.website}
                      </a>
                    </div>
                  )}
                </div>
                {companyMeta?.address && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600">주소</label>
                    <p className="mt-1 text-base">{companyMeta.address}</p>
                  </div>
                )}
              </div>

              {/* 회사 소개 */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회사 소개
                </label>
                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={8}
                    placeholder="회사를 소개하는 글을 작성해주세요..."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 min-h-40">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {description || '회사 소개가 없습니다. 편집 버튼을 눌러 작성해주세요.'}
                    </p>
                  </div>
                )}
              </div>

              {/* 회사 연혁 */}
              {companyMeta?.history && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">연혁</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{companyMeta.history}</p>
                  </div>
                </div>
              )}

              {/* 우선순위 설정 섹션 (기업) */}
              <div className="border-t pt-6">
                <PrioritySettings
                  userType="employer"
                  priorities={priorities}
                  onPrioritiesChange={setPriorities}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </RequireAuth>
  )
}