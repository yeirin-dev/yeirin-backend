import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

/**
 * Admin Auth Module
 *
 * 관리자 인증 모듈
 * - JWT 기반 인증
 * - 환경변수 비밀번호 검증
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('ADMIN_JWT_EXPIRATION', '24h');
        return {
          secret: configService.get<string>('JWT_SECRET', 'your-secret-key-change-this'),
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` | number,
          },
        };
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtAuthGuard],
  exports: [AdminAuthService, AdminJwtAuthGuard, JwtModule],
})
export class AdminAuthModule {}
