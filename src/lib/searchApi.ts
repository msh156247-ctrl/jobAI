// 학교/자격증/어학시험 검색 API

/**
 * 학교 검색
 * 실제 환경에서는 교육부 학교정보 API 또는 자체 DB 사용
 */

export interface School {
  id: string
  name: string
  type: 'university' | 'college' | 'high_school' | 'graduate_school'
  location?: string
  established?: string
}

export interface Certification {
  id: string
  name: string
  category: string
  issuer: string
  description?: string
}

export interface LanguageTest {
  id: string
  name: string
  type: 'TOEIC' | 'TOEFL' | 'OPIC' | 'TEPS' | 'HSK' | 'JLPT' | 'OTHER'
  maxScore?: string
  description?: string
}

// Mock 데이터: 대한민국 주요 대학교
const MOCK_UNIVERSITIES: School[] = [
  { id: 'school-001', name: '서울대학교', type: 'university', location: '서울' },
  { id: 'school-002', name: '연세대학교', type: 'university', location: '서울' },
  { id: 'school-003', name: '고려대학교', type: 'university', location: '서울' },
  { id: 'school-004', name: '카이스트(KAIST)', type: 'university', location: '대전' },
  { id: 'school-005', name: '포항공과대학교(POSTECH)', type: 'university', location: '경북' },
  { id: 'school-006', name: '성균관대학교', type: 'university', location: '서울' },
  { id: 'school-007', name: '한양대학교', type: 'university', location: '서울' },
  { id: 'school-008', name: '중앙대학교', type: 'university', location: '서울' },
  { id: 'school-009', name: '경희대학교', type: 'university', location: '서울' },
  { id: 'school-010', name: '한국외국어대학교', type: 'university', location: '서울' },
  { id: 'school-011', name: '서강대학교', type: 'university', location: '서울' },
  { id: 'school-012', name: '이화여자대학교', type: 'university', location: '서울' },
  { id: 'school-013', name: '서울시립대학교', type: 'university', location: '서울' },
  { id: 'school-014', name: '건국대학교', type: 'university', location: '서울' },
  { id: 'school-015', name: '동국대학교', type: 'university', location: '서울' },
  { id: 'school-016', name: '홍익대학교', type: 'university', location: '서울' },
  { id: 'school-017', name: '숙명여자대학교', type: 'university', location: '서울' },
  { id: 'school-018', name: '부산대학교', type: 'university', location: '부산' },
  { id: 'school-019', name: '경북대학교', type: 'university', location: '대구' },
  { id: 'school-020', name: '전남대학교', type: 'university', location: '광주' },
  { id: 'school-021', name: '충남대학교', type: 'university', location: '대전' },
  { id: 'school-022', name: '강원대학교', type: 'university', location: '강원' },
  { id: 'school-023', name: '제주대학교', type: 'university', location: '제주' },
  { id: 'school-024', name: '인하대학교', type: 'university', location: '인천' },
  { id: 'school-025', name: '아주대학교', type: 'university', location: '경기' },
]

// Mock 데이터: 주요 자격증
const MOCK_CERTIFICATIONS: Certification[] = [
  { id: 'cert-001', name: '정보처리기사', category: 'IT', issuer: '한국산업인력공단' },
  { id: 'cert-002', name: '정보처리산업기사', category: 'IT', issuer: '한국산업인력공단' },
  { id: 'cert-003', name: '빅데이터분석기사', category: 'IT', issuer: '한국데이터산업진흥원' },
  { id: 'cert-004', name: 'AWS Certified Solutions Architect', category: 'IT', issuer: 'Amazon' },
  { id: 'cert-005', name: 'Google Cloud Professional', category: 'IT', issuer: 'Google' },
  { id: 'cert-006', name: 'SQLD', category: 'IT', issuer: '한국데이터산업진흥원' },
  { id: 'cert-007', name: 'SQLP', category: 'IT', issuer: '한국데이터산업진흥원' },
  { id: 'cert-008', name: '워드프로세서', category: '사무', issuer: '대한상공회의소' },
  { id: 'cert-009', name: '컴퓨터활용능력 1급', category: '사무', issuer: '대한상공회의소' },
  { id: 'cert-010', name: '컴퓨터활용능력 2급', category: '사무', issuer: '대한상공회의소' },
  { id: 'cert-011', name: '전산회계 1급', category: '회계', issuer: '한국세무사회' },
  { id: 'cert-012', name: '전산회계 2급', category: '회계', issuer: '한국세무사회' },
  { id: 'cert-013', name: '재경관리사', category: '회계', issuer: '삼일회계법인' },
  { id: 'cert-014', name: 'CPA', category: '회계', issuer: '금융감독원' },
  { id: 'cert-015', name: '공인중개사', category: '부동산', issuer: '한국산업인력공단' },
  { id: 'cert-016', name: 'GTQ 그래픽기술자격', category: '디자인', issuer: '한국생산성본부' },
  { id: 'cert-017', name: 'GTQi 일러스트', category: '디자인', issuer: '한국생산성본부' },
  { id: 'cert-018', name: '컬러리스트기사', category: '디자인', issuer: '한국산업인력공단' },
  { id: 'cert-019', name: '토목기사', category: '건설', issuer: '한국산업인력공단' },
  { id: 'cert-020', name: '건축기사', category: '건설', issuer: '한국산업인력공단' },
  { id: 'cert-021', name: '전기기사', category: '전기', issuer: '한국산업인력공단' },
  { id: 'cert-022', name: '전자기사', category: '전기', issuer: '한국산업인력공단' },
  { id: 'cert-023', name: '기계설계기사', category: '기계', issuer: '한국산업인력공단' },
  { id: 'cert-024', name: 'PMP', category: '프로젝트관리', issuer: 'PMI' },
  { id: 'cert-025', name: '한국사능력검정시험 1급', category: '역사', issuer: '국사편찬위원회' },
]

