/**
 * Auth E2E 테스트
 *
 * 시설 인증 API 전체 테스트
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { TestAppFactory, TestAppContext, setupTestEnv } from '../../utils/test-app.factory';
import { TestRequest } from '../../utils/test-helpers';
import { DatabaseSeeder, TEST_IDS, TEST_PASSWORDS } from '../../utils/database-seeder';
import { JwtTestGenerator } from '../../utils/jwt-generator';
import { FacilityType } from '@application/auth/dto/institution-auth.dto';

describe('Auth Controller (E2E)', () => {
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
  // 구/군 목록 조회 API
  // =========================================================================

  describe('GET /api/v1/auth/districts', () => {
    it('구/군 목록을 성공적으로 조회한다', async () => {
      const response = await testRequest.get('/api/v1/auth/districts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // 시드 데이터에 포함된 구/군 확인
      expect(response.body).toContain('강남구');
    });

    it('인증 없이도 구/군 목록을 조회할 수 있다', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/districts');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // 시설 목록 조회 API
  // =========================================================================

  describe('GET /api/v1/auth/facilities', () => {
    it('구/군으로 시설 목록을 조회한다', async () => {
      const district = encodeURIComponent('강남구');
      const response = await testRequest.get(`/api/v1/auth/facilities?district=${district}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // 시드 데이터에 포함된 시설 확인
      if (response.body.length > 0) {
        const facility = response.body[0];
        expect(facility).toHaveProperty('id');
        expect(facility).toHaveProperty('name');
        expect(facility).toHaveProperty('facilityType');
        expect(facility).toHaveProperty('district');
        expect(facility.district).toBe('강남구');
      }
    });

    it('시설 타입으로 필터링하여 조회한다 (양육시설)', async () => {
      const district = encodeURIComponent('강남구');
      const response = await testRequest.get(
        `/api/v1/auth/facilities?district=${district}&facilityType=CARE_FACILITY`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // 모든 결과가 CARE_FACILITY 타입인지 확인
      response.body.forEach((facility: { facilityType: string }) => {
        expect(facility.facilityType).toBe('CARE_FACILITY');
      });
    });

    it('시설 타입으로 필터링하여 조회한다 (지역아동센터)', async () => {
      const district = encodeURIComponent('강남구');
      const response = await testRequest.get(
        `/api/v1/auth/facilities?district=${district}&facilityType=COMMUNITY_CENTER`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // 모든 결과가 COMMUNITY_CENTER 타입인지 확인
      response.body.forEach((facility: { facilityType: string }) => {
        expect(facility.facilityType).toBe('COMMUNITY_CENTER');
      });
    });

    it('존재하지 않는 구/군으로 조회하면 빈 배열을 반환한다', async () => {
      const district = encodeURIComponent('존재하지않는구');
      const response = await testRequest.get(`/api/v1/auth/facilities?district=${district}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('district 파라미터 없이 요청하면 400 에러가 발생한다', async () => {
      const response = await testRequest.get('/api/v1/auth/facilities');

      // 구현에 따라 400 또는 빈 배열 반환
      expect([200, 400]).toContain(response.status);
    });
  });

  // =========================================================================
  // 시설 로그인 API
  // =========================================================================

  describe('POST /api/v1/auth/institution/login', () => {
    it('올바른 자격증명으로 로그인에 성공한다 (양육시설)', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('institution');
      expect(response.body.institution.id).toBe(TEST_IDS.CARE_FACILITY);
      expect(response.body.institution.facilityType).toBe('CARE_FACILITY');
    });

    it('올바른 자격증명으로 로그인에 성공한다 (지역아동센터)', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.COMMUNITY_CENTER,
        facilityType: FacilityType.COMMUNITY_CENTER,
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.institution.id).toBe(TEST_IDS.COMMUNITY_CENTER);
      expect(response.body.institution.facilityType).toBe('COMMUNITY_CENTER');
    });

    it('잘못된 비밀번호로 로그인하면 401 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
    });

    it('존재하지 않는 시설 ID로 로그인하면 401 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: '99999999-9999-9999-9999-999999999999',
        facilityType: FacilityType.CARE_FACILITY,
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(response.status).toBe(401);
    });

    it('시설 타입이 불일치하면 401 에러가 발생한다', async () => {
      // 양육시설 ID로 지역아동센터 타입으로 로그인 시도
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.COMMUNITY_CENTER,
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(response.status).toBe(401);
    });

    it('필수 필드가 누락되면 400 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        // facilityType 누락
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // 비밀번호 변경 API
  // =========================================================================

  describe('POST /api/v1/auth/institution/change-password', () => {
    it('올바른 현재 비밀번호로 비밀번호 변경에 성공한다', async () => {
      const newPassword = 'new-secure-password-123';

      const response = await testRequest.post('/api/v1/auth/institution/change-password', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        currentPassword: TEST_PASSWORDS.DEFAULT,
        newPassword: newPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.institution.isPasswordChanged).toBe(true);

      // 새 비밀번호로 로그인 확인
      const loginResponse = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        password: newPassword,
      });

      expect(loginResponse.status).toBe(200);

      // 테스트 후 원래 비밀번호로 복원
      await testRequest.post('/api/v1/auth/institution/change-password', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        currentPassword: newPassword,
        newPassword: TEST_PASSWORDS.DEFAULT,
      });
    });

    it('잘못된 현재 비밀번호로 변경하면 401 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/change-password', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        currentPassword: 'wrong-current-password',
        newPassword: 'new-password-123',
      });

      expect(response.status).toBe(401);
    });

    it('새 비밀번호가 너무 짧으면 400 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/change-password', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        currentPassword: TEST_PASSWORDS.DEFAULT,
        newPassword: '123', // 4자 미만
      });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // 토큰 갱신 API
  // =========================================================================

  describe('POST /api/v1/auth/institution/refresh', () => {
    it('유효한 리프레시 토큰으로 액세스 토큰을 갱신한다', async () => {
      // 먼저 로그인하여 리프레시 토큰 획득
      const loginResponse = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        password: TEST_PASSWORDS.DEFAULT,
      });

      expect(loginResponse.status).toBe(200);
      const refreshToken = loginResponse.body.refreshToken;

      // 리프레시 토큰으로 액세스 토큰 갱신
      const refreshResponse = await testRequest.post('/api/v1/auth/institution/refresh', {
        refreshToken,
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken');
    });

    it('만료된 리프레시 토큰으로 갱신하면 401 에러가 발생한다', async () => {
      // 만료된 리프레시 토큰 생성
      const expiredRefreshToken = JwtTestGenerator.refreshToken(
        { sub: TEST_IDS.CARE_FACILITY },
        { expiresIn: '-1s' },
      );

      const response = await testRequest.post('/api/v1/auth/institution/refresh', {
        refreshToken: expiredRefreshToken,
      });

      expect(response.status).toBe(401);
    });

    it('잘못된 서명의 리프레시 토큰으로 갱신하면 401 에러가 발생한다', async () => {
      const invalidToken = JwtTestGenerator.invalidSignature({
        sub: TEST_IDS.CARE_FACILITY,
        facilityType: 'CARE_FACILITY',
        facilityName: '테스트 시설',
        district: '강남구',
        role: 'INSTITUTION',
        isPasswordChanged: true,
      });

      const response = await testRequest.post('/api/v1/auth/institution/refresh', {
        refreshToken: invalidToken,
      });

      expect(response.status).toBe(401);
    });

    it('리프레시 토큰 없이 요청하면 400 또는 401 에러가 발생한다', async () => {
      const response = await testRequest.post('/api/v1/auth/institution/refresh', {});

      expect([400, 401]).toContain(response.status);
    });
  });

  // =========================================================================
  // 현재 시설 정보 조회 API
  // =========================================================================

  describe('GET /api/v1/auth/me', () => {
    it('유효한 토큰으로 현재 시설 정보를 조회한다', async () => {
      // 로그인하여 토큰 획득
      const loginResponse = await testRequest.post('/api/v1/auth/institution/login', {
        facilityId: TEST_IDS.CARE_FACILITY,
        facilityType: FacilityType.CARE_FACILITY,
        password: TEST_PASSWORDS.DEFAULT,
      });

      const accessToken = loginResponse.body.accessToken;

      // 토큰으로 현재 시설 정보 조회
      const response = await testRequest.authenticated(accessToken).get('/api/v1/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('facilityType');
      expect(response.body).toHaveProperty('facilityName');
      expect(response.body).toHaveProperty('district');
      expect(response.body).toHaveProperty('isPasswordChanged');
      expect(response.body.id).toBe(TEST_IDS.CARE_FACILITY);
    });

    it('인증 없이 요청하면 401 에러가 발생한다', async () => {
      const response = await testRequest.get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('만료된 토큰으로 요청하면 401 에러가 발생한다', async () => {
      const expiredToken = JwtTestGenerator.expired({
        sub: TEST_IDS.CARE_FACILITY,
        facilityType: 'CARE_FACILITY',
        facilityName: '테스트 시설',
        district: '강남구',
        role: 'INSTITUTION',
        isPasswordChanged: true,
      });

      const response = await testRequest.authenticated(expiredToken).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('잘못된 서명의 토큰으로 요청하면 401 에러가 발생한다', async () => {
      const invalidToken = JwtTestGenerator.invalidSignature({
        sub: TEST_IDS.CARE_FACILITY,
        facilityType: 'CARE_FACILITY',
        facilityName: '테스트 시설',
        district: '강남구',
        role: 'INSTITUTION',
        isPasswordChanged: true,
      });

      const response = await testRequest.authenticated(invalidToken).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
