import {
  CounselRequestStatus,
  CareType,
  Gender,
} from '../../src/domain/counsel-request/model/value-objects/counsel-request-enums';

/**
 * 상담의뢰지 테스트 픽스처
 */

/**
 * 상태별 상담의뢰지 데이터
 */
export const counselRequestFixtures = {
  /**
   * PENDING 상태 (접수 대기)
   */
  pending: {
    id: 'counsel-req-pending-001',
    childId: 'child-cf-001',
    status: CounselRequestStatus.PENDING,
    formData: createDefaultFormData('양육시설아동1'),
    centerName: '테스트 양육시설',
    careType: CareType.PRIORITY,
    requestDate: new Date(),
    matchedInstitutionId: null,
    matchedCounselorId: null,
    integratedReportS3Key: null,
    integratedReportStatus: null,
  },

  /**
   * RECOMMENDED 상태 (AI 추천 완료)
   */
  recommended: {
    id: 'counsel-req-recommended-001',
    childId: 'child-cf-002',
    status: CounselRequestStatus.RECOMMENDED,
    formData: createDefaultFormData('양육시설아동2'),
    centerName: '테스트 양육시설',
    careType: CareType.GENERAL,
    requestDate: new Date(),
    matchedInstitutionId: null,
    matchedCounselorId: null,
    integratedReportS3Key: null,
    integratedReportStatus: null,
  },

  /**
   * MATCHED 상태 (기관 선택 완료)
   */
  matched: {
    id: 'counsel-req-matched-001',
    childId: 'child-cc-001',
    status: CounselRequestStatus.MATCHED,
    formData: createDefaultFormData('센터아동1'),
    centerName: '테스트 지역아동센터',
    careType: CareType.PRIORITY,
    requestDate: new Date(),
    matchedInstitutionId: 'mock-institution-uuid-001',
    matchedCounselorId: null,
    integratedReportS3Key: null,
    integratedReportStatus: null,
  },

  /**
   * IN_PROGRESS 상태 (상담 진행 중)
   */
  inProgress: {
    id: 'counsel-req-inprogress-001',
    childId: 'child-cc-002',
    status: CounselRequestStatus.IN_PROGRESS,
    formData: createDefaultFormData('센터아동2'),
    centerName: '테스트 지역아동센터',
    careType: CareType.GENERAL,
    requestDate: new Date(),
    matchedInstitutionId: 'mock-institution-uuid-001',
    matchedCounselorId: 'mock-counselor-uuid-001',
    integratedReportS3Key: null,
    integratedReportStatus: null,
  },

  /**
   * COMPLETED 상태 (상담 완료)
   */
  completed: {
    id: 'counsel-req-completed-001',
    childId: 'child-cc-003',
    status: CounselRequestStatus.COMPLETED,
    formData: createDefaultFormData('센터아동3'),
    centerName: '테스트 지역아동센터',
    careType: CareType.SPECIAL,
    requestDate: new Date(),
    matchedInstitutionId: 'mock-institution-uuid-001',
    matchedCounselorId: 'mock-counselor-uuid-001',
    integratedReportS3Key: 'reports/integrated/completed-001.pdf',
    integratedReportStatus: 'completed' as const,
  },

  /**
   * REJECTED 상태 (매칭 거부)
   */
  rejected: {
    id: 'counsel-req-rejected-001',
    childId: 'child-cf-003',
    status: CounselRequestStatus.REJECTED,
    formData: createDefaultFormData('양육시설아동3'),
    centerName: '테스트 양육시설',
    careType: CareType.PRIORITY,
    requestDate: new Date(),
    matchedInstitutionId: null,
    matchedCounselorId: null,
    integratedReportS3Key: null,
    integratedReportStatus: null,
  },
};

/**
 * 다른 시설의 상담의뢰지 (접근 제어 테스트용)
 */
export const otherFacilityCounselRequestFixtures = {
  pending: {
    id: 'counsel-req-other-001',
    childId: 'child-other-cf-001',
    status: CounselRequestStatus.PENDING,
    formData: createDefaultFormData('다른시설아동'),
    centerName: '다른 양육시설',
    careType: CareType.GENERAL,
    requestDate: new Date(),
    matchedInstitutionId: null,
    matchedCounselorId: null,
  },
};

/**
 * 상담의뢰지 생성 DTO 픽스처
 */
