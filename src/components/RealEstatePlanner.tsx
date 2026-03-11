'use client';

import { useMemo, useState } from 'react';

type DealType = '매매' | '전세' | '월세/전월세';
type Purpose = '실거주' | '투자' | '신혼부부/가족이주' | '직주근접';
type MaritalStatus = '미혼' | '기혼' | '예비부부';

interface ApiResult {
  updatedAt: string;
  loan: {
    ltv: number;
    dti: number;
    interestRateRange: { min: number; max: number };
    maxByLtv: number;
    maxByDti: number;
    possibleLoan: number;
    shortage: number;
  };
  docs: string[];
  notice: string;
}

interface MapListing {
  id: string;
  name: string;
  district: string;
  region: string;
  price: number;
  type: string;
  x: number;
  y: number;
}

const regionSamples: Record<string, string[]> = {
  서울: ['강남구 아파트', '노원구 빌라', '마포구 오피스텔'],
  경기: ['성남시 아파트', '수원시 빌라', '고양시 다세대'],
  인천: ['연수구 아파트', '부평구 빌라', '서구 오피스텔'],
  부산: ['해운대구 아파트', '수영구 빌라', '동래구 다세대'],
};

const mapListings: MapListing[] = [
  { id: 'seoul-1', name: '강남 래미안', district: '강남구', region: '서울', price: 940000000, type: '아파트', x: 76, y: 58 },
  { id: 'seoul-2', name: '노원 센트럴빌', district: '노원구', region: '서울', price: 510000000, type: '빌라', x: 39, y: 35 },
  { id: 'seoul-3', name: '마포 리버뷰', district: '마포구', region: '서울', price: 690000000, type: '오피스텔', x: 28, y: 52 },
  { id: 'gyeonggi-1', name: '판교 테크하우스', district: '성남시', region: '경기', price: 820000000, type: '아파트', x: 67, y: 64 },
  { id: 'gyeonggi-2', name: '수원 헤리티지', district: '수원시', region: '경기', price: 560000000, type: '빌라', x: 49, y: 75 },
  { id: 'incheon-1', name: '송도 센트럴', district: '연수구', region: '인천', price: 620000000, type: '아파트', x: 21, y: 61 },
  { id: 'busan-1', name: '해운대 오션뷰', district: '해운대구', region: '부산', price: 730000000, type: '아파트', x: 82, y: 82 },
];

const requiredDocs = [
  '등기부등본 (갑구/을구 확인: 소유권, 근저당, 가압류)',
  '건축물대장 (위반건축물 여부)',
  '토지대장/임야대장 (대지권, 지목 확인)',
  '전입세대 열람내역 (선순위 임차인 확인)',
  '확정일자 부여현황 (임대차 우선순위 점검)',
  '관리비 고지서/장기수선충당금 내역',
  '중개대상물 확인·설명서',
  '임대인 신분증 및 대리계약 시 위임장/인감증명서',
];

function formatKrw(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.round(amount)));
}

