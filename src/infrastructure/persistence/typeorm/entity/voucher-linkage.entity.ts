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
