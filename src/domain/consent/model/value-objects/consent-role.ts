/**
 * 동의 주체 역할 Value Object
 *
 * 만 14세 기준 동의 분기:
 * - 14세 미만: 보호자 동의만 필요 (GUARDIAN)
 * - 14세 이상: 보호자 동의 + 아동 본인 동의 모두 필요 (GUARDIAN + CHILD)
 */
export enum ConsentRole {
  /** 아동 본인 동의 (14세 이상 필수) */
  CHILD = 'CHILD',
  /** 보호자 동의 (모든 아동 필수) */
  GUARDIAN = 'GUARDIAN',
}

/**
 * 유효한 보호자 관계 목록
 */
export const VALID_GUARDIAN_RELATIONS = ['부모', '시설담당자', '기타'] as const;

export type GuardianRelation = (typeof VALID_GUARDIAN_RELATIONS)[number];

/**
 * 보호자 관계가 유효한지 확인
 */
export function isValidGuardianRelation(relation: string): relation is GuardianRelation {
  return VALID_GUARDIAN_RELATIONS.includes(relation as GuardianRelation);
}
