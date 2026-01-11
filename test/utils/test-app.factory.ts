/**
 * E2E 테스트 앱 팩토리
 *
 * 통합 테스트를 위한 NestJS 애플리케이션 생성 및 관리
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

// Domain Modules
import { AuthModule } from '@presentation/auth/auth.module';
import { CareFacilityModule } from '@presentation/care-facility/care-facility.module';
import { ChildModule } from '@presentation/child/child.module';
import { CommunityChildCenterModule } from '@presentation/community-child-center/community-child-center.module';
import { CounselRequestModule } from '@presentation/counsel-request/counsel-request.module';
import { CounselReportModule } from '@presentation/counsel-report/counsel-report.module';
import { MatchingModule } from '@presentation/matching/matching.module';
import { ReviewModule } from '@presentation/review/review.module';
import { UploadModule } from '@presentation/upload/upload.module';
import { WebhookModule } from '@presentation/webhook/webhook.module';
import { InstitutionDashboardModule } from '@presentation/institution-dashboard/institution-dashboard.module';
import { ConsentModule } from '@presentation/consent/consent.module';
import { HealthModule } from '@infrastructure/common/health/health.module';

// External Clients (for mocking)
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { YeirinAIClient } from '@infrastructure/external/yeirin-ai.client';

/**
 * 테스트 앱 설정 옵션
 */
export interface TestAppOptions {
  /**
   * 스키마 드롭 여부 (각 테스트 전 초기화)
   */
  dropSchema?: boolean;

  /**
   * 로깅 활성화 여부
   */
  logging?: boolean;

  /**
   * Rate limiting 비활성화 여부
   */
  disableThrottler?: boolean;

  /**
   * 특정 모듈만 로드 (미지정 시 전체 로드)
   */
  modules?: Array<new (...args: unknown[]) => unknown>;
}

/**
 * 테스트 앱 생성 결과
 */
export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
}

/**
 * 테스트 앱 팩토리 클래스
 */
export class TestAppFactory {
  private static defaultModules = [
    AuthModule,
    CareFacilityModule,
    ChildModule,
    CommunityChildCenterModule,
    CounselRequestModule,
    CounselReportModule,
    MatchingModule,
    ReviewModule,
    UploadModule,
    WebhookModule,
    InstitutionDashboardModule,
    ConsentModule,
    HealthModule,
  ];

