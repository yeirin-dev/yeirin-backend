import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  FastTrackGender,
  FastTrackInstitutionType,
  FastTrackGuardianContactAvailability,
  FastTrackGuardianConsentStatus,
  FastTrackReferralStatus,
} from './enums/fast-track-referral-enums';

@Entity('fast_track_counseling_referrals')
@Index('idx_fast_track_referrals_status', ['status'])
@Index('idx_fast_track_referrals_created_at', ['createdAt'])
export class FastTrackReferralEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 의뢰 처리 상태
   */
  @Column({
    type: 'enum',
    enum: FastTrackReferralStatus,
    default: FastTrackReferralStatus.SUBMITTED,
  })
  status: FastTrackReferralStatus;

  // ============================================
  // 의뢰 메타 정보 (상단 헤더)
  // ============================================

  @Column({ type: 'date', name: 'referral_date' })
  referralDate: Date;

  @Column({ type: 'varchar', length: 200, name: 'institution_name' })
  institutionName: string;

  @Column({ type: 'varchar', length: 100, name: 'staff_name' })
  staffName: string;

  // ============================================
  // 섹션 1: 아동 기본 정보
  // ============================================

  @Column({ type: 'varchar', length: 100, name: 'child_name' })
  childName: string;

  @Column({ type: 'enum', enum: FastTrackGender, name: 'child_gender' })
  childGender: FastTrackGender;

  @Column({ type: 'int', name: 'child_age' })
  childAge: number;

  @Column({ type: 'varchar', length: 50, name: 'child_grade' })
  childGrade: string;

  @Column({ type: 'date', nullable: true, name: 'facility_admission_date' })
  facilityAdmissionDate?: Date;

  @Column({
    type: 'enum',
    enum: FastTrackInstitutionType,
    name: 'institution_type',
  })
  institutionType: FastTrackInstitutionType;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'institution_type_other' })
  institutionTypeOther?: string;

  @Column({
    type: 'enum',
    enum: FastTrackGuardianContactAvailability,
    name: 'guardian_contact_availability',
  })
  guardianContactAvailability: FastTrackGuardianContactAvailability;

  // ============================================
  // 섹션 2: 현재 위기 수준
  // ============================================

  @Column({ type: 'date', name: 'crisis_occurrence_date' })
  crisisOccurrenceDate: Date;

  @Column({ type: 'simple-array', name: 'crisis_levels' })
  crisisLevels: string[];

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'crisis_level_other' })
  crisisLevelOther?: string;

  // ============================================
  // 섹션 3: 정서/심리 관련 정보
  // ============================================

  @Column({ type: 'boolean', name: 'has_pre_existing_psychiatric_condition' })
  hasPreExistingPsychiatricCondition: boolean;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'psychiatric_diagnosis_name' })
  psychiatricDiagnosisName?: string;

  @Column({ type: 'boolean', name: 'is_currently_on_medication' })
  isCurrentlyOnMedication: boolean;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'medication_name' })
  medicationName?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'child_characteristics_and_counseling_notes',
  })
  childCharacteristicsAndCounselingNotes?: string;

  // ============================================
  // 섹션 4: 최근 문제 행동 및 에피소드
  // ============================================

  @Column({ type: 'text', name: 'recent_incidents_and_behavioral_changes' })
  recentIncidentsAndBehavioralChanges: string;

  // ============================================
  // 섹션 5: 의뢰 동기 및 상담 목표
  // ============================================

  @Column({ type: 'text', name: 'referral_motivation' })
  referralMotivation: string;

  @Column({ type: 'text', name: 'counseling_goal' })
  counselingGoal: string;

  // ============================================
  // 섹션 6: 개인정보 공유 및 상담 동의
  // ============================================

  @Column({
    type: 'enum',
    enum: FastTrackGuardianConsentStatus,
    name: 'guardian_consent_status',
  })
  guardianConsentStatus: FastTrackGuardianConsentStatus;

  @Column({ type: 'varchar', length: 100, name: 'consent_person_name' })
  consentPersonName: string;

  @Column({ type: 'varchar', length: 100, name: 'relationship' })
  relationship: string;

  @Column({ type: 'date', name: 'consent_date' })
  consentDate: Date;

  // ============================================
  // 타임스탬프
  // ============================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
