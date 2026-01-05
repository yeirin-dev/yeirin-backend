import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CounselorProfileEntity } from './counselor-profile.entity';
import { ServiceType } from './enums/service-type.enum';
import { SpecialTreatment } from './enums/special-treatment.enum';
import { VoucherType } from './enums/voucher-type.enum';
import { ReviewEntity } from './review.entity';
import { UserEntity } from './user.entity';

/**
 * 바우처 기관 (상담 공급 기관) Entity
 * - User와 1:1 관계 (INSTITUTION_ADMIN 역할만 보유)
 */
@Entity('voucher_institutions')
export class VoucherInstitutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 연결된 User ID (FK) - 기관 대표
   */
  @Column({ type: 'uuid', unique: true })
  userId: string;

  /**
   * User와의 관계 (1:1)
   */
  @OneToOne(() => UserEntity, (user) => user.voucherInstitution, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  /** 센터명 */
  @Column({ type: 'varchar', length: 100 })
  centerName: string;

  /** 대표자명 (User 테이블의 realName과 중복되지만 비정규화) */
  @Column({ type: 'varchar', length: 50 })
  representativeName: string;

  /** 센터 주소 */
  @Column({ type: 'varchar', length: 200 })
  address: string;

  /** 센터 개소일 */
  @Column({ type: 'date' })
  establishedDate: Date;

  /** 운영 중인 바우처 목록 */
  @Column({
    type: 'enum',
    enum: VoucherType,
    array: true,
  })
  operatingVouchers: VoucherType[];

  /** 품질 인증 여부 */
  @Column({ type: 'boolean', default: false })
  isQualityCertified: boolean;

  /** 수용 가능한 아동 수 */
  @Column({ type: 'int' })
  maxCapacity: number;

  /** 센터 한 줄 소개 */
  @Column({ type: 'varchar', length: 200 })
  introduction: string;

  /** 심리 상담사 수 */
  @Column({ type: 'int', default: 0 })
  counselorCount: number;

  /** 심리 상담사 보유 자격증 목록 (집계) */
  @Column({ type: 'simple-array', nullable: true })
  counselorCertifications: string[];

  /** 주요 대상군 1 */
  @Column({ type: 'varchar', length: 50 })
  primaryTargetGroup: string;

  /** 주요 대상군 2 */
  @Column({ type: 'varchar', length: 50, nullable: true })
  secondaryTargetGroup: string;

  /** 종합심리검사 가능 여부 */
  @Column({ type: 'boolean', default: false })
  canProvideComprehensiveTest: boolean;

  /** 제공 서비스 목록 */
  @Column({
    type: 'enum',
    enum: ServiceType,
    array: true,
  })
  providedServices: ServiceType[];

  /** 특수치료 가능 여부 목록 */
  @Column({
    type: 'enum',
    enum: SpecialTreatment,
    array: true,
  })
  specialTreatments: SpecialTreatment[];

  /** 보호자 상담 가능 여부 */
  @Column({ type: 'boolean', default: false })
  canProvideParentCounseling: boolean;

  /** 평균 별점 (캐시) */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  /** 리뷰 개수 (캐시) */
  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  /** 상담사 프로필 목록 */
  @OneToMany(() => CounselorProfileEntity, (profile) => profile.institution, {
    cascade: true,
  })
  counselorProfiles: CounselorProfileEntity[];

  /** 리뷰 목록 */
  @OneToMany(() => ReviewEntity, (review) => review.institution)
  reviews: ReviewEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
