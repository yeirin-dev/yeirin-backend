import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateReviewUseCase } from './update-review.use-case';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';
import { Review } from '@domain/review/model/review';
import { Rating } from '@domain/review/model/value-objects/rating.vo';
import { ReviewContent } from '@domain/review/model/value-objects/review-content.vo';

describe('UpdateReviewUseCase', () => {
  let useCase: UpdateReviewUseCase;
  let mockReviewRepository: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    mockReviewRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByUserId: jest.fn(),
      existsByUserIdAndInstitutionId: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateReviewUseCase,
        {
          provide: 'ReviewRepository',
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateReviewUseCase>(UpdateReviewUseCase);
  });

  describe('리뷰 수정', () => {
    it('작성자 본인이 리뷰를 수정한다', async () => {
      // Given
      const existingReview = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(3).value,
        content: ReviewContent.create('원래 리뷰 내용입니다').value,
      }).value;

      const dto = {
        rating: 5,
        content: '수정된 리뷰 내용입니다. 매우 만족스럽습니다.',
      };

      mockReviewRepository.findById.mockResolvedValue(existingReview);
      mockReviewRepository.save.mockResolvedValue(existingReview);

      // When
      const result = await useCase.execute('review-123', 'user-456', dto);

      // Then
      expect(result.rating).toBe(5);
      expect(result.content).toBe('수정된 리뷰 내용입니다. 매우 만족스럽습니다.');
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('존재하지 않는 리뷰는 수정할 수 없다', async () => {
      // Given
      mockReviewRepository.findById.mockResolvedValue(null);

      const dto = {
        rating: 5,
        content: '수정된 내용입니다',
      };

      // When & Then
      await expect(useCase.execute('non-existent', 'user-456', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });

    it('작성자가 아닌 사용자는 리뷰를 수정할 수 없다', async () => {
      // Given
      const existingReview = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(3).value,
        content: ReviewContent.create('원래 리뷰 내용입니다').value,
      }).value;

      const dto = {
        rating: 5,
        content: '해킹 시도입니다',
      };

      mockReviewRepository.findById.mockResolvedValue(existingReview);

      // When & Then
      await expect(
        useCase.execute('review-123', 'other-user', dto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });
  });
});
