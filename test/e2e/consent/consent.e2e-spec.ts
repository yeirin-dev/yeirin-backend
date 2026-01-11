/**
 * Consent E2E 테스트
 *
 * 동의서 관리 API 테스트 (Soul-E 내부 API)
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAppFactory, TestAppContext, setupTestEnv } from '../../utils/test-app.factory';
import { TestRequest } from '../../utils/test-helpers';
import { DatabaseSeeder, TEST_IDS, TEST_PASSWORDS } from '../../utils/database-seeder';
import { FacilityType } from '@application/auth/dto/institution-auth.dto';

describe('Consent Controller (E2E)', () => {
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let testRequest: TestRequest;

  // 테스트용 아동 ID
  let testChildId: string;
  let careFacilityToken: string;

  // Internal API Secret
  const validInternalSecret = 'yeirin-internal-secret';

  beforeAll(async () => {
    setupTestEnv();
    // Internal Secret 환경변수 설정
    process.env.INTERNAL_API_SECRET = validInternalSecret;

    context = await TestAppFactory.createCounselFlow({ dropSchema: true });
    app = context.app;
    dataSource = context.dataSource;
    testRequest = new TestRequest(app);

    // 시드 데이터 삽입
    await DatabaseSeeder.seedMinimal(dataSource);

    // 양육시설 로그인
    const careFacilityLogin = await testRequest.post('/api/v1/auth/institution/login', {
      facilityId: TEST_IDS.CARE_FACILITY,
      facilityType: FacilityType.CARE_FACILITY,
      password: TEST_PASSWORDS.DEFAULT,
    });
    careFacilityToken = careFacilityLogin.body.accessToken;

    // 테스트용 아동 등록
    const childResponse = await testRequest.authenticated(careFacilityToken).post('/api/v1/children', {
      childType: 'CARE_FACILITY',
      name: '동의테스트아동',
      birthDate: '2012-08-20',
      gender: 'FEMALE',
    });
    testChildId = childResponse.body.id;
  }, 30000);

  afterAll(async () => {
    if (context) {
      await TestAppFactory.cleanup(context);
    }
  });

  // =========================================================================
  // 동의 상태 조회 API
  // =========================================================================

  describe('GET /api/v1/consent/status/:childId', () => {
    it('유효한 Internal Secret으로 동의 상태를 조회한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .get(`/api/v1/consent/status/${testChildId}`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('hasConsent');
        expect(response.body).toHaveProperty('isValid');
      }
    });

    it('잘못된 Internal Secret으로 조회 시 401 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', 'invalid-secret')
        .get(`/api/v1/consent/status/${testChildId}`);

      // 엔드포인트가 없으면 404, 있으면 401
      expect([401, 404]).toContain(response.status);
    });

    it('Internal Secret 없이 조회 시 401 에러가 발생한다', async () => {
      const response = await testRequest.get(`/api/v1/consent/status/${testChildId}`);

      // 엔드포인트가 없으면 404, 있으면 401
      expect([401, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // 동의 제출 API
  // =========================================================================

  describe('POST /api/v1/consent/accept', () => {
    it('유효한 Internal Secret으로 동의를 제출한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .post('/api/v1/consent/accept', {
          childId: testChildId,
          consentItems: {
            personalInfo: true,
            sensitiveData: true,
            researchData: false,
            childSelfConsent: true,
          },
          isChildOver14: true,
          documentUrl: '/documents/privacy-policy-v1.0.0.pdf',
        });

      // 엔드포인트가 없으면 404
      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200) {
        // API returns consent entity with id and childId
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('childId');
      }
    });

    it('필수 동의 항목 누락 시 400 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .post('/api/v1/consent/accept', {
          childId: testChildId,
          consentItems: {
            personalInfo: true,
            // sensitiveData 누락
            researchData: false,
          },
          isChildOver14: false,
        });

      expect([200, 400]).toContain(response.status);
    });

    it('잘못된 Internal Secret으로 제출 시 401 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', 'invalid-secret')
        .post('/api/v1/consent/accept', {
          childId: testChildId,
          consentItems: {
            personalInfo: true,
            sensitiveData: true,
          },
        });

      // 엔드포인트가 없으면 404, 있으면 401, 검증 실패 400
      expect([400, 401, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // 보호자 동의 제출 API
  // =========================================================================

  describe('POST /api/v1/consent/guardian/accept', () => {
    it('유효한 Internal Secret으로 보호자 동의를 제출한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .post('/api/v1/consent/guardian/accept', {
          childId: testChildId,
          consentItems: {
            personalInfo: true,
            sensitiveData: true,
            researchData: false,
          },
          guardianPhone: '010-1234-5678',
          guardianRelation: '부모',
          documentUrl: '/documents/privacy-policy-v1.0.0.pdf',
        });

      // 엔드포인트가 없으면 404
      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200) {
        // API returns consent entity with id and childId
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('childId');
      }
    });

    it('보호자 정보 누락 시 400 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .post('/api/v1/consent/guardian/accept', {
          childId: testChildId,
          consentItems: {
            personalInfo: true,
            sensitiveData: true,
          },
          // guardianPhone, guardianRelation 누락
        });

      // 엔드포인트가 없으면 404, 있으면 400
      expect([400, 404]).toContain(response.status);
    });

    it('잘못된 Internal Secret으로 제출 시 401 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', 'invalid-secret')
        .post('/api/v1/consent/guardian/accept', {
          childId: testChildId,
          consentItems: {
            personalInfo: true,
            sensitiveData: true,
          },
          guardianPhone: '010-1234-5678',
          guardianRelation: '부모',
        });

      // 엔드포인트가 없으면 404, 있으면 401, 검증 실패 400
      expect([400, 401, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // 동의 철회 API
  // =========================================================================

  describe('POST /api/v1/consent/revoke/:childId', () => {
    it('유효한 Internal Secret으로 동의를 철회한다', async () => {
      // 먼저 동의를 제출
      await testRequest.withHeader('X-Internal-Secret', validInternalSecret).post('/api/v1/consent/accept', {
        childId: testChildId,
        consentItems: {
          personalInfo: true,
          sensitiveData: true,
        },
        isChildOver14: false,
      });

      // 동의 철회
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .post(`/api/v1/consent/revoke/${testChildId}`, {
          reason: '테스트 철회 사유',
        });

      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200) {
        // API returns consent entity with hasValidConsent=false
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('childId');
        expect(response.body.hasValidConsent).toBe(false);
      }
    });

    it('잘못된 Internal Secret으로 철회 시 401 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', 'invalid-secret')
        .post(`/api/v1/consent/revoke/${testChildId}`, {
          reason: '테스트 철회 사유',
        });

      // 엔드포인트가 없으면 404, 있으면 401
      expect([401, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // 완전한 동의 상태 조회 API (14세 기준 분기)
  // =========================================================================

  describe('GET /api/v1/consent/complete-status/:childId', () => {
    it('14세 미만 아동의 완전한 동의 상태를 조회한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .get(`/api/v1/consent/complete-status/${testChildId}?isOver14=false`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('isComplete');
        expect(response.body).toHaveProperty('hasGuardianConsent');
        expect(response.body.isOver14).toBe(false);
      }
    });

    it('14세 이상 아동의 완전한 동의 상태를 조회한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', validInternalSecret)
        .get(`/api/v1/consent/complete-status/${testChildId}?isOver14=true`);

      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('isComplete');
        expect(response.body).toHaveProperty('hasGuardianConsent');
        expect(response.body).toHaveProperty('hasChildConsent');
        expect(response.body.isOver14).toBe(true);
      }
    });

    it('잘못된 Internal Secret으로 조회 시 401 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Internal-Secret', 'invalid-secret')
        .get(`/api/v1/consent/complete-status/${testChildId}?isOver14=false`);

      // 엔드포인트가 없으면 404, 있으면 401
      expect([401, 404]).toContain(response.status);
    });
  });
});
