import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston 로거 설정
 * 빅테크 스타일: 구조화된 로깅, 여러 전송 채널, 환경별 설정
 *
 * 🇰🇷 한국 시간(KST) 기준 타임스탬프 사용
 */

/**
 * 한국 시간(KST) 기준 타임스탬프 포맷터
 * process.env.TZ = 'Asia/Seoul'이 main.ts에서 설정되어 있음
 */
const koreaTimestamp = winston.format((info) => {
  const now = new Date();
  // TZ 환경변수가 설정되어 있으므로 toLocaleString 사용
  info.timestamp = now.toLocaleString('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace('T', ' ');
  return info;
});

export const createWinstonLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';

  // 로그 포맷 정의 (한국 시간 사용)
  const logFormat = winston.format.combine(
    koreaTimestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  );

  // Console 전용 포맷 (개발 환경, 한국 시간 사용)
  const consoleFormat = winston.format.combine(
    koreaTimestamp(),
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
    exceptionHandlers: [new winston.transports.File({ filename: 'logs/exceptions.log' })],
    // 처리되지 않은 Promise 거부 로깅
    rejectionHandlers: [new winston.transports.File({ filename: 'logs/rejections.log' })],
  });
};
