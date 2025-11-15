import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ReviewEntity } from '../entity/review.entity';
import { ReviewRepository } from '@domain/review/repository/review.repository';

@Injectable()
export class ReviewRepositoryImpl implements ReviewRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
  ) {}

  async findById(id: string): Promise<ReviewEntity | null> {
    return await this.reviewRepository.findOne({
      where: { id },
      relations: ['institution'],
    });
  }

  async findAll(page: number, limit: number): Promise<[ReviewEntity[], number]> {
    return await this.reviewRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByInstitutionId(institutionId: string): Promise<ReviewEntity[]> {
    return await this.reviewRepository.find({
      where: { institutionId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    review: Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt' | 'institution'>,
  ): Promise<ReviewEntity> {
    const newReview = this.reviewRepository.create(review);
    return await this.reviewRepository.save(newReview);
  }

  async update(id: string, review: Partial<ReviewEntity>): Promise<ReviewEntity> {
    await this.reviewRepository.update(id, review);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('리뷰를 찾을 수 없습니다');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.reviewRepository.delete(id);
  }

  async findByMinRating(minRating: number): Promise<ReviewEntity[]> {
    return await this.reviewRepository.find({
      where: { rating: MoreThanOrEqual(minRating) },
      relations: ['institution'],
      order: { rating: 'DESC', createdAt: 'DESC' },
    });
  }

  async incrementHelpfulCount(id: string): Promise<ReviewEntity> {
    const review = await this.findById(id);
    if (!review) {
      throw new Error('리뷰를 찾을 수 없습니다');
    }
    review.helpfulCount += 1;
    return await this.reviewRepository.save(review);
  }
}
