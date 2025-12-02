import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 민감 정보 필드 목록
 */
const SENSITIVE_FIELDS = [
  'password',
  'newPassword',
  'currentPassword',
  'refreshToken',
  'accessToken',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
  'socialSecurityNumber',
];

/**
 * 민감 정보 마스킹 처리
 */
const maskSensitiveData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

/**
 * HTTP 요청/응답 로깅 인터셉터
 * - 빅테크 스타일: 구조화된 로그, 성능 측정, 에러 추적
 * - Request ID 추적, 사용자 컨텍스트, 민감정보 마스킹
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers, body, query, params } = request;
    const userAgent = headers['user-agent'] || '';
    const requestId = request.requestId || headers['x-request-id'] || 'unknown';
    const startTime = Date.now();

    // 사용자 정보 추출
    const user = request.user;
    const userId = user?.userId || null;
    const userRole = user?.role || null;

    // 요청 로그 (민감정보 마스킹)
    this.logger.log({
      type: 'request',
      requestId,
      method,
      url,
      ip: ip || headers['x-forwarded-for'],
      userAgent,
      userId,
      userRole,
      query: Object.keys(query || {}).length > 0 ? query : undefined,
      params: Object.keys(params || {}).length > 0 ? params : undefined,
      body: Object.keys(body || {}).length > 0 ? maskSensitiveData(body) : undefined,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          // 응답 로그
          this.logger.log({
            type: 'response',
            requestId,
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            userId,
            timestamp: new Date().toISOString(),
          });

          // 느린 요청 경고 (500ms 이상)
          if (responseTime > 500) {
            this.logger.warn({
              type: 'slow_request',
              requestId,
              method,
              url,
              responseTime: `${responseTime}ms`,
              userId,
              threshold: '500ms',
            });
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          // 에러 로그
          this.logger.error({
            type: 'error',
            requestId,
            method,
            url,
            error: error.message,
            errorName: error.name,
            statusCode: error.status || error.statusCode || 500,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            responseTime: `${responseTime}ms`,
            userId,
            userRole,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
