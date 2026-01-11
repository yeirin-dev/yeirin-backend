import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

/**
 * 시설 기반 JWT Payload 인터페이스
 * - institution-auth.service.ts의 payload 구조와 동일
 */
export interface InstitutionJwtPayload {
  sub: string; // facility id
  facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER';
  facilityName: string;
  district: string;
  role: 'INSTITUTION';
  isPasswordChanged: boolean;
  iat?: number; // issued at
  exp?: number; // expiration
}

/**
 * 테스트용 기본 설정
 */
const TEST_JWT_SECRET = 'test-jwt-secret-for-e2e-testing';
const TEST_JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-e2e-testing';
const DEFAULT_ACCESS_TOKEN_EXPIRY: SignOptions['expiresIn'] = '15m';
const DEFAULT_REFRESH_TOKEN_EXPIRY: SignOptions['expiresIn'] = '7d';

/**
 * 양육시설 기본 데이터
 */
export const DEFAULT_CARE_FACILITY_PAYLOAD: InstitutionJwtPayload = {
  sub: 'care-facility-test-uuid-001',
  facilityType: 'CARE_FACILITY',
  facilityName: '테스트 양육시설',
  district: '강남구',
  role: 'INSTITUTION',
  isPasswordChanged: true,
};

/**
 * 지역아동센터 기본 데이터
 */
export const DEFAULT_COMMUNITY_CENTER_PAYLOAD: InstitutionJwtPayload = {
  sub: 'community-center-test-uuid-001',
  facilityType: 'COMMUNITY_CENTER',
  facilityName: '테스트 지역아동센터',
  district: '서초구',
  role: 'INSTITUTION',
  isPasswordChanged: true,
};

/**
 * E2E 테스트용 JWT 토큰 생성기
 *
 * 사용 예시:
 * ```typescript
 * const token = JwtTestGenerator.forCareFacility();
 * const customToken = JwtTestGenerator.forCareFacility({ district: '서초구' });
 * const expiredToken = JwtTestGenerator.expired(DEFAULT_CARE_FACILITY_PAYLOAD);
 * ```
 */
export class JwtTestGenerator {
  /**
   * 양육시설용 Access Token 생성
   */
  static forCareFacility(
    overrides?: Partial<InstitutionJwtPayload>,
    options?: { secret?: string; expiresIn?: SignOptions['expiresIn'] },
  ): string {
    const payload: InstitutionJwtPayload = {
      ...DEFAULT_CARE_FACILITY_PAYLOAD,
      ...overrides,
    };
    return this.generateAccessToken(payload, options);
  }

  /**
   * 지역아동센터용 Access Token 생성
   */
  static forCommunityCenter(
    overrides?: Partial<InstitutionJwtPayload>,
    options?: { secret?: string; expiresIn?: SignOptions['expiresIn'] },
  ): string {
    const payload: InstitutionJwtPayload = {
      ...DEFAULT_COMMUNITY_CENTER_PAYLOAD,
      ...overrides,
    };
    return this.generateAccessToken(payload, options);
  }

  /**
   * 특정 시설 ID로 토큰 생성
   */
  static forFacilityId(
    facilityId: string,
    facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER',
    overrides?: Partial<Omit<InstitutionJwtPayload, 'sub' | 'facilityType'>>,
  ): string {
    const basePayload =
      facilityType === 'CARE_FACILITY'
        ? DEFAULT_CARE_FACILITY_PAYLOAD
        : DEFAULT_COMMUNITY_CENTER_PAYLOAD;

    const payload: InstitutionJwtPayload = {
      ...basePayload,
      ...overrides,
      sub: facilityId,
      facilityType,
    };
    return this.generateAccessToken(payload);
  }

  /**
   * 만료된 토큰 생성 (테스트용)
   */
  static expired(payload?: Partial<InstitutionJwtPayload>): string {
    const fullPayload: InstitutionJwtPayload = {
      ...DEFAULT_CARE_FACILITY_PAYLOAD,
      ...payload,
    };
    return jwt.sign(fullPayload, TEST_JWT_SECRET, {
      expiresIn: '-1s', // 이미 만료됨
    });
  }

