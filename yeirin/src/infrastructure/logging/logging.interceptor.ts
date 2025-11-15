import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * HTTP 요청/응답 로깅 인터셉터
 * 빅테크 스타일: 구조화된 로그, 성능 측정, 에러 추적
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // 요청 로그
    this.logger.log({
      type: 'request',
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          // 응답 로그
          this.logger.log({
            type: 'response',
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          // 에러 로그
          this.logger.error({
            type: 'error',
            method,
            url,
            error: error.message,
            stack: error.stack,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
