import * as bcrypt from 'bcrypt';

/**
 * 양육시설 테스트 픽스처
 */

export const TEST_PASSWORD = 'Test1234!';
export const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

/**
 * 기본 양육시설 데이터
 */
export const careFacilityFixtures = {
  /**
   * 활성 양육시설 (기본)
   */
  active: {
    id: 'care-facility-test-uuid-001',
    name: '테스트 양육시설',
    district: '강남구',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: true,
    address: '서울특별시 강남구 테스트로 123',
    addressDetail: '1층',
    postalCode: '06123',
    representativeName: '홍길동',
    phoneNumber: '02-1234-5678',
    capacity: 50,
    establishedDate: new Date('2010-01-01'),
    introduction: '테스트용 양육시설입니다.',
    isActive: true,
  },

  /**
   * 비밀번호 미변경 양육시설
   */
  passwordNotChanged: {
    id: 'care-facility-pwd-notchanged-001',
    name: '비밀번호 미변경 양육시설',
    district: '서초구',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: false,
    address: '서울특별시 서초구 테스트로 456',
    addressDetail: null,
    postalCode: '06456',
    representativeName: '김영희',
    phoneNumber: '02-2222-3333',
    capacity: 30,
    establishedDate: new Date('2015-05-15'),
    introduction: null,
    isActive: true,
  },

  /**
   * 비활성 양육시설
   */
  inactive: {
    id: 'care-facility-inactive-001',
    name: '비활성 양육시설',
    district: '강남구',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: false,
    address: '서울특별시 강남구 비활성로 111',
    addressDetail: null,
    postalCode: null,
    representativeName: '비활성담당자',
    phoneNumber: '02-0000-0000',
    capacity: 20,
    establishedDate: new Date('2020-01-01'),
    introduction: null,
    isActive: false,
  },

  /**
   * 다른 구/군 양육시설
   */
  otherDistrict: {
    id: 'care-facility-other-district-001',
    name: '영등포 양육시설',
    district: '영등포구',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: true,
    address: '서울특별시 영등포구 테스트로 789',
    addressDetail: '2층',
    postalCode: '07789',
    representativeName: '박철수',
    phoneNumber: '02-5555-6666',
    capacity: 40,
    establishedDate: new Date('2012-06-01'),
    introduction: '영등포구 양육시설입니다.',
    isActive: true,
  },
};

/**
 * 양육시설 생성 DTO 픽스처
 */
export const createCareFacilityDtoFixtures = {
  valid: {
    name: '신규 양육시설',
    district: '마포구',
    password: TEST_PASSWORD,
    address: '서울특별시 마포구 신규로 100',
    representativeName: '신규담당자',
    phoneNumber: '02-7777-8888',
    capacity: 25,
    establishedDate: '2023-01-01',
  },

  missingRequired: {
    name: '필수 필드 누락',
    // district, password, address 등 누락
  },

  invalidDistrict: {
    name: '잘못된 구/군',
    district: '없는구',
    password: TEST_PASSWORD,
    address: '잘못된 주소',
    representativeName: '담당자',
    phoneNumber: '02-0000-0000',
    capacity: 10,
  },
};

/**
 * 로그인 DTO 픽스처
 */
export const institutionLoginDtoFixtures = {
  validCareFacility: {
    facilityId: 'care-facility-test-uuid-001',
    facilityType: 'CARE_FACILITY' as const,
    password: TEST_PASSWORD,
  },

  wrongPassword: {
    facilityId: 'care-facility-test-uuid-001',
    facilityType: 'CARE_FACILITY' as const,
    password: 'WrongPassword123!',
  },

  nonExistentFacility: {
    facilityId: 'non-existent-facility-id',
    facilityType: 'CARE_FACILITY' as const,
    password: TEST_PASSWORD,
  },

  inactiveFacility: {
    facilityId: 'care-facility-inactive-001',
    facilityType: 'CARE_FACILITY' as const,
    password: TEST_PASSWORD,
  },
};

/**
 * 비밀번호 변경 DTO 픽스처
 */
export const changePasswordDtoFixtures = {
  valid: {
    facilityId: 'care-facility-test-uuid-001',
    facilityType: 'CARE_FACILITY' as const,
    currentPassword: TEST_PASSWORD,
    newPassword: 'NewPassword123!',
  },

  wrongCurrentPassword: {
    facilityId: 'care-facility-test-uuid-001',
    facilityType: 'CARE_FACILITY' as const,
    currentPassword: 'WrongPassword123!',
    newPassword: 'NewPassword123!',
  },

  samePassword: {
    facilityId: 'care-facility-test-uuid-001',
    facilityType: 'CARE_FACILITY' as const,
    currentPassword: TEST_PASSWORD,
    newPassword: TEST_PASSWORD,
  },
};
