import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

/**
 * 테스트 앱 설정 헬퍼
 * 모든 E2E 테스트에서 일관된 앱 초기화 제공
 */
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // 글로벌 파이프, 필터 등 설정
  // app.useGlobalPipes(new ValidationPipe());

  await app.init();
  return app;
}

/**
 * 테스트 앱 정리 헬퍼
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}

/**
 * API 요청 헬퍼
 */
export class TestRequest {
  constructor(private readonly app: INestApplication) {}

  get(path: string) {
    return request(this.app.getHttpServer()).get(path);
  }

  post(path: string, body?: any) {
    return request(this.app.getHttpServer()).post(path).send(body);
  }

  put(path: string, body?: any) {
    return request(this.app.getHttpServer()).put(path).send(body);
  }

  patch(path: string, body?: any) {
    return request(this.app.getHttpServer()).patch(path).send(body);
  }

  delete(path: string) {
    return request(this.app.getHttpServer()).delete(path);
  }

  /**
   * 인증 토큰 포함 요청
   */
  authenticated(token: string) {
    return {
      get: (path: string) =>
        request(this.app.getHttpServer())
          .get(path)
          .set('Authorization', `Bearer ${token}`),

      post: (path: string, body?: any) =>
        request(this.app.getHttpServer())
          .post(path)
          .set('Authorization', `Bearer ${token}`)
          .send(body),

      put: (path: string, body?: any) =>
        request(this.app.getHttpServer())
          .put(path)
          .set('Authorization', `Bearer ${token}`)
          .send(body),

      patch: (path: string, body?: any) =>
        request(this.app.getHttpServer())
          .patch(path)
          .set('Authorization', `Bearer ${token}`)
          .send(body),

      delete: (path: string) =>
        request(this.app.getHttpServer())
          .delete(path)
          .set('Authorization', `Bearer ${token}`),
    };
  }
}

/**
 * 테스트 데이터 정리 헬퍼
 */
export async function cleanupTestData(app: INestApplication): Promise<void> {
  // 필요시 데이터베이스 정리 로직 추가
}
