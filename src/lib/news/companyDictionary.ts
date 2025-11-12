/**
 * 한국 주요 기업 사전
 * 기업명과 유사명칭(aliases)을 포함하여 뉴스 기사에서 기업 자동 탐지
 */

import type { Company } from './types'

export const COMPANY_DICTIONARY: Company[] = [
  // 대기업 IT
  {
    name: '삼성전자',
    aliases: ['삼성전자', '삼성전자㈜', 'Samsung Electronics', '삼성'],
    industry: 'IT/전자',
    description: '글로벌 전자제품 제조사'
  },
  {
    name: 'LG전자',
    aliases: ['LG전자', 'LG전자㈜', 'LG Electronics', 'LG'],
    industry: 'IT/전자',
    description: '가전 및 전자제품 제조사'
  },
  {
    name: 'SK하이닉스',
    aliases: ['SK하이닉스', 'SK하이닉스㈜', 'SK Hynix', '하이닉스'],
    industry: 'IT/반도체',
    description: '반도체 제조사'
  },

  // 포털/플랫폼
  {
    name: '네이버',
    aliases: ['네이버', '네이버㈜', 'NAVER', 'Naver'],
    industry: 'IT/포털',
    description: '국내 1위 포털 및 플랫폼 기업'
  },
  {
    name: '카카오',
    aliases: ['카카오', '카카오㈜', 'Kakao'],
    industry: 'IT/플랫폼',
    description: '메신저 및 플랫폼 기업'
  },
  {
    name: '쿠팡',
    aliases: ['쿠팡', 'Coupang'],
    industry: 'IT/이커머스',
    description: '이커머스 플랫폼'
  },
  {
    name: '배달의민족',
    aliases: ['배달의민족', '배민', '우아한형제들', 'Baemin', '우아한형제들㈜'],
    industry: 'IT/플랫폼',
    description: '배달 플랫폼'
  },
  {
    name: '토스',
    aliases: ['토스', 'Toss', '비바리퍼블리카', '비바리퍼블리카㈜'],
    industry: 'IT/핀테크',
    description: '핀테크 기업'
  },
  {
    name: '당근마켓',
    aliases: ['당근마켓', '당근', 'Daangn'],
    industry: 'IT/플랫폼',
    description: '로컬 커뮤니티 플랫폼'
  },
  {
    name: '야놀자',
    aliases: ['야놀자', 'Yanolja'],
    industry: 'IT/여행',
    description: '여행 플랫폼'
  },
  {
    name: '직방',
    aliases: ['직방', 'Zigbang'],
    industry: 'IT/부동산',
    description: '부동산 플랫폼'
  },

  // 게임
  {
    name: '넷마블',
    aliases: ['넷마블', '넷마블㈜', 'Netmarble'],
    industry: 'IT/게임',
    description: '모바일 게임 개발사'
  },
  {
    name: '엔씨소프트',
    aliases: ['엔씨소프트', 'NC소프트', 'NCSOFT', 'NCsoft'],
    industry: 'IT/게임',
    description: '온라인 게임 개발사'
  },
  {
    name: '넥슨',
    aliases: ['넥슨', 'Nexon', '넥슨코리아'],
    industry: 'IT/게임',
    description: '온라인 게임 개발사'
  },
  {
    name: '크래프톤',
    aliases: ['크래프톤', 'KRAFTON', '크래프톤㈜'],
    industry: 'IT/게임',
    description: 'PUBG 개발사'
  },

  // 엔터테인먼트
  {
    name: '하이브',
    aliases: ['하이브', 'HYBE', '하이브㈜', '빅히트'],
    industry: 'IT/엔터테인먼트',
    description: '종합 엔터테인먼트 기업'
  },
  {
    name: 'SM엔터테인먼트',
    aliases: ['SM엔터테인먼트', 'SM', 'SM Entertainment'],
    industry: 'IT/엔터테인먼트',
    description: '엔터테인먼트 기업'
  },
  {
    name: 'YG엔터테인먼트',
    aliases: ['YG엔터테인먼트', 'YG', 'YG Entertainment'],
    industry: 'IT/엔터테인먼트',
    description: '엔터테인먼트 기업'
  },

  // 통신
  {
    name: 'SK텔레콤',
    aliases: ['SK텔레콤', 'SKT', 'SK Telecom'],
    industry: 'IT/통신',
    description: '이동통신사'
  },
  {
    name: 'KT',
    aliases: ['KT', 'KT㈜'],
    industry: 'IT/통신',
    description: '통신사'
  },
  {
    name: 'LG유플러스',
    aliases: ['LG유플러스', 'LGU+', 'LG U+'],
    industry: 'IT/통신',
    description: '이동통신사'
  },

  // 핀테크
  {
    name: '카카오뱅크',
    aliases: ['카카오뱅크', 'Kakao Bank'],
    industry: 'IT/핀테크',
    description: '인터넷 전문 은행'
  },
  {
    name: '케이뱅크',
    aliases: ['케이뱅크', 'K뱅크', 'K Bank'],
    industry: 'IT/핀테크',
    description: '인터넷 전문 은행'
  },
  {
    name: '페이코',
    aliases: ['페이코', 'PAYCO', 'NHN페이코'],
    industry: 'IT/핀테크',
    description: '간편결제 서비스'
  },

  // 모빌리티
  {
    name: '카카오모빌리티',
    aliases: ['카카오모빌리티', '카카오T', 'Kakao Mobility'],
    industry: 'IT/모빌리티',
    description: '모빌리티 플랫폼'
  },
  {
    name: '타다',
    aliases: ['타다', 'TADA', 'VCNC'],
    industry: 'IT/모빌리티',
    description: '모빌리티 서비스'
  },

  // AI/클라우드
  {
    name: '업스테이지',
    aliases: ['업스테이지', 'Upstage'],
    industry: 'IT/AI',
    description: 'AI 기업'
  },
  {
    name: '네이버클라우드',
    aliases: ['네이버클라우드', 'NAVER Cloud', '네이버 클라우드'],
    industry: 'IT/클라우드',
    description: '클라우드 서비스'
  },
  {
    name: '카카오엔터프라이즈',
    aliases: ['카카오엔터프라이즈', 'Kakao Enterprise'],
    industry: 'IT/클라우드',
    description: '기업용 클라우드 서비스'
  },

  // 이커머스
  {
    name: '11번가',
    aliases: ['11번가', '11st', 'SK11번가'],
    industry: 'IT/이커머스',
    description: '이커머스 플랫폼'
  },
  {
    name: '티몬',
    aliases: ['티몬', 'TMON', 'Tmon'],
    industry: 'IT/이커머스',
    description: '소셜커머스'
  },
  {
    name: '위메프',
    aliases: ['위메프', 'Wemakeprice', 'WeMakePrice'],
    industry: 'IT/이커머스',
    description: '소셜커머스'
  },
  {
    name: '마켓컬리',
    aliases: ['마켓컬리', '컬리', 'Market Kurly'],
    industry: 'IT/이커머스',
    description: '신선식품 배송 서비스'
  },

  // 콘텐츠/미디어
  {
    name: '왓챠',
    aliases: ['왓챠', 'Watcha', '왓챠㈜'],
    industry: 'IT/콘텐츠',
    description: 'OTT 플랫폼'
  },
  {
    name: '웨이브',
    aliases: ['웨이브', 'WAVVE', 'Wavve'],
    industry: 'IT/콘텐츠',
    description: 'OTT 플랫폼'
  },
  {
    name: '카카오엔터테인먼트',
    aliases: ['카카오엔터테인먼트', 'Kakao Entertainment'],
    industry: 'IT/콘텐츠',
    description: '콘텐츠 기업'
  },

  // 헬스케어
  {
    name: '닥터나우',
    aliases: ['닥터나우', 'Dr.Now'],
    industry: 'IT/헬스케어',
    description: '비대면 진료 플랫폼'
  },
  {
    name: '굿닥',
    aliases: ['굿닥', 'GoodDoc'],
    industry: 'IT/헬스케어',
    description: '병원 예약 플랫폼'
  },

  // 기타 주요 스타트업
  {
    name: '두나무',
    aliases: ['두나무', 'Dunamu', '업비트'],
    industry: 'IT/핀테크',
    description: '암호화폐 거래소'
  },
  {
    name: '하이퍼커넥트',
    aliases: ['하이퍼커넥트', 'Hyperconnect', '아자르'],
    industry: 'IT/소셜',
    description: '소셜 네트워크 서비스'
  },
  {
    name: '센드버드',
    aliases: ['센드버드', 'Sendbird'],
    industry: 'IT/소프트웨어',
    description: '메시징 플랫폼'
  },
  {
    name: '무신사',
    aliases: ['무신사', 'Musinsa', 'MUSINSA'],
    industry: 'IT/패션',
    description: '패션 플랫폼'
  }
]

/**
 * 기사 본문에서 기업명 탐지
 * @param text 기사 제목 또는 본문
 * @returns 매칭된 기업명 (없으면 null)
 */
export function detectCompany(text: string): string | null {
  if (!text) return null

  // 모든 기업을 순회하며 매칭 시도
  for (const company of COMPANY_DICTIONARY) {
    for (const alias of company.aliases) {
      // 정확한 단어 매칭 (부분 문자열이 아닌 단어 단위)
      const regex = new RegExp(`\\b${alias}\\b`, 'i')
      if (regex.test(text)) {
        return company.name
      }
    }
  }

  return null
}

/**
 * 기업명으로 Company 객체 찾기
 */
export function getCompanyByName(name: string): Company | undefined {
  return COMPANY_DICTIONARY.find(c => c.name === name)
}

/**
 * 산업별 기업 목록 가져오기
 */
export function getCompaniesByIndustry(industry: string): Company[] {
  return COMPANY_DICTIONARY.filter(c => c.industry === industry)
}

/**
 * 모든 기업명 목록 (자동완성용)
 */
export function getAllCompanyNames(): string[] {
  return COMPANY_DICTIONARY.map(c => c.name)
}
