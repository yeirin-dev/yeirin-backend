import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselRequestRecommendation } from '@domain/counsel-request-recommendation/model/counsel-request-recommendation';
import { CounselRequestRecommendationRepository } from '@domain/counsel-request-recommendation/repository/counsel-request-recommendation.repository';
import { CounselRequestRecommendationEntity } from '../entity/counsel-request-recommendation.entity';
import { CounselRequestRecommendationMapper } from '../mapper/counsel-request-recommendation.mapper';

/**
 * CounselRequestRecommendation Repository 구현체
 */
@Injectable()
export class CounselRequestRecommendationRepositoryImpl
  implements CounselRequestRecommendationRepository
{
  constructor(
    @InjectRepository(CounselRequestRecommendationEntity)
    private readonly repository: Repository<CounselRequestRecommendationEntity>,
  ) {}

  async save(
    recommendation: CounselRequestRecommendation,
  ): Promise<CounselRequestRecommendation> {
    const entity = CounselRequestRecommendationMapper.toEntity(recommendation);
    const saved = await this.repository.save(entity);
    return CounselRequestRecommendationMapper.toDomain(saved);
  }

  async saveAll(
    recommendations: CounselRequestRecommendation[],
  ): Promise<CounselRequestRecommendation[]> {
    const entities = recommendations.map((rec) =>
      CounselRequestRecommendationMapper.toEntity(rec),
    );
    const saved = await this.repository.save(entities);
    return saved.map((entity) => CounselRequestRecommendationMapper.toDomain(entity));
  }

  async findByCounselRequestId(
    counselRequestId: string,
  ): Promise<CounselRequestRecommendation[]> {
    const entities = await this.repository.find({
      where: { counselRequestId },
      order: { rank: 'ASC' }, // rank 순 정렬
    });
    return entities.map((entity) => CounselRequestRecommendationMapper.toDomain(entity));
  }

  async findById(id: string): Promise<CounselRequestRecommendation | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CounselRequestRecommendationMapper.toDomain(entity) : null;
  }

  async findSelectedByCounselRequestId(
    counselRequestId: string,
  ): Promise<CounselRequestRecommendation | null> {
    const entity = await this.repository.findOne({
      where: { counselRequestId, selected: true },
    });
    return entity ? CounselRequestRecommendationMapper.toDomain(entity) : null;
  }

  async deleteByCounselRequestId(counselRequestId: string): Promise<void> {
    await this.repository.delete({ counselRequestId });
  }
}
