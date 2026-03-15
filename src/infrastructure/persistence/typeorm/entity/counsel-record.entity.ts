import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecordStatus } from '@domain/counsel-record/model/value-objects/record-status';
import { CounselSessionEntity } from './counsel-session.entity';

@Entity('counsel_records')
@Index('idx_counsel_records_institution', ['bImpactInstitutionId'])
@Index('idx_counsel_records_session', ['counselSessionId'], { unique: true })
export class CounselRecordEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'counsel_session_id', unique: true })
  counselSessionId: string;

  @OneToOne(() => CounselSessionEntity)
  @JoinColumn({ name: 'counsel_session_id' })
  counselSession: CounselSessionEntity;

  @Column('uuid', { name: 'voucher_linkage_id' })
  voucherLinkageId: string;

  @Column('uuid', { name: 'counsel_request_id' })
  counselRequestId: string;

  @Column('uuid', { name: 'child_id' })
  childId: string;

  @Column('uuid', { name: 'b_impact_institution_id' })
  bImpactInstitutionId: string;

  @Column('int', { name: 'session_number' })
  sessionNumber: number;

  @Column('date', { name: 'record_date' })
  recordDate: Date;

  @Column('text', { name: 'counsel_content' })
  counselContent: string;

  @Column('text', { nullable: true, name: 'child_observation' })
  childObservation?: string;

  @Column('text', { nullable: true, name: 'counselor_opinion' })
  counselorOpinion?: string;

  @Column('text', { nullable: true, name: 'next_session_plan' })
  nextSessionPlan?: string;

  @Column('boolean', { default: false, name: 'additional_counseling_needed' })
  additionalCounselingNeeded: boolean;

  @Column('simple-array', { default: '', name: 'attachment_urls' })
  attachmentUrls: string[];

  @Column({
    type: 'enum',
    enum: RecordStatus,
    enumName: 'record_status_enum',
    default: RecordStatus.DRAFT,
  })
  status: RecordStatus;

  @Column('text', { nullable: true, name: 'ai_summary' })
  aiSummary?: string;

  @Column('text', { nullable: true, name: 'ai_summary_for_guardian' })
  aiSummaryForGuardian?: string;

  @Column('timestamp', { nullable: true, name: 'ai_summarized_at' })
  aiSummarizedAt?: Date;

  @Column('timestamp', { nullable: true, name: 'shared_at' })
  sharedAt?: Date;

  @Column('timestamp', { nullable: true, name: 'submitted_at' })
  submittedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
