import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AUDIT_ACTION_KEY, AuditActionMeta } from '../decorators/audit-action.decorator';
import { SKIP_ADMIN_AUDIT_KEY } from '../decorators/skip-admin-audit.decorator';
import { AdminUserContext } from '../guards/admin-permission.guard';

/**
 * Audit Service 인터페이스
 * - yeirin의 AuditService와 호환되는 인터페이스
 */
export interface IAuditService {
  log(dto: AuditLogDto): Promise<void>;
  logImmediate(dto: AuditLogDto): Promise<unknown>;
}

/**
 * Audit Log DTO
 */
export interface AuditLogDto {
  action: string;
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
    responseTime?: number;
  };
  description?: string;
  isSuccess?: boolean;
  errorMessage?: string;
}

/**
 * Admin Audit Interceptor
 * - 모든 Admin API 호출에 대한 감사 로깅
 * - @AuditAction() 데코레이터로 상세 정보 지정 가능
 * - @SkipAdminAudit()으로 조회 API 제외 가능
 *
 * @example
 * ```typescript
 * // Module에서 Interceptor 등록
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: AdminAuditInterceptor,
 *   },
 * ]
 * ```
 */
@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AdminAuditInterceptor');

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject('AuditService') private readonly auditService?: IAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Skip 체크
    const skipAudit = this.reflector.getAllAndOverride<boolean>(SKIP_ADMIN_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAudit) {
      return next.handle();
    }

    // Admin 경로가 아니면 스킵
    if (!request.url.includes('/admin')) {
      return next.handle();
    }

    const startTime = Date.now();
    const user = request.user as AdminUserContext | undefined;

    // AuditAction 메타데이터 추출
    const auditMeta = this.reflector.getAllAndOverride<AuditActionMeta>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 요청 정보 캡처
    const auditContext = {
      action: auditMeta?.action || this.inferActionFromMethod(request.method),
      entityType: auditMeta?.entityType || this.inferEntityType(request.url),
      entityId: request.params?.id,
      userId: user?.userId,
      userEmail: user?.email,
      userRole: user?.role,
      requestBody: this.sanitizeBody(request.body),
      requestId: request.requestId,
      ipAddress: request.ip || request.headers['x-forwarded-for'],
      userAgent: request.headers['user-agent'],
      path: request.url,
      method: request.method,
      level: auditMeta?.level || 'HIGH',
      description: auditMeta?.description,
    };

    return next.handle().pipe(
      tap(async (response) => {
        const responseTime = Date.now() - startTime;

        await this.logAudit({
          ...auditContext,
          entityId: auditContext.entityId || (response as { id?: string })?.id,
          newValue: this.sanitizeResponse(response),
          responseTime,
          isSuccess: true,
        });
      }),
      catchError(async (error) => {
        const responseTime = Date.now() - startTime;

        await this.logAudit({
          ...auditContext,
          responseTime,
          isSuccess: false,
          errorMessage: error.message,
        });

        throw error;
      }),
    );
  }

  /**
   * 감사 로그 기록
   */
  private async logAudit(context: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    requestBody?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    path: string;
    method: string;
    level: string;
    description?: string;
    responseTime: number;
    isSuccess: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const auditLog: AuditLogDto = {
      action: context.action,
      entityType: context.entityType,
      entityId: context.entityId,
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      oldValue: context.requestBody,
      newValue: context.newValue,
      metadata: {
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        source: 'ADMIN_API',
        responseTime: context.responseTime,
      },
      description:
        context.description || `Admin ${context.action}: ${context.method} ${context.path}`,
      isSuccess: context.isSuccess,
      errorMessage: context.errorMessage,
    };

    // AuditService가 주입되어 있으면 사용
    if (this.auditService) {
      try {
        if (context.level === 'HIGH') {
          await this.auditService.logImmediate(auditLog);
        } else {
          await this.auditService.log(auditLog);
        }
      } catch (error) {
        this.logger.error('Failed to save audit log', {
          error: error instanceof Error ? error.message : 'Unknown error',
          auditLog,
        });
      }
    } else {
      // AuditService가 없으면 로그만 출력
      this.logger.log({
        type: 'admin_audit',
        ...auditLog,
      });
    }
  }

  /**
   * HTTP 메서드로부터 액션 추론
   */
  private inferActionFromMethod(method: string): string {
    const methodActionMap: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return methodActionMap[method.toUpperCase()] || 'UNKNOWN';
  }

  /**
   * URL로부터 엔티티 타입 추론
   */
  private inferEntityType(url: string): string {
    // /admin/users/:id -> User
    // /admin/counsel-requests/:id -> CounselRequest
    const match = url.match(/\/admin\/([^/]+)/);
    if (match) {
      const segment = match[1];
      // kebab-case to PascalCase
      return segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    }
    return 'Unknown';
  }

  /**
   * 요청 본문에서 민감 정보 제거
   */
  private sanitizeBody(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    const sanitized = { ...body } as Record<string, unknown>;

    // 민감한 필드 제거
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * 응답에서 민감 정보 제거 및 크기 제한
   */
  private sanitizeResponse(response: unknown): Record<string, unknown> | undefined {
    if (!response || typeof response !== 'object') {
      return undefined;
    }

    const sanitized = { ...response } as Record<string, unknown>;

    // 민감한 필드 제거
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // 큰 배열은 요약
    for (const [key, value] of Object.entries(sanitized)) {
      if (Array.isArray(value) && value.length > 10) {
        sanitized[key] = `[Array: ${value.length} items]`;
      }
    }

    return sanitized;
  }
}
