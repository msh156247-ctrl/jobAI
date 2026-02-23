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

const regionSamples: Record<string, string[]> = {
  서울: ['강남구 아파트', '노원구 빌라', '마포구 오피스텔'],
  경기: ['성남시 아파트', '수원시 빌라', '고양시 다세대'],
  인천: ['연수구 아파트', '부평구 빌라', '서구 오피스텔'],
  부산: ['해운대구 아파트', '수영구 빌라', '동래구 다세대'],
};

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

      <section className="card">
        <h2>4) 지역별 샘플 매물 종류</h2>
        <ul>
          {regionSamples[region].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>5) 계약 전 필수 서류 체크리스트</h2>
        <ul>
          {requiredDocs.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
