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
import { ChildProfileEntity } from './child-profile.entity';
import { ConsentRole } from './enums/consent-role.enum';

/**
 * 동의 항목 JSONB 타입
 */
export interface ConsentItemsJson {
  /** (필수) 개인정보 수집·이용 및 제3자 제공 동의 */
  personalInfo: boolean;
  /** (필수) 민감정보 처리 동의 */
  sensitiveData: boolean;
  /** (선택) 비식별화 데이터 연구 활용 동의 */
  researchData: boolean;
  /** (14세 이상 필수) 아동 본인 동의 */
  childSelfConsent: boolean;
}

/**
 * 아동 동의서 엔티티
 *
 * Soul-E 서비스 이용 전 개인정보 처리 동의를 저장합니다.
 * - 아동당 역할별로 하나의 유효한 동의만 존재 (childId + role unique)
 * - 보호자 동의 (GUARDIAN) / 아동 본인 동의 (CHILD) 분리
 * - 철회 시 revokedAt 기록
 */
@Entity('child_consents')
@Index('idx_child_consents_child_role', ['childId', 'role'], { unique: true })
export class ChildConsentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 아동 ID (FK)
   */
  @Column({ type: 'uuid' })
  @Index()
  childId: string;

  /**
   * 동의 주체 역할 (아동 본인 / 보호자)
   * 기본값: CHILD (기존 동의는 모두 아동 본인 동의)
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: ConsentRole.CHILD,
  })
  role: ConsentRole;

  /**
   * 아동과의 관계 (Many-to-One)
   */
  @ManyToOne(() => ChildProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: ChildProfileEntity;

  /**
   * 동의 항목 (JSONB)
   */
  @Column({ type: 'jsonb' })
  consentItems: ConsentItemsJson;

  /**
   * 동의서 버전
   */
  @Column({ type: 'varchar', length: 20 })
  consentVersion: string;

  /**
   * 동의서 문서 URL
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  documentUrl: string | null;

  /**
   * 동의 시각
   */
  @Column({ type: 'timestamp with time zone' })
  consentedAt: Date;

  /**
   * 철회 시각
   */
  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt: Date | null;

  /**
   * 철회 사유
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  revocationReason: string | null;

  /**
   * 보호자 전화번호 (role이 GUARDIAN인 경우에만 사용)
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  guardianPhone: string | null;

  /**
   * 보호자 관계 (부모, 시설담당자, 기타)
   * role이 GUARDIAN인 경우에만 사용
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  guardianRelation: string | null;

  /**
   * 동의 시 IP 주소
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
