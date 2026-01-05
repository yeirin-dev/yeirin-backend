import { Controller, Get, HttpStatus, Inject, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

/**
 * Health Check 응답 인터페이스
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'up' | 'down';
  responseTime?: number;
  details?: Record<string, unknown>;
}

/**
 * Health Check Controller
 * - 쿠버네티스 Liveness/Readiness Probe 지원
 * - 빅테크 스타일: 상세한 헬스 체크, 의존성 상태
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger('HealthCheck');
  private readonly startTime = Date.now();

  constructor(
    @Inject(DataSource)
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 기본 Liveness Probe
   * - 애플리케이션이 살아있는지 확인
   * - 빠른 응답 (DB 체크 없음)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness Probe - 애플리케이션 생존 확인' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness Probe
   * - 트래픽을 받을 준비가 되었는지 확인
   * - DB 연결 등 의존성 체크
   */
  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness Probe - 서비스 준비 상태 확인' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(): Promise<HealthCheckResponse> {
    const checks = await this.performHealthChecks();
    const allHealthy = Object.values(checks).every((check) => check.status === 'up');

    const response: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '0.1.0',
      checks,
    };

    if (!allHealthy) {
      this.logger.warn('Health check failed', response);
    }

    return response;
  }

  /**
   * 상세 Health Check (모니터링용)
   */
  @Public()
  @Get('detailed')
  @ApiOperation({ summary: '상세 Health Check - 모든 컴포넌트 상태' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async detailedHealth(): Promise<HealthCheckResponse & { system: SystemInfo }> {
    const checks = await this.performHealthChecks();
    const allHealthy = Object.values(checks).every((check) => check.status === 'up');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '0.1.0',
      checks,
      system: this.getSystemInfo(),
    };
  }

  /**
   * 모든 헬스 체크 수행
   */
  private async performHealthChecks(): Promise<HealthCheckResponse['checks']> {
    const [database, memory] = await Promise.all([this.checkDatabase(), this.checkMemory()]);

    return { database, memory };
  }

  /**
   * 데이터베이스 연결 체크
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        details: {
          type: 'postgres',
          isConnected: this.dataSource.isInitialized,
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * 메모리 상태 체크
   */
  private checkMemory(): HealthCheckResult {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = Math.round((heapUsedMB / heapTotalMB) * 100);

    // 메모리 사용량 85% 이상이면 unhealthy
    const isHealthy = heapUsagePercent < 85;

    return {
      status: isHealthy ? 'up' : 'down',
      details: {
        heapUsedMB,
        heapTotalMB,
        heapUsagePercent: `${heapUsagePercent}%`,
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
    };
  }

  /**
   * 시스템 정보 수집
   */
  private getSystemInfo(): SystemInfo {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      env: process.env.NODE_ENV || 'development',
    };
  }
}

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
  env: string;
}
