import { CounselRequestRecommendation } from '@domain/counsel-request-recommendation/model/counsel-request-recommendation';
import { CounselRequestRecommendationEntity } from '../entity/counsel-request-recommendation.entity';

/**
 * CounselRequestRecommendation Mapper
 * Domain ↔ Infrastructure 변환 (Anti-Corruption Layer)
 */
export class CounselRequestRecommendationMapper {
  /**
   * Entity → Domain
   */
  static toDomain(entity: CounselRequestRecommendationEntity): CounselRequestRecommendation {
    return CounselRequestRecommendation.restore({
      id: entity.id,
      counselRequestId: entity.counselRequestId,
      institutionId: entity.institutionId,
      score: Number(entity.score), // decimal을 number로 변환
      reason: entity.reason,
      rank: entity.rank,
      selected: entity.selected,
      createdAt: entity.createdAt,
    });
  }

  /**
   * Domain → Entity
   */
  static toEntity(domain: CounselRequestRecommendation): CounselRequestRecommendationEntity {
    const entity = new CounselRequestRecommendationEntity();
    entity.id = domain.id;
    entity.counselRequestId = domain.counselRequestId;
    entity.institutionId = domain.institutionId;
    entity.score = domain.score;
    entity.reason = domain.reason;
    entity.rank = domain.rank;
    entity.selected = domain.selected;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
