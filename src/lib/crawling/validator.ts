/**
 * 크롤링 검증 시스템
 * 크롤링된 데이터의 품질을 검증하고 문제를 보고합니다
 */

import { ScrapedJob } from '../scrapers'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  jobId: string
  source: string
}

export interface ValidationError {
  field: string
  message: string
  severity: 'critical' | 'high' | 'medium'
}

export interface ValidationWarning {
  field: string
  message: string
}

export interface ValidationReport {
  totalJobs: number
  validJobs: number
  invalidJobs: number
  successRate: number
  errorsByType: Record<string, number>
  warningsByType: Record<string, number>
  details: ValidationResult[]
}

/**
 * 단일 공고 검증
 */
export function validateJob(job: ScrapedJob): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 필수 필드 검증
  if (!job.id || job.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Job ID is required',
      severity: 'critical'
    })
  }

  if (!job.title || job.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Job title is required',
      severity: 'critical'
    })
  }

  if (!job.company || job.company.trim() === '') {
    errors.push({
      field: 'company',
      message: 'Company name is required',
      severity: 'critical'
    })
  }

  if (!job.sourceUrl || job.sourceUrl.trim() === '') {
    errors.push({
      field: 'sourceUrl',
      message: 'Source URL is required',
      severity: 'critical'
    })
  } else {
    // URL 형식 검증
    try {
      new URL(job.sourceUrl)
    } catch {
      errors.push({
        field: 'sourceUrl',
        message: 'Invalid URL format',
        severity: 'high'
      })
    }
  }

  if (!job.source || job.source.trim() === '') {
    errors.push({
      field: 'source',
      message: 'Source platform is required',
      severity: 'critical'
    })
  }

  // 연봉 검증
  if (!job.salary || typeof job.salary.min !== 'number' || typeof job.salary.max !== 'number') {
    errors.push({
      field: 'salary',
      message: 'Salary information is invalid',
      severity: 'medium'
    })
  } else {
    if (job.salary.min > job.salary.max) {
      errors.push({
        field: 'salary',
        message: 'Minimum salary is greater than maximum salary',
        severity: 'medium'
      })
    }
    if (job.salary.min < 0 || job.salary.max < 0) {
      errors.push({
        field: 'salary',
        message: 'Salary cannot be negative',
        severity: 'medium'
      })
    }
    if (job.salary.max > 50000) {
      warnings.push({
        field: 'salary',
        message: 'Salary seems unusually high (over 500M KRW)'
      })
    }
  }

  // 경력 검증
  if (job.experience) {
    if (typeof job.experience.min !== 'number' || typeof job.experience.max !== 'number') {
      errors.push({
        field: 'experience',
        message: 'Experience information is invalid',
        severity: 'medium'
      })
    } else {
      if (job.experience.min > job.experience.max) {
        errors.push({
          field: 'experience',
          message: 'Minimum experience is greater than maximum experience',
          severity: 'medium'
        })
      }
      if (job.experience.min < 0 || job.experience.max < 0) {
        errors.push({
          field: 'experience',
          message: 'Experience cannot be negative',
          severity: 'medium'
        })
      }
      if (job.experience.max > 50) {
        warnings.push({
          field: 'experience',
          message: 'Experience requirement seems unusually high'
        })
      }
    }
  }

  // 지역 검증
  if (!job.location || job.location.trim() === '') {
    warnings.push({
      field: 'location',
      message: 'Location is missing'
    })
  }

  // 마감일 검증
  if (!job.deadline) {
    warnings.push({
      field: 'deadline',
      message: 'Deadline is missing'
    })
  } else {
    try {
      const deadlineDate = new Date(job.deadline)
      const now = new Date()
      if (deadlineDate < now) {
        warnings.push({
          field: 'deadline',
          message: 'Deadline is in the past'
        })
      }
    } catch {
      errors.push({
        field: 'deadline',
        message: 'Invalid deadline format',
        severity: 'medium'
      })
    }
  }

  // 설명 검증
  if (!job.description || job.description.trim() === '') {
    warnings.push({
      field: 'description',
      message: 'Job description is missing'
    })
  } else if (job.description.length < 10) {
    warnings.push({
      field: 'description',
      message: 'Job description is too short'
    })
  }

  // 근무 형태 검증
  const validWorkTypes = ['onsite', 'remote', 'dispatch']
  if (!validWorkTypes.includes(job.workType)) {
    errors.push({
      field: 'workType',
      message: `Invalid work type: ${job.workType}`,
      severity: 'medium'
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    jobId: job.id,
    source: job.source
  }
}

/**
 * 여러 공고 일괄 검증
 */
export function validateJobs(jobs: ScrapedJob[]): ValidationReport {
  const results = jobs.map(job => validateJob(job))

  const validJobs = results.filter(r => r.valid).length
  const invalidJobs = results.length - validJobs
  const successRate = results.length > 0 ? (validJobs / results.length) * 100 : 0

  // 에러 타입별 집계
  const errorsByType: Record<string, number> = {}
  results.forEach(result => {
    result.errors.forEach(error => {
      errorsByType[error.field] = (errorsByType[error.field] || 0) + 1
    })
  })

  // 경고 타입별 집계
  const warningsByType: Record<string, number> = {}
  results.forEach(result => {
    result.warnings.forEach(warning => {
      warningsByType[warning.field] = (warningsByType[warning.field] || 0) + 1
    })
  })

  return {
    totalJobs: results.length,
    validJobs,
    invalidJobs,
    successRate,
    errorsByType,
    warningsByType,
    details: results
  }
}

/**
 * 링크 유효성 검증 (실제 URL 접근 테스트)
 */
export async function validateLink(url: string, timeout: number = 10000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    clearTimeout(timeoutId)

    // 200-399 범위의 상태 코드는 유효한 것으로 간주
    return response.ok || (response.status >= 300 && response.status < 400)
  } catch (error) {
    console.error(`Link validation failed for ${url}:`, error)
    return false
  }
}

