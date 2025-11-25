import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { CounselRequestEntity } from './counsel-request.entity';

/**
 * 상담의뢰지 추천 Entity (TypeORM)
 */
@Entity('counsel_request_recommendations')
@Index(['counselRequestId', 'rank']) // rank 순 조회 최적화
export class CounselRequestRecommendationEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'counsel_request_id', type: 'uuid' })
  counselRequestId: string;

  @Column({ name: 'institution_id', type: 'uuid' })
  institutionId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, comment: '추천 점수 (0~1)' })
  score: number;

  @Column({ type: 'text', comment: '추천 이유' })
  reason: string;

  @Column({ type: 'int', comment: '순위 (1~5)' })
  rank: number;

  @Column({ type: 'boolean', default: false, comment: '선택 여부' })
  selected: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => CounselRequestEntity, { onDelete: 'CASCADE' })
  counselRequest: CounselRequestEntity;
}
