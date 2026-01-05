import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Review } from '@domain/review/model/review';
import { Rating } from '@domain/review/model/value-objects/rating.vo';
import { ReviewContent } from '@domain/review/model/value-objects/review-content.vo';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';
import { DeleteReviewUseCase } from './delete-review.use-case';

describe('DeleteReviewUseCase', () => {
  let useCase: DeleteReviewUseCase;
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
        DeleteReviewUseCase,
        {
          provide: 'ReviewRepository',
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteReviewUseCase>(DeleteReviewUseCase);
  });

  describe('리뷰 삭제', () => {
    it('작성자 본인이 리뷰를 삭제한다', async () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('삭제할 리뷰 내용입니다').value,
      }).value;

      mockReviewRepository.findById.mockResolvedValue(review);
      mockReviewRepository.delete.mockResolvedValue();

      // When
      await useCase.execute('review-123', 'user-456');

      // Then
      expect(mockReviewRepository.delete).toHaveBeenCalledWith('review-123');
    });

    it('존재하지 않는 리뷰는 삭제할 수 없다', async () => {
      // Given
      mockReviewRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(useCase.execute('non-existent', 'user-456')).rejects.toThrow(NotFoundException);
      expect(mockReviewRepository.delete).not.toHaveBeenCalled();
    });

    it('작성자가 아닌 사용자는 리뷰를 삭제할 수 없다', async () => {
      // Given
      const review = Review.create({
        institutionId: 'inst-123',
        userId: 'user-456',
        rating: Rating.create(5).value,
        content: ReviewContent.create('삭제할 리뷰 내용입니다').value,
      }).value;

      mockReviewRepository.findById.mockResolvedValue(review);

      // When & Then
      await expect(useCase.execute('review-123', 'other-user')).rejects.toThrow(ForbiddenException);
      expect(mockReviewRepository.delete).not.toHaveBeenCalled();
    });
  });
});
