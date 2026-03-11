import { NextResponse } from 'next/server';

type DealType = '매매' | '전세' | '월세/전월세';
type Purpose = '실거주' | '투자' | '신혼부부/가족이주' | '직주근접';
type MaritalStatus = '미혼' | '기혼' | '예비부부';

interface RequestBody {
  applicant: {
    age: number;
    maritalStatus: MaritalStatus;
    purpose: Purpose;
    annualIncome: number;
    existingDebt: number;
  };
  finance: {
    currentFunds: number;
  };
  property: {
    region: string;
    propertyType: string;
    dealType: DealType;
    targetPrice: number;
    monthlyRent: number;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function POST(req: Request) {
  const body = (await req.json()) as RequestBody;

  const { applicant, finance, property } = body;

  const ageAdj = applicant.age <= 34 ? 0.05 : applicant.age >= 55 ? -0.05 : 0;
  const maritalAdj = applicant.maritalStatus === '예비부부' || applicant.maritalStatus === '기혼' ? 0.03 : 0;
  const purposeAdj = applicant.purpose === '실거주' || applicant.purpose === '신혼부부/가족이주' ? 0.04 : -0.02;

  const baseLtv = property.dealType === '매매' ? 0.7 : property.dealType === '전세' ? 0.8 : 0.6;
  const baseDti = 0.4;

  const ltv = clamp(baseLtv + ageAdj + maritalAdj + purposeAdj, 0.45, 0.9);
  const dti = clamp(baseDti + (purposeAdj > 0 ? 0.03 : -0.02), 0.3, 0.5);

  const maxByLtv = property.targetPrice * ltv;
  const maxByDti = applicant.annualIncome * dti * 6 - applicant.existingDebt;
  const possibleLoan = Math.max(0, Math.min(maxByLtv, maxByDti));

  const requiredTotal = property.targetPrice;
  const availableTotal = finance.currentFunds + possibleLoan;

  const interestFloor = clamp(3.2 + (purposeAdj > 0 ? -0.2 : 0.15), 2.8, 5.2);
  const interestCeil = clamp(interestFloor + 1.4, 4.0, 6.8);

  const documentTips = [
    '등기부등본(갑구/을구) 최신 발급본으로 권리관계 확인',
    '건축물대장/토지대장으로 위반건축물·대지권 확인',
    '전입세대열람 및 확정일자 현황으로 선순위 임차인 확인',
    '대출 사전심사 결과서(금리/한도/DSR) 2~3개 은행 비교',
  ];

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    market: {
      region: property.region,
      propertyType: property.propertyType,
      dealType: property.dealType,
      targetPrice: property.targetPrice,
      monthlyRent: property.monthlyRent,
    },
    applicantSummary: {
      age: applicant.age,
      maritalStatus: applicant.maritalStatus,
      purpose: applicant.purpose,
    },
    loan: {
      ltv,
      dti,
      interestRateRange: {
        min: Number(interestFloor.toFixed(2)),
        max: Number(interestCeil.toFixed(2)),
      },
      maxByLtv,
      maxByDti,
      possibleLoan,
      requiredTotal,
      availableTotal,
      shortage: Math.max(0, requiredTotal - availableTotal),
    },
    docs: documentTips,
    notice:
      '본 결과는 참고용 추정치입니다. 실제 대출 가능액은 금융사 심사, 신용점수, 규제지역, 보증기관 정책에 따라 달라질 수 있습니다.',
  });
}
