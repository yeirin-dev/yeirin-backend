import { ChildType } from '../../src/infrastructure/persistence/typeorm/entity/enums/child-type.enum';
import { PsychologicalStatus } from '../../src/infrastructure/persistence/typeorm/entity/enums/psychological-status.enum';

/**
 * 아동 프로필 테스트 픽스처
 */

/**
 * 양육시설 아동 데이터
 */
export const careFacilityChildFixtures = {
  /**
   * 일반 상태 아동 (14세 미만)
   */
  normalUnder14: {
    id: 'child-cf-001',
    childType: ChildType.CARE_FACILITY,
    name: '양육시설아동1',
    birthDate: new Date('2015-03-15'), // 약 9세
    gender: 'MALE' as const,
    careFacilityId: 'care-facility-test-uuid-001',
    communityChildCenterId: null,
    medicalInfo: null,
    specialNeeds: null,
    psychologicalStatus: PsychologicalStatus.NORMAL,
  },

  /**
   * 위험 상태 아동 (14세 이상)
   */
  atRiskOver14: {
    id: 'child-cf-002',
    childType: ChildType.CARE_FACILITY,
    name: '양육시설아동2',
    birthDate: new Date('2010-07-20'), // 약 14세
    gender: 'FEMALE' as const,
    careFacilityId: 'care-facility-test-uuid-001',
    communityChildCenterId: null,
    medicalInfo: '알러지: 땅콩',
    specialNeeds: 'ADHD 진단',
    psychologicalStatus: PsychologicalStatus.AT_RISK,
  },

  /**
   * 고위험 상태 아동
   */
  highRisk: {
    id: 'child-cf-003',
    childType: ChildType.CARE_FACILITY,
    name: '양육시설아동3',
    birthDate: new Date('2008-11-10'), // 약 16세
    gender: 'MALE' as const,
    careFacilityId: 'care-facility-test-uuid-001',
    communityChildCenterId: null,
    medicalInfo: null,
    specialNeeds: '상담 우선 대상',
    psychologicalStatus: PsychologicalStatus.HIGH_RISK,
  },
};

/**
 * 지역아동센터 아동 데이터
 */
export const communityCenterChildFixtures = {
  /**
   * 일반 상태 아동
   */
  normal1: {
    id: 'child-cc-001',
    childType: ChildType.COMMUNITY_CENTER,
    name: '센터아동1',
    birthDate: new Date('2014-05-25'), // 약 10세
    gender: 'FEMALE' as const,
    careFacilityId: null,
    communityChildCenterId: 'community-center-test-uuid-001',
    medicalInfo: null,
    specialNeeds: null,
    psychologicalStatus: PsychologicalStatus.NORMAL,
  },

  /**
   * 일반 상태 아동 2
   */
  normal2: {
    id: 'child-cc-002',
    childType: ChildType.COMMUNITY_CENTER,
    name: '센터아동2',
    birthDate: new Date('2013-09-12'), // 약 11세
    gender: 'MALE' as const,
    careFacilityId: null,
    communityChildCenterId: 'community-center-test-uuid-001',
    medicalInfo: null,
    specialNeeds: null,
    psychologicalStatus: PsychologicalStatus.NORMAL,
  },

  /**
   * 위험 상태 아동 (14세 이상)
   */
  atRiskOver14: {
    id: 'child-cc-003',
    childType: ChildType.COMMUNITY_CENTER,
    name: '센터아동3',
    birthDate: new Date('2009-01-30'), // 약 15세
    gender: 'FEMALE' as const,
    careFacilityId: null,
    communityChildCenterId: 'community-center-test-uuid-001',
    medicalInfo: null,
    specialNeeds: '학교 적응 문제',
    psychologicalStatus: PsychologicalStatus.AT_RISK,
  },
};

/**
 * 다른 시설 아동 (접근 제어 테스트용)
 */
export const otherFacilityChildFixtures = {
  otherCareFacility: {
    id: 'child-other-cf-001',
    childType: ChildType.CARE_FACILITY,
    name: '다른시설아동',
    birthDate: new Date('2016-02-28'),
    gender: 'MALE' as const,
    careFacilityId: 'care-facility-other-uuid-002',
    communityChildCenterId: null,
    medicalInfo: null,
    specialNeeds: null,
    psychologicalStatus: PsychologicalStatus.NORMAL,
  },

  otherCommunityCenter: {
    id: 'child-other-cc-001',
    childType: ChildType.COMMUNITY_CENTER,
    name: '다른센터아동',
    birthDate: new Date('2015-08-15'),
    gender: 'FEMALE' as const,
    careFacilityId: null,
    communityChildCenterId: 'community-center-other-uuid-002',
    medicalInfo: null,
    specialNeeds: null,
    psychologicalStatus: PsychologicalStatus.NORMAL,
  },
};

/**
 * 아동 등록 DTO 픽스처
 */
export const createChildDtoFixtures = {
  /**
   * 유효한 양육시설 아동 등록
   */
  validCareFacility: {
    childType: ChildType.CARE_FACILITY,
    name: '신규아동',
    birthDate: '2015-06-15',
    gender: 'MALE',
    medicalInfo: null,
    specialNeeds: null,
  },

  /**
   * 유효한 지역아동센터 아동 등록
   */
  validCommunityCenter: {
    childType: ChildType.COMMUNITY_CENTER,
    name: '신규센터아동',
    birthDate: '2014-03-20',
    gender: 'FEMALE',
    medicalInfo: '천식',
    specialNeeds: null,
  },

  /**
   * 필수 필드 누락
   */
  missingRequired: {
    childType: ChildType.CARE_FACILITY,
    // name 누락
    birthDate: '2015-06-15',
    gender: 'MALE',
  },

  /**
   * 잘못된 생년월일 형식
   */
  invalidBirthDate: {
    childType: ChildType.CARE_FACILITY,
    name: '신규아동',
    birthDate: 'invalid-date',
    gender: 'MALE',
  },

  /**
   * 잘못된 성별
   */
  invalidGender: {
    childType: ChildType.CARE_FACILITY,
    name: '신규아동',
    birthDate: '2015-06-15',
    gender: 'INVALID',
  },
};

/**
 * 아동 수정 DTO 픽스처
 */
export const updateChildDtoFixtures = {
  /**
   * 이름만 수정
   */
  updateName: {
    name: '수정된이름',
  },

  /**
   * 의료정보 수정
   */
  updateMedicalInfo: {
    medicalInfo: '알러지: 계란, 우유',
    specialNeeds: '식이조절 필요',
  },

  /**
   * 전체 수정
   */
  updateAll: {
    name: '완전수정아동',
    birthDate: '2014-12-25',
    gender: 'OTHER',
    medicalInfo: '수정된 의료정보',
    specialNeeds: '수정된 특수요구사항',
  },
};

/**
 * 아동 목록 조회 쿼리 픽스처
 */
export const childQueryFixtures = {
  defaultPagination: {
    page: 1,
    limit: 10,
  },

  secondPage: {
    page: 2,
    limit: 5,
  },

  filterByStatus: {
    page: 1,
    limit: 10,
    psychologicalStatus: PsychologicalStatus.AT_RISK,
  },

  filterByGender: {
    page: 1,
    limit: 10,
    gender: 'MALE',
  },
};

/**
 * 아동 나이 계산 헬퍼
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * 14세 이상 여부 확인
 */
export function isOver14(birthDate: Date): boolean {
  return calculateAge(birthDate) >= 14;
}