  /**
   * E2E 테스트용 앱 생성
   */
  static async create(options: TestAppOptions = {}): Promise<TestAppContext> {
    const {
      dropSchema = true,
      logging = false,
      disableThrottler = true,
      modules = this.defaultModules,
    } = options;

    const imports = [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
        // 테스트 환경 기본값
        load: [
          () => ({
            // Database
            DB_HOST: process.env.DB_HOST || 'localhost',
            DB_PORT: process.env.DB_PORT || 5433,
            DB_USERNAME: process.env.DB_USERNAME || 'yeirin_test',
            DB_PASSWORD: process.env.DB_PASSWORD || 'yeirin_test',
            DB_DATABASE: process.env.DB_DATABASE || 'yeirin_test',
            // JWT
            JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key',
            JWT_REFRESH_SECRET:
              process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key',
            JWT_ACCESS_TOKEN_EXPIRATION: '7d',
            JWT_REFRESH_TOKEN_EXPIRATION: '30d',
            // AWS S3 (MinIO compatible)
            AWS_REGION: process.env.AWS_REGION || 'ap-northeast-2',
            AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'yeirin-test-bucket',
            AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT || 'http://localhost:9000',
            AWS_S3_FORCE_PATH_STYLE: 'true',
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin123',
            // Internal API Secrets
            INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET || 'test-internal-secret',
            SOUL_E_SECRET: process.env.SOUL_E_SECRET || 'test-soul-e-secret',
            YEIRIN_WEBHOOK_SECRET: process.env.YEIRIN_WEBHOOK_SECRET || 'test-webhook-secret',
            // AI Service
            AI_RECOMMENDATION_SERVICE_URL:
              process.env.AI_RECOMMENDATION_SERVICE_URL || 'http://localhost:8001',
          }),
        ],
      }),
      TypeOrmModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: parseInt(configService.get<string>('DB_PORT') || '5433', 10),
          username: configService.get<string>('DB_USERNAME') || 'yeirin_test',
          password: configService.get<string>('DB_PASSWORD') || 'yeirin_test',
          database: configService.get<string>('DB_DATABASE') || 'yeirin_test',
          entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema,
          logging,
        }),
      }),
      // Rate Limiting (테스트에서는 비활성화 가능)
      ThrottlerModule.forRoot(
        disableThrottler
          ? [{ ttl: 0, limit: 0 }]
          : [{ ttl: 10000, limit: 100 }],
      ),
      ...modules,
    ];

    // Mock 외부 클라이언트 (HTTP 호출 방지)
    const mockSoulEClient = {
      getAssessmentResults: jest.fn().mockResolvedValue([]),
      getLatestAssessmentResult: jest.fn().mockResolvedValue(null),
      healthCheck: jest.fn().mockResolvedValue(true),
      generateGuardianConsentLink: jest.fn().mockResolvedValue({
        token: 'test-token',
        consent_url: 'https://test.yeirin.com/consent/test-token',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        child_id: 'test-child-id',
        child_name: '테스트아동',
      }),
    };

    const mockYeirinAIClient = {
      requestIntegratedReport: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports,
    })
      .overrideProvider(SoulEClient)
      .useValue(mockSoulEClient)
      .overrideProvider(YeirinAIClient)
      .useValue(mockYeirinAIClient)
      .compile();

    const app = moduleFixture.createNestApplication();

    // 글로벌 파이프 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    const dataSource = moduleFixture.get<DataSource>(DataSource);

    return {
      app,
      module: moduleFixture,
      dataSource,
    };
  }

  /**
   * 테스트 앱 정리
   */
  static async cleanup(context: TestAppContext): Promise<void> {
    if (context.app) {
      await context.app.close();
    }
  }

  /**
   * 인증 모듈만 포함한 최소 테스트 앱 생성
   */
  static async createAuthOnly(options: Omit<TestAppOptions, 'modules'> = {}): Promise<TestAppContext> {
    return this.create({
      ...options,
      modules: [AuthModule, CareFacilityModule, CommunityChildCenterModule],
    });
  }

  /**
   * 상담의뢰 워크플로우 테스트용 앱 생성
   */
  static async createCounselFlow(options: Omit<TestAppOptions, 'modules'> = {}): Promise<TestAppContext> {
    return this.create({
      ...options,
      modules: [
        AuthModule,
        CareFacilityModule,
        CommunityChildCenterModule,
        ChildModule,
        CounselRequestModule,
        MatchingModule,
      ],
    });
  }
}

/**
 * 테스트 환경 변수 설정 헬퍼
 */
export function setupTestEnv(): void {
  process.env.NODE_ENV = 'test';
  // Database
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.DB_PORT || '5433';
  process.env.DB_USERNAME = process.env.DB_USERNAME || 'yeirin_test';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'yeirin_test';
  process.env.DB_DATABASE = process.env.DB_DATABASE || 'yeirin_test';
  // JWT
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key';
  // AWS S3
  process.env.AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2';
  process.env.AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'yeirin-test-bucket';
  process.env.AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT || 'http://localhost:9000';
  process.env.AWS_S3_FORCE_PATH_STYLE = 'true';
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'minioadmin';
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin123';
  // Internal API Secrets
  process.env.INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'test-internal-secret';
  process.env.SOUL_E_SECRET = process.env.SOUL_E_SECRET || 'test-soul-e-secret';
  process.env.YEIRIN_WEBHOOK_SECRET = process.env.YEIRIN_WEBHOOK_SECRET || 'test-webhook-secret';
  // AI Service
  process.env.AI_RECOMMENDATION_SERVICE_URL =
    process.env.AI_RECOMMENDATION_SERVICE_URL || 'http://localhost:8001';
}
