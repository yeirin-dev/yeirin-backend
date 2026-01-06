import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 리뷰 Entity
 * NOTE: VoucherInstitution 시스템 제거로 FK 관계 해제됨. 컬럼만 유지.
 */
@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 리뷰 대상 기관 ID (레거시 - VoucherInstitution용, 현재 사용 안함) */
  @Column({ type: 'uuid', nullable: true })
  institutionId: string | null;

  /** 작성자 ID (레거시) */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