export const createCounselRequestDtoFixtures = {
  /**
   * 유효한 상담의뢰지 생성
   */
  valid: {
    childId: 'child-cf-001',
    formData: createDefaultFormData('양육시설아동1'),
    centerName: '테스트 양육시설',
    careType: CareType.PRIORITY,
    requestDate: new Date().toISOString().split('T')[0],
  },

  /**
   * 필수 필드 누락
   */
  missingRequired: {
    childId: 'child-cf-001',
    // formData 누락
    centerName: '테스트 양육시설',
  },

  /**
   * 존재하지 않는 아동
   */
  nonExistentChild: {
    childId: 'non-existent-child-id',
    formData: createDefaultFormData('존재하지않는아동'),
    centerName: '테스트 양육시설',
    careType: CareType.GENERAL,
    requestDate: new Date().toISOString().split('T')[0],
  },

  /**
   * 다른 시설 아동으로 생성 시도
   */
  otherFacilityChild: {
    childId: 'child-other-cf-001',
    formData: createDefaultFormData('다른시설아동'),
    centerName: '테스트 양육시설',
    careType: CareType.GENERAL,
    requestDate: new Date().toISOString().split('T')[0],
  },
};

/**
 * 상담의뢰지 수정 DTO 픽스처
 */
export const updateCounselRequestDtoFixtures = {
  /**
   * formData 수정
   */
  updateFormData: {
    formData: {
      ...createDefaultFormData('양육시설아동1'),
      counselingNeeds: '수정된 상담 필요 사항',
    },
  },

  /**
   * careType 수정
   */
  updateCareType: {
    careType: CareType.SPECIAL,
  },
};

/**
 * 기관 선택 DTO 픽스처
 */
export const selectInstitutionDtoFixtures = {
  valid: {
    institutionId: 'mock-institution-uuid-001',
  },

  nonExistent: {
    institutionId: 'non-existent-institution-id',
  },
};

/**
 * 상담의뢰지 목록 조회 쿼리 픽스처
 */
export const counselRequestQueryFixtures = {
  defaultPagination: {
    page: 1,
    limit: 10,
  },

  filterByStatus: {
    page: 1,
    limit: 10,
    status: CounselRequestStatus.PENDING,
  },

  filterByMultipleStatus: {
    page: 1,
    limit: 10,
    status: [CounselRequestStatus.PENDING, CounselRequestStatus.RECOMMENDED],
  },

  sortByCreatedAt: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC' as const,
  },
};

/**
 * AI 추천 응답 Mock 데이터
 */
export const aiRecommendationMockFixtures = {
  success: {
    recommendations: [
      {
        institutionId: 'institution-uuid-001',
        institutionName: '추천기관1',
        score: 95,
        matchReasons: ['전문분야 일치', '지역 접근성 우수', '평점 높음'],
      },
      {
        institutionId: 'institution-uuid-002',
        institutionName: '추천기관2',
        score: 88,
        matchReasons: ['전문분야 일치', '경력 우수'],
      },
      {
        institutionId: 'institution-uuid-003',
        institutionName: '추천기관3',
        score: 82,
        matchReasons: ['지역 접근성 우수'],
      },
    ],
  },

  empty: {
    recommendations: [],
  },

  error: {
    statusCode: 500,
    message: 'AI 추천 서비스 오류',
  },
};

/**
 * 기본 formData 생성 헬퍼
 */
function createDefaultFormData(childName: string) {
  return {
    // 기본 정보
    childName,
    birthDate: '2015-03-15',
    gender: Gender.MALE,

    // 상담 의뢰 내용
    counselingNeeds: '학교생활 적응 어려움, 또래 관계 문제',
    currentSymptoms: '불안, 우울감, 집중력 저하',
    familyBackground: '한부모 가정, 형제 없음',

    // 발달 정보
    developmentalHistory: '정상 발달, 특이사항 없음',
    educationStatus: '초등학교 3학년 재학 중',

    // 이전 상담 경험
    previousCounseling: false,
    previousCounselingDetails: null,

    // 추가 정보
    additionalNotes: '테스트 추가 메모',
    urgencyLevel: 'MEDIUM',

    // 동의 정보
    consentStatus: 'AGREED',
  };
}

/**
 * 상태 전이 유효성 검증 헬퍼
 */
export const validStatusTransitions: Record<CounselRequestStatus, CounselRequestStatus[]> = {
  [CounselRequestStatus.PENDING]: [CounselRequestStatus.RECOMMENDED],
  [CounselRequestStatus.RECOMMENDED]: [CounselRequestStatus.MATCHED, CounselRequestStatus.REJECTED],
  [CounselRequestStatus.MATCHED]: [CounselRequestStatus.IN_PROGRESS, CounselRequestStatus.REJECTED],
  [CounselRequestStatus.IN_PROGRESS]: [CounselRequestStatus.COMPLETED],
  [CounselRequestStatus.COMPLETED]: [],
  [CounselRequestStatus.REJECTED]: [],
};

/**
 * 상태 전이 유효성 검증 함수
 */
export function isValidStatusTransition(
  from: CounselRequestStatus,
  to: CounselRequestStatus,
): boolean {
  return validStatusTransitions[from]?.includes(to) ?? false;
}
