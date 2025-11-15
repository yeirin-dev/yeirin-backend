import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { VoucherInstitutionEntity } from './voucher-institution.entity';
import { UserEntity } from './user.entity';

/**
 * 심리 상담사 프로필 Entity
 * - User와 1:1 관계 (COUNSELOR 역할만 보유)
 */
@Entity('counselor_profiles')
export class CounselorProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 연결된 User ID (FK) - 상담사 계정
   */
  @Column({ type: 'uuid', unique: true })
  userId: string;

  /**
   * User와의 관계 (1:1)
   */
  @OneToOne(() => UserEntity, (user) => user.counselorProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /** 소속 기관 ID */
  @Column({ type: 'uuid' })
  institutionId: string;

  /** 상담사 이름 (User 테이블의 realName과 중복되지만 비정규화) */
  @Column({ type: 'varchar', length: 50 })
  name: string;

  /** 경력 (년) */
  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  /** 보유 자격증 목록 */
  @Column({ type: 'simple-array' })
  certifications: string[];

  /** 전문 분야 목록 */
  @Column({ type: 'simple-array', nullable: true })
  specialties: string[];

  /** 소개 */
  @Column({ type: 'text', nullable: true })
  introduction: string;

  /** 소속 기관 관계 */
  @ManyToOne(() => VoucherInstitutionEntity, (institution) => institution.counselorProfiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'institutionId' })
  institution: VoucherInstitutionEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
