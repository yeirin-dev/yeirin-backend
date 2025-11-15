import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Review API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/reviews (POST)', () => {
    it('유효한 데이터로 리뷰를 생성한다', () => {
      const createReviewDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440000',
        authorNickname: '테스트사용자',
        rating: 5,
        content: '매우 만족스러운 상담이었습니다.',
      };

      return request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.institutionId).toBe(createReviewDto.institutionId);
          expect(res.body.authorNickname).toBe(createReviewDto.authorNickname);
          expect(res.body.rating).toBe(createReviewDto.rating);
          expect(res.body.helpfulCount).toBe(0);
        });
    });

    it('평점이 1-5 범위를 벗어나면 실패한다', () => {
      const invalidDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        authorNickname: '테스트사용자',
        rating: 6,
        content: '잘못된 평점',
      };

      return request(app.getHttpServer())
        .post('/reviews')
        .send(invalidDto)
        .expect(400);
    });

    it('필수 필드 누락 시 실패한다', () => {
      const incompleteDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        // authorNickname 누락
        rating: 5,
      };

      return request(app.getHttpServer())
        .post('/reviews')
        .send(incompleteDto)
        .expect(400);
    });
  });

  describe('/reviews (GET)', () => {
    it('페이지네이션이 적용된 리뷰 목록을 조회한다', () => {
      return request(app.getHttpServer())
        .get('/reviews')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('reviews');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.reviews)).toBe(true);
        });
    });

    it('page와 limit 파라미터 없이도 조회 가능하다', () => {
      return request(app.getHttpServer())
        .get('/reviews')
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(10);
        });
    });
  });

  describe('/reviews/:id (GET)', () => {
    let createdReviewId: string;

    beforeAll(async () => {
      // 테스트용 리뷰 생성
      const createDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        authorNickname: '테스트사용자',
        rating: 5,
        content: '단건 조회 테스트용 리뷰',
      };

      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send(createDto);

      createdReviewId = response.body.id;
    });

    it('ID로 리뷰를 조회한다', () => {
      return request(app.getHttpServer())
        .get(`/reviews/${createdReviewId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdReviewId);
          expect(res.body).toHaveProperty('authorNickname');
          expect(res.body).toHaveProperty('rating');
        });
    });

    it('존재하지 않는 ID로 조회 시 404를 반환한다', () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/reviews/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('/reviews/:id (PUT)', () => {
    let createdReviewId: string;

    beforeAll(async () => {
      // 테스트용 리뷰 생성
      const createDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        authorNickname: '수정테스트',
        rating: 3,
        content: '수정 전 내용',
      };

      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send(createDto);

      createdReviewId = response.body.id;
    });

    it('리뷰를 수정한다', () => {
      const updateDto = {
        content: '수정된 리뷰 내용',
        rating: 5,
      };

      return request(app.getHttpServer())
        .put(`/reviews/${createdReviewId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBe(updateDto.content);
          expect(res.body.rating).toBe(updateDto.rating);
        });
    });
  });

  describe('/reviews/:id/helpful (PATCH)', () => {
    let createdReviewId: string;

    beforeAll(async () => {
      // 테스트용 리뷰 생성
      const createDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        authorNickname: '도움됨테스트',
        rating: 5,
        content: '도움이 됨 테스트',
      };

      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send(createDto);

      createdReviewId = response.body.id;
    });

    it('도움이 됨 카운트를 증가시킨다', async () => {
      const initialResponse = await request(app.getHttpServer())
        .get(`/reviews/${createdReviewId}`);

      const initialCount = initialResponse.body.helpfulCount;

      return request(app.getHttpServer())
        .patch(`/reviews/${createdReviewId}/helpful`)
        .expect(200)
        .expect((res) => {
          expect(res.body.helpfulCount).toBe(initialCount + 1);
        });
    });

    it('여러 번 호출하면 매번 1씩 증가한다', async () => {
      const response1 = await request(app.getHttpServer())
        .patch(`/reviews/${createdReviewId}/helpful`);

      const count1 = response1.body.helpfulCount;

      const response2 = await request(app.getHttpServer())
        .patch(`/reviews/${createdReviewId}/helpful`);

      expect(response2.body.helpfulCount).toBe(count1 + 1);
    });
  });

  describe('/reviews/:id (DELETE)', () => {
    it('리뷰를 삭제한다', async () => {
      // 삭제용 리뷰 생성
      const createDto = {
        institutionId: '550e8400-e29b-41d4-a716-446655440000',
        authorNickname: '삭제테스트',
        rating: 5,
        content: '삭제될 리뷰',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/reviews')
        .send(createDto);

      const reviewId = createResponse.body.id;

      // 삭제
      await request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .expect(204);

      // 삭제 확인
      return request(app.getHttpServer())
        .get(`/reviews/${reviewId}`)
        .expect(404);
    });
  });
});
