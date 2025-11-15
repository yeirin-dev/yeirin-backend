import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GuardianProfileEntity } from './guardian-profile.entity';
import { VoucherInstitutionEntity } from './voucher-institution.entity';

/**
 * 아동 프로필 엔티티
 * - Guardian(부모/교사) 또는 Institution(양육시설) 중 하나와 연결
 * - 직접 회원가입 불가, Guardian이 등록
 */
@Entity('child_profiles')
export class ChildProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  /**
   * 보호자 ID (FK) - 부모 또는 양육시설 교사
   * guardianId와 institutionId 중 하나만 존재
   */
  @Column({ type: 'uuid', nullable: true })
  guardianId: string | null;

  /**
   * 보호자와의 관계 (Many-to-One)
   */
  @ManyToOne(() => GuardianProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guardianId' })
  guardian: GuardianProfileEntity | null;

  /**
   * 양육시설 ID (FK) - 고아인 경우
   */
  @Column({ type: 'uuid', nullable: true })
  institutionId: string | null;

  /**
   * 양육시설과의 관계 (Many-to-One)
   */
  @ManyToOne(() => VoucherInstitutionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'institutionId' })
  institution: VoucherInstitutionEntity | null;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
