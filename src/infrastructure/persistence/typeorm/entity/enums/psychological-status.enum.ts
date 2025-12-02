/**
 * 아동 심리 상태 Enum
 * - NORMAL: 일반 (정상 상태)
 * - AT_RISK: 위험 (관심 필요)
 * - HIGH_RISK: 고위험 (즉시 개입 필요)
 */
export enum PsychologicalStatus {
  /** 일반 상태 - 정상적인 대화 패턴 */
  NORMAL = 'NORMAL',

  /** 위험 상태 - 심리적 불안정 징후 감지 */
  AT_RISK = 'AT_RISK',

  /** 고위험 상태 - 즉각적인 전문 상담 필요 */
  HIGH_RISK = 'HIGH_RISK',
}

/**
 * 심리 상태별 우선순위 (숫자가 높을수록 심각)
 */
export const PSYCHOLOGICAL_STATUS_PRIORITY: Record<PsychologicalStatus, number> = {
  [PsychologicalStatus.NORMAL]: 0,
  [PsychologicalStatus.AT_RISK]: 1,
  [PsychologicalStatus.HIGH_RISK]: 2,
};

/**
 * 심리 상태 레이블 (한글)
 */
export const PSYCHOLOGICAL_STATUS_LABELS: Record<PsychologicalStatus, string> = {
  [PsychologicalStatus.NORMAL]: '일반',
  [PsychologicalStatus.AT_RISK]: '위험',
  [PsychologicalStatus.HIGH_RISK]: '고위험',
};

/**
 * 심리 상태 우선순위 비교
 * @returns 양수: a가 더 심각, 음수: b가 더 심각, 0: 동일
 */
export function comparePsychologicalStatus(a: PsychologicalStatus, b: PsychologicalStatus): number {
  return PSYCHOLOGICAL_STATUS_PRIORITY[a] - PSYCHOLOGICAL_STATUS_PRIORITY[b];
}

/**
 * 주어진 상태가 위험 수준 이상인지 확인
 */
export function isAtRiskOrHigher(status: PsychologicalStatus): boolean {
  return (
    PSYCHOLOGICAL_STATUS_PRIORITY[status] >=
    PSYCHOLOGICAL_STATUS_PRIORITY[PsychologicalStatus.AT_RISK]
  );
}

/**
 * 주어진 상태가 고위험 수준인지 확인
 */
export function isHighRisk(status: PsychologicalStatus): boolean {
  return status === PsychologicalStatus.HIGH_RISK;
}
