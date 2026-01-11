import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * 표준화된 에러 응답 인터페이스
 * - 빅테크 스타일: 일관된 에러 구조, 디버깅 정보, 추적 가능성
 */
export interface ErrorResponse {
  /** HTTP 상태 코드 */
  statusCode: number;
  /** 에러 코드 (클라이언트 식별용) */
  errorCode: string;
  /** 사용자 친화적 메시지 */
  message: string;
  /** 상세 에러 정보 (배열) */
  details?: string[];
  /** 요청 추적 ID */
  requestId: string;
  /** 요청 경로 */
  path: string;
  /** 에러 발생 시간 */
  timestamp: string;
}

/**
 * 에러 코드 맵핑
 * - HTTP 상태 코드 → 애플리케이션 에러 코드
 */
const ERROR_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Global HTTP Exception Filter
 * - 모든 HTTP 예외를 표준화된 형식으로 변환
 * - 요청 ID 추적, 구조화된 로깅
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 요청 ID 추출 (헤더에서 또는 생성)
    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request as any).requestId ||
      this.generateRequestId();

    // 상태 코드 및 메시지 추출
    const { statusCode, message, details } = this.extractErrorInfo(exception);

    // 에러 코드 결정
    const errorCode = ERROR_CODE_MAP[statusCode] || 'UNKNOWN_ERROR';

    // 표준화된 에러 응답 생성
    const errorResponse: ErrorResponse = {
      statusCode,
      errorCode,
      message,
      details: details.length > 0 ? details : undefined,
      requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 구조화된 로깅
    this.logError(request, errorResponse, exception);

    // 응답 전송
    response.status(statusCode).json(errorResponse);
  }

  /**
   * 예외에서 에러 정보 추출
   */
  private extractErrorInfo(exception: unknown): {
    statusCode: number;
    message: string;
    details: string[];
  } {
    // HttpException 처리
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode, message: response, details: [] };
      }

      if (typeof response === 'object') {
        const responseObj = response as Record<string, unknown>;
        const message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? (responseObj.message[0] as string)
              : '요청을 처리할 수 없습니다';
        const details = Array.isArray(responseObj.message) ? (responseObj.message as string[]) : [];
        return { statusCode, message, details };
      }
    }

    // TypeORM QueryFailedError 처리 (데이터베이스 쿼리 실패)
    if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as { code?: string; detail?: string };

      // PostgreSQL unique violation (중복 키)
      if (driverError?.code === '23505') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: '이미 존재하는 데이터입니다',
          details: driverError.detail ? [driverError.detail] : [],
        };
      }

      // PostgreSQL foreign key violation (외래 키 제약 조건)
      if (driverError?.code === '23503') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '참조된 데이터가 존재하지 않거나 참조 무결성 위반입니다',
          details: driverError.detail ? [driverError.detail] : [],
        };
      }

      // PostgreSQL not null violation (필수 필드 누락)
      if (driverError?.code === '23502') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '필수 필드가 누락되었습니다',
          details: driverError.detail ? [driverError.detail] : [],
        };
      }

      // 기타 DB 에러
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '데이터베이스 처리 중 오류가 발생했습니다',
        details: [],
      };
    }

    // TypeORM EntityNotFoundError 처리
    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: '요청한 데이터를 찾을 수 없습니다',
        details: [],
      };
    }

    // 일반 Error 처리
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '서버 내부 오류가 발생했습니다',
        details: [],
      };
    }

    // 알 수 없는 예외
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '알 수 없는 오류가 발생했습니다',
      details: [],
    };
  }

  /**
   * 구조화된 에러 로깅
   */
  private logError(request: Request, errorResponse: ErrorResponse, exception: unknown): void {
    const logContext = {
      requestId: errorResponse.requestId,
      method: request.method,
      url: request.url,
      statusCode: errorResponse.statusCode,
      errorCode: errorResponse.errorCode,
      message: errorResponse.message,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.headers['x-forwarded-for'],
      userId: (request as any).user?.userId || null,
    };

    // 4xx 에러는 warn, 5xx 에러는 error
    if (errorResponse.statusCode >= 500) {
      this.logger.error({
        ...logContext,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn(logContext);
    }
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