export default function RealEstatePlanner() {
  const [region, setRegion] = useState('서울');
  const [propertyType, setPropertyType] = useState('아파트');
  const [dealType, setDealType] = useState<DealType>('전세');
  const [targetPrice, setTargetPrice] = useState(600000000);
  const [currentFunds, setCurrentFunds] = useState(100000000);
  const [monthlyRent, setMonthlyRent] = useState(800000);

  const [age, setAge] = useState(32);
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('미혼');
  const [purpose, setPurpose] = useState<Purpose>('실거주');
  const [income, setIncome] = useState(60000000);
  const [existingDebt, setExistingDebt] = useState(10000000);

  const [latest, setLatest] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const quickLoan = useMemo(() => {
    const ltv = dealType === '매매' ? 0.7 : dealType === '전세' ? 0.8 : 0.6;
    const dti = 0.4;
    const maxByLtv = targetPrice * ltv;
    const maxByDti = income * dti * 6 - existingDebt;
    const possibleLoan = Math.max(0, Math.min(maxByLtv, maxByDti));

    return {
      ltv,
      dti,
      maxByLtv,
      maxByDti,
      possibleLoan,
      shortage: Math.max(0, targetPrice - currentFunds - possibleLoan),
    };
  }, [dealType, targetPrice, currentFunds, income, existingDebt]);

  const availableBudget = latest?.loan.possibleLoan ? currentFunds + latest.loan.possibleLoan : currentFunds + quickLoan.possibleLoan;

  const regionalMapStats = useMemo(() => {
    const regionItems = mapListings.filter((item) => item.region === region);
    const affordable = regionItems.filter((item) => item.price <= availableBudget);
    return {
      all: regionItems,
      affordable,
      remaining: affordable.length,
    };
  }, [region, availableBudget]);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/planner/latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant: { age, maritalStatus, purpose, annualIncome: income, existingDebt },
          finance: { currentFunds },
          property: { region, propertyType, dealType, targetPrice, monthlyRent },
        }),
      });

      if (!response.ok) {
        throw new Error('최신 조건 조회 실패');
      }

      const data = (await response.json()) as ApiResult;
      setLatest(data);
    } catch {
      setLatest(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="hero">
        <h1>한국 부동산 집찾기 전략 플래너</h1>
        <p>신청자 상황(나이/결혼/거주 목적), 현재 자금, 매물 정보를 바탕으로 API 기반 최신 대출 조건을 확인하세요.</p>
      </header>

      <section className="card grid">
        <h2>1) 신청자 정보</h2>
        <label>
          나이
          <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
        </label>
        <label>
          결혼 상태
          <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}>
            <option>미혼</option>
            <option>기혼</option>
            <option>예비부부</option>
          </select>
        </label>
        <label>
          거주 목적
          <select value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)}>
            <option>실거주</option>
            <option>신혼부부/가족이주</option>
            <option>직주근접</option>
            <option>투자</option>
          </select>
        </label>
        <label>
          연소득(원)
          <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} />
        </label>
        <label>
          기존 연간 부채상환액(원)
          <input type="number" value={existingDebt} onChange={(e) => setExistingDebt(Number(e.target.value))} />
        </label>
      </section>

      <section className="card grid">
        <h2>2) 현재 가진 금액 + 부동산 정보</h2>
        <label>
          지역
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {Object.keys(regionSamples).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          주택 유형
          <input value={propertyType} onChange={(e) => setPropertyType(e.target.value)} placeholder="아파트, 빌라, 오피스텔" />
        </label>
        <label>
          거래 유형
          <select value={dealType} onChange={(e) => setDealType(e.target.value as DealType)}>
            <option>매매</option>
            <option>전세</option>
            <option>월세/전월세</option>
          </select>
        </label>
        <label>
          목표 매물가/보증금(원)
          <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(Number(e.target.value))} />
        </label>
        <label>
          현재 가진 금액(원)
          <input type="number" value={currentFunds} onChange={(e) => setCurrentFunds(Number(e.target.value))} />
        </label>
        <label>
          월세(원)
          <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
        </label>
      </section>

      <section className="card grid">
        <h2>3) 대출 정보 조회</h2>
        <button onClick={fetchLatest} disabled={loading} className="actionBtn">
          {loading ? '조회 중...' : 'API로 최신 대출 조건 조회'}
        </button>

        <ul className="result">
          <li>LTV 기준 한도(간이): 약 {formatKrw(quickLoan.maxByLtv)}원</li>
          <li>DTI 기준 한도(간이): 약 {formatKrw(quickLoan.maxByDti)}원</li>
          <li>예상 대출 가능액(간이): {formatKrw(quickLoan.possibleLoan)}원</li>
          <li>자금 부족 예상(간이): {formatKrw(quickLoan.shortage)}원</li>
        </ul>

        {latest && (
          <div className="apiBox">
            <p>업데이트 시각: {new Date(latest.updatedAt).toLocaleString('ko-KR')}</p>
            <p>
              API 대출 비율: LTV {Math.round(latest.loan.ltv * 100)}% / DTI {Math.round(latest.loan.dti * 100)}%
            </p>
            <p>
              API 금리 범위(추정): 연 {latest.loan.interestRateRange.min}% ~ {latest.loan.interestRateRange.max}%
            </p>
            <p>API 대출 가능액(추정): {formatKrw(latest.loan.possibleLoan)}원</p>
            <p>최종 부족자금: {formatKrw(latest.loan.shortage)}원</p>
            <ul>
              {latest.docs.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
            <p className="note">{latest.notice}</p>
          </div>
        )}
      </section>

      <section className="card grid">
        <h2>4) 지도 기반 위치별 매물 확인</h2>
        <p>
          선택 지역 <strong>{region}</strong>에서 총 <strong>{regionalMapStats.all.length}개</strong> 중 현재 예산(보유금+대출)으로
          입주 가능한 매물은 <strong>{regionalMapStats.remaining}개</strong>입니다.
        </p>
        <p className="note">현재 사용 가능 예산 추정: {formatKrw(availableBudget)}원</p>

        <div className="mapCanvas" role="img" aria-label="지역별 매물 지도">
          {regionalMapStats.all.map((item) => {
            const canAfford = item.price <= availableBudget;
            return (
              <div
                key={item.id}
                className={`mapPin ${canAfford ? 'ok' : 'no'}`}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                title={`${item.name} · ${item.district} · ${formatKrw(item.price)}원`}
              >
                <span>{canAfford ? '가능' : '부족'}</span>
              </div>
            );
          })}
        </div>

        <ul>
          {regionalMapStats.all.map((item) => {
            const canAfford = item.price <= availableBudget;
            return (
              <li key={`list-${item.id}`}>
                [{item.district}] {item.name} ({item.type}) - {formatKrw(item.price)}원 /{' '}
                <strong>{canAfford ? '입주 가능' : '예산 부족'}</strong>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2>5) 지역별 샘플 매물 종류</h2>
        <ul>
          {regionSamples[region].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>6) 계약 전 필수 서류 체크리스트</h2>
        <ul>
          {requiredDocs.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
