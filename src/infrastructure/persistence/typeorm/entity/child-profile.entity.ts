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
import { CareFacilityEntity } from './care-facility.entity';
import { CommunityChildCenterEntity } from './community-child-center.entity';
import { ChildType } from './enums/child-type.enum';
import { PsychologicalStatus } from './enums/psychological-status.enum';

/**
 * 아동 프로필 엔티티
 *
 * 아동 유형별 관계:
 * - CARE_FACILITY (양육시설 아동): careFacilityId로 연결
 * - COMMUNITY_CENTER (지역아동센터 아동): communityChildCenterId로 연결
 *
 * NOTE: 모든 아동은 시설(Institution)에 직접 연결됩니다.
 */
@Entity('child_profiles')
@Index('idx_child_profiles_type', ['childType'])
@Index('idx_child_profiles_psychological_status', ['psychologicalStatus'])
@Index('idx_child_profiles_gender', ['gender'])
export class ChildProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 아동 유형
   */
  @Column({
    type: 'enum',
    enum: ChildType,
    default: ChildType.REGULAR,
  })
  childType: ChildType;

  /**
   * 아동 이름
   */
  @Column({ type: 'varchar', length: 30 })
  name: string;

  /**
   * 생년월일
   */
  @Column({ type: 'date' })
  birthDate: Date;

  /**
   * 성별 (MALE, FEMALE, OTHER)
   */
  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  // ========== 기관 연결 (아동 유형에 따라 선택적) ==========

  /**
   * 양육시설 ID (FK)
   * - CARE_FACILITY 유형만 필수
   */
  @Column({ type: 'uuid', nullable: true })
  careFacilityId: string | null;

  /**
   * 양육시설과의 관계 (Many-to-One)
   */
  @ManyToOne(() => CareFacilityEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'careFacilityId' })
  careFacility: CareFacilityEntity | null;

  /**
   * 지역아동센터 ID (FK)
   * - COMMUNITY_CENTER 유형만 필수
   */
  @Column({ type: 'uuid', nullable: true })
  communityChildCenterId: string | null;

  /**
   * 지역아동센터와의 관계 (Many-to-One)
   */
  @ManyToOne(() => CommunityChildCenterEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communityChildCenterId' })
  communityChildCenter: CommunityChildCenterEntity | null;

  // ========== 추가 정보 ==========

  /**
   * 의료 정보 (민감 정보)
   */
  @Column({ type: 'text', nullable: true })
  medicalInfo: string | null;

  /**
   * 특수 요구사항 (심리/발달 정보)
   */
  @Column({ type: 'text', nullable: true })
  specialNeeds: string | null;

  /**
   * 심리 상태 (Soul-E 챗봇에서 감지)
   * - NORMAL: 일반 (정상 상태)
   * - AT_RISK: 위험 (관심 필요)
   * - HIGH_RISK: 고위험 (즉시 개입 필요)
   */
  @Column({
    type: 'enum',
    enum: PsychologicalStatus,
    default: PsychologicalStatus.NORMAL,
  })
  psychologicalStatus: PsychologicalStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
