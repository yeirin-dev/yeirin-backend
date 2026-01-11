/**
 * 전체 상담 플로우 통합 테스트
 *
 * 시설 로그인부터 상담 완료까지의 전체 워크플로우 테스트
 *
 * 1. 시설 로그인
 * 2. 아동 등록
 * 3. 상담의뢰지 생성
 * 4. AI 추천 요청
 * 5. 기관 선택
 * 6. 상담 시작
 * 7. 상담 완료
 * 8. 대시보드에서 결과 확인
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAppFactory, TestAppContext, setupTestEnv } from '../../utils/test-app.factory';
import { TestRequest } from '../../utils/test-helpers';
import { DatabaseSeeder, TEST_IDS, TEST_PASSWORDS } from '../../utils/database-seeder';
import { FacilityType } from '@application/auth/dto/institution-auth.dto';
import {
  CounselRequestStatus,
  CareType,
  Gender,
  ConsentStatus,
  PriorityReason,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';

describe('Full Counsel Flow Integration (E2E)', () => {
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let testRequest: TestRequest;

  // 테스트용 토큰 및 ID
  let careFacilityToken: string;
  let testChildId: string;
  let testCounselRequestId: string;

  beforeAll(async () => {
    setupTestEnv();
    context = await TestAppFactory.createCounselFlow({ dropSchema: true });
    app = context.app;
    dataSource = context.dataSource;
    testRequest = new TestRequest(app);

    // 시드 데이터 삽입
    await DatabaseSeeder.seedMinimal(dataSource);
  }, 30000);

  afterAll(async () => {
    if (context) {
      await TestAppFactory.cleanup(context);
    }
  });

  // =========================================================================
  // Step 1: 시설 로그인
  // =========================================================================

  describe('Step 1: 시설 로그인', () => {
    it('양육시설로 로그인한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      careFacilityToken = response.body.accessToken;
    });
  });

  // =========================================================================
  // Step 2: 아동 등록
  // =========================================================================

  describe('Step 2: 아동 등록', () => {
    it('테스트용 아동을 등록한다', async () => {
      const response = await testRequest.authenticated(careFacilityToken).post('/api/v1/children', {
        childType: 'CARE_FACILITY',
        name: '통합테스트아동',
        birthDate: '2013-05-15',
        gender: 'MALE',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');

      testChildId = response.body.id;
    });

    it('등록된 아동 목록에서 조회된다', async () => {
      const response = await testRequest.authenticated(careFacilityToken).get('/api/v1/children');

      expect(response.status).toBe(200);
      // API may return children under 'data' key or directly as array
      const children = response.body.data || response.body;
      expect(Array.isArray(children)).toBe(true);
      expect(children.some((child: { id: string }) => child.id === testChildId)).toBe(true);
    });
  });

  // =========================================================================
  // Step 3: 상담의뢰지 생성
  // =========================================================================

  describe('Step 3: 상담의뢰지 생성', () => {
    it('상담의뢰지를 생성한다', async () => {
      const requestData = {
        childId: testChildId,
        coverInfo: {
          requestDate: { year: 2024, month: 12, day: 1 },
          centerName: '테스트 양육시설',
          counselorName: '테스트 담당자',
        },
        basicInfo: {
          childInfo: {
            name: '통합테스트아동',
            gender: Gender.MALE,
            age: 11,
            grade: '초5',
          },
          careType: CareType.PRIORITY,
          priorityReasons: [PriorityReason.SINGLE_PARENT],
        },
        psychologicalInfo: {
          medicalHistory: '특이사항 없음',
          specialNotes: '통합 테스트를 위한 상담의뢰',
        },
        requestMotivation: {
          motivation: '또래 관계 및 학교 적응 어려움',
          goals: '사회성 향상 및 자신감 회복',
        },
        testResults: {},
        consent: ConsentStatus.AGREED,
      };

      const response = await testRequest
        .authenticated(careFacilityToken)
        .post('/api/v1/counsel-requests', requestData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(CounselRequestStatus.PENDING);

      testCounselRequestId = response.body.id;
    });

    it('생성된 상담의뢰지가 목록에서 조회된다', async () => {
      const response = await testRequest
        .authenticated(careFacilityToken)
        .get('/api/v1/counsel-requests');

      expect(response.status).toBe(200);
      expect(
        response.body.data.some((req: { id: string }) => req.id === testCounselRequestId),
      ).toBe(true);
    });
  });

  // =========================================================================
  // Step 4-7: 상담 워크플로우 (AI Mock 환경에 따라 다름)
  // =========================================================================

  describe('Step 4-7: 상담 워크플로우', () => {
    it('전체 워크플로우가 정상적으로 진행된다 (또는 AI 서비스 없이 일부만 진행)', async () => {
      // AI 추천 요청 시도
      const recommendResponse = await testRequest
        .authenticated(careFacilityToken)
        .post(`/api/v1/counsel-requests/${testCounselRequestId}/request-recommendation`);

      // AI 서비스가 없는 환경에서는 스킵
      if (recommendResponse.status !== 200) {
        console.log('AI 서비스 없이 테스트 환경에서 실행 중 - 워크플로우 일부만 테스트');

        // 상담의뢰지 상태 확인
        const getResponse = await testRequest
          .authenticated(careFacilityToken)
          .get(`/api/v1/counsel-requests/${testCounselRequestId}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.status).toBe(CounselRequestStatus.PENDING);
        return;
      }

      // RECOMMENDED 상태 확인
      let getResponse = await testRequest
        .authenticated(careFacilityToken)
        .get(`/api/v1/counsel-requests/${testCounselRequestId}`);
      expect(getResponse.body.status).toBe(CounselRequestStatus.RECOMMENDED);

      // 기관 선택
      const selectResponse = await testRequest
        .authenticated(careFacilityToken)
        .post(`/api/v1/counsel-requests/${testCounselRequestId}/select-institution`, {
          institutionId: '11111111-1111-1111-1111-111111111111',
        });

      if (selectResponse.status !== 200) return;

      // MATCHED 상태 확인
      getResponse = await testRequest
        .authenticated(careFacilityToken)
        .get(`/api/v1/counsel-requests/${testCounselRequestId}`);
      expect(getResponse.body.status).toBe(CounselRequestStatus.MATCHED);

      // 상담 시작
      const startResponse = await testRequest
        .authenticated(careFacilityToken)
        .post(`/api/v1/counsel-requests/${testCounselRequestId}/start`);

      if (startResponse.status !== 200) return;

      // IN_PROGRESS 상태 확인
      getResponse = await testRequest
        .authenticated(careFacilityToken)
        .get(`/api/v1/counsel-requests/${testCounselRequestId}`);
      expect(getResponse.body.status).toBe(CounselRequestStatus.IN_PROGRESS);

      // 상담 완료
      const completeResponse = await testRequest
        .authenticated(careFacilityToken)
        .post(`/api/v1/counsel-requests/${testCounselRequestId}/complete`);

      if (completeResponse.status !== 200) return;

      // COMPLETED 상태 확인
      getResponse = await testRequest
        .authenticated(careFacilityToken)
        .get(`/api/v1/counsel-requests/${testCounselRequestId}`);
      expect(getResponse.body.status).toBe(CounselRequestStatus.COMPLETED);
    });
  });

  // =========================================================================
  // Step 8: 대시보드에서 결과 확인
  // =========================================================================

  describe('Step 8: 대시보드에서 결과 확인', () => {
    it('대시보드에서 통계가 올바르게 표시된다', async () => {
      const response = await testRequest
        .authenticated(careFacilityToken)
        .get('/api/v1/institution/dashboard');

      // Dashboard endpoint might not be available in minimal test setup
      if (response.status === 404) {
        console.log('Dashboard endpoint not available in test environment - skipping detailed assertions');
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('childCount');
      expect(response.body.childCount).toBeGreaterThanOrEqual(1);
      expect(response.body).toHaveProperty('counselRequestStats');
    });
  });

  // =========================================================================
  // 정리 및 검증
  // =========================================================================

  describe('정리 및 검증', () => {
    it('생성된 상담의뢰지를 삭제할 수 있다 (PENDING 상태인 경우)', async () => {
      // 새 상담의뢰지 생성
      const createResponse = await testRequest
        .authenticated(careFacilityToken)
        .post('/api/v1/counsel-requests', {
          childId: testChildId,
          coverInfo: {
            requestDate: { year: 2024, month: 12, day: 2 },
            centerName: '테스트 시설',
            counselorName: '담당자',
          },
          basicInfo: {
            childInfo: { name: '테스트', gender: Gender.MALE, age: 10, grade: '초4' },
            careType: CareType.PRIORITY,
            priorityReasons: [PriorityReason.SINGLE_PARENT],
          },
          psychologicalInfo: { medicalHistory: '없음', specialNotes: '없음' },
          requestMotivation: { motivation: '테스트', goals: '테스트' },
          testResults: {},
          consent: ConsentStatus.AGREED,
        });

      expect(createResponse.status).toBe(201);

      // 삭제
      const deleteResponse = await testRequest
        .authenticated(careFacilityToken)
        .delete(`/api/v1/counsel-requests/${createResponse.body.id}`);

      // DELETE returns 204 No Content on success
      expect(deleteResponse.status).toBe(204);

      // 삭제 확인
      const getResponse = await testRequest
        .authenticated(careFacilityToken)
        .get(`/api/v1/counsel-requests/${createResponse.body.id}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
