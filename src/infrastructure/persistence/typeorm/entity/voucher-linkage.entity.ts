import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoucherLinkageStatus } from './enums/voucher-linkage-status.enum';
import { CounselRequestEntity } from './counsel-request.entity';

/**
 * 바우처 연계현황 엔티티
 * 바우처 추천대상 아동의 기관 연계 상태를 추적
 */
@Entity('voucher_linkages')
@Index('idx_voucher_linkages_status', ['status'])
@Index('idx_voucher_linkages_counsel_request', ['counselRequestId'])
@Index('idx_voucher_linkages_linked_at', ['linkedAt'])
export class VoucherLinkageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 상담의뢰지 ID (1:1 관계)
   */
  @Column({ type: 'uuid', name: 'counsel_request_id', unique: true })
  counselRequestId: string;

  @OneToOne(() => CounselRequestEntity, { nullable: false })
  @JoinColumn({ name: 'counsel_request_id' })
  counselRequest: CounselRequestEntity;

  /**
   * 연계 상태
   */
  @Column({
    type: 'enum',
    enum: VoucherLinkageStatus,
    default: VoucherLinkageStatus.PENDING,
  })
  status: VoucherLinkageStatus;

  /**
   * 연계 기관명
   */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'linked_institution_name' })
  linkedInstitutionName?: string;

  /**
   * 연계 기관 연락처
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'linked_institution_phone' })
  linkedInstitutionPhone?: string;

  /**
   * 연계 기관 주소
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'linked_institution_address' })
  linkedInstitutionAddress?: string;

  /**
   * 담당 상담사명
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'linked_counselor_name' })
  linkedCounselorName?: string;

  /**
   * 연계 완료일
   */
  @Column({ type: 'timestamp', nullable: true, name: 'linked_at' })
  linkedAt?: Date;

  /**
   * 비고/메모
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ============================================
  // Guardian 제출 필드 (바우처 선정 여부 폼)
  // ============================================

  /**
   * 바우처 선정 확인 여부 (1번 질문)
   */
  @Column({ type: 'boolean', nullable: true, name: 'is_voucher_confirmed' })
  isVoucherConfirmed?: boolean;

  /**
   * 선정된 바우처 종류 (2번 질문: 심리치유 / 정서발달)
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'voucher_type' })
  voucherType?: string;

  /**
   * 예이린 플랫폼 연계 희망 여부 (3번 질문)
   */
  @Column({ type: 'boolean', nullable: true, name: 'wants_platform_linkage' })
  wantsPlatformLinkage?: boolean;

  /**
   * 연계 미희망 사유 (3-1번 질문)
   */
  @Column({ type: 'text', nullable: true, name: 'linkage_decline_reason' })
  linkageDeclineReason?: string;

  /**
   * Guardian 연계 정보 제출 완료 여부
   */
  @Column({ type: 'boolean', default: false, name: 'linkage_info_submitted' })
  linkageInfoSubmitted: boolean;

  /**
   * 선택된 바우처 기관 ID
   */
  @Column({ type: 'varchar', nullable: true, name: 'linked_voucher_institution_id' })
  linkedVoucherInstitutionId?: string;

  /**
   * 선택된 바우처 기관 유형 (B_IMPACT / COMMON)
   */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'linked_voucher_institution_type' })
  linkedVoucherInstitutionType?: string;

  /**
   * 기관 검토 완료일 (B-IMPACT 기관 수락/거절 시)
   */
  @Column({ type: 'timestamp', nullable: true, name: 'institution_reviewed_at' })
  institutionReviewedAt?: Date;

  /**
   * 기관 거절 사유 (B-IMPACT 기관 거절 시)
   */
  @Column({ type: 'text', nullable: true, name: 'institution_rejection_reason' })
  institutionRejectionReason?: string;

  /**
   * 생성자 (관리자 ID)
   */
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy?: string;

  /**
   * 수정자 (관리자 ID)
   */
  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
