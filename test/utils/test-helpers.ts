import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

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
  private customHeaders: Record<string, string> = {};

  constructor(private readonly app: INestApplication) {}

  /**
   * 커스텀 헤더 설정
   */
  withHeader(name: string, value: string) {
    const newInstance = new TestRequest(this.app);
    newInstance.customHeaders = { ...this.customHeaders, [name]: value };
    return newInstance;
  }

  private applyHeaders(req: request.Test): request.Test {
    for (const [key, value] of Object.entries(this.customHeaders)) {
      req = req.set(key, value);
    }
    return req;
  }

  get(path: string) {
    return this.applyHeaders(request(this.app.getHttpServer()).get(path));
  }

  post(path: string, body?: any) {
    return this.applyHeaders(request(this.app.getHttpServer()).post(path).send(body));
  }

  put(path: string, body?: any) {
    return this.applyHeaders(request(this.app.getHttpServer()).put(path).send(body));
  }

  patch(path: string, body?: any) {
    return this.applyHeaders(request(this.app.getHttpServer()).patch(path).send(body));
  }

  delete(path: string) {
    return this.applyHeaders(request(this.app.getHttpServer()).delete(path));
  }

  /**
   * 단일 파일 multipart 업로드
   */
  postMultipart(path: string, fieldName: string, filePath: string) {
    let req = request(this.app.getHttpServer()).post(path).attach(fieldName, filePath);
    return this.applyHeaders(req);
  }

  /**
   * 여러 파일 multipart 업로드
   */
  postMultipartMultiple(path: string, fieldName: string, filePaths: string[]) {
    let req = request(this.app.getHttpServer()).post(path);
    for (const filePath of filePaths) {
      req = req.attach(fieldName, filePath);
    }
    return this.applyHeaders(req);
  }

  /**
   * 인증 토큰 포함 요청
   */
  authenticated(token: string) {
    const self = this;
    return {
      get: (path: string) =>
        self.applyHeaders(
          request(self.app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`),
        ),

      post: (path: string, body?: any) =>
        self.applyHeaders(
          request(self.app.getHttpServer())
            .post(path)
            .set('Authorization', `Bearer ${token}`)
            .send(body),
        ),

      put: (path: string, body?: any) =>
        self.applyHeaders(
          request(self.app.getHttpServer())
            .put(path)
            .set('Authorization', `Bearer ${token}`)
            .send(body),
        ),

      patch: (path: string, body?: any) =>
        self.applyHeaders(
          request(self.app.getHttpServer())
            .patch(path)
            .set('Authorization', `Bearer ${token}`)
            .send(body),
        ),

      delete: (path: string) =>
        self.applyHeaders(
          request(self.app.getHttpServer()).delete(path).set('Authorization', `Bearer ${token}`),
        ),

      /**
       * 단일 파일 multipart 업로드 (인증 포함)
       */
      postMultipart: (path: string, fieldName: string, filePath: string) =>
        self.applyHeaders(
          request(self.app.getHttpServer())
            .post(path)
            .set('Authorization', `Bearer ${token}`)
            .attach(fieldName, filePath),
        ),

      /**
       * 여러 파일 multipart 업로드 (인증 포함)
       */
      postMultipartMultiple: (path: string, fieldName: string, filePaths: string[]) => {
        let req = request(self.app.getHttpServer())
          .post(path)
          .set('Authorization', `Bearer ${token}`);
        for (const filePath of filePaths) {
          req = req.attach(fieldName, filePath);
        }
        return self.applyHeaders(req);
      },
    };
  }
}

/**
 * 테스트 데이터 정리 헬퍼
 */
export async function cleanupTestData(app: INestApplication): Promise<void> {
  // 필요시 데이터베이스 정리 로직 추가
}