// Mock 데이터: 어학 시험
const MOCK_LANGUAGE_TESTS: LanguageTest[] = [
  { id: 'lang-001', name: 'TOEIC', type: 'TOEIC', maxScore: '990', description: '토익' },
  { id: 'lang-002', name: 'TOEIC Speaking', type: 'TOEIC', maxScore: '200', description: '토익 스피킹' },
  { id: 'lang-003', name: 'TOEFL iBT', type: 'TOEFL', maxScore: '120', description: '토플' },
  { id: 'lang-004', name: 'OPIC', type: 'OPIC', maxScore: 'AL', description: '오픽 (AL/IH/IM/IL)' },
  { id: 'lang-005', name: 'TEPS', type: 'TEPS', maxScore: '600', description: '텝스' },
  { id: 'lang-006', name: 'TEPS Speaking', type: 'TEPS', maxScore: '400', description: '텝스 스피킹' },
  { id: 'lang-007', name: 'HSK 1급', type: 'HSK', description: '중국어 HSK 1급' },
  { id: 'lang-008', name: 'HSK 2급', type: 'HSK', description: '중국어 HSK 2급' },
  { id: 'lang-009', name: 'HSK 3급', type: 'HSK', description: '중국어 HSK 3급' },
  { id: 'lang-010', name: 'HSK 4급', type: 'HSK', description: '중국어 HSK 4급' },
  { id: 'lang-011', name: 'HSK 5급', type: 'HSK', description: '중국어 HSK 5급' },
  { id: 'lang-012', name: 'HSK 6급', type: 'HSK', description: '중국어 HSK 6급' },
  { id: 'lang-013', name: 'JLPT N1', type: 'JLPT', description: '일본어능력시험 N1' },
  { id: 'lang-014', name: 'JLPT N2', type: 'JLPT', description: '일본어능력시험 N2' },
  { id: 'lang-015', name: 'JLPT N3', type: 'JLPT', description: '일본어능력시험 N3' },
  { id: 'lang-016', name: 'JLPT N4', type: 'JLPT', description: '일본어능력시험 N4' },
  { id: 'lang-017', name: 'JLPT N5', type: 'JLPT', description: '일본어능력시험 N5' },
]

/**
 * 학교 검색
 */
export async function searchSchools(query: string): Promise<School[]> {
  // 실제 환경에서는 API 호출
  // const response = await fetch(`/api/schools/search?q=${encodeURIComponent(query)}`)
  // return response.json()

  // Mock: 로컬 필터링
  if (!query || query.trim().length === 0) {
    return MOCK_UNIVERSITIES.slice(0, 10)
  }

  const filtered = MOCK_UNIVERSITIES.filter(school =>
    school.name.toLowerCase().includes(query.toLowerCase())
  )

  return filtered.slice(0, 10)
}

/**
 * 자격증 검색
 */
export async function searchCertifications(query: string): Promise<Certification[]> {
  // 실제 환경에서는 API 호출
  // const response = await fetch(`/api/certifications/search?q=${encodeURIComponent(query)}`)
  // return response.json()

  // Mock: 로컬 필터링
  if (!query || query.trim().length === 0) {
    return MOCK_CERTIFICATIONS.slice(0, 10)
  }

  const filtered = MOCK_CERTIFICATIONS.filter(cert =>
    cert.name.toLowerCase().includes(query.toLowerCase()) ||
    cert.category.toLowerCase().includes(query.toLowerCase())
  )

  return filtered.slice(0, 10)
}

/**
 * 어학 시험 검색
 */
export async function searchLanguageTests(query: string): Promise<LanguageTest[]> {
  // 실제 환경에서는 API 호출
  // const response = await fetch(`/api/language-tests/search?q=${encodeURIComponent(query)}`)
  // return response.json()

  // Mock: 로컬 필터링
  if (!query || query.trim().length === 0) {
    return MOCK_LANGUAGE_TESTS
  }

  const filtered = MOCK_LANGUAGE_TESTS.filter(test =>
    test.name.toLowerCase().includes(query.toLowerCase()) ||
    test.type.toLowerCase().includes(query.toLowerCase())
  )

  return filtered
}

/**
 * 학교 ID로 조회
 */
export async function getSchoolById(id: string): Promise<School | undefined> {
  return MOCK_UNIVERSITIES.find(school => school.id === id)
}

/**
 * 자격증 ID로 조회
 */
export async function getCertificationById(id: string): Promise<Certification | undefined> {
  return MOCK_CERTIFICATIONS.find(cert => cert.id === id)
}

/**
 * 어학 시험 ID로 조회
 */
export async function getLanguageTestById(id: string): Promise<LanguageTest | undefined> {
  return MOCK_LANGUAGE_TESTS.find(test => test.id === id)
}
