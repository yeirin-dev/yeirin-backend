import { DomainError, Result } from '@domain/common/result';

/**
 * 사용자 역할 타입
 */
export type UserRoleType = 'GUARDIAN' | 'INSTITUTION_ADMIN' | 'COUNSELOR' | 'ADMIN';

/**
 * 권한 타입
 */
type Permission = string;

/**
 * UserRole Value Object
 * - 역할 기반 접근 제어 (RBAC)
 * - 각 역할별 권한 정의
 */
export class UserRole {
  private static readonly VALID_ROLES: UserRoleType[] = [
    'GUARDIAN',
    'INSTITUTION_ADMIN',
    'COUNSELOR',
    'ADMIN',
  ];

  /**
   * 역할별 권한 매핑 (Enterprise RBAC)
   */
  private static readonly ROLE_PERMISSIONS: Record<UserRoleType, Permission[]> = {
    GUARDIAN: [
      'view:own-children',
      'request:counseling',
      'view:counseling-reports',
      'update:own-profile',
    ],
    INSTITUTION_ADMIN: [
      'manage:institution',
      'manage:counselors',
      'view:institution-reports',
      'approve:counselors',
      'update:own-profile',
    ],
    COUNSELOR: [
      'view:assigned-cases',
      'write:reports',
      'update:case-notes',
      'request:supervision',
      'update:own-profile',
    ],
    ADMIN: ['*'], // 모든 권한
  };

  /**
   * 역할 한글 이름
   */
  private static readonly DISPLAY_NAMES: Record<UserRoleType, string> = {
    GUARDIAN: '보호자',
    INSTITUTION_ADMIN: '기관 대표',
    COUNSELOR: '상담사',
    ADMIN: '시스템 관리자',
  };

  private constructor(private readonly _value: UserRoleType) {
    Object.freeze(this);
  }

  /**
   * 정적 팩토리 메서드
   */
  static create(role: UserRoleType): Result<UserRole, DomainError> {
    if (!this.VALID_ROLES.includes(role)) {
      return Result.fail(new DomainError(`유효하지 않은 역할입니다: ${role}`));
    }

    return Result.ok(new UserRole(role));
  }

  /**
   * 권한 확인
   */
  hasPermission(permission: Permission): boolean {
    const permissions = UserRole.ROLE_PERMISSIONS[this._value];

    // ADMIN은 모든 권한 보유
    if (permissions.includes('*')) {
      return true;
    }

    return permissions.includes(permission);
  }

  /**
   * 여러 권한 중 하나라도 가지고 있는지 확인
   */
  hasAnyPermission(...permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * 모든 권한을 가지고 있는지 확인
   */
  hasAllPermissions(...permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * 값 접근자
   */
  get value(): UserRoleType {
    return this._value;
  }

  /**
   * 한글 이름
   */
  get displayName(): string {
    return UserRole.DISPLAY_NAMES[this._value];
  }

  /**
   * 해당 역할의 모든 권한 조회
   */
  get permissions(): Permission[] {
    return UserRole.ROLE_PERMISSIONS[this._value];
  }

  /**
   * 동등성 비교
   */
  equals(other: UserRole): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * 관리자 여부
   */
  get isAdmin(): boolean {
    return this._value === 'ADMIN';
  }

  /**
   * 문자열 변환
   */
  toString(): string {
    return this._value;
  }
}
