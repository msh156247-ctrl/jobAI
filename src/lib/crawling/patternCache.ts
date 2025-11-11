/**
 * 크롤링 패턴 캐싱 시스템
 * 학습된 URL 패턴을 저장하고 재사용합니다
 */

import { URLPattern } from './urlPatternLearner'
import * as fs from 'fs'
import * as path from 'path'

const CACHE_DIR = path.join(process.cwd(), '.crawling-cache')
const CACHE_EXPIRY_DAYS = 30 // 30일 후 만료

/**
 * 캐시 디렉토리 생성
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

/**
 * 도메인을 파일명으로 변환
 */
function domainToFileName(domain: string): string {
  return domain.replace(/\./g, '_') + '.json'
}

/**
 * 패턴 저장
 */
export function savePattern(pattern: URLPattern): void {
  ensureCacheDir()

  const fileName = domainToFileName(pattern.domain)
  const filePath = path.join(CACHE_DIR, fileName)

  const data = {
    ...pattern,
    detailPageRegex: pattern.detailPageRegex.source // RegExp를 문자열로 변환
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`✅ 패턴 저장 완료: ${pattern.domain}`)
}

/**
 * 패턴 불러오기
 */
export function loadPattern(domain: string): URLPattern | null {
  ensureCacheDir()

  const fileName = domainToFileName(domain)
  const filePath = path.join(CACHE_DIR, fileName)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // 만료 확인
    const lastUpdated = new Date(data.lastUpdated)
    const now = new Date()
    const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff > CACHE_EXPIRY_DAYS) {
      console.log(`⏰ 캐시 만료됨: ${domain} (${daysDiff.toFixed(0)}일 경과)`)
      return null
    }

    // RegExp 복원
    const pattern: URLPattern = {
      ...data,
      detailPageRegex: new RegExp(data.detailPageRegex)
    }

    console.log(`📦 캐시된 패턴 로드: ${domain}`)
    return pattern

  } catch (error) {
    console.error(`❌ 패턴 로드 실패: ${domain}`, error)
    return null
  }
}

/**
 * 패턴 삭제
 */
export function deletePattern(domain: string): boolean {
  const fileName = domainToFileName(domain)
  const filePath = path.join(CACHE_DIR, fileName)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`🗑️ 패턴 삭제: ${domain}`)
    return true
  }

  return false
}

/**
 * 모든 캐시된 패턴 목록
 */
export function listCachedPatterns(): string[] {
  ensureCacheDir()

  const files = fs.readdirSync(CACHE_DIR)
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', '').replace(/_/g, '.'))
}

/**
 * 모든 패턴 불러오기
 */
export function getAllPatterns(): URLPattern[] {
  const domains = listCachedPatterns()
  const patterns: URLPattern[] = []

  domains.forEach(domain => {
    const pattern = loadPattern(domain)
    if (pattern) {
      patterns.push(pattern)
    }
  })

  return patterns
}

/**
 * 캐시 전체 삭제
 */
export function clearAllCache(): void {
  ensureCacheDir()

  const files = fs.readdirSync(CACHE_DIR)
  files.forEach(file => {
    fs.unlinkSync(path.join(CACHE_DIR, file))
  })

  console.log(`🧹 모든 캐시 삭제 완료`)
}

/**
 * 패턴 업데이트
 */
export function updatePattern(domain: string, updates: Partial<URLPattern>): boolean {
  const pattern = loadPattern(domain)

  if (!pattern) {
    console.error(`❌ 패턴을 찾을 수 없음: ${domain}`)
    return false
  }

  const updatedPattern: URLPattern = {
    ...pattern,
    ...updates,
    lastUpdated: new Date().toISOString()
  }

  savePattern(updatedPattern)
  return true
}

/**
 * 패턴이 최신인지 확인
 */
export function isPatternFresh(domain: string, maxAgeDays: number = 7): boolean {
  const pattern = loadPattern(domain)

  if (!pattern) {
    return false
  }

  const lastUpdated = new Date(pattern.lastUpdated)
  const now = new Date()
  const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

  return daysDiff <= maxAgeDays
}
