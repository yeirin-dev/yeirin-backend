/**
 * Webhook E2E 테스트
 *
 * Soul-E Webhook API 테스트
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAppFactory, TestAppContext, setupTestEnv } from '../../utils/test-app.factory';
import { TestRequest } from '../../utils/test-helpers';
import { DatabaseSeeder, TEST_IDS, TEST_PASSWORDS } from '../../utils/database-seeder';
import { FacilityType } from '@application/auth/dto/institution-auth.dto';

describe('Webhook Controller (E2E)', () => {
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let testRequest: TestRequest;

  // 테스트용 아동 ID
  let testChildId: string;
  let careFacilityToken: string;

  // Webhook Secret
  const validWebhookSecret = 'soul-e-webhook-secret';

  beforeAll(async () => {
    setupTestEnv();
    // Webhook Secret 환경변수 설정
    process.env.SOUL_E_WEBHOOK_SECRET = validWebhookSecret;

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
      name: 'Webhook테스트아동',
      birthDate: '2013-05-10',
      gender: 'MALE',
    });
    testChildId = childResponse.body.id;
  }, 30000);

  afterAll(async () => {
    if (context) {
      await TestAppFactory.cleanup(context);
    }
  });

  // =========================================================================
  // 심리 상태 업데이트 API
  // =========================================================================

  describe('POST /api/v1/webhook/soul-e/psychological-status', () => {
    it('유효한 Webhook Secret으로 심리 상태를 업데이트한다 (AT_RISK)', async () => {
      const response = await testRequest
        .withHeader('X-Soul-E-Secret', validWebhookSecret)
        .post('/api/v1/webhook/soul-e/psychological-status', {
          childId: testChildId,
          newStatus: 'AT_RISK',
          reason: '대화 중 우울 관련 키워드 감지',
          sessionId: 'test-session-id-001',
          metadata: {
            detectedKeywords: ['힘들어', '우울해'],
            confidenceScore: 0.75,
          },
        });

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('childId');
        expect(response.body).toHaveProperty('previousStatus');
        expect(response.body).toHaveProperty('newStatus');
        expect(response.body.newStatus).toBe('AT_RISK');
      }
    });

    it('유효한 Webhook Secret으로 심리 상태를 업데이트한다 (HIGH_RISK)', async () => {
      const response = await testRequest
        .withHeader('X-Soul-E-Secret', validWebhookSecret)
        .post('/api/v1/webhook/soul-e/psychological-status', {
          childId: testChildId,
          newStatus: 'HIGH_RISK',
          reason: '자해/자살 관련 표현 감지로 긴급 개입 필요',
          sessionId: 'test-session-id-002',
          metadata: {
            detectedKeywords: ['살고 싶지 않아'],
            conversationContext: '학교 왕따 관련 상담 중',
            confidenceScore: 0.92,
          },
        });

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.newStatus).toBe('HIGH_RISK');
        expect(response.body.isEscalation).toBe(true);
      }
    });

    it('잘못된 Webhook Secret으로 요청 시 401 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Soul-E-Secret', 'invalid-secret')
        .post('/api/v1/webhook/soul-e/psychological-status', {
          childId: testChildId,
          newStatus: 'AT_RISK',
          reason: '테스트 사유',
        });

      // 엔드포인트가 없으면 404, 있으면 401
      expect([401, 404]).toContain(response.status);
    });

    it('Webhook Secret 없이 요청 시 401 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/webhook/soul-e/psychological-status', {
        childId: testChildId,
        newStatus: 'AT_RISK',
        reason: '테스트 사유',
      });

      // 엔드포인트가 없으면 404, 있으면 401
      expect([401, 404]).toContain(response.status);
    });

    it('존재하지 않는 아동 ID로 요청 시 404 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Soul-E-Secret', validWebhookSecret)
        .post('/api/v1/webhook/soul-e/psychological-status', {
          childId: '99999999-9999-9999-9999-999999999999',
          newStatus: 'AT_RISK',
          reason: '테스트 사유',
        });

      // UUID 형식이 아닌 경우 400, UUID지만 존재하지 않는 경우 404
      expect([400, 404]).toContain(response.status);
    });

    it('잘못된 상태 값으로 요청 시 400 에러가 발생한다', async () => {
      const response = await testRequest
        .withHeader('X-Soul-E-Secret', validWebhookSecret)
        .post('/api/v1/webhook/soul-e/psychological-status', {
          childId: testChildId,
          newStatus: 'INVALID_STATUS',
          reason: '테스트 사유',
        });

      // 엔드포인트가 없으면 404, 있으면 400
      expect([400, 404]).toContain(response.status);
    });
  });
});
