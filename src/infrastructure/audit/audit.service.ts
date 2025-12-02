import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditAction,
  AuditLogEntity,
} from '@infrastructure/persistence/typeorm/entity/audit-log.entity';

/**
 * 감사 로그 생성 DTO
 */
export interface CreateAuditLogDto {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: {
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    source?: string;
  };
  description?: string;
  isSuccess?: boolean;
  errorMessage?: string;
}

/**
 * 요청 컨텍스트에서 추출할 사용자 정보
 */
export interface AuditUserContext {
  userId?: string;
  email?: string;
  role?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Service
 * - 감사 로그 생성 및 조회
 * - 비동기 처리로 성능 영향 최소화
 * - 빅테크 스타일: 비차단 로깅, 배치 처리
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');
  private readonly logQueue: CreateAuditLogDto[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {
    // 주기적으로 큐 처리 (5초마다)
    setInterval(() => this.processQueue(), 5000);
  }

  /**
   * 감사 로그 기록 (비동기, 비차단)
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    // 큐에 추가 (비차단)
    this.logQueue.push(dto);

    // 큐가 일정 크기 이상이면 즉시 처리
    if (this.logQueue.length >= 10) {
      await this.processQueue();
    }
  }

  /**
   * 감사 로그 즉시 기록 (동기)
   * - 중요한 작업에 사용 (로그인, 권한 변경 등)
   */
  async logImmediate(dto: CreateAuditLogDto): Promise<AuditLogEntity> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...dto,
        isSuccess: dto.isSuccess ?? true,
      });

      const saved = await this.auditLogRepository.save(auditLog);

      this.logger.debug({
        type: 'audit_logged',
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        userId: dto.userId,
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to save audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dto,
      });
      throw error;
    }
  }

  /**
   * 요청 컨텍스트 기반 로그 헬퍼
   */
  async logWithContext(
    context: AuditUserContext,
    dto: Omit<CreateAuditLogDto, 'userId' | 'userEmail' | 'userRole' | 'metadata'> & {
      metadata?: Omit<CreateAuditLogDto['metadata'], 'requestId' | 'ipAddress' | 'userAgent'>;
    },
  ): Promise<void> {
    await this.log({
      ...dto,
      userId: context.userId,
      userEmail: context.email,
      userRole: context.role,
      metadata: {
        ...dto.metadata,
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
  }

  /**
   * 엔티티별 감사 로그 조회
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 사용자별 감사 로그 조회
   */
  async findByUser(userId: string, limit = 100): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 액션별 감사 로그 조회
   */
  async findByAction(action: AuditAction, limit = 100): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 기간별 감사 로그 조회
   */
  async findByDateRange(startDate: Date, endDate: Date, limit = 1000): Promise<AuditLogEntity[]> {
    return this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :startDate', { startDate })
      .andWhere('audit.createdAt <= :endDate', { endDate })
      .orderBy('audit.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 큐 처리 (배치 저장)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 큐에서 로그 추출 (최대 100개)
      const logsToProcess = this.logQueue.splice(0, 100);

      if (logsToProcess.length === 0) {
        return;
      }

      // 배치 저장
      const auditLogs = logsToProcess.map((dto) =>
        this.auditLogRepository.create({
          ...dto,
          isSuccess: dto.isSuccess ?? true,
        }),
      );

      await this.auditLogRepository.save(auditLogs);

      this.logger.debug(`Processed ${auditLogs.length} audit logs`);
    } catch (error) {
      this.logger.error('Failed to process audit log queue', {
        error: error instanceof Error ? error.message : 'Unknown error',
        queueSize: this.logQueue.length,
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