/**
 * 여러 링크 일괄 검증 (병렬 처리)
 */
export async function validateLinks(
  jobs: ScrapedJob[],
  options: {
    concurrency?: number
    timeout?: number
    sample?: number
  } = {}
): Promise<{
  total: number
  valid: number
  invalid: number
  successRate: number
  invalidLinks: { jobId: string; url: string }[]
}> {
  const { concurrency = 5, timeout = 10000, sample } = options

  // 샘플링 (전체를 검증하지 않고 일부만 검증)
  let jobsToValidate = jobs
  if (sample && sample < jobs.length) {
    jobsToValidate = jobs.slice(0, sample)
  }

  const invalidLinks: { jobId: string; url: string }[] = []

  // 병렬 처리를 위한 배치 분할
  const batches: ScrapedJob[][] = []
  for (let i = 0; i < jobsToValidate.length; i += concurrency) {
    batches.push(jobsToValidate.slice(i, i + concurrency))
  }

  let validCount = 0
  let totalCount = 0

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async job => {
        const isValid = await validateLink(job.sourceUrl, timeout)
        return { job, isValid }
      })
    )

    results.forEach(({ job, isValid }) => {
      totalCount++
      if (isValid) {
        validCount++
      } else {
        invalidLinks.push({ jobId: job.id, url: job.sourceUrl })
      }
    })

    // 배치 사이에 짧은 대기 (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return {
    total: totalCount,
    valid: validCount,
    invalid: totalCount - validCount,
    successRate: totalCount > 0 ? (validCount / totalCount) * 100 : 0,
    invalidLinks
  }
}

/**
 * 검증 리포트 출력
 */
export function printValidationReport(report: ValidationReport): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 크롤링 검증 리포트')
  console.log('='.repeat(60))
  console.log(`총 공고 수: ${report.totalJobs}`)
  console.log(`✅ 유효한 공고: ${report.validJobs}`)
  console.log(`❌ 유효하지 않은 공고: ${report.invalidJobs}`)
  console.log(`📈 성공률: ${report.successRate.toFixed(2)}%`)

  if (Object.keys(report.errorsByType).length > 0) {
    console.log('\n❌ 에러 분석:')
    Object.entries(report.errorsByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([field, count]) => {
        console.log(`   ${field}: ${count}건`)
      })
  }

  if (Object.keys(report.warningsByType).length > 0) {
    console.log('\n⚠️ 경고 분석:')
    Object.entries(report.warningsByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([field, count]) => {
        console.log(`   ${field}: ${count}건`)
      })
  }

  // 심각한 에러가 있는 공고만 상세 표시
  const criticalErrors = report.details.filter(d =>
    d.errors.some(e => e.severity === 'critical')
  )

  if (criticalErrors.length > 0) {
    console.log('\n🚨 심각한 에러가 있는 공고:')
    criticalErrors.slice(0, 5).forEach(result => {
      console.log(`\n   [${result.source}] ${result.jobId}`)
      result.errors
        .filter(e => e.severity === 'critical')
        .forEach(error => {
          console.log(`      - ${error.field}: ${error.message}`)
        })
    })

    if (criticalErrors.length > 5) {
      console.log(`\n   ... 외 ${criticalErrors.length - 5}건 더`)
    }
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

/**
 * 중복 제거
 */
export function removeDuplicates(jobs: ScrapedJob[]): {
  unique: ScrapedJob[]
  duplicates: number
} {
  const seen = new Set<string>()
  const unique: ScrapedJob[] = []

  jobs.forEach(job => {
    // ID 또는 sourceUrl로 중복 판단
    const key = job.sourceUrl || job.id
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(job)
    }
  })

  return {
    unique,
    duplicates: jobs.length - unique.length
  }
}
