import * as bcrypt from 'bcrypt';

/**
 * 지역아동센터 테스트 픽스처
 */

export const TEST_PASSWORD = 'Test1234!';
export const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

/**
 * 기본 지역아동센터 데이터
 */
export const communityChildCenterFixtures = {
  /**
   * 활성 지역아동센터 (기본)
   */
  active: {
    id: 'community-center-test-uuid-001',
    name: '테스트 지역아동센터',
    district: '서초구',
    region: '강남권',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: true,
    address: '서울특별시 서초구 테스트로 456',
    addressDetail: '2층',
    postalCode: '06789',
    directorName: '김철수',
    managerName: '이영희',
    managerPhone: '010-1111-2222',
    phoneNumber: '02-9876-5432',
    email: 'test@community.kr',
    expectedChildCount: 30,
    capacity: 40,
    establishedDate: new Date('2015-03-15'),
    introduction: '테스트용 지역아동센터입니다.',
    operatingHours: '평일 14:00-19:00',
    isActive: true,
  },

  /**
   * 비밀번호 미변경 지역아동센터
   */
  passwordNotChanged: {
    id: 'community-center-pwd-notchanged-001',
    name: '비밀번호 미변경 센터',
    district: '강남구',
    region: '강남권',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: false,
    address: '서울특별시 강남구 테스트로 789',
    addressDetail: null,
    postalCode: '06111',
    directorName: '박영수',
    managerName: null,
    managerPhone: null,
    phoneNumber: '02-3333-4444',
    email: null,
    expectedChildCount: 20,
    capacity: 30,
    establishedDate: new Date('2018-07-01'),
    introduction: null,
    operatingHours: null,
    isActive: true,
  },

  /**
   * 비활성 지역아동센터
   */
  inactive: {
    id: 'community-center-inactive-001',
    name: '비활성 지역아동센터',
    district: '서초구',
    region: '강남권',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: false,
    address: '서울특별시 서초구 비활성로 222',
    addressDetail: null,
    postalCode: null,
    directorName: '비활성센터장',
    managerName: null,
    managerPhone: null,
    phoneNumber: '02-1111-1111',
    email: null,
    expectedChildCount: null,
    capacity: null,
    establishedDate: null,
    introduction: null,
    operatingHours: null,
    isActive: false,
  },

  /**
   * 다른 구/군 지역아동센터
   */
  otherDistrict: {
    id: 'community-center-other-district-001',
    name: '영도구 지역아동센터',
    district: '영도구',
    region: '원도심권',
    password: TEST_PASSWORD_HASH,
    isPasswordChanged: true,
    address: '부산광역시 영도구 테스트로 123',
    addressDetail: '1층',
    postalCode: '49111',
    directorName: '최민수',
    managerName: '강지영',
    managerPhone: '010-5555-6666',
    phoneNumber: '051-1234-5678',
    email: 'yeongdo@community.kr',
    expectedChildCount: 25,
    capacity: 35,
    establishedDate: new Date('2016-09-01'),
    introduction: '영도구 지역아동센터입니다.',
    operatingHours: '평일 13:00-18:00',
    isActive: true,
  },
};

/**
 * 로그인 DTO 픽스처
 */
export const communityLoginDtoFixtures = {
  validCommunityCenter: {
    facilityId: 'community-center-test-uuid-001',
    facilityType: 'COMMUNITY_CENTER' as const,
    password: TEST_PASSWORD,
  },

  wrongPassword: {
    facilityId: 'community-center-test-uuid-001',
    facilityType: 'COMMUNITY_CENTER' as const,
    password: 'WrongPassword123!',
  },

  nonExistentCenter: {
    facilityId: 'non-existent-center-id',
    facilityType: 'COMMUNITY_CENTER' as const,
    password: TEST_PASSWORD,
  },

  inactiveCenter: {
    facilityId: 'community-center-inactive-001',
    facilityType: 'COMMUNITY_CENTER' as const,
    password: TEST_PASSWORD,
  },
};

/**
 * 비밀번호 변경 DTO 픽스처
 */
export const communityChangePasswordDtoFixtures = {
  valid: {
    facilityId: 'community-center-test-uuid-001',
    facilityType: 'COMMUNITY_CENTER' as const,
    currentPassword: TEST_PASSWORD,
    newPassword: 'NewPassword123!',
  },

  wrongCurrentPassword: {
    facilityId: 'community-center-test-uuid-001',
    facilityType: 'COMMUNITY_CENTER' as const,
    currentPassword: 'WrongPassword123!',
    newPassword: 'NewPassword123!',
  },
};

/**
 * 시설 목록 조회 쿼리 픽스처
 */
export const facilityQueryFixtures = {
  byDistrict: {
    district: '서초구',
  },

  byDistrictAndType: {
    district: '강남구',
    facilityType: 'COMMUNITY_CENTER',
  },

  emptyDistrict: {
    district: '',
  },

  nonExistentDistrict: {
    district: '존재하지않는구',
  },
};
