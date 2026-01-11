/**
 * 테스트 Mock 통합 Export
 */

// Yeirin-AI 추천 서비스 Mock
export * from './yeirin-ai.mock';

// S3/MinIO 스토리지 Mock
export * from './s3.mock';

// SMS 발송 서비스 Mock
export * from './sms.mock';

// Soul-E 클라이언트 Mock
export * from './soul-e.mock';

/**
 * 모든 Mock 리셋 헬퍼
 *
 * @example
 * beforeEach(() => {
 *   resetAllMocks();
 * });
 */
export function resetAllMocks(): void {
  // Lazy import to avoid circular dependencies
  const { yeirinAiMock } = require('./yeirin-ai.mock');
  const { s3Mock } = require('./s3.mock');
  const { smsMock } = require('./sms.mock');
  const { soulEMock } = require('./soul-e.mock');

  yeirinAiMock.reset();
  s3Mock.reset();
  smsMock.reset();
  soulEMock.reset();
}

/**
 * NestJS 테스트 모듈용 Provider 배열
 *
 * @example
 * const module = await Test.createTestingModule({
 *   providers: [
 *     ...MockProviders,
 *   ],
 * }).compile();
 */
export const MockProviders = [
  {
    provide: 'YeirinAiService',
    useFactory: () => {
      const { createYeirinAiMock } = require('./yeirin-ai.mock');
      return createYeirinAiMock();
    },
  },
  {
    provide: 'S3Service',
    useFactory: () => {
      const { createS3Mock } = require('./s3.mock');
      return createS3Mock();
    },
  },
  {
    provide: 'SmsService',
    useFactory: () => {
      const { createSmsMock } = require('./sms.mock');
      return createSmsMock();
    },
  },
  {
    provide: 'SoulEClient',
    useFactory: () => {
      const { createSoulEMock } = require('./soul-e.mock');
      return createSoulEMock();
    },
  },
];
