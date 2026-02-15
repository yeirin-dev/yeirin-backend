import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SoulEClient } from '@infrastructure/external/soul-e.client';
import { AdminAuthModule } from '../auth/admin-auth.module';
import { AdminSessionController } from './admin-session.controller';
import { AdminSessionService } from './admin-session.service';

/**
 * Admin Session Module
 * 채팅 세션 조회 Admin API
 *
 * Soul-E 백엔드의 채팅 세션 데이터를 어드민에 제공
 */
@Module({
  imports: [ConfigModule, forwardRef(() => AdminAuthModule)],
  controllers: [AdminSessionController],
  providers: [AdminSessionService, SoulEClient],
  exports: [AdminSessionService, SoulEClient],
})
export class AdminSessionModule {}
