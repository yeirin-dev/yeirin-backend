import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ReviewRepositoryImpl } from './review.repository.impl';
import { ReviewEntity } from '../entity/review.entity';
import { ReviewFixture } from '../../../../../test/fixtures/review.fixture';

describe('ReviewRepositoryImpl', () => {
  let reviewRepository: ReviewRepositoryImpl;
  let mockTypeOrmRepository: jest.Mocked<Repository<ReviewEntity>>;

  beforeEach(async () => {
    // TypeORM Repository 모킹
    mockTypeOrmRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewRepositoryImpl,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    reviewRepository = module.get<ReviewRepositoryImpl>(ReviewRepositoryImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('리뷰 ID로 조회 시 리뷰를 반환한다', async () => {
      // Given
      const reviewEntity = ReviewFixture.createReviewEntity();
      mockTypeOrmRepository.findOne.mockResolvedValue(reviewEntity);

      // When
      const result = await reviewRepository.findById(reviewEntity.id);

      // Then
      expect(result).toEqual(reviewEntity);
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: reviewEntity.id },
        relations: ['institution'],
      });
    });

    it('존재하지 않는 ID로 조회 시 null을 반환한다', async () => {
      // Given
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      // When
      const result = await reviewRepository.findById('non-existent-id');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('페이지네이션이 적용된 리뷰 목록을 반환한다', async () => {
      // Given
      const reviews = Array.from({ length: 5 }, (_, i) =>
        ReviewFixture.createReviewEntity({ id: `review-${i}` })
      );
      mockTypeOrmRepository.findAndCount.mockResolvedValue([reviews, 5]);

      // When
      const [result, total] = await reviewRepository.findAll(1, 10);

      // Then
      expect(result).toHaveLength(5);
      expect(total).toBe(5);
      expect(mockTypeOrmRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['institution'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('두 번째 페이지 조회 시 올바른 offset을 적용한다', async () => {
      // Given
      mockTypeOrmRepository.findAndCount.mockResolvedValue([[], 0]);

      // When
      await reviewRepository.findAll(2, 10);

      // Then
      expect(mockTypeOrmRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['institution'],
        skip: 10,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByInstitutionId', () => {
    it('특정 기관의 모든 리뷰를 반환한다', async () => {
      // Given
      const institutionId = 'test-institution-id';
      const reviews = ReviewFixture.createMultipleReviewData(3).map((data, i) =>
        ReviewFixture.createReviewEntity({ ...data, id: `review-${i}`, institutionId })
      );
      mockTypeOrmRepository.find.mockResolvedValue(reviews);

      // When
      const result = await reviewRepository.findByInstitutionId(institutionId);

      // Then
      expect(result).toHaveLength(3);
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { institutionId },
        relations: ['institution'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('새로운 리뷰를 생성하고 반환한다', async () => {
      // Given
      const reviewData = ReviewFixture.createReviewData();
      const createdReview = ReviewFixture.createReviewEntity(reviewData);

      mockTypeOrmRepository.create.mockReturnValue(createdReview as any);
      mockTypeOrmRepository.save.mockResolvedValue(createdReview);

      // When
      const result = await reviewRepository.create(reviewData);

      // Then
      expect(result).toEqual(createdReview);
      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(reviewData);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(createdReview);
    });

    it('helpfulCount가 0으로 초기화된 리뷰를 생성한다', async () => {
      // Given
      const reviewData = ReviewFixture.createReviewData({ helpfulCount: 0 });
      const createdReview = ReviewFixture.createReviewEntity(reviewData);

      mockTypeOrmRepository.create.mockReturnValue(createdReview as any);
      mockTypeOrmRepository.save.mockResolvedValue(createdReview);

      // When
      const result = await reviewRepository.create(reviewData);

      // Then
      expect(result.helpfulCount).toBe(0);
    });
  });

  describe('update', () => {
    it('리뷰를 수정하고 업데이트된 리뷰를 반환한다', async () => {
      // Given
      const existingReview = ReviewFixture.createReviewEntity();
      const updateData = { content: '수정된 리뷰 내용', rating: 4 };
      const updatedReview = { ...existingReview, ...updateData };

      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepository.findOne.mockResolvedValue(updatedReview);

      // When
      const result = await reviewRepository.update(existingReview.id, updateData);

      // Then
      expect(result.content).toBe('수정된 리뷰 내용');
      expect(result.rating).toBe(4);
      expect(mockTypeOrmRepository.update).toHaveBeenCalledWith(
        existingReview.id,
        updateData
      );
    });

    it('존재하지 않는 리뷰 수정 시 에러를 발생시킨다', async () => {
      // Given
      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        reviewRepository.update('non-existent-id', { content: '수정' })
      ).rejects.toThrow('리뷰를 찾을 수 없습니다');
    });
  });

  describe('delete', () => {
    it('리뷰를 삭제한다', async () => {
      // Given
      const reviewId = 'test-review-id';
      mockTypeOrmRepository.delete.mockResolvedValue({ affected: 1 } as any);

      // When
      await reviewRepository.delete(reviewId);

      // Then
      expect(mockTypeOrmRepository.delete).toHaveBeenCalledWith(reviewId);
    });
  });

  describe('findByMinRating', () => {
    it('최소 평점 이상의 리뷰만 반환한다', async () => {
      // Given
      const minRating = 4;
      const reviews = [
        ReviewFixture.createReviewEntity({ rating: 4 }),
        ReviewFixture.createReviewEntity({ rating: 5 }),
      ];
      mockTypeOrmRepository.find.mockResolvedValue(reviews);

      // When
      const result = await reviewRepository.findByMinRating(minRating);

      // Then
      expect(result).toHaveLength(2);
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['institution'],
        })
      );
    });
  });

  describe('incrementHelpfulCount', () => {
    it('도움이 됨 카운트를 1 증가시킨다', async () => {
      // Given
      const review = ReviewFixture.createReviewEntity({ helpfulCount: 5 });
      const updatedReview = { ...review, helpfulCount: 6 };

      mockTypeOrmRepository.findOne.mockResolvedValue(review);
      mockTypeOrmRepository.save.mockResolvedValue(updatedReview);

      // When
      const result = await reviewRepository.incrementHelpfulCount(review.id);

      // Then
      expect(result.helpfulCount).toBe(6);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith({
        ...review,
        helpfulCount: 6,
      });
    });

    it('존재하지 않는 리뷰의 카운트 증가 시 에러를 발생시킨다', async () => {
      // Given
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        reviewRepository.incrementHelpfulCount('non-existent-id')
      ).rejects.toThrow('리뷰를 찾을 수 없습니다');
    });
  });
});
