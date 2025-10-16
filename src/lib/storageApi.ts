// Supabase Storage API - 프로필 이미지 및 파일 업로드

import { supabase } from './supabase'

const PROFILE_IMAGES_BUCKET = 'profile-images'
const RESUMES_BUCKET = 'resumes'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * 프로필 이미지 업로드
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' }
    }

    // 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, WEBP만 가능)' }
    }

    // 파일명 생성 (userId + timestamp + 확장자)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // 기존 프로필 이미지 삭제
    const { data: existingFiles } = await supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .list(userId)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`)
      await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove(filesToDelete)
    }

    // 새 이미지 업로드
    const { data, error } = await supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: '이미지 업로드에 실패했습니다.' }
    }

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    return { success: true, url: publicUrlData.publicUrl }
  } catch (error) {
    console.error('Upload profile image error:', error)
    return { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' }
  }
}

/**
 * 프로필 이미지 삭제
 */
export async function deleteProfileImage(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: files } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).list(userId)

    if (!files || files.length === 0) {
      return { success: true }
    }

    const filesToDelete = files.map(f => `${userId}/${f.name}`)
    const { error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove(filesToDelete)

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: '이미지 삭제에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete profile image error:', error)
    return { success: false, error: '이미지 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 프로필 이미지 URL 조회
 */
export async function getProfileImageUrl(userId: string): Promise<string | null> {
  try {
    const { data: files } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).list(userId, {
      limit: 1,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (!files || files.length === 0) {
      return null
    }

    const filePath = `${userId}/${files[0].name}`
    const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('Get profile image URL error:', error)
    return null
  }
}

/**
 * 이력서 업로드
 */
export async function uploadResume(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
  try {
    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' }
    }

    // 파일 형식 검증
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: '지원하지 않는 파일 형식입니다. (PDF, DOC, DOCX만 가능)' }
    }

    // 파일명 생성
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `resume-${timestamp}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // 업로드
    const { data, error } = await supabase.storage
      .from(RESUMES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: '이력서 업로드에 실패했습니다.' }
    }

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage.from(RESUMES_BUCKET).getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name
    }
  } catch (error) {
    console.error('Upload resume error:', error)
    return { success: false, error: '이력서 업로드 중 오류가 발생했습니다.' }
  }
}

/**
 * 이력서 삭제
 */
export async function deleteResume(userId: string, fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = `${userId}/${fileName}`
    const { error } = await supabase.storage.from(RESUMES_BUCKET).remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: '이력서 삭제에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete resume error:', error)
    return { success: false, error: '이력서 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자의 모든 이력서 목록 조회
 */
export async function listResumes(userId: string): Promise<{ name: string; url: string; createdAt: string }[]> {
  try {
    const { data: files, error } = await supabase.storage.from(RESUMES_BUCKET).list(userId, {
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) {
      console.error('List resumes error:', error)
      return []
    }

    if (!files || files.length === 0) {
      return []
    }

    return files.map(file => {
      const filePath = `${userId}/${file.name}`
      const { data } = supabase.storage.from(RESUMES_BUCKET).getPublicUrl(filePath)

      return {
        name: file.name,
        url: data.publicUrl,
        createdAt: file.created_at || '',
      }
    })
  } catch (error) {
    console.error('List resumes error:', error)
    return []
  }
}

/**
 * 이미지 URL을 Blob으로 변환
 */
export async function urlToBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.blob()
  } catch (error) {
    console.error('URL to Blob error:', error)
    return null
  }
}

/**
 * Blob을 Base64로 변환
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
