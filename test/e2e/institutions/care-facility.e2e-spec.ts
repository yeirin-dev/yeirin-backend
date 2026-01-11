/**
 * Care Facility E2E 테스트
 *
 * 양육시설 API 테스트
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAppFactory, TestAppContext, setupTestEnv } from '../../utils/test-app.factory';
import { TestRequest } from '../../utils/test-helpers';
import { DatabaseSeeder, TEST_IDS } from '../../utils/database-seeder';

describe('Care Facility Controller (E2E)', () => {
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let testRequest: TestRequest;

  beforeAll(async () => {
    setupTestEnv();
    context = await TestAppFactory.createAuthOnly({ dropSchema: true });
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
  // 양육시설 목록 조회 API
  // =========================================================================

  describe('GET /api/v1/care-facilities', () => {
    it('양육시설 목록을 성공적으로 조회한다', async () => {
      const response = await testRequest.get('/api/v1/care-facilities');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('facilities');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.facilities)).toBe(true);
    });

    it('페이지네이션 파라미터로 목록을 조회한다', async () => {
      const response = await testRequest.get('/api/v1/care-facilities?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.limit).toBe(5);
    });

    it('활성화 상태로 필터링하여 조회한다 (isActive=true)', async () => {
      const response = await testRequest.get('/api/v1/care-facilities?isActive=true');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.facilities)).toBe(true);

      // 모든 결과가 활성화 상태인지 확인
      response.body.facilities.forEach((facility: { isActive: boolean }) => {
        expect(facility.isActive).toBe(true);
      });
    });

    it('비활성화 상태로 필터링하여 조회한다 (isActive=false)', async () => {
      const response = await testRequest.get('/api/v1/care-facilities?isActive=false');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.facilities)).toBe(true);

      // 모든 결과가 비활성화 상태인지 확인 (없을 수도 있음)
      if (response.body.facilities.length > 0) {
        response.body.facilities.forEach((facility: { isActive: boolean }) => {
          expect(facility.isActive).toBe(false);
        });
      }
    });

    it('인증 없이도 목록을 조회할 수 있다 (Public API)', async () => {
      const response = await testRequest.get('/api/v1/care-facilities');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // 양육시설 상세 조회 API
  // =========================================================================

  describe('GET /api/v1/care-facilities/:id', () => {
    it('양육시설 상세 정보를 조회한다', async () => {
      const response = await testRequest.get(`/api/v1/care-facilities/${TEST_IDS.CARE_FACILITY}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(TEST_IDS.CARE_FACILITY);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('isActive');
    });

    it('존재하지 않는 양육시설 조회 시 404 에러가 발생한다', async () => {
      const response = await testRequest.get('/api/v1/care-facilities/99999999-9999-9999-9999-999999999999');

      expect(response.status).toBe(404);
    });

    it('인증 없이도 상세 정보를 조회할 수 있다 (Public API)', async () => {
      const response = await testRequest.get(`/api/v1/care-facilities/${TEST_IDS.CARE_FACILITY}`);

      expect(response.status).toBe(200);
    });
  });
});
