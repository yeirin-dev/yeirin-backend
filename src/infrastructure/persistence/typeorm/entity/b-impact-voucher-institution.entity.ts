import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('b_impact_voucher_institutions')
@Index('idx_bvi_district', ['district'])
export class BImpactVoucherInstitutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ──────────────── 기관 기본 정보 ────────────────

  /** 센터명 */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** 대표자명 */
  @Column({ type: 'varchar', length: 50 })
  representativeName: string;

  /** 센터 주소 */
  @Column({ type: 'varchar', length: 255 })
  address: string;

  /** 구/군 (ex: 금정구, 동래구, 사상구) - 주소에서 추출 */
  @Column({ type: 'varchar', length: 20 })
  district: string;

  /** 센터 개소일 */
  @Column({ type: 'date', nullable: true })
  establishedDate: Date | null;

  /** 센터 한 줄 소개 */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ──────────────── 운영 정보 ────────────────

  /** 운영 중인 바우처 프로그램 목록 */
  @Column({ type: 'varchar', array: true, default: '{}' })
  voucherPrograms: string[];

  /** 품질인증 여부 */
  @Column({ type: 'boolean', nullable: true })
  qualityCertified: boolean | null;

  /** 수용가능 아동 수 (텍스트 - "동시간대 4~5명", "100명" 등 형식 다양) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  capacityDescription: string | null;

  // ──────────────── 인력 정보 ────────────────

  /** 전일제 심리상담사 수 */
  @Column({ type: 'smallint', default: 0 })
  counselorFullTime: number;

  /** 시간제 심리상담사 수 */
  @Column({ type: 'smallint', default: 0 })
  counselorPartTime: number;

  /** 심리상담사 보유 자격증 목록 */
  @Column({ type: 'varchar', array: true, default: '{}' })
  counselorCertifications: string[];

  // ──────────────── 서비스 대상 ────────────────

  /** 주요 대상군(1) - 연령 카테고리 */
  @Column({ type: 'varchar', array: true, default: '{}' })
  targetAgeGroups: string[];

  /** 주요 대상군(2) - 증상/장애 유형 */
  @Column({ type: 'varchar', array: true, default: '{}' })
  targetConditions: string[];

  // ──────────────── 서비스 기능 ────────────────

  /** 종합심리검사(풀배터리) 가능여부 */
  @Column({ type: 'boolean', nullable: true })
  fullBatteryTestAvailable: boolean | null;

  /** 제공 서비스 목록 (상담, 언어, 미술, 음악, 놀이, 감각통합, 인지 등) */
  @Column({ type: 'varchar', array: true, default: '{}' })
  services: string[];

  /** 특수치료 가능여부 (발달재활 등) */
  @Column({ type: 'varchar', array: true, nullable: true })
  specialTherapy: string[] | null;

  /** 보호자(가족) 상담 가능여부 */
  @Column({ type: 'boolean', nullable: true })
  guardianCounselingAvailable: boolean | null;

  // ──────────────── 비용 ────────────────

  /** 서비스 이용 단가 (텍스트 - 기관별 형식 다양) */
  @Column({ type: 'text', nullable: true })
  pricingDescription: string | null;

  // ──────────────── 인증 ────────────────

  /** 비밀번호 (bcrypt 해시) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  /** 비밀번호 변경 여부 (첫 로그인 시 변경 필요) */
  @Column({ type: 'boolean', default: false })
  isPasswordChanged: boolean;

  /** 활성 여부 */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // ──────────────── 메타 ────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
