import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '@domain/review/model/review';
import { ReviewRepository } from '@domain/review/repository/review.repository.interface';
import { ReviewEntity } from '../entity/review.entity';
import { ReviewMapper } from '../mapper/review.mapper';

/**
 * Review Repository 구현체
 */
@Injectable()
export class ReviewRepositoryImpl implements ReviewRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly repository: Repository<ReviewEntity>,
  ) {}

  async save(review: Review): Promise<Review> {
    const entity = ReviewMapper.toEntity(review);
    const saved = await this.repository.save(entity);
    return ReviewMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Review | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['institution'],
    });

    return entity ? ReviewMapper.toDomain(entity) : null;
  }

  async findByInstitutionId(institutionId: string): Promise<Review[]> {
    const entities = await this.repository.find({
      where: { institutionId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });

    return ReviewMapper.toDomainList(entities);
  }

  async findByUserId(userId: string): Promise<Review[]> {
    const entities = await this.repository.find({
      where: { userId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });

    return ReviewMapper.toDomainList(entities);
  }

  async existsByUserIdAndInstitutionId(userId: string, institutionId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, institutionId },
    });

    return count > 0;
  }

  async findAll(page: number, limit: number): Promise<{ reviews: Review[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      relations: ['institution'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      reviews: ReviewMapper.toDomainList(entities),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
