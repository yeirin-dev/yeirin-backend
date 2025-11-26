import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CareFacilityEntity } from './care-facility.entity';
import { CommunityChildCenterEntity } from './community-child-center.entity';
import { GuardianType } from './enums/guardian-type.enum';
import { UserEntity } from './user.entity';

/**
 * 보호자 프로필 엔티티
 * - 부모, 양육시설 선생님, 지역아동센터 선생님 역할의 상세 정보
 * - User와 1:1 관계 (GUARDIAN 역할만 보유)
 * - 선생님인 경우 해당 기관과 N:1 관계
 */
@Entity('guardian_profiles')
export class GuardianProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 연결된 User ID (FK)
   */
  @Column({ type: 'uuid', unique: true })
  userId: string;

  /**
   * User와의 관계 (1:1)
   */
  @OneToOne(() => UserEntity, (user) => user.guardianProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /**
   * 보호자 유형
   * - PARENT: 부모
   * - CARE_FACILITY_TEACHER: 양육시설 선생님
   * - COMMUNITY_CENTER_TEACHER: 지역아동센터 선생님
   */
  @Column({
    type: 'enum',
    enum: GuardianType,
  })
  guardianType: GuardianType;

  /**
   * 양육시설 ID (FK) - CARE_FACILITY_TEACHER인 경우에만 사용
   */
  @Column({ type: 'uuid', nullable: true })
  careFacilityId: string | null;

  /**
   * 양육시설과의 관계 (N:1)
   */
  @ManyToOne(() => CareFacilityEntity, (facility) => facility.guardians, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'careFacilityId' })
  careFacility: CareFacilityEntity | null;

  /**
   * 지역아동센터 ID (FK) - COMMUNITY_CENTER_TEACHER인 경우에만 사용
   */
  @Column({ type: 'uuid', nullable: true })
  communityChildCenterId: string | null;

  /**
   * 지역아동센터와의 관계 (N:1)
   */
  @ManyToOne(() => CommunityChildCenterEntity, (center) => center.guardians, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'communityChildCenterId' })
  communityChildCenter: CommunityChildCenterEntity | null;

  /**
   * 담당 아동 수 (교사의 경우)
   */
  @Column({ type: 'int', nullable: true })
  numberOfChildren: number | null;

  /**
   * 주소
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string | null;

  /**
   * 상세 주소
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  addressDetail: string | null;

  /**
   * 우편번호
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  /**
   * 비고 (추가 정보)
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
