/**
 * 보호자 유형 Enum
 * - PARENT: 부모
 * - CARE_FACILITY_TEACHER: 양육시설 선생님
 * - COMMUNITY_CENTER_TEACHER: 지역아동센터 선생님
 */
export enum GuardianType {
  /** 부모 */
  PARENT = 'PARENT',

  /** 양육시설 선생님 */
  CARE_FACILITY_TEACHER = 'CARE_FACILITY_TEACHER',

  /** 지역아동센터 선생님 */
  COMMUNITY_CENTER_TEACHER = 'COMMUNITY_CENTER_TEACHER',
}

/**
 * 기관 소속 여부가 필요한 보호자 유형
 */
export const INSTITUTION_REQUIRED_GUARDIAN_TYPES: GuardianType[] = [
  GuardianType.CARE_FACILITY_TEACHER,
  GuardianType.COMMUNITY_CENTER_TEACHER,
];

/**
 * 보호자 유형이 기관 소속을 필요로 하는지 확인
 */
export function requiresInstitution(guardianType: GuardianType): boolean {
  return INSTITUTION_REQUIRED_GUARDIAN_TYPES.includes(guardianType);
}