  /**
   * 잘못된 서명의 토큰 생성 (테스트용)
   */
  static invalidSignature(payload?: Partial<InstitutionJwtPayload>): string {
    const fullPayload: InstitutionJwtPayload = {
      ...DEFAULT_CARE_FACILITY_PAYLOAD,
      ...payload,
    };
    return jwt.sign(fullPayload, 'wrong-secret-key');
  }

  /**
   * 잘못된 role을 가진 토큰 생성 (테스트용)
   */
  static invalidRole(payload?: Partial<Omit<InstitutionJwtPayload, 'role'>>): string {
    const fullPayload = {
      ...DEFAULT_CARE_FACILITY_PAYLOAD,
      ...payload,
      role: 'INVALID_ROLE',
    };
    return jwt.sign(fullPayload, TEST_JWT_SECRET, {
      expiresIn: DEFAULT_ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * 비밀번호 미변경 상태 토큰 생성
   */
  static withPasswordNotChanged(
    facilityType: 'CARE_FACILITY' | 'COMMUNITY_CENTER' = 'CARE_FACILITY',
    overrides?: Partial<InstitutionJwtPayload>,
  ): string {
    const basePayload =
      facilityType === 'CARE_FACILITY'
        ? DEFAULT_CARE_FACILITY_PAYLOAD
        : DEFAULT_COMMUNITY_CENTER_PAYLOAD;

    return this.generateAccessToken({
      ...basePayload,
      ...overrides,
      isPasswordChanged: false,
    });
  }

  /**
   * Refresh Token 생성
   */
  static refreshToken(
    payload?: Partial<InstitutionJwtPayload>,
    options?: { secret?: string; expiresIn?: SignOptions['expiresIn'] },
  ): string {
    const fullPayload: InstitutionJwtPayload = {
      ...DEFAULT_CARE_FACILITY_PAYLOAD,
      ...payload,
    };

    return jwt.sign(fullPayload, options?.secret || TEST_JWT_REFRESH_SECRET, {
      expiresIn: (options?.expiresIn || DEFAULT_REFRESH_TOKEN_EXPIRY) as SignOptions['expiresIn'],
    });
  }

  /**
   * 만료된 Refresh Token 생성
   */
  static expiredRefreshToken(payload?: Partial<InstitutionJwtPayload>): string {
    const fullPayload: InstitutionJwtPayload = {
      ...DEFAULT_CARE_FACILITY_PAYLOAD,
      ...payload,
    };
    return jwt.sign(fullPayload, TEST_JWT_REFRESH_SECRET, {
      expiresIn: '-1s' as SignOptions['expiresIn'],
    });
  }

  /**
   * 액세스 토큰 생성 헬퍼
   */
  private static generateAccessToken(
    payload: InstitutionJwtPayload,
    options?: { secret?: string; expiresIn?: SignOptions['expiresIn'] },
  ): string {
    return jwt.sign(payload, options?.secret || TEST_JWT_SECRET, {
      expiresIn: (options?.expiresIn || DEFAULT_ACCESS_TOKEN_EXPIRY) as SignOptions['expiresIn'],
    });
  }

  /**
   * 테스트용 JWT Secret 반환
   * - ConfigService mock에서 사용
   */
  static getTestSecret(): string {
    return TEST_JWT_SECRET;
  }

  /**
   * 테스트용 JWT Refresh Secret 반환
   */
  static getTestRefreshSecret(): string {
    return TEST_JWT_REFRESH_SECRET;
  }
}

/**
 * 토큰 디코딩 헬퍼 (테스트 검증용)
 */
export function decodeToken(token: string): InstitutionJwtPayload | null {
  try {
    return jwt.decode(token) as InstitutionJwtPayload;
  } catch {
    return null;
  }
}

/**
 * 토큰 검증 헬퍼 (테스트 검증용)
 */
export function verifyToken(
  token: string,
  secret: string = TEST_JWT_SECRET,
): InstitutionJwtPayload | null {
  try {
    return jwt.verify(token, secret) as InstitutionJwtPayload;
  } catch {
    return null;
  }
}
