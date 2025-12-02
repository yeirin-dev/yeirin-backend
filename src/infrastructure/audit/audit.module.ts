import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '@infrastructure/persistence/typeorm/entity/audit-log.entity';
import { AuditService } from './audit.service';

/**
 * Audit Module
 * - Global로 등록되어 어디서든 AuditService 주입 가능
 * - 감사 로그 기록 및 조회 기능 제공
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
