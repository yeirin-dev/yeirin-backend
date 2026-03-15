import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SessionType, SessionStatus } from '@domain/counsel-session/model/value-objects/session-enums';
import { VoucherLinkageEntity } from './voucher-linkage.entity';

@Entity('counsel_sessions')
@Index('idx_counsel_sessions_institution_date', ['bImpactInstitutionId', 'scheduledDate'])
@Index('idx_counsel_sessions_linkage', ['voucherLinkageId'])
export class CounselSessionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'voucher_linkage_id' })
  voucherLinkageId: string;

  @ManyToOne(() => VoucherLinkageEntity)
  @JoinColumn({ name: 'voucher_linkage_id' })
  voucherLinkage: VoucherLinkageEntity;

  @Column('uuid', { name: 'counsel_request_id' })
  counselRequestId: string;

  @Column('uuid', { name: 'child_id' })
  childId: string;

  @Column('uuid', { name: 'b_impact_institution_id' })
  bImpactInstitutionId: string;

  @Column('int', { name: 'session_number' })
  sessionNumber: number;

  @Column('date', { name: 'scheduled_date' })
  scheduledDate: Date;

  @Column('varchar', { length: 10, name: 'scheduled_start_time' })
  scheduledStartTime: string;

  @Column('varchar', { length: 10, name: 'scheduled_end_time' })
  scheduledEndTime: string;

  @Column({
    type: 'enum',
    enum: SessionType,
    enumName: 'session_type_enum',
  })
  sessionType: SessionType;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    enumName: 'session_status_enum',
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Column('text', { nullable: true, name: 'cancel_reason' })
  cancelReason?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
