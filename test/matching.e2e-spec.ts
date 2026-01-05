import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Matching Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/matching/recommendations', () => {
    it('유효한 상담의뢰지 텍스트로 추천을 요청하면 200과 추천 결과를 반환한다', () => {
      return request(app.getHttpServer())
        .post('/api/v1/matching/recommendations')
        .send({
          counselRequestText: '8세 남아, ADHD 의심 증상, 학교 적응 어려움, 집중력 부족',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('counselRequestText');
          expect(res.body).toHaveProperty('recommendations');
          expect(res.body).toHaveProperty('createdAt');
          expect(Array.isArray(res.body.recommendations)).toBe(true);
          expect(res.body.recommendations.length).toBeGreaterThan(0);

          // 첫 번째 추천 결과 구조 검증
          const firstRecommendation = res.body.recommendations[0];
          expect(firstRecommendation).toHaveProperty('institutionId');
          expect(firstRecommendation).toHaveProperty('score');
          expect(firstRecommendation).toHaveProperty('reason');
          expect(firstRecommendation).toHaveProperty('isHighScore');
          expect(typeof firstRecommendation.score).toBe('number');
          expect(firstRecommendation.score).toBeGreaterThanOrEqual(0);
          expect(firstRecommendation.score).toBeLessThanOrEqual(1);
        });
    });

    it('ADHD 키워드가 포함된 상담의뢰지는 ADHD 전문 기관을 추천한다', () => {
      return request(app.getHttpServer())
        .post('/api/v1/matching/recommendations')
        .send({
          counselRequestText: '아이가 ADHD 증상을 보이고 있습니다. 집중력이 매우 부족합니다.',
        })
        .expect(200)
        .expect((res) => {
          const recommendations = res.body.recommendations;
          expect(recommendations.some((r: { reason: string }) => r.reason.includes('ADHD'))).toBe(
            true,
          );
        });
    });

    it('불안 키워드가 포함된 상담의뢰지는 불안장애 전문 기관을 추천한다', () => {
      return request(app.getHttpServer())
        .post('/api/v1/matching/recommendations')
        .send({
          counselRequestText: '아이가 심한 불안 증상을 보입니다. 항상 걱정이 많습니다.',
        })
        .expect(200)
        .expect((res) => {
          const recommendations = res.body.recommendations;
          expect(recommendations.some((r: { reason: string }) => r.reason.includes('불안'))).toBe(
            true,
          );
        });
    });

    it('추천 결과는 점수 기준 내림차순으로 정렬되어 반환된다', () => {
      return request(app.getHttpServer())
        .post('/api/v1/matching/recommendations')
        .send({
          counselRequestText: '8세 아동, 학교 적응 어려움, 상담이 필요합니다.',
        })
        .expect(200)
        .expect((res) => {
          const recommendations = res.body.recommendations;
          for (let i = 0; i < recommendations.length - 1; i++) {
            expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
          }
        });
    });

    it('빈 문자열로 요청하면 400 에러가 발생한다', () => {
      return request(app.getHttpServer())
        .post('/api/v1/matching/recommendations')
        .send({
          counselRequestText: '',
        })
        .expect(400);
    });

    it('너무 짧은 텍스트로 요청하면 500 에러가 발생한다', () => {
      return request(app.getHttpServer())
        .post('/api/v1/matching/recommendations')
        .send({
          counselRequestText: '짧음',
        })
        .expect(500);
    });
  });
});
