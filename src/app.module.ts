import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '@infrastructure/audit/audit.module';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@infrastructure/auth/guards/roles.guard';
import { GlobalHttpExceptionFilter } from '@infrastructure/common/filters/http-exception.filter';
import { HealthModule } from '@infrastructure/common/health/health.module';
import { RequestIdMiddleware } from '@infrastructure/common/middleware/request-id.middleware';
import { getTypeOrmConfig } from '@infrastructure/config/typeorm.config';
import { LoggingInterceptor } from '@infrastructure/logging/logging.interceptor';
import { AdminApiModule } from '@presentation/admin-api/admin-api.module';
import { AuthModule } from '@presentation/auth/auth.module';
import { CareFacilityModule } from '@presentation/care-facility/care-facility.module';
import { ChildModule } from '@presentation/child/child.module';
import { CommunityChildCenterModule } from '@presentation/community-child-center/community-child-center.module';
import { CounselReportModule } from '@presentation/counsel-report/counsel-report.module';
import { CounselRequestModule } from '@presentation/counsel-request/counsel-request.module';
import { CounselorProfileModule } from '@presentation/counselor/counselor-profile.module';
import { GuardianModule } from '@presentation/guardian/guardian.module';
import { InstitutionModule } from '@presentation/institution/institution.module';
import { MatchingModule } from '@presentation/matching/matching.module';
import { ReviewModule } from '@presentation/review/review.module';
import { UploadModule } from '@presentation/upload/upload.module';
import { WebhookModule } from '@presentation/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),
    // Rate Limiting 설정 (기본: 10초당 10개 요청)
    ThrottlerModule.forRoot([
      {
        ttl: 10000, // 10초
        limit: 10, // 10개 요청
      },
    ]),
    // Infrastructure Modules
    HealthModule,
    AuditModule,
    // Domain Modules
    AuthModule,
    CareFacilityModule,
    ChildModule,
    CommunityChildCenterModule,
    CounselRequestModule,
    CounselReportModule,
    CounselorProfileModule,
    InstitutionModule,
    MatchingModule,
    ReviewModule,
    UploadModule,
    GuardianModule,
    WebhookModule,
    // Admin API Module
    AdminApiModule,
  ],
  providers: [
    // 글로벌 예외 필터 (표준화된 에러 응답)
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    // 글로벌 JWT 가드 (모든 라우트에 적용, @Public()으로 제외 가능)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 글로벌 역할 가드 (RBAC)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 글로벌 Rate Limiting 가드 (DDoS 방어)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 글로벌 로깅 인터셉터
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Request ID 미들웨어 (모든 요청에 적용)
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
