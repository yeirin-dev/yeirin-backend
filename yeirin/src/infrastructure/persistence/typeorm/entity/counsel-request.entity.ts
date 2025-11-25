import {
  Column,
  CreateDateColumn,
  Entity,
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
import { GuardianProfileEntity } from './guardian-profile.entity';

@Entity('counsel_requests')
export class CounselRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'child_id' })
  childId: string;

  @ManyToOne(() => ChildProfileEntity, { nullable: false })
  @JoinColumn({ name: 'child_id' })
  child: ChildProfileEntity;

  @Column({ type: 'uuid', name: 'guardian_id' })
  guardianId: string;

  @ManyToOne(() => GuardianProfileEntity, { nullable: false })
  @JoinColumn({ name: 'guardian_id', referencedColumnName: 'userId' })
  guardian: GuardianProfileEntity;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
