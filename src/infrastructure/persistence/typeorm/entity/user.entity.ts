import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CounselorProfileEntity } from './counselor-profile.entity';
import { GuardianProfileEntity } from './guardian-profile.entity';
import { VoucherInstitutionEntity } from './voucher-institution.entity';

/**
 * 사용자 Entity (Infrastructure Layer)
 * - TypeORM 전용 (프레임워크 의존성)
 * - Domain의 User Aggregate와 분리
 */
@Entity('users')
@Index('idx_users_role', ['role'])
@Index('idx_users_created_at', ['createdAt'])
@Index('idx_users_last_login', ['lastLoginAt'])
@Index('idx_users_is_banned', ['isBanned'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 이메일 (로그인 ID) */
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  /** 비밀번호 (해시) */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /** 실명 */
  @Column({ type: 'varchar', length: 50 })
  realName: string;

  /** 전화번호 */
  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  /** 사용자 역할 */
  @Column({
    type: 'enum',
    enum: ['GUARDIAN', 'INSTITUTION_ADMIN', 'COUNSELOR', 'ADMIN'],
    default: 'GUARDIAN',
  })
  role: 'GUARDIAN' | 'INSTITUTION_ADMIN' | 'COUNSELOR' | 'ADMIN';

  /** 리프레시 토큰 (로그아웃 처리용) */
  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  /** 이메일 인증 여부 */
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  /** 계정 활성화 여부 */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** 계정 정지 여부 */
  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  /** 정지 사유 */
  @Column({ type: 'text', nullable: true })
  banReason: string | null;

  /** 정지 일시 */
  @Column({ type: 'timestamp', nullable: true })
  bannedAt: Date | null;

  /** 마지막 로그인 시간 */
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  /**
   * 보호자 프로필 (GUARDIAN 역할일 때만 존재)
   */
  @OneToOne(() => GuardianProfileEntity, (profile) => profile.user, {
    nullable: true,
  })
  guardianProfile?: GuardianProfileEntity;

  /**
   * 바우처 기관 정보 (INSTITUTION_ADMIN 역할일 때만 존재)
   */
  @OneToOne(() => VoucherInstitutionEntity, (institution) => institution.user, {
    nullable: true,
  })
  voucherInstitution?: VoucherInstitutionEntity;

  /**
   * 상담사 프로필 (COUNSELOR 역할일 때만 존재)
   */
  @OneToOne(() => CounselorProfileEntity, (profile) => profile.user, {
    nullable: true,
  })
  counselorProfile?: CounselorProfileEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
