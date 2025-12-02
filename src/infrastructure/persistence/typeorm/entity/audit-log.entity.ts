import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 감사 액션 타입
 */
export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PERMISSION_CHANGE'
  | 'STATUS_CHANGE'
  | 'EXPORT'
  | 'IMPORT';

/**
 * 감사 로그 Entity
 * - 모든 중요 작업에 대한 감사 추적
 * - GDPR, HIPAA 등 컴플라이언스 대응
 * - 빅테크 스타일: 불변 로그, 인덱싱, 보존 정책
 */
@Entity('audit_logs')
@Index(['entityType', 'entityId']) // 엔티티별 조회
@Index(['userId']) // 사용자별 조회
@Index(['action']) // 액션별 조회
@Index(['createdAt']) // 시간별 조회
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 수행된 액션
   */
  @Column({
    type: 'varchar',
    length: 50,
  })
  action: AuditAction;

  /**
   * 대상 엔티티 타입 (User, CounselRequest, CounselReport 등)
   */
  @Column({
    type: 'varchar',
    length: 100,
  })
  entityType: string;

  /**
   * 대상 엔티티 ID
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  entityId: string | null;

  /**
   * 작업 수행자 ID (null = 시스템)
   */
  @Column({
    type: 'uuid',
    nullable: true,
  })
  userId: string | null;

  /**
   * 작업 수행자 이메일 (비정규화 - 사용자 삭제 후에도 추적 가능)
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  userEmail: string | null;

  /**
   * 작업 수행자 역할
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  userRole: string | null;

  /**
   * 변경 전 값 (JSON)
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  oldValue: Record<string, unknown> | null;

  /**
   * 변경 후 값 (JSON)
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  newValue: Record<string, unknown> | null;

  /**
   * 추가 메타데이터
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: {
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    source?: string; // API, WEBHOOK, SYSTEM, ADMIN
  } | null;

  /**
   * 작업 설명
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  /**
   * 성공 여부
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  isSuccess: boolean;

  /**
   * 실패 시 에러 메시지
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
