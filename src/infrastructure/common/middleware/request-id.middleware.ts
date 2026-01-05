import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID 헤더 키
 */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Request에 requestId 타입 확장
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Request ID Middleware
 * - 모든 요청에 고유 ID 부여
 * - 분산 추적 및 로그 연관성 확보
 * - 빅테크 스타일: Correlation ID 패턴
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 기존 Request ID 사용 또는 새로 생성
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) || this.generateRequestId();

    // Request 객체에 저장
    req.requestId = requestId;

    // Response 헤더에도 추가 (클라이언트 추적용)
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }

  /**
   * UUID v4 기반 Request ID 생성
   * 형식: req_{timestamp}_{uuid_short}
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const uuid = uuidv4().replace(/-/g, '').substring(0, 12);
    return `req_${timestamp}_${uuid}`;
  }
}
