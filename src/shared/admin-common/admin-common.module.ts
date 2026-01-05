import {
  DynamicModule,
  Module,
  Provider,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AdminPermissionGuard } from './guards/admin-permission.guard';
import { AdminAuditInterceptor, IAuditService } from './interceptors/admin-audit.interceptor';

/**
 * AdminCommonModule 설정 옵션
 */
export interface AdminCommonModuleOptions {
  /**
   * AuditService 인스턴스 (optional)
   * - 제공하지 않으면 콘솔 로깅만 수행
   */
  auditService?: IAuditService;

  /**
   * AdminPermissionGuard를 전역으로 등록할지 여부
   * @default false
   */
  globalGuard?: boolean;

  /**
   * AdminAuditInterceptor를 전역으로 등록할지 여부
   * @default false
   */
  globalInterceptor?: boolean;
}

/**
 * Admin Common Module
 *
 * Admin API 공통 기능을 제공하는 모듈
 * - Guards: AdminPermissionGuard
 * - Interceptors: AdminAuditInterceptor
 * - Decorators: @AdminOnly, @AdminPermissions, @AuditAction, @SkipAdminAudit
 *
 * @example
 * ```typescript
 * // 기본 사용 (전역 등록 없이)
 * @Module({
 *   imports: [AdminCommonModule.register()],
 * })
 * export class AdminApiModule {}
 *
 * // AuditService 연동 + 전역 등록
 * @Module({
 *   imports: [
 *     AdminCommonModule.registerAsync({
 *       imports: [AuditModule],
 *       inject: [AuditService],
 *       useFactory: (auditService: AuditService) => ({
 *         auditService,
 *         globalGuard: true,
 *         globalInterceptor: true,
 *       }),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class AdminCommonModule {
  /**
   * 동기 등록
   */
  static register(options: AdminCommonModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [AdminPermissionGuard, AdminAuditInterceptor];

    // AuditService 주입
    if (options.auditService) {
      providers.push({
        provide: 'AuditService',
        useValue: options.auditService,
      });
    }

    // 전역 Guard 등록
    if (options.globalGuard) {
      providers.push({
        provide: APP_GUARD,
        useClass: AdminPermissionGuard,
      });
    }

    // 전역 Interceptor 등록
    if (options.globalInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: AdminAuditInterceptor,
      });
    }

    return {
      module: AdminCommonModule,
      providers,
      exports: [AdminPermissionGuard, AdminAuditInterceptor],
    };
  }

  /**
   * 비동기 등록 (의존성 주입 사용 시)
   */
  static registerAsync(options: {
    imports?: DynamicModule[];
    inject?: (InjectionToken | OptionalFactoryDependency)[];
    useFactory: (
      ...args: unknown[]
    ) => AdminCommonModuleOptions | Promise<AdminCommonModuleOptions>;
  }): DynamicModule {
    return {
      module: AdminCommonModule,
      imports: options.imports as never[],
      providers: [
        AdminPermissionGuard,
        AdminAuditInterceptor,
        {
          provide: 'ADMIN_COMMON_OPTIONS',
          inject: options.inject,
          useFactory: options.useFactory,
        },
        {
          provide: 'AuditService',
          inject: ['ADMIN_COMMON_OPTIONS'],
          useFactory: (opts: AdminCommonModuleOptions) => opts.auditService,
        },
        // 조건부 전역 Guard
        {
          provide: 'ADMIN_GLOBAL_GUARD',
          inject: ['ADMIN_COMMON_OPTIONS'],
          useFactory: (opts: AdminCommonModuleOptions) => {
            if (opts.globalGuard) {
              return {
                provide: APP_GUARD,
                useClass: AdminPermissionGuard,
              };
            }
            return null;
          },
        },
        // 조건부 전역 Interceptor
        {
          provide: 'ADMIN_GLOBAL_INTERCEPTOR',
          inject: ['ADMIN_COMMON_OPTIONS'],
          useFactory: (opts: AdminCommonModuleOptions) => {
            if (opts.globalInterceptor) {
              return {
                provide: APP_INTERCEPTOR,
                useClass: AdminAuditInterceptor,
              };
            }
            return null;
          },
        },
      ],
      exports: [AdminPermissionGuard, AdminAuditInterceptor],
    };
  }

  /**
   * 기본 설정으로 등록 (테스트용)
   */
  static forRoot(): DynamicModule {
    return this.register({
      globalGuard: false,
      globalInterceptor: false,
    });
  }
}
