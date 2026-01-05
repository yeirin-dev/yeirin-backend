import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReportStatus } from '@domain/counsel-report/model/value-objects/report-status';
import { ChildProfileEntity } from './child-profile.entity';
import { CounselRequestEntity } from './counsel-request.entity';
import { CounselorProfileEntity } from './counselor-profile.entity';
import { VoucherInstitutionEntity } from './voucher-institution.entity';

/**
 * 면담결과지 Entity (Infrastructure Layer)
 *
 * @description
 * TypeORM Entity - 데이터베이스 counsel_reports 테이블과 매핑
 * Domain Model과 분리되어 있으며, Mapper를 통해 변환
 */
@Entity('counsel_reports')
export class CounselReportEntity {
  @PrimaryColumn('uuid')
  id: string;

  // ==================== Foreign Keys ====================

  @Column('uuid', { name: 'counsel_request_id' })
  counselRequestId: string;

  @ManyToOne(() => CounselRequestEntity, (counselRequest) => counselRequest.id)
  @JoinColumn({ name: 'counsel_request_id' })
  counselRequest: CounselRequestEntity;

  @Column('uuid', { name: 'child_id' })
  childId: string;

  @ManyToOne(() => ChildProfileEntity, (child) => child.id)
  @JoinColumn({ name: 'child_id' })
  child: ChildProfileEntity;

  @Column('uuid', { name: 'counselor_id' })
  counselorId: string;

  @ManyToOne(() => CounselorProfileEntity, (counselor) => counselor.userId)
  @JoinColumn({ name: 'counselor_id' })
  counselor: CounselorProfileEntity;

  @Column('uuid', { name: 'institution_id' })
  institutionId: string;

  @ManyToOne(() => VoucherInstitutionEntity, (institution) => institution.userId)
  @JoinColumn({ name: 'institution_id' })
  institution: VoucherInstitutionEntity;

  // ==================== Report Data ====================

  @Column('int', { name: 'session_number' })
  sessionNumber: number;

  @Column('date', { name: 'report_date' })
  reportDate: Date;

  @Column('varchar', { length: 200, name: 'center_name' })
  centerName: string;

  @Column('text', { nullable: true, name: 'counselor_signature' })
  counselorSignature: string | null;

  @Column('text', { name: 'counsel_reason' })
  counselReason: string;

  @Column('text', { name: 'counsel_content' })
  counselContent: string;

  @Column('text', { nullable: true, name: 'center_feedback' })
  centerFeedback: string | null;

  @Column('text', { nullable: true, name: 'home_feedback' })
  homeFeedback: string | null;

  @Column('simple-array', { default: '', name: 'attachment_urls' })
  attachmentUrls: string[];

  // ==================== Status & Workflow ====================

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column('timestamp', { nullable: true, name: 'submitted_at' })
  submittedAt: Date | null;

  @Column('timestamp', { nullable: true, name: 'reviewed_at' })
  reviewedAt: Date | null;

  @Column('text', { nullable: true, name: 'guardian_feedback' })
  guardianFeedback: string | null;

  // ==================== Timestamps ====================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
