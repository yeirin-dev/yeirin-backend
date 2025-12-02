import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChildProfileEntity } from './child-profile.entity';
import { PsychologicalStatus } from './enums/psychological-status.enum';

/**
 * 아동 심리 상태 변경 로그 엔티티
 *
 * Soul-E 챗봇에서 위험 징후를 감지할 때마다 로그가 생성됩니다.
 * 상태 변경 이력을 추적하여 아동의 심리 상태 변화를 모니터링합니다.
 */
@Entity('psychological_status_logs')
export class PsychologicalStatusLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 아동 ID (FK)
   */
  @Column({ type: 'uuid' })
  childId: string;

  /**
   * 아동 프로필과의 관계 (Many-to-One)
   */
  @ManyToOne(() => ChildProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: ChildProfileEntity;

  /**
   * 변경 전 상태
   */
  @Column({
    type: 'enum',
    enum: PsychologicalStatus,
  })
  previousStatus: PsychologicalStatus;

  /**
   * 변경 후 상태
   */
  @Column({
    type: 'enum',
    enum: PsychologicalStatus,
  })
  newStatus: PsychologicalStatus;

  /**
   * 변경 사유/근거
   * Soul-E 챗봇에서 감지한 위험 징후 설명
   */
  @Column({ type: 'text' })
  reason: string;

  /**
   * 감지 출처
   * - SOUL_E: Soul-E 챗봇에서 자동 감지
   * - COUNSELOR: 상담사가 수동으로 변경
   * - SYSTEM: 시스템에서 자동 변경 (예: 일정 기간 후 자동 하락)
   */
  @Column({
    type: 'enum',
    enum: ['SOUL_E', 'COUNSELOR', 'SYSTEM'],
    default: 'SOUL_E',
  })
  source: 'SOUL_E' | 'COUNSELOR' | 'SYSTEM';

  /**
   * 관련 세션 ID (Soul-E 채팅 세션)
   * Soul-E에서 감지한 경우에만 값이 있음
   */
  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  /**
   * 상태 상승 여부 (위험도 증가)
   * true: NORMAL → AT_RISK, AT_RISK → HIGH_RISK
   * false: HIGH_RISK → AT_RISK, AT_RISK → NORMAL
   */
  @Column({ type: 'boolean', default: false })
  isEscalation: boolean;

  /**
   * 메타데이터 (JSON)
   * - 감지된 키워드, 대화 맥락 등 추가 정보
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
