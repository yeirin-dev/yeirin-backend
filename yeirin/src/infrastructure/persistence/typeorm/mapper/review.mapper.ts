import { Review } from '@domain/review/model/review';
import { Rating } from '@domain/review/model/value-objects/rating.vo';
import { ReviewContent } from '@domain/review/model/value-objects/review-content.vo';
import { ReviewEntity } from '../entity/review.entity';

/**
 * Review Domain ↔ ReviewEntity 매퍼
 * Anti-Corruption Layer
 */
export class ReviewMapper {
  /**
   * Domain 모델 → Entity
   */
  public static toEntity(review: Review): ReviewEntity {
    const entity = new ReviewEntity();
    entity.id = review.id;
    entity.institutionId = review.institutionId;
    entity.userId = review.userId;
    entity.rating = review.rating.value;
    entity.content = review.content.value;
    entity.helpfulCount = review.helpfulCount;
    entity.createdAt = review.createdAt;
    entity.updatedAt = review.updatedAt;
    return entity;
  }

  /**
   * Entity → Domain 모델
   */
  public static toDomain(entity: ReviewEntity): Review {
    const ratingResult = Rating.create(entity.rating);
    const contentResult = ReviewContent.create(entity.content);

    if (ratingResult.isFailure) {
      throw new Error(`Invalid rating in DB: ${ratingResult.error}`);
    }

    if (contentResult.isFailure) {
      throw new Error(`Invalid content in DB: ${contentResult.error}`);
    }

    return Review.restore({
      id: entity.id,
      institutionId: entity.institutionId,
      userId: entity.userId,
      rating: ratingResult.value,
      content: contentResult.value,
      helpfulCount: entity.helpfulCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Entity[] → Domain[]
   */
  public static toDomainList(entities: ReviewEntity[]): Review[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
