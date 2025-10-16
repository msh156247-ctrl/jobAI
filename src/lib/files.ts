import { supabase } from './supabase'

export interface FileUploadResult {
  path: string
  publicUrl: string
  fileName: string
  fileSize: number
}

export interface StoredFile {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  file_url: string
  upload_type: 'resume' | 'portfolio' | 'cover_letter' | 'certificate'
  created_at: string
  updated_at: string
}

const BUCKET_NAME = 'file-uploads'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = {
  resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  portfolio: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  cover_letter: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  certificate: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
}

// 파일 유효성 검사
export function validateFile(file: File, uploadType: keyof typeof ALLOWED_FILE_TYPES): { valid: boolean; error?: string } {
  // 파일 크기 검사
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' }
  }

  // 파일 타입 검사
  const allowedTypes = ALLOWED_FILE_TYPES[uploadType]
  if (!allowedTypes.includes(file.type)) {
    const typeNames = {
      resume: 'PDF, Word 문서',
      portfolio: 'PDF, 이미지 파일',
      cover_letter: 'PDF, Word 문서, 텍스트 파일',
      certificate: 'PDF, 이미지 파일'
    }
    return { valid: false, error: `허용된 파일 형식: ${typeNames[uploadType]}` }
  }

  return { valid: true }
}

// 파일 업로드
export async function uploadFile(
  file: File,
  userId: string,
  uploadType: keyof typeof ALLOWED_FILE_TYPES
): Promise<FileUploadResult> {
  // 파일 유효성 검사
  const validation = validateFile(file, uploadType)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // 파일명 생성 (중복 방지)
  const timestamp = Date.now()
  const fileName = `${userId}/${uploadType}/${timestamp}_${file.name}`

  try {
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error('파일 업로드 중 오류가 발생했습니다.')
  }
}

// 파일 정보를 데이터베이스에 저장
export async function saveFileRecord(
  userId: string,
  uploadResult: FileUploadResult,
  uploadType: keyof typeof ALLOWED_FILE_TYPES,
  file: File
): Promise<StoredFile> {
  const { data, error } = await supabase
    .from('user_files')
    .insert([
      {
        user_id: userId,
        file_name: uploadResult.fileName,
        file_path: uploadResult.path,
        file_size: uploadResult.fileSize,
        file_type: file.type,
        file_url: uploadResult.publicUrl,
        upload_type: uploadType
      }
    ] as any)
    .select()
    .single()

  if (error) throw error
  return data as any
}

// 사용자 파일 목록 조회
export async function getUserFiles(
  userId: string,
  uploadType?: keyof typeof ALLOWED_FILE_TYPES
): Promise<StoredFile[]> {
  let query = supabase
    .from('user_files')
    .select('*')
    .eq('user_id', userId)

  if (uploadType) {
    query = query.eq('upload_type', uploadType)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// 파일 삭제
export async function deleteFile(fileId: string, userId: string): Promise<void> {
  // 데이터베이스에서 파일 정보 조회
  const { data: fileRecord, error: fetchError } = await supabase
    .from('user_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError
  if (!fileRecord) throw new Error('파일을 찾을 수 없습니다.')

  try {
    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([(fileRecord as any).file_path])

    if (storageError) throw storageError

    // 데이터베이스에서 레코드 삭제
    const { error: dbError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId)

    if (dbError) throw dbError
  } catch (error) {
    console.error('File deletion error:', error)
    throw new Error('파일 삭제 중 오류가 발생했습니다.')
  }
}

// 파일 다운로드 URL 생성
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600) // 1시간 유효

  if (error) throw error
  return data.signedUrl
}

// 파일 타입별 아이콘 반환
export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('text')) return '📋'
  return '📎'
}

// 파일 크기를 읽기 쉬운 형태로 변환
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}