/**
 * 아동 유형 Enum
 * - CARE_FACILITY: 양육시설 아동 (고아)
 * - COMMUNITY_CENTER: 지역아동센터 아동 (비고아, 부모+센터)
 * - EDUCATION_WELFARE_SCHOOL: 교육복지사협회 학교 아동
 * - REGULAR: 일반 아동 (부모 직접보호)
 */
export enum ChildType {
  /** 양육시설 아동 (고아) - 양육시설만 연결 */
  CARE_FACILITY = 'CARE_FACILITY',

  /** 지역아동센터 아동 (비고아) - 지역아동센터 + 부모 연결 */
  COMMUNITY_CENTER = 'COMMUNITY_CENTER',

  /** 교육복지사협회 학교 아동 - 학교 + 부모 연결 */
  EDUCATION_WELFARE_SCHOOL = 'EDUCATION_WELFARE_SCHOOL',

  /** 일반 아동 - 부모만 연결 (직접보호) */
  REGULAR = 'REGULAR',
}

/**
 * 기관 소속이 필요한 아동 유형
 */
export const INSTITUTION_REQUIRED_CHILD_TYPES: ChildType[] = [
  ChildType.CARE_FACILITY,
  ChildType.COMMUNITY_CENTER,
  ChildType.EDUCATION_WELFARE_SCHOOL,
];

/**
 * 부모(보호자) 연결이 필요한 아동 유형
 */
export const GUARDIAN_REQUIRED_CHILD_TYPES: ChildType[] = [
  ChildType.COMMUNITY_CENTER,
  ChildType.EDUCATION_WELFARE_SCHOOL,
  ChildType.REGULAR,
];

/**
 * 아동 유형이 기관 소속을 필요로 하는지 확인
 */
export function requiresInstitution(childType: ChildType): boolean {
  return INSTITUTION_REQUIRED_CHILD_TYPES.includes(childType);
}

/**
 * 아동 유형이 부모(보호자) 연결을 필요로 하는지 확인
 */
export function requiresGuardian(childType: ChildType): boolean {
  return GUARDIAN_REQUIRED_CHILD_TYPES.includes(childType);
}

/**
 * 아동 유형이 고아인지 확인
 */
export function isOrphanType(childType: ChildType): boolean {
  return childType === ChildType.CARE_FACILITY;
}
