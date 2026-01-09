import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ConsentAction } from './enums/consent-action.enum';

/**
 * 동의 이력 엔티티 (감사 추적용)
 *
 * 동의 생성/수정/철회 시 이력을 기록합니다.
 */
@Entity('consent_history')
@Index('idx_consent_history_consent_id', ['consentId'])
@Index('idx_consent_history_child_id', ['childId'])
@Index('idx_consent_history_created_at', ['createdAt'])
export class ConsentHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 동의 ID (FK - soft reference)
   */
  @Column({ type: 'uuid' })
  consentId: string;

  /**
   * 아동 ID
   */
  @Column({ type: 'uuid' })
  childId: string;

  /**
   * 액션 타입
   */
  @Column({
    type: 'enum',
    enum: ConsentAction,
  })
  action: ConsentAction;

  /**
   * 변경 전 데이터 (업데이트/철회 시)
   */
  @Column({ type: 'jsonb', nullable: true })
  previousData: Record<string, unknown> | null;

  /**
   * 변경 후 데이터 (생성/업데이트 시)
   */
  @Column({ type: 'jsonb', nullable: true })
  newData: Record<string, unknown> | null;

  /**
   * 요청 IP 주소
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
