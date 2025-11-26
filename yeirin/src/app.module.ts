import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { getTypeOrmConfig } from '@infrastructure/config/typeorm.config';
import { LoggingInterceptor } from '@infrastructure/logging/logging.interceptor';
import { AuthModule } from '@presentation/auth/auth.module';
import { CareFacilityModule } from '@presentation/care-facility/care-facility.module';
import { ChildModule } from '@presentation/child/child.module';
import { CommunityChildCenterModule } from '@presentation/community-child-center/community-child-center.module';
import { CounselReportModule } from '@presentation/counsel-report/counsel-report.module';
import { CounselRequestModule } from '@presentation/counsel-request/counsel-request.module';
import { CounselorProfileModule } from '@presentation/counselor/counselor-profile.module';
import { InstitutionModule } from '@presentation/institution/institution.module';
import { MatchingModule } from '@presentation/matching/matching.module';
import { ReviewModule } from '@presentation/review/review.module';
import { UploadModule } from '@presentation/upload/upload.module';

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
  ],
  providers: [
    // 글로벌 JWT 가드 (모든 라우트에 적용, @Public()으로 제외 가능)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
export class AppModule {}
