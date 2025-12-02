import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health Check Module
 * - Kubernetes Liveness/Readiness Probe 지원
 * - 시스템 모니터링용 상세 헬스 체크
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
