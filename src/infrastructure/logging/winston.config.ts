import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston 로거 설정
 * 빅테크 스타일: 구조화된 로깅, 여러 전송 채널, 환경별 설정
 */
export const createWinstonLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';

  // 로그 포맷 정의
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  );

  // Console 전용 포맷 (개발 환경)
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('Yeirin', {
      colors: true,
      prettyPrint: true,
    }),
  );

  // 전송 채널 설정
  const transports: winston.transport[] = [
    // Console 출력
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : logFormat,
    }),
  ];

  // 프로덕션 환경: 파일 로깅 추가
  if (!isDevelopment) {
    transports.push(
      // 에러 로그
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      // 통합 로그
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: logFormat,
    transports,
    // 처리되지 않은 예외 로깅
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    // 처리되지 않은 Promise 거부 로깅
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
  });
};
