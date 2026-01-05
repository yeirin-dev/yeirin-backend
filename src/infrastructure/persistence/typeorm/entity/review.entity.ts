import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoucherInstitutionEntity } from './voucher-institution.entity';

/**
 * 리뷰 Entity
 */
@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 리뷰 대상 기관 ID */
  @Column({ type: 'uuid' })
  institutionId: string;

  /** 작성자 ID (추후 User 엔티티 연결 예정) */
  @Column({ type: 'uuid', nullable: true })
  userId: string;

  /** 작성자 닉네임 (비회원 또는 익명) */
  @Column({ type: 'varchar', length: 50 })
  authorNickname: string;

  /** 별점 (1-5) */
  @Column({ type: 'int' })
  rating: number;

  /** 피드백 내용 */
  @Column({ type: 'text' })
  content: string;

  /** 도움이 됨 카운트 */
  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  /** 리뷰 대상 기관 관계 */
  @ManyToOne(() => VoucherInstitutionEntity, (institution) => institution.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'institutionId' })
  institution: VoucherInstitutionEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
