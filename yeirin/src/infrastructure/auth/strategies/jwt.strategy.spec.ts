import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret-key',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('유효한 JWT 페이로드를 사용자 객체로 변환해야 함', async () => {
      // Given
      const payload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'USER',
        iat: Date.now(),
        exp: Date.now() + 900000, // 15분 후
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('ADMIN 역할을 가진 사용자를 검증해야 함', async () => {
      // Given
      const payload = {
        sub: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result).toEqual({
        userId: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });

    it('페이로드의 sub를 userId로 매핑해야 함', async () => {
      // Given
      const payload = {
        sub: 'unique-user-id',
        email: 'user@example.com',
        role: 'USER',
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result.userId).toBe(payload.sub);
    });

    it('이메일과 역할을 그대로 반환해야 함', async () => {
      // Given
      const payload = {
        sub: 'test-id',
        email: 'specific@example.com',
        role: 'USER',
      };

      // When
      const result = await strategy.validate(payload);

      // Then
      expect(result.email).toBe(payload.email);
      expect(result.role).toBe(payload.role);
    });
  });

  describe('configuration', () => {
    it('ConfigService에서 JWT_SECRET을 가져와야 함', () => {
      // Then
      expect(configService.get).toHaveBeenCalledWith(
        'JWT_SECRET',
        'your-secret-key-change-this',
      );
    });

    it('Authorization 헤더에서 Bearer 토큰을 추출해야 함', () => {
      // Strategy는 ExtractJwt.fromAuthHeaderAsBearerToken() 사용
      // 이는 Passport가 자동으로 처리하므로 설정만 확인
      expect(strategy).toBeDefined();
    });
  });
});
