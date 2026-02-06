import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CareType,
  CounselRequestStatus,
} from '@domain/counsel-request/model/value-objects/counsel-request-enums';
import { CounselRequestFormData } from '@domain/counsel-request/model/value-objects/counsel-request-form-data';
import { ChildProfileEntity } from './child-profile.entity';

@Entity('counsel_requests')
@Index('idx_counsel_requests_status', ['status'])
@Index('idx_counsel_requests_status_created', ['status', 'createdAt'])
@Index('idx_counsel_requests_created_at', ['createdAt'])
@Index('idx_counsel_requests_voucher_eligible', ['isVoucherEligible'])
@Index('idx_counsel_requests_status_voucher', ['status', 'isVoucherEligible'])
export class CounselRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'child_id' })
  childId: string;

  @ManyToOne(() => ChildProfileEntity, { nullable: false })
  @JoinColumn({ name: 'child_id' })
  child: ChildProfileEntity;

  @Column({
    type: 'enum',
    enum: CounselRequestStatus,
    default: CounselRequestStatus.PENDING,
  })
  status: CounselRequestStatus;

  @Column({ type: 'jsonb', name: 'form_data' })
  formData: CounselRequestFormData;

  @Column({ type: 'varchar', nullable: true, name: 'center_name' })
  centerName: string;

  @Column({ type: 'enum', enum: CareType, nullable: true, name: 'care_type' })
  careType: CareType;

  @Column({ type: 'date', nullable: true, name: 'request_date' })
  requestDate: Date;

  @Column({ type: 'uuid', nullable: true, name: 'matched_institution_id' })
  matchedInstitutionId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'matched_counselor_id' })
  matchedCounselorId?: string;

  /**
   * 통합 보고서 S3 키
   * yeirin-ai에서 생성된 통합 보고서 (상담의뢰지 + KPRC 검사지)
   */
  @Column({ type: 'varchar', nullable: true, name: 'integrated_report_s3_key' })
  integratedReportS3Key?: string;

  /**
   * 통합 보고서 생성 상태
   */
  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
    name: 'integrated_report_status',
  })
  integratedReportStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  /**
   * 바우처 추천대상 여부
   * 상담의뢰지 생성 시 Soul-E 검사결과 기반으로 계산
   */
  @Column({ type: 'boolean', nullable: true, name: 'is_voucher_eligible' })
  isVoucherEligible?: boolean;

  /**
   * 바우처 추천 사유 목록
   * ex) ["CRTES-R 경계선 이상", "SDQ-A 난점 경계선 이상"]
   */
  @Column({ type: 'text', array: true, nullable: true, name: 'voucher_eligibility_reasons' })
  voucherEligibilityReasons?: string[];

  /**
   * 바우처 추천 여부 계산 시점
   */
  @Column({ type: 'timestamp', nullable: true, name: 'voucher_eligibility_checked_at' })
  voucherEligibilityCheckedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
