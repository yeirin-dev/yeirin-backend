import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MatchingModule } from './presentation/http/matching/matching.module';
import { InstitutionModule } from './presentation/http/institution/institution.module';
import { CounselorProfileModule } from './presentation/counselor/counselor-profile.module';
import { ReviewModule } from './presentation/review/review.module';
import { AuthModule } from './presentation/auth/auth.module';
import { ChildModule } from './presentation/child/child.module';
import { getTypeOrmConfig } from './infrastructure/config/typeorm.config';
import { JwtAuthGuard } from './infrastructure/auth/guards/jwt-auth.guard';
import { LoggingInterceptor } from './infrastructure/logging/logging.interceptor';

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
    MatchingModule,
    InstitutionModule,
    CounselorProfileModule,
    ReviewModule,
    ChildModule,
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
