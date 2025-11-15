import { UserRole, UserRoleType } from './user-role.vo';

describe('UserRole Value Object', () => {
  describe('생성', () => {
    it('유효한 역할이면 UserRole을 생성한다', () => {
      // Given
      const validRoles: UserRoleType[] = ['GUARDIAN', 'INSTITUTION_ADMIN', 'COUNSELOR', 'ADMIN'];

      validRoles.forEach((role) => {
        // When
        const result = UserRole.create(role);

        // Then
        expect(result.isSuccess).toBe(true);
        expect(result.getValue().value).toBe(role);
      });
    });

    it('유효하지 않은 역할이면 실패한다', () => {
      // Given
      const invalidRole = 'INVALID_ROLE' as UserRoleType;

      // When
      const result = UserRole.create(invalidRole);

      // Then
      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('유효하지 않은 역할');
    });
  });

  describe('권한 검증', () => {
    it('ADMIN은 모든 권한을 가진다', () => {
      // Given
      const admin = UserRole.create('ADMIN').getValue();

      // When & Then
      expect(admin.hasPermission('*')).toBe(true);
      expect(admin.hasPermission('manage:users')).toBe(true);
    });

    it('GUARDIAN은 자신의 권한만 가진다', () => {
      // Given
      const guardian = UserRole.create('GUARDIAN').getValue();

      // When & Then
      expect(guardian.hasPermission('view:own-children')).toBe(true);
      expect(guardian.hasPermission('manage:institution')).toBe(false);
    });

    it('INSTITUTION_ADMIN은 기관 관리 권한을 가진다', () => {
      // Given
      const institutionAdmin = UserRole.create('INSTITUTION_ADMIN').getValue();

      // When & Then
      expect(institutionAdmin.hasPermission('manage:institution')).toBe(true);
      expect(institutionAdmin.hasPermission('manage:counselors')).toBe(true);
      expect(institutionAdmin.hasPermission('view:own-children')).toBe(false);
    });

    it('COUNSELOR는 상담 관련 권한을 가진다', () => {
      // Given
      const counselor = UserRole.create('COUNSELOR').getValue();

      // When & Then
      expect(counselor.hasPermission('view:assigned-cases')).toBe(true);
      expect(counselor.hasPermission('write:reports')).toBe(true);
      expect(counselor.hasPermission('manage:institution')).toBe(false);
    });
  });

  describe('동등성', () => {
    it('같은 역할이면 동등하다', () => {
      // Given
      const role1 = UserRole.create('GUARDIAN').getValue();
      const role2 = UserRole.create('GUARDIAN').getValue();

      // When & Then
      expect(role1.equals(role2)).toBe(true);
    });

    it('다른 역할이면 동등하지 않다', () => {
      // Given
      const role1 = UserRole.create('GUARDIAN').getValue();
      const role2 = UserRole.create('COUNSELOR').getValue();

      // When & Then
      expect(role1.equals(role2)).toBe(false);
    });
  });

  describe('역할 이름', () => {
    it('한글 이름을 반환한다', () => {
      // Given & When & Then
      expect(UserRole.create('GUARDIAN').getValue().displayName).toBe('보호자');
      expect(UserRole.create('INSTITUTION_ADMIN').getValue().displayName).toBe('기관 대표');
      expect(UserRole.create('COUNSELOR').getValue().displayName).toBe('상담사');
      expect(UserRole.create('ADMIN').getValue().displayName).toBe('시스템 관리자');
    });
  });
});
