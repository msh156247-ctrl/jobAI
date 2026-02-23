'use client';

import { useMemo, useState } from 'react';

type DealType = '매매' | '전세' | '월세/전월세';

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
  const [dealType, setDealType] = useState<DealType>('전세');
  const [price, setPrice] = useState(600000000);
  const [deposit, setDeposit] = useState(100000000);
  const [monthlyRent, setMonthlyRent] = useState(800000);
  const [income, setIncome] = useState(60000000);
  const [existingDebt, setExistingDebt] = useState(10000000);

  const loanResult = useMemo(() => {
    const ltv = dealType === '매매' ? 0.7 : dealType === '전세' ? 0.8 : 0.6;
    const dti = 0.4;
    const maxByLtv = price * ltv;
    const maxByDti = income * dti * 6 - existingDebt;
    const possibleLoan = Math.max(0, Math.min(maxByLtv, maxByDti));

    return {
      ltv,
      dti,
      maxByLtv,
      maxByDti,
      possibleLoan,
      shortage: dealType === '매매' ? Math.max(0, price - deposit - possibleLoan) : Math.max(0, deposit - possibleLoan),
    };
  }, [dealType, price, deposit, income, existingDebt]);

  return (
    <main className="container">
      <header className="hero">
        <h1>한국 부동산 집찾기 전략 플래너</h1>
        <p>원하는 지역의 매매/전세/월세·전월세를 비교하고, 대출 가능 금액과 필수 서류를 한 번에 점검하세요.</p>
      </header>

      <section className="card grid">
        <h2>1) 탐색 조건</h2>
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
          거래 유형
          <select value={dealType} onChange={(e) => setDealType(e.target.value as DealType)}>
            <option>매매</option>
            <option>전세</option>
            <option>월세/전월세</option>
          </select>
        </label>

        <label>
          매물가/보증금(원)
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </label>

        <label>
          보유 현금(원)
          <input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
        </label>

        <label>
          월세(원, 월세/전월세 시 참고)
          <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
        </label>
      </section>

      <section className="card grid">
        <h2>2) 대출 가능성 빠른 계산 (참고용)</h2>
        <label>
          연소득(원)
          <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} />
        </label>
        <label>
          기존 연간 부채상환액(원)
          <input type="number" value={existingDebt} onChange={(e) => setExistingDebt(Number(e.target.value))} />
        </label>

        <ul className="result">
          <li>LTV 기준 한도: 약 {formatKrw(loanResult.maxByLtv)}원 (가정 비율 {Math.round(loanResult.ltv * 100)}%)</li>
          <li>DTI 기준 한도: 약 {formatKrw(loanResult.maxByDti)}원 (가정 비율 {Math.round(loanResult.dti * 100)}%)</li>
          <li>
            예상 대출 가능액: <strong>{formatKrw(loanResult.possibleLoan)}원</strong>
          </li>
          <li>자금 부족 예상: {formatKrw(loanResult.shortage)}원</li>
          {dealType === '월세/전월세' && <li>월세 부담: 월 {formatKrw(monthlyRent)}원 + 관리비/보증보험료 별도 고려</li>}
        </ul>
        <p className="note">※ 실제 한도는 은행별 정책, 보증기관(HUG/HF/SGI), 신용점수, 주택 유형, 규제지역 여부에 따라 달라집니다.</p>
      </section>

      <section className="card">
        <h2>3) 지역별 샘플 매물 종류</h2>
        <ul>
          {regionSamples[region].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>4) 계약 전 필수 서류 체크리스트</h2>
        <ul>
          {requiredDocs.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>5) 실행 전략</h2>
        <ol>
          <li>희망 지역/예산/거주기간 정의 → 매매 vs 전세 vs 월세·전월세 우선순위 확정</li>
          <li>국토부 실거래가/네이버부동산/직방/호갱노노 등에서 시세와 동일단지 최근 거래 검증</li>
          <li>등기부등본·건축물대장 확인 후 권리관계 이상 매물 제외</li>
          <li>대출 사전심사(2~3개 금융사)로 한도/금리 비교 후 협상</li>
          <li>계약서 특약(하자보수, 대출불가 시 해제, 잔금일 인도조건) 명시</li>
        </ol>
      </section>
    </main>
  );
}
