/**
 * 상담의뢰지 관련 Enum Value Objects
 */

/**
 * 상담의뢰 상태
 */
export enum CounselRequestStatus {
  PENDING = 'PENDING', // 접수 대기
  RECOMMENDED = 'RECOMMENDED', // AI 추천 완료
  MATCHED = 'MATCHED', // 기관 선택 완료
  IN_PROGRESS = 'IN_PROGRESS', // 상담 진행 중
  COMPLETED = 'COMPLETED', // 상담 완료
  REJECTED = 'REJECTED', // 매칭 거부
}

/**
 * 센터 이용 기준
 */
export enum CareType {
  PRIORITY = 'PRIORITY', // 우선돌봄 아동
  GENERAL = 'GENERAL', // 일반 아동
  SPECIAL = 'SPECIAL', // 돌봄 특례 아동
}

/**
 * 우선돌봄 세부 사유
 */
export enum PriorityReason {
  BASIC_LIVELIHOOD = 'BASIC_LIVELIHOOD', // 기초생활보장 수급권자
  LOW_INCOME = 'LOW_INCOME', // 차상위계층 가구의 아동
  MEDICAL_AID = 'MEDICAL_AID', // 의료급여 수급권자
  DISABILITY = 'DISABILITY', // 장애가구의 아동 또는 장애 아동
  MULTICULTURAL = 'MULTICULTURAL', // 다문화가족의 아동
  SINGLE_PARENT = 'SINGLE_PARENT', // 한부모가족의 아동
  GRANDPARENT = 'GRANDPARENT', // 조손가구의 아동
  EDUCATION_SUPPORT = 'EDUCATION_SUPPORT', // 초중고 교육비 지원 대상 아동
  MULTI_CHILD = 'MULTI_CHILD', // 자녀가 2명 이상인 가구의 아동
}

/**
 * 성별
 */
export enum Gender {
  MALE = 'MALE', // 남
  FEMALE = 'FEMALE', // 여
}

/**
 * 보호자 동의 상태
 */
export enum ConsentStatus {
  AGREED = 'AGREED', // 동의
  DISAGREED = 'DISAGREED', // 미동의
}
